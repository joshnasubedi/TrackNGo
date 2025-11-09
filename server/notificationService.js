// notificationService.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // or "http://localhost:5001"
    methods: ["GET", "POST"]
  }
});

const parentSockets = {}; // store connected parents

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("registerParent", (parentId) => {
    parentSockets[parentId] = socket.id;
    console.log(`👩‍🦰 Parent ${parentId} registered with socket ${socket.id}`);
  });

  socket.on("sendNotification", (data) => {
    console.log("📨 Driver sent notification:", data);
    const { parentId } = data;
    const parentSocketId = parentSockets[parentId];
    if (parentSocketId) {
      io.to(parentSocketId).emit("receiveNotification", data);
      console.log(`✅ Notification sent to parent ${parentId}`);
    } else {
      console.log(`⚠️ Parent ${parentId} not connected`);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(5001, () => {
  console.log("🚀 Socket.IO server running on http://localhost:5001");
});
