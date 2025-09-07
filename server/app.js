const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
//added
const graph = require("./graph");
const dijkstra = require("./dijkstra");
//added

const socketio = require("socket.io");

const server = http.createServer(app);

const io = socketio(server);
app.use(express.static('public'));
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")));


io.on("connection", function (socket){
    socket.on("send-location", function (data){
        io.emit("receive-location", {id: socket.id, ...data })
    });
    socket.on("disconnect", function(){
        io.emit("user-disconnected", socket.id);
    })
});


  app.get("/live", function (req, res) {
    const role = req.query.role || "parent"; // Default to parent
    res.render("index", { role });
  });
    
//added
// API to get shortest path between two nodes
app.get("/shortest-path", (req, res) => {
  const { start, end } = req.query;

  if (!graph[start] || !graph[end]) {
    return res.status(400).json({ error: "Invalid nodes" });
  }

  const result = dijkstra(graph, start, end);
  res.json(result);
});

//added


server.listen(3000);