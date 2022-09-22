import { GameRules, ServerGameState, GameStatus, PlayerState, ClientGameState, PlayerID, BoardSpace, GuessResult, PlayerStatus, PlayerUpdateType, PlayerUpdate } from "vsordle-types"
import { VALID_WORDS, VALID_GUESSES } from "./words"
import { PlayerInstance } from "./PlayerInstance"
import { range } from "lodash"
import { Mutex } from "async-mutex"

const WORD_SET = new Set(VALID_WORDS)
const GUESS_SET = new Set(VALID_GUESSES)

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
            reserve: []
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
            if (!this.players[pid].ready) 
                return false
        }
        return true
    }

    addPlayer(id: string, name: string) {
        this.players[id] = new PlayerInstance(id, name)
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
        const mainIndices: number[] = [], reserveIndices: number[] = []
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
            this.players[pid].start()
            this.players[pid].currWord = this.words.main[0]
        }
        // start game time
        const intervalId = setInterval(() => {
            if (this.gameTime === timeLimit) {
                clearInterval(intervalId)
                if (onTimeLimitReached) onTimeLimitReached()
            } else {
                this.gameTime += 1
            }
        }, 1_000)
        console.log(this.words.main)
        console.log(this.words.reserve)
        return true
    }

    async submitGuess(pid: string, guess: string): Promise<GuessResult> {
        const me = this.players[pid]
        const guessResult = this.getGuessResult(me.currWord, guess)
        if (
            me.status === PlayerStatus.done ||
            me.status === PlayerStatus.dead
        ) {
            return { type: "fail", error: "gameOver" }
        } else if (!this.isValidGuess(guess)) {
            return { type: "fail", error: "invalidGuess" }
        }
        // update board
        me.board[me.guesses] = guessResult
        me.guesses += 1
        let update: PlayerUpdate
        if (guess === me.currWord) {
            me.solved += 1
            if (me.solved === this.rules.wordCount) {
                update = {
                    type: "won",
                    pid: pid
                }
            } else {
                me.currWord = this.words.main[me.solved]
                me.board = PlayerInstance.cleanBoard()
                me.guesses = 0
                // sort pids
                await this.sortLock.runExclusive(() => {
                    this.sortedPids.sort((a, b) => {
                        const p1 = this.players[a]
                        const p2 = this.players[b]
                        return p2.solved - p1.solved
                    })
                    this.sortedPids.forEach((pid, i) => {
                        const player = this.players[pid]
                        player.position = i + 1
                    })
                })
                update = {
                    type: "solved",
                    pid: pid,
                    board: me.board,
                    solved: me.solved,
                    sortedPids: this.sortedPids
                }
            }
        } else if (me.guesses < this.rules.allowedGuesses) {
            update = {
                type: "continue_guessing",
                pid: pid,
                board: me.board
            }
        } else {
            // miss
            if (me.missed === this.rules.missCount) {
                update = {
                    type: "lost",
                    pid: pid,
                }
            } else {
                me.board = PlayerInstance.cleanBoard()
                me.currWord = this.words.reserve[me.missed]
                me.guesses = 0
                me.missed += 1
                update = {
                    type: "missed",
                    pid: pid,
                    board: me.board,
                    missed: me.missed,
                    sortedPids: this.sortedPids
                }
            }
        }
        return {
            type: "success",
            update: update,
        }
    }

    isValidGuess(guess: string) {
        return WORD_SET.has(guess) || GUESS_SET.has(guess)
    }

    private getGuessResult(currWord: string, guess: string): BoardSpace[] {
        const ret: BoardSpace[] = []
        // first get letter freqs of curr word 
        const wordFreqs: { [c: string]: number } = {}
        for (const c of currWord) {
            wordFreqs[c] = wordFreqs[c] ? wordFreqs[c] + 1 : 1
        }
        const guessFreqs: { [c: string]: number } = {}
        // determine color by comparing frequencies to letters
        for (let i = 0; i < 5; i++) {
            const char = guess[i]
            guessFreqs[char] = guessFreqs[char] ? guessFreqs[char] + 1 : 1
            if (char === currWord[i]) {
                ret.push(BoardSpace.correct)
            } else if (wordFreqs[char] && guessFreqs[char] <= wordFreqs[char]) {
                ret.push(BoardSpace.partial)
            } else {
                ret.push(BoardSpace.incorrect)
            }
        }
        return ret
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
            status: this.status
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
            status: this.status
        }
    }

}