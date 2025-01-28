import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { cors } from "hono/cors";
import { auth, CLIENT_URL } from "./utils/auth";
import { Server } from "socket.io";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routes/_app";
import { Answer } from "@prisma/client";
import prisma from "./prisma";

interface Game {
  hostname: string;
  players: { id: string; name: string; score: number }[];
}

const games: Record<string, Game> = {};

interface SinglePlayerSession {
}

interface QuestionWithAnswers {
  id: string; // Question ID
  questionText: string; // Text of the question
  answers: Answer[]; // Array of possible answers
}


const singlePlayerSessions: Record<string, SinglePlayerSession> = {};


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

const httpServer = serve({
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 9999,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : "",
});


const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.id}`);

  socket.on("start_single_player", async ({ quizId, currentUserId }, callback) => {
    if (!quizId || !currentUserId) {
      callback({ error: "Invalid quiz or user ID" });
      return;
    }

    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
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
    const isCorrect = currentQuestion.answers[answerIndex]?.isCorrect || false;

    if (isCorrect) {
      session.score += 1;
    }

    session.currentQuestionIndex += 1;

    if (session.currentQuestionIndex < session.questions.length) {
      const nextQuestion = session.questions[session.currentQuestionIndex];
      callback({
        correct: isCorrect,
        nextQuestion,
      });
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

  // Host creates a game
  socket.on("create_game", ({ hostname }, callback) => {
    const gameCode = (Date.now() % 1000000).toString().padStart(6, '0');
    games[gameCode] = {
      hostname,
      players: [],
    };

    console.log(`Game created by ${hostname} with code: ${gameCode}`);

    callback({ gameCode });
  });

  // Player joins a game
  socket.on("join_game", ({ gameCode, playerName }, callback) => {
    const game = games[gameCode];
    if (!game) {
      callback({ error: "Game not found" });
      return;
    }

    const player = { id: socket.id, name: playerName, score: 0 };
    game.players.push(player);

    console.log(`${playerName} joined game: ${gameCode}`);

    socket.join(gameCode);
    io.to(gameCode).emit("player_joined", game.players);

    callback({ success: true });
  });

  // Host starts the game
  socket.on("start_game", ({ gameCode }, callback) => {
    const game = games[gameCode];
    if (!game) {
      callback({ error: "Game not found" });
      return;
    }

    console.log(`Game started for game code: ${gameCode}`);
    io.to(gameCode).emit("game_started", { gameCode });

    callback({ success: true });
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const [gameCode, game] of Object.entries(games)) {
      game.players = game.players.filter((player) => player.id !== socket.id);
      io.to(gameCode).emit("player_left", game.players);

      if (game.players.length === 0 && game.hostname === socket.id) {
        delete games[gameCode];
        console.log(`Game ${gameCode} deleted`);
      }
    }
  });
});

console.log("Socket.IO server initialized");