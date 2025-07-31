const express = require("express");
const app = express();
const path = require("path");
const http = require("http");

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
    



server.listen(3000);