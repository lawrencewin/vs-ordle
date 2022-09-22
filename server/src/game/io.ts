import { Server, Socket } from "socket.io"
import { GameRules, ClientGameState, GameUpdate, PlayerID, GuessResult } from "vsordle-types"
import { GameInstance } from "./GameInstance"

/**
actions: join_lobby, leave_lobby, create_lobby, guess, ready
events: game_start, game_over, lobby_joined, lobby_left, game_update, player_ready
game_events: won, solved, missed, continue_guessing, lost, error
 */

export const PLAYERS_TO_LOBBY: { [pid: PlayerID]: string } = {}
export const GAMES: { [lobby_id: string]: GameInstance } = {}
const DEFAULT_RULES = {
    allowedGuesses: 6,
    wordCount: 7,
    missCount: 3,
}

const RAND_STRING_CHOICES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"
function randString(n: number = 8) {
    let ret = ""
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * RAND_STRING_CHOICES.length)
        ret += RAND_STRING_CHOICES[idx]
    }
    return ret
}

function playerIsAlreadyInGame(id: string) {
    for (const gameId in GAMES) {
        if (GAMES[gameId].hasPlayer(id)) {
            console.log(GAMES[gameId].serialized())
            return true
        }
    }
    return false
}

export function bindGameToSocket(io: Server, socket: Socket) {
    const emitToSelf = (update: GameUpdate) => {
        console.log("To player", socket.id)
        console.log(JSON.stringify(update, (k, v) => {
            if (v instanceof Array) 
                return JSON.stringify(v)
            return v
        }, 2))
        socket.emit("game_update", update)
    }
    const emitToLobby = (update: GameUpdate, lobbyId: string, except?: PlayerID[]) => {
        let broadcast = io.to(lobbyId)
        if (except) {
           broadcast = broadcast.except(except) 
        }
        console.log("To lobby:", lobbyId)
        console.log(JSON.stringify(update, (k, v) => {
            if (v instanceof Array) 
                return JSON.stringify(v)
            return v
        }, 2))
        broadcast.emit("game_update", update)
    }

    const removeFromLobby = (lobbyId: string, pid: PlayerID) => {
        GAMES[lobbyId].removePlayer(pid)
        delete PLAYERS_TO_LOBBY[pid]
        // emit to everyone else
        emitToLobby({
            type: "lobby_left",
            lobbyId: lobbyId,
            pid: pid,
            playerCount: GAMES[lobbyId].totalPlayers,
            sortedPids: GAMES[lobbyId].sortedPids,
        }, lobbyId)
        // if no one is in the game, delete it
        if (GAMES[lobbyId].totalPlayers === 0) {
            delete GAMES[lobbyId]
        }
    }

    socket.on("create_lobby", (
        ownerName: string, 
        rules: GameRules | null, // if null, use default rules
        callback: (state: ClientGameState | null, error?: any) => void
    ) => {
        // should emit a lobby_joined event on creation
        // callback should pass lobbyId + game rules
        const pid = socket.id
        // first check if owner is in any games other than this
        if (playerIsAlreadyInGame(pid)) {
            callback(null, {
                name: "PlayerAlreadyInGameError",
                message: "Player is already in a running game."
            })
            return
        }
        // we can create a new game instance
        const lobbyId = randString()
        const gameRules = rules || DEFAULT_RULES
        GAMES[lobbyId] = new GameInstance(lobbyId, gameRules)
        GAMES[lobbyId].addPlayer(pid, ownerName)
        GAMES[lobbyId].players[pid].lobbyLeader = true
        PLAYERS_TO_LOBBY[pid] = lobbyId
        // put socket in room
        socket.join(lobbyId)
        socket.leave("outside_lobby")
        // emit event and return success
        console.log("success")
        callback(GAMES[lobbyId].clientSerialized(socket.id))
        emitToSelf({
            type: "lobby_joined",
            lobbyId: lobbyId,
            player: GAMES[lobbyId].players[pid].serialized(),
            playerCount: GAMES[lobbyId].totalPlayers,
            sortedPids: GAMES[lobbyId].sortedPids,
        })
    })

    socket.on("join_lobby", (
        playerName: string,
        lobbyId: string, 
        callback: (gameState: ClientGameState | null, error?: any) => void
    ) => {
        // should emit a lobby_joined event on join
        // callback passes true if successful join, false if not
        const pid = socket.id
        // check if socket is in another game
        if (playerIsAlreadyInGame(pid)) {
            callback(null, {
                name: "PlayerAlreadyInGameError",
                message: "Player is already in a running game."
            })
        } else if (GAMES[lobbyId] === undefined) {
            callback(null, {
                name: "GameDoesNotExistError",
                message: "Given lobby ID doesn't currently exist on the server."
            })
        } else {
            // good to go into this game
            GAMES[lobbyId].addPlayer(pid, playerName)
            PLAYERS_TO_LOBBY[pid] = lobbyId
            // put player in room
            socket.join(lobbyId)
            socket.leave("outside_lobby")
            // broadcast that the player has joined to everyone in the lobby
            callback(GAMES[lobbyId].clientSerialized(pid))
            emitToLobby({
                type: "lobby_joined",
                lobbyId: lobbyId,
                player: GAMES[lobbyId].players[pid].serialized(),
                playerCount: GAMES[lobbyId].totalPlayers,
                sortedPids: GAMES[lobbyId].sortedPids,
            }, lobbyId, [pid])
        }
    })

    socket.on("leave_lobby", (callback: (success: boolean) => void) => {
        // should emit a lobby_left event if successful
        // callback passes bool based on success
        const pid = socket.id
        const lobbyId = PLAYERS_TO_LOBBY[pid]
        if (lobbyId && GAMES[lobbyId]) {
            removeFromLobby(lobbyId, pid)
            callback(true)
        } else {
            callback(false)
        }
    })

    socket.on("ready", (callback: (success: boolean) => void) => {
        // emits player_ready event if successful, callback passes bool based on success
        const pid = socket.id
        const lobbyId = PLAYERS_TO_LOBBY[pid]
        if (lobbyId && GAMES[lobbyId]) {
            const game = GAMES[lobbyId]
            game.players[pid].readyUp()
            emitToLobby({
                type: "ready_update",
                pid: pid,
                ready: game.players[pid].ready
            }, lobbyId)
            callback(true)
        } else {
            callback(false)
        }
    })

    socket.on("start_game", (callback: (errorMessage?: string) => void) => {
        // emits game starting
        const pid = socket.id
        const lobbyId = PLAYERS_TO_LOBBY[pid]
        if (lobbyId && GAMES[lobbyId]) {
            const game = GAMES[lobbyId]
            if (!game.players[pid].lobbyLeader) {
                callback("not_lobby_leader")
                return
            }
            callback()
            game.status = "starting"
            // we can start game
            emitToLobby({
                type: "game_status_update",
                status: "starting"
            }, lobbyId)
            game.status = "playing"
            // start game 3 sec after
            setTimeout(() => {
                game.start()
                emitToLobby({
                    type: "game_status_update",
                    status: "playing"
                }, lobbyId)
            }, 3_000)
        } else {
            callback("not_in_game")
        }
    })

    socket.on("guess", async (guess: string, callback: (result: GuessResult) => void) => {
        // emits game_update event if successful, callback passes bool based off success
        const pid = socket.id
        const lobbyId = PLAYERS_TO_LOBBY[pid]
        if (lobbyId && GAMES[lobbyId]) {
            const game = GAMES[lobbyId]
            const result = await game.submitGuess(pid, guess)
            // figure out if we end game here
            emitToLobby({
                type: "guess_result",
                result: result
            }, lobbyId)
            callback(result)
        } else {
            callback({
                type: "fail",
                error: "serverError",
                message: "Player not in lobby."
            })
        }
    })

    socket.on("disconnect", () => {
        const pid = socket.id
        const lobbyId = PLAYERS_TO_LOBBY[socket.id]
        if (lobbyId) {
            removeFromLobby(lobbyId, pid)
        }
    })
}