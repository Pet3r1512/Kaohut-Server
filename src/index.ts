import { serve } from "@hono/node-server";
import app from "./app";
import { cors } from "hono/cors";
import { auth, CLIENT_URL } from "./utils/auth";
import { Server } from "socket.io";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routes/_app";
import { Answer } from "@prisma/client";
import prisma from "./prisma";
import cron from "node-cron";

const games: Record<string, Game> = {};

interface SinglePlayerSession {
  userId: string;
  quizId: string;
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  questions: QuestionWithAnswers[];
}

interface QuestionWithAnswers {
  id: string;
  questionText: string;
  answers: Answer[];
}

interface Game {
  hostname: string;
  quizId: string;
  players: Player[];
  duration: number
}

interface Player {
  id: string;
  name: string;
  score: number;
}

const singlePlayerSessions: Record<string, SinglePlayerSession> = {};
const multiPlayerSessions: Record<string, Record<string, SinglePlayerSession>> = {};

app.use(
  "/api/auth/**",
  cors({
    origin: CLIENT_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  cors(),
  trpcServer({
    router: appRouter,
  })
);

cron.schedule('0 23 * * *', async () => {
  console.log('[CRON] Running session cleanup at 11 PM...');
  const now = new Date();
  const expiredSessions = await prisma.session.findMany({
    where: { expiresAt: { lt: now } }
  });
  console.log(`[CRON] Found ${expiredSessions.length} expired sessions.`);
  if (expiredSessions.length > 0) {
    await prisma.session.deleteMany({
      where: { expiresAt: { lt: now } }
    });
    console.log('[CRON] Expired sessions deleted.');
  } else {
    console.log('[CRON] No expired sessions found.');
  }
});

const httpServer = serve({
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 9999,
});

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.id}`);
  socket.emit("socket_id", socket.id);

  socket.on("start_single_player", async ({ quizId, currentUserId }, callback) => {
    if (!quizId || !currentUserId) {
      callback({ error: "Invalid quiz or user ID" });
      return;
    }

    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { include: { answers: true } } },
      });

      if (!quiz || quiz.questions.length === 0) {
        callback({ error: "Quiz not found or has no questions" });
        return;
      }

      singlePlayerSessions[socket.id] = {
        userId: currentUserId,
        quizId: quiz.id,
        currentQuestionIndex: 0,
        score: 0,
        totalQuestions: quiz.questions.length,
        questions: quiz.questions,
      };

      callback({
        success: true,
        question: quiz.questions[0],
      });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      callback({ error: "Failed to start quiz session" });
    }
  });

  socket.on("answer_question", ({ answerIndex }, callback) => {
    const session = singlePlayerSessions[socket.id];
    if (!session) {
      callback({ error: "No active session" });
      return;
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      callback({ error: "Invalid question index" });
      return;
    }

    let isCorrect = false
    if (answerIndex) {
      isCorrect = currentQuestion.answers[answerIndex]?.isCorrect
    }

    if (isCorrect) {
      session.score += 1;
    }

    session.currentQuestionIndex += 1;

    if (session.currentQuestionIndex < session.questions.length) {
      const nextQuestion = session.questions[session.currentQuestionIndex];
      callback({ correct: isCorrect, nextQuestion });
    } else {
      callback({
        correct: isCorrect,
        finalScore: session.score,
        totalQuestions: session.questions.length,
      });
      delete singlePlayerSessions[socket.id];
      console.log(`[SinglePlayer] Session ended for socket ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    if (singlePlayerSessions[socket.id]) {
      delete singlePlayerSessions[socket.id];
      console.log(`[SinglePlayer] Session data cleared for socket ${socket.id}`);
    }
  });

  // Multiplayer Game Code with Quiz Selection Before Hosting

  // Host selects a quiz and creates a game
  socket.on("select_quiz_and_create_game", ({ quizId, hostname }, callback) => {
    const gameCode = (Date.now() % 1e6).toString().padStart(6, "0");
    games[gameCode] = {
      hostname,
      quizId,
      players: [{ id: socket.id, name: hostname, score: 0 }],
      duration: 0
    };
    socket.join(gameCode);

    prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { answers: true } } },
    }).then((quiz) => {
      if (!quiz || quiz.questions.length === 0) {
        callback({ error: "Selected quiz has no questions" });
        return;
      }
      callback({ success: true, gameCode, quiz });
      games[gameCode].duration = quiz.time
      io.in(gameCode).emit("player_joined", games[gameCode].players);
    }).catch((error) => {
      console.error("Error fetching quiz:", error);
      callback({ error: "Failed to fetch quiz" });
    });
  });

  socket.on("join_game", ({ gameCode, playerName }, callback) => {
    const game = games[gameCode];
    if (!game) {
      console.log("Game not found:", gameCode);
      callback({ error: "Game not found" });
      return;
    }

    const player = { id: socket.id, name: playerName, score: 0 };
    game.players.push(player);
    socket.join(gameCode);

    console.log(`${playerName} joined game: ${gameCode}`);
    if (!multiPlayerSessions[gameCode]) {
      multiPlayerSessions[gameCode] = {};
    }
    multiPlayerSessions[gameCode][socket.id] = {
      userId: socket.id, // Use socket.id as userId in multiplayer
      quizId: "", // quizId will be set when the game starts
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: 0,
      questions: [],
    };

    io.in(gameCode).emit("player_joined", game.players);
    callback({ success: true, quizId: game.quizId });

  });

  // Host starts the game with the selected quiz
  socket.on('start_game', ({ gameCode }, callback) => {
    const game = games[gameCode];
    if (!game) {
      return callback({ error: "Game not found" });
    }

    if (game.players.length < 2) {
      return callback({ error: "Not enough players to start the game" });
    }

    prisma.quiz.findUnique({
      where: { id: game.quizId },
      include: { questions: { include: { answers: true } } },
    }).then(async (quiz) => { // Make the callback async
      if (!quiz || quiz.questions.length === 0) {
        return callback({ error: "Quiz has no questions" });
      }

      try {
        // Use Promise.all to ensure all sessions are initialized before starting the game
        await Promise.all(game.players.map(async (player) => {
          if (!multiPlayerSessions[gameCode]) {
            multiPlayerSessions[gameCode] = {};
          }
          multiPlayerSessions[gameCode][player.id] = {
            userId: player.id,
            quizId: quiz.id,
            currentQuestionIndex: 0,
            score: 0,
            totalQuestions: quiz.questions.length,
            questions: quiz.questions,
          };
        }));

        // After all sessions are initialized, emit game_started and send the first question
        io.to(gameCode).emit('game_started', { gameCode, firstQuestion: quiz.questions, currentQuestionIndex: 0 }); // Include index
        callback({ success: true, firstQuestion: quiz.questions, currentQuestionIndex: 0 }); // Include index in callback

      } catch (error) {
        console.error("Error setting up game sessions:", error);
        return callback({ error: "Failed to set up game sessions" });
      }

    }).catch((error) => {
      console.error("Error fetching quiz:", error);
      return callback({ error: "Failed to fetch quiz for the game" });
    });
  });

  socket.on("answer_question_multiplayer", ({ gameCode, answerIndex }, callback) => {
    const playerSession = multiPlayerSessions[gameCode][socket.id];
    if (!playerSession) {
      return callback({ error: "Player not in session" });
    }

    const currentQuestion = playerSession.questions[playerSession.currentQuestionIndex];
    if (!currentQuestion) {
      return callback({ error: "Invalid question index" }); // Still possible if client is out of sync
    }

    const isCorrect = currentQuestion.answers[answerIndex]?.isCorrect || false;
    if (isCorrect) {
      playerSession.score += 1;
    }

    io.to(socket.id).emit("player_answered", {
      playerId: socket.id,
      score: playerSession.score,
      isCorrect,
    });

    callback({ correct: isCorrect });

    setTimeout(() => {
      playerSession.currentQuestionIndex++; // Increment *before* emitting next question
      if (playerSession.currentQuestionIndex < playerSession.questions.length) {
        const nextQuestion = playerSession.questions[playerSession.currentQuestionIndex];
        io.to(gameCode).emit("next_question", { nextQuestion, currentQuestionIndex: playerSession.currentQuestionIndex }); // Include index
      } else {
        io.to(gameCode).emit("game_over", { players: game.players });
      }
    }, game.duration * 1000);
  });

  // Player answers a question in multiplayer mode
  socket.on("answer_question_multiplayer", ({ gameCode, answerIndex }, callback) => {
    const game = games[gameCode];
    if (!game) {
      callback({ error: "Game not found" });
      return;
    }

    const playerSession = multiPlayerSessions[gameCode][socket.id]; // Use gameCode and socket.id
    if (!playerSession) {
      callback({ error: "Player not in session" });
      return;
    }

    const currentQuestion = playerSession.questions[playerSession.currentQuestionIndex];
    if (!currentQuestion) {
      callback({ error: "Invalid question index" });
      return;
    }

    const isCorrect = currentQuestion.answers[answerIndex]?.isCorrect || false;
    if (isCorrect) {
      playerSession.score += 1;
    }

    // Emit updated scores ONLY for the current player
    io.to(socket.id).emit("player_answered", { // Emit only to the player who answered
      playerId: socket.id,
      score: playerSession.score,
      isCorrect
    });

    callback({ correct: isCorrect });

    setTimeout(() => {
      playerSession.currentQuestionIndex += 1;
      const nextQuestion = playerSession.questions[playerSession.currentQuestionIndex];

      if (nextQuestion) {
        io.to(gameCode).emit("next_question", { nextQuestion }); // Everyone gets the next question
      } else {
        io.to(gameCode).emit("game_over", { players: game.players }); // Send final scores to everyone
        // Consider removing player sessions here if needed:
        // delete multiPlayerSessions[gameCode][socket.id];
      }
    }, game.duration * 1000);
  });

  // Handle player disconnection in multiplayer game
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const gameCode in multiPlayerSessions) {
      if (multiPlayerSessions[gameCode][socket.id]) {
        delete multiPlayerSessions[gameCode][socket.id];
        const game = games[gameCode];
        if (game) {
          game.players = game.players.filter((player) => player.id !== socket.id);
          io.to(gameCode).emit("player_left", game.players);

          if (game.hostname === socket.id) {
            delete games[gameCode];
            io.to(gameCode).emit("game_ended", { message: "Game ended due to host disconnection." });
            delete multiPlayerSessions[gameCode]; // Clean up sessions for the game
          }
        }
        break; // Important: Exit loop after finding the player
      }
    }
  });
});

console.log("Socket.IO server initialized")