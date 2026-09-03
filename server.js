import "dotenv/config";

import dns from "node:dns";
import http from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectToDb from "./src/configs/db/db.js";

// Configure DNS resolution to prevent lookup failures on Windows/ISP DNS
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // Ignore if not supported
}

const PORT = process.env.PORT || 8080;
const allowedClientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === allowedClientUrl ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Socket CORS policy violation"), false);
    },
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  socket.on("message", (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await connectToDb();

    server.listen(PORT, () => {
      console.log(`🚀 EverBloom Café Server running on port ${PORT}`);
      console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/v1`);
      console.log(`☕ Health Check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
