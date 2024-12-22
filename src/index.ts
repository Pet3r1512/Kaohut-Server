import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { cors } from "hono/cors";
import { auth, CLIENT_URL } from "./utils/auth";
import { Server } from "socket.io";

const port = env.PORT;

interface Game {
  hostname: string;
  players: { id: string; name: string; score: number }[];
}

const games: Record<string, Game> = {};

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

const httpServer = serve({
  fetch: app.fetch,
  port,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : undefined,
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("player_joined", (players) => {
    console.log("Player joined:", players);
  });

  socket.on("game_started", (data) => {
    console.log("Game started with data:", data);
  });
  // Host creates a game
  socket.on("create_game", ({ hostname }, callback) => {
    const gameCode = (Math.random() * 999999).toString()
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