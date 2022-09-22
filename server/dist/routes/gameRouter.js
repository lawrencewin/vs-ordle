"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const io_1 = require("../game/io");
const router = (0, express_1.Router)();
router.get("/lobbies", (_, res) => {
    res.status(200).json(Object.keys(io_1.GAMES));
});
router.get("/lobbyExists/:id", (req, res) => {
    const exists = io_1.GAMES[req.params.id] !== undefined;
    res.status(200).json(exists);
});
router.get("/game", (_, res) => {
    const serialized = {};
    for (const gameId in io_1.GAMES) {
        serialized[gameId] = io_1.GAMES[gameId].serialized();
    }
    res.status(200).json(serialized);
});
exports.default = router;
