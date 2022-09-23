import {
    GameRules,
    ClientGameState,
    GameUpdate,
    GameContextInterface,
    GuessResult,
    PlayerStatus,
    ClientGameStateUpdate,
    ClientPlayerStateUpdate,
    PlayerID,
} from "vsordle-types"
import { io, Socket } from "socket.io-client"

let socket: Socket = {} as Socket
let currentLobby: string | null = null
let lobbyListener: ((lobbyId: string | null) => any) | null = null
export const getId = () => {
    return socket.id
}

export const getCurrentLobby = () => {
    return currentLobby
}

export const listenToLobbyChange = (
    listener: (lobbyId: string | null) => any
) => {
    console.log(listener)
    lobbyListener = listener
    return () => {
        lobbyListener = null
    }
}

export const connect = (
    url: string,
    onConnect?: () => void,
    onDisconnect?: (reason: Socket.DisconnectReason) => void,
    onError?: (err: Error) => void
) => {
    socket = io(url)
    socket.on("connect", () => {
        if (onDisconnect) {
            socket.once("disconnect", onDisconnect)
        }
        if (onConnect) onConnect()
    })
    socket.on("connect_error", (error) => {
        if (onError) onError(error)
    })
}

export const createLobby = (displayName: string, rules: GameRules | null) => {
    return new Promise<ClientGameState>((resolve, reject) => {
        socket.emit(
            "create_lobby",
            displayName,
            rules,
            (gameState: ClientGameState | null, err?: any) => {
                console.log(gameState)
                if (gameState !== null) {
                    currentLobby = gameState.lobbyId
                    console.log(lobbyListener)
                    if (lobbyListener) lobbyListener(currentLobby)
                    resolve(gameState)
                } else {
                    reject(err)
                }
            }
        )
    })
}

export const joinLobby = (displayName: string, lobbyId: string) => {
    return new Promise<ClientGameState>((resolve, reject) => {
        socket.emit(
            "join_lobby",
            displayName,
            lobbyId,
            (gameState: ClientGameState | null, err?: any) => {
                if (gameState !== null) {
                    currentLobby = lobbyId
                    if (lobbyListener) lobbyListener(currentLobby)
                    resolve(gameState)
                } else {
                    reject({
                        name: "JoinLobbyError",
                        message: `Unable to join lobby ${lobbyId}.`,
                    })
                }
            }
        )
    })
}

export const leaveLobby = () => {
    return new Promise<void>((resolve, reject) => {
        if (currentLobby) {
            socket.emit("leave_lobby", (success: boolean) => {
                if (success) {
                    currentLobby = null
                    if (lobbyListener) lobbyListener(currentLobby)
                    resolve()
                } else {
                    reject({
                        name: "DisconnectError",
                        message: "Unable to disconnect from current lobby.",
                    })
                }
            })
        } else {
            reject({
                name: "LobbyNotJoinedError",
                message: "Currently not connected to a lobby.",
            })
        }
    })
}

export const readyUp = () => {
    return new Promise<void>((resolve, reject) => {
        if (currentLobby) {
            socket.emit("ready", (success: boolean) => {
                if (success) {
                    resolve()
                } else {
                    reject({
                        name: "ReadyError",
                        message: "Unable to ready up in the current lobby.",
                    })
                }
            })
        } else {
            reject({
                name: "LobbyNotJoinedError",
                message: "Currently not connected to a lobby.",
            })
        }
    })
}

export const startGame = () => {
    return new Promise<void>((resolve, reject) => {
        if (currentLobby) {
            socket.emit("start_game", (errorMessage?: string) => {
                if (!errorMessage) {
                    resolve()
                } else {
                    if (errorMessage === "not_lobby_leader") {
                        reject({
                            name: "LobbyPermissionError",
                            message:
                                "You are not the leader of this lobby and cannot start the game.",
                        })
                    } else {
                        reject({
                            name: "StartGameError",
                            message: "Unable to start the game at this time.",
                        })
                    }
                }
            })
        } else {
            reject({
                name: "LobbyNotJoinedError",
                message: "Currently not connected to a lobby.",
            })
        }
    })
}

export const submitGuess = (guess: string) => {
    return new Promise<GuessResult>((resolve, reject) => {
        if (currentLobby) {
            socket.emit("guess", guess, (result: GuessResult) => {
                if (result.type === "success") {
                    resolve(result)
                } else {
                    reject(result)
                }
            })
        } else {
            reject({
                name: "LobbyNotJoinedError",
                message: "Currently not connected to a lobby.",
            })
        }
    })
}

const onGameUpdate = (listener: (update: GameUpdate) => void) => {
    socket.on("game_update", listener)
    return () => {
        socket.off("game_update")
    }
}

const getGameUpdate = (update: GameUpdate): ClientGameStateUpdate => {
    switch (update.type) {
        case "lobby_joined":
            const pid = update.player.pid
            return {
                players: {
                    [pid]: update.player,
                },
                sortedPids: update.sortedPids,
                totalPlayers: update.playerCount,
            }
        case "lobby_left":
            return {
                players: { [update.pid]: null },
                sortedPids: update.sortedPids,
                totalPlayers: update.playerCount,
            }

        case "game_status_update":
            return {
                status: update.status,
            }
        case "ready_update":
            return {
                players: {
                    [update.pid]: {
                        ready: update.ready,
                    },
                },
            }
        case "guess_result":
            if (update.result.type === "success") {
                const playerUpdate = update.result.update
                let updatesToPlayer: ClientPlayerStateUpdate = {}
                let newSortedPids: PlayerID[] | null = null
                switch (playerUpdate.type) {
                    case "solved":
                        updatesToPlayer.solved = playerUpdate.solved
                        updatesToPlayer.board = playerUpdate.board
                        newSortedPids = playerUpdate.sortedPids
                        break
                    case "missed":
                        updatesToPlayer.missed = playerUpdate.missed
                        updatesToPlayer.board = playerUpdate.board
                        newSortedPids = playerUpdate.sortedPids
                        break
                    case "won":
                        updatesToPlayer.status = PlayerStatus.done
                        updatesToPlayer.solved = playerUpdate.solved
                        break
                    case "lost":
                        updatesToPlayer.status = PlayerStatus.dead
                        break
                    case "continue_guessing":
                        updatesToPlayer.board = playerUpdate.board
                        break
                    default:
                }
                const ret: ClientGameStateUpdate = {
                    players: {
                        [playerUpdate.pid]: updatesToPlayer,
                    },
                }
                if (newSortedPids !== null) {
                    ret.sortedPids = newSortedPids
                    newSortedPids.forEach((pid, i) => {
                        const update = { position: i + 1 }
                        if (ret.players![pid]) {
                            ret.players![pid] = {
                                ...ret.players![pid],
                                ...update,
                            }
                        } else {
                            ret.players![pid] = update
                        }
                    })
                }
                return ret
            } else {
                throw update.result
            }
            break
        default:
            throw new Error("INVALID GAME UPDATE TYPE")
    }
}

export const bindGameToSocket = (
    listener: (update: ClientGameStateUpdate) => void
) => {
    console.log("binding")
    onGameUpdate((update) => {
        console.log("onGameUpdate")
        console.log(update)
        const partial = getGameUpdate(update)
        console.log("partial")
        console.log(partial)
        listener(partial)
    })
}

export const unbindGameFromSocket = () => {
    socket.off("game_update")
}
