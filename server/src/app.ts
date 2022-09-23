import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"
import gameRouter from "./routes/gameRouter"
import { bindGameToSocket } from "./game/io"

const app = express()
app.use(
    cors({
        origin: true,
        methods: ["GET", "POST"],
        credentials: true,
    })
)
app.use(gameRouter)

const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true,
    },
})

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected.`)
    bindGameToSocket(io, socket)
    socket.on("disconnect", (reason) => {
        console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`)
    })

    socket.join("outside_lobby")
})

server.listen(8080, () => console.log("Listening on 8080"))
