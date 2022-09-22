"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindGameToSocket = exports.GAMES = exports.PLAYERS_TO_LOBBY = void 0;
const GameInstance_1 = require("./GameInstance");
/**
actions: join_lobby, leave_lobby, create_lobby, guess, ready
events: game_start, game_over, lobby_joined, lobby_left, game_update, player_ready
game_events: won, solved, missed, continue_guessing, lost, error
 */
exports.PLAYERS_TO_LOBBY = {};
exports.GAMES = {};
const DEFAULT_RULES = {
    allowedGuesses: 6,
    wordCount: 7,
    missCount: 3,
};
const RAND_STRING_CHOICES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
function randString(n = 8) {
    let ret = "";
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * RAND_STRING_CHOICES.length);
        ret += RAND_STRING_CHOICES[idx];
    }
    return ret;
}
function playerIsAlreadyInGame(id) {
    for (const gameId in exports.GAMES) {
        if (exports.GAMES[gameId].hasPlayer(id)) {
            console.log(exports.GAMES[gameId].serialized());
            return true;
        }
    }
    return false;
}
function bindGameToSocket(io, socket) {
    const emitToSelf = (update) => socket.emit("game_update", update);
    const emitToLobby = (update, lobbyId, except) => {
        let broadcast = io.to(lobbyId);
        if (except) {
            broadcast = broadcast.except(except);
        }
        broadcast.emit("game_update", update);
    };
    const removeFromLobby = (lobbyId, pid) => {
        exports.GAMES[lobbyId].removePlayer(pid);
        delete exports.PLAYERS_TO_LOBBY[pid];
        // emit to everyone else
        emitToLobby({
            type: "lobby_left",
            lobbyId: lobbyId,
            pid: pid,
            playerCount: exports.GAMES[lobbyId].totalPlayers,
            sortedPids: exports.GAMES[lobbyId].sortedPids,
        }, lobbyId);
        // if no one is in the game, delete it
        if (exports.GAMES[lobbyId].totalPlayers === 0) {
            delete exports.GAMES[lobbyId];
        }
    };
    socket.on("create_lobby", (ownerName, rules, // if null, use default rules
    callback) => {
        // should emit a lobby_joined event on creation
        // callback should pass lobbyId + game rules
        const pid = socket.id;
        // first check if owner is in any games other than this
        if (playerIsAlreadyInGame(pid)) {
            callback(null, {
                name: "PlayerAlreadyInGameError",
                message: "Player is already in a running game."
            });
            return;
        }
        // we can create a new game instance
        const lobbyId = randString();
        const gameRules = rules || DEFAULT_RULES;
        exports.GAMES[lobbyId] = new GameInstance_1.GameInstance(lobbyId, gameRules);
        exports.GAMES[lobbyId].addPlayer(pid, ownerName);
        exports.GAMES[lobbyId].players[pid].lobbyLeader = true;
        exports.PLAYERS_TO_LOBBY[pid] = lobbyId;
        // put socket in room
        socket.join(lobbyId);
        socket.leave("outside_lobby");
        // emit event and return success
        console.log("success");
        callback(exports.GAMES[lobbyId].clientSerialized(socket.id));
        emitToSelf({
            type: "lobby_joined",
            lobbyId: lobbyId,
            player: exports.GAMES[lobbyId].players[pid].serialized(),
            playerCount: exports.GAMES[lobbyId].totalPlayers,
            sortedPids: exports.GAMES[lobbyId].sortedPids,
        });
    });
    socket.on("join_lobby", (playerName, lobbyId, callback) => {
        // should emit a lobby_joined event on join
        // callback passes true if successful join, false if not
        const pid = socket.id;
        // check if socket is in another game
        if (playerIsAlreadyInGame(pid)) {
            callback(null, {
                name: "PlayerAlreadyInGameError",
                message: "Player is already in a running game."
            });
        }
        else if (exports.GAMES[lobbyId] === undefined) {
            callback(null, {
                name: "GameDoesNotExistError",
                message: "Given lobby ID doesn't currently exist on the server."
            });
        }
        else {
            // good to go into this game
            exports.GAMES[lobbyId].addPlayer(pid, playerName);
            exports.PLAYERS_TO_LOBBY[pid] = lobbyId;
            // put player in room
            socket.join(lobbyId);
            socket.leave("outside_lobby");
            // broadcast that the player has joined to everyone in the lobby
            callback(exports.GAMES[lobbyId].clientSerialized(pid));
            emitToLobby({
                type: "lobby_joined",
                lobbyId: lobbyId,
                player: exports.GAMES[lobbyId].players[pid].serialized(),
                playerCount: exports.GAMES[lobbyId].totalPlayers,
                sortedPids: exports.GAMES[lobbyId].sortedPids,
            }, lobbyId, [pid]);
        }
    });
    socket.on("leave_lobby", (callback) => {
        // should emit a lobby_left event if successful
        // callback passes bool based on success
        const pid = socket.id;
        const lobbyId = exports.PLAYERS_TO_LOBBY[pid];
        if (lobbyId && exports.GAMES[lobbyId]) {
            removeFromLobby(lobbyId, pid);
            callback(true);
        }
        else {
            callback(false);
        }
    });
    socket.on("ready", (callback) => {
        // emits player_ready event if successful, callback passes bool based on success
        const pid = socket.id;
        const lobbyId = exports.PLAYERS_TO_LOBBY[pid];
        if (lobbyId && exports.GAMES[lobbyId]) {
            const game = exports.GAMES[lobbyId];
            game.players[pid].readyUp();
            emitToLobby({
                type: "ready_update",
                pid: pid,
                ready: game.players[pid].ready
            }, lobbyId);
            callback(true);
        }
        else {
            callback(false);
        }
    });
    socket.on("start_game", (callback) => {
        // emits game starting
        const pid = socket.id;
        const lobbyId = exports.PLAYERS_TO_LOBBY[pid];
        if (lobbyId && exports.GAMES[lobbyId]) {
            const game = exports.GAMES[lobbyId];
            if (!game.players[pid].lobbyLeader) {
                callback("not_lobby_leader");
                return;
            }
            callback();
            game.status = "starting";
            // we can start game
            emitToLobby({
                type: "game_status_update",
                status: "starting"
            }, lobbyId);
            game.status = "playing";
            // start game 3 sec after
            setTimeout(() => {
                game.start();
                emitToLobby({
                    type: "game_status_update",
                    status: "playing"
                }, lobbyId);
            }, 3000);
        }
        else {
            callback("not_in_game");
        }
    });
    socket.on("guess", (guess, callback) => __awaiter(this, void 0, void 0, function* () {
        // emits game_update event if successful, callback passes bool based off success
        const pid = socket.id;
        const lobbyId = exports.PLAYERS_TO_LOBBY[pid];
        if (lobbyId && exports.GAMES[lobbyId]) {
            const game = exports.GAMES[lobbyId];
            const result = yield game.submitGuess(pid, guess);
            emitToLobby({
                type: "guess_result",
                result: result
            }, lobbyId);
            callback(result);
        }
        else {
            callback({
                type: "fail",
                error: "serverError",
                message: "Player not in lobby."
            });
        }
    }));
    socket.on("disconnect", () => {
        const pid = socket.id;
        const lobbyId = exports.PLAYERS_TO_LOBBY[socket.id];
        if (lobbyId) {
            removeFromLobby(lobbyId, pid);
        }
    });
}
exports.bindGameToSocket = bindGameToSocket;
