import {
    GameRules,
    ServerGameState,
    GameStatus,
    PlayerState,
    ClientGameState,
    PlayerID,
    GuessResult,
    PlayerStatus,
    PlayerUpdate,
    PlayerUpdateType,
} from "vsordle-types"
import { VALID_WORDS } from "./words"
import { PlayerInstance } from "./PlayerInstance"
import { Mutex } from "async-mutex"

export class GameInstance implements ServerGameState {
    lobbyId: string
    players: { [pid: PlayerID]: PlayerInstance }
    rules: GameRules
    sortedPids: PlayerID[]
    totalPlayers: number
    words: {
        main: string[]
        reserve: string[]
    }
    hasStarted: boolean
    status: GameStatus
    gameTime: number

    private sortLock: Mutex

    constructor(lobbyId: string, rules: GameRules) {
        this.lobbyId = lobbyId
        this.rules = rules

        this.players = {}
        this.sortedPids = []
        this.totalPlayers = 0
        this.words = {
            main: [],
            reserve: [],
        }
        this.hasStarted = false
        this.status = "lobby"

        this.sortLock = new Mutex()
        this.gameTime = 0
    }

    get canStart() {
        if (this.totalPlayers <= 1) {
            return false
        }
        for (const pid in this.players) {
            if (!this.players[pid].ready) return false
        }
        return true
    }

    get playersPlaying(): PlayerID[] {
        let numPlaying = 0
        const playersPlaying: PlayerID[] = []
        for (const pid in this.players) {
            if (this.players[pid].status === PlayerStatus.playing) {
                numPlaying += 1
                playersPlaying.push(pid)
            }
        }
        return playersPlaying
    }

    addPlayer(id: string, name: string) {
        this.players[id] = new PlayerInstance(id, name, this.rules)
        this.sortedPids.push(id)
        this.totalPlayers += 1
    }

    removePlayer(id: string) {
        delete this.players[id]
        this.sortedPids = this.sortedPids.filter((val) => val !== id)
        this.totalPlayers -= 1
    }

    hasPlayer(id: string) {
        return this.players[id] !== undefined
    }

    start(timeLimit: number = 300, onTimeLimitReached?: () => void): boolean {
        if (!this.canStart) {
            return false
        }
        // generate words
        const mainIndices: number[] = [],
            reserveIndices: number[] = []
        for (let i = 0; i < this.rules.wordCount; i++) {
            let idx = Math.floor(Math.random() * VALID_WORDS.length)
            while (mainIndices.includes(idx)) {
                idx = Math.floor(Math.random() * VALID_WORDS.length)
            }
            mainIndices.push(idx)
        }
        for (let j = 0; j < this.rules.missCount - 1; j++) {
            let idx = Math.floor(Math.random() * VALID_WORDS.length)
            while (reserveIndices.includes(idx)) {
                idx = Math.floor(Math.random() * VALID_WORDS.length)
            }
            reserveIndices.push(idx)
        }
        this.words.main = mainIndices.map((i) => VALID_WORDS[i])
        this.words.reserve = reserveIndices.map((j) => VALID_WORDS[j])
        // start game for each player
        for (const pid in this.players) {
            this.players[pid].start(this.words.main[0])
        }
        // start game time
        const intervalId = setInterval(() => {
            if (this.gameTime === timeLimit) {
                clearInterval(intervalId)
                if (onTimeLimitReached) {
                    onTimeLimitReached()
                }
            } else {
                this.gameTime += 1
            }
        }, 1_000)
        console.log(this.words.main)
        console.log(this.words.reserve)
        return true
    }

    async reSortPids() {
        await this.sortLock.runExclusive(() => {
            this.sortedPids.sort((a, b) => {
                const p1 = this.players[a]
                const p2 = this.players[b]
                let diff = p1.status - p2.status
                if (diff === 0) {
                    diff = p2.solved - p1.solved
                    if (diff === 0) {
                        diff = p1.missed - p2.missed
                    }
                }
                return diff
            })
            this.sortedPids.forEach((pid, i) => {
                const player = this.players[pid]
                player.position = i + 1
            })
        })
    }

    async submitGuess(pid: string, guess: string): Promise<GuessResult> {
        const me = this.players[pid]
        // insert logic for checking validity of hard mode / unique starter
        try {
            me.checkGuessValidity(guess)
        } catch (error) {
            return {
                type: "fail",
                error: "invalidGuess",
                message: (error as Error).message,
            }
        }
        if (
            me.status === PlayerStatus.done ||
            me.status === PlayerStatus.dead
        ) {
            return { type: "fail", error: "gameOver" }
        }
        // submit guess and update board
        const playerUpdateType = me.submitGuess(guess)
        // update game state and return update
        let update: PlayerUpdate
        switch (playerUpdateType) {
            case PlayerUpdateType.won:
                update = {
                    type: playerUpdateType,
                    pid: pid,
                    solved: me.solved,
                }
                break
            case PlayerUpdateType.solved:
                me.resetForNewWord(this.words.main[me.solved])
                await this.reSortPids()
                update = {
                    type: playerUpdateType,
                    pid: pid,
                    board: me.board,
                    solved: me.solved,
                    sortedPids: this.sortedPids,
                }
                break
            case PlayerUpdateType.continue_guessing:
                update = {
                    type: playerUpdateType,
                    pid: pid,
                    board: me.board,
                }
                break
            case PlayerUpdateType.lost:
                update = {
                    type: playerUpdateType,
                    pid: pid,
                }
                break
            case PlayerUpdateType.missed:
                me.resetForNewWord(this.words.reserve[me.missed])
                update = {
                    type: playerUpdateType,
                    pid: pid,
                    board: me.board,
                    missed: me.missed,
                    sortedPids: this.sortedPids,
                }
                break
            default:
                throw new Error("Invalid player update type.")
        }
        return {
            type: "success",
            update: update,
        }
    }

    serialized(): ServerGameState {
        const serializedPlayers: { [pid: PlayerID]: PlayerState } = {}
        for (const pid in this.players) {
            serializedPlayers[pid] = this.players[pid].serialized()
        }
        return {
            lobbyId: this.lobbyId,
            players: serializedPlayers,
            rules: this.rules,
            sortedPids: this.sortedPids,
            totalPlayers: this.totalPlayers,
            words: this.words,
            hasStarted: this.hasStarted,
            status: this.status,
        }
    }

    clientSerialized(pid: PlayerID): ClientGameState {
        const serializedPlayers: { [pid: PlayerID]: PlayerState } = {}
        for (const pid in this.players) {
            serializedPlayers[pid] = this.players[pid].serialized()
        }
        return {
            lobbyId: this.lobbyId,
            players: serializedPlayers,
            rules: this.rules,
            sortedPids: this.sortedPids,
            totalPlayers: this.totalPlayers,
            me: pid,
            status: this.status,
        }
    }
}
