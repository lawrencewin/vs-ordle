"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const gameRouter_1 = __importDefault(require("./routes/gameRouter"));
const io_1 = require("./game/io");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(gameRouter_1.default);
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    },
});
io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected.`);
    (0, io_1.bindGameToSocket)(io, socket);
    socket.on("disconnect", (reason) => {
        console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
    });
    socket.join("outside_lobby");
});
server.listen(8080, () => console.log("Listening on 8080"));
