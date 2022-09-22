import { Router } from "express"
import { GAMES } from "../game/io"

const router = Router()

router.get("/lobbies", (_, res) => {
    res.status(200).json(Object.keys(GAMES)) 
})

router.get("/lobbyExists/:id", (req, res) => {
    const exists = GAMES[req.params.id] !== undefined
    res.status(200).json(exists)
})

router.get("/game", (_, res) => {
    const serialized: any = {}
    for (const gameId in GAMES) {
        serialized[gameId] = GAMES[gameId].serialized()
    }
    res.status(200).json(serialized)
})

export default router