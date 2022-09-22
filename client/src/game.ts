import { range } from "lodash"
import { VALID_WORDS, VALID_GUESSES } from "./assets/words"
import {
    BoardSpace,
    PlayerStatus,
    PlayerUpdateType,
    GuessResult,
    ClientGameStateUpdate,
} from "vsordle-types"

// const WORD_SET = new Set(VALID_WORDS)
// const GUESS_SET = new Set(VALID_GUESSES)

// // game that i'll implement on server later
// interface PlayerState {
//     id: string
//     guesses: number
//     misses: number
//     solved: number
//     currWord: string
//     status: PlayerStatus
//     board: BoardSpace[][]
// }

// const emptyBoard = () => range(6).map(() => range(5).map(() => -1))

// export class Wordle {
//     words: string[] = []
//     missReserve: string[] = []
//     players: { [id: string]: PlayerState } = {}
//     guessLimit: number
//     missLimit: number
//     totalWords: number

//     constructor(
//         guessLimit: number,
//         numWords: number,
//         numMisses: number,
//         pids: string[]
//     ) {
//         this.guessLimit = guessLimit
//         this.totalWords = numWords
//         this.missLimit = numMisses - 1
//         for (const pid of pids) {
//             this.players[pid] = {
//                 id: pid,
//                 guesses: 0,
//                 misses: 0,
//                 solved: 0,
//                 currWord: "",
//                 status: PlayerStatus.playing,
//                 board: emptyBoard(),
//             }
//         }
//         this.reset()
//     }

//     reset() {
//         const wordIndices: number[] = []
//         const missIndices: number[] = []
//         for (let i = 0; i < this.totalWords + this.missLimit; i++) {
//             let idx = Math.floor(Math.random() * VALID_WORDS.length)
//             while (wordIndices.includes(idx)) {
//                 idx = Math.floor(Math.random() * VALID_WORDS.length)
//             }
//             if (i < this.totalWords) {
//                 wordIndices.push(idx)
//             } else {
//                 missIndices.push(idx)
//             }
//         }
//         this.words = wordIndices.map((idx) => VALID_WORDS[idx])
//         this.missReserve = missIndices.map((idx) => VALID_WORDS[idx])

//         for (const pid in this.players) {
//             this.players[pid].guesses = 0
//             this.players[pid].misses = 0
//             this.players[pid].solved = 0
//             this.players[pid].currWord = this.words[0]
//             this.players[pid].status = PlayerStatus.playing
//             this.players[pid].board = emptyBoard()
//         }
//         console.log("Words:", this.words)
//         console.log("Miss reserve:", this.missReserve)
//     }

//     submitGuess(pid: string, guess: string): GuessResult {
//         const me = this.players[pid]
//         const guessResult = this.getGuessResult(me.currWord, guess)
//         if (
//             me.status === PlayerStatus.done ||
//             me.status === PlayerStatus.dead
//         ) {
//             return { type: "fail", error: "gameOver" }
//         } else if (!this.isValidGuess(guess)) {
//             return { type: "fail", error: "invalidGuess" }
//         }
//         // update board
//         me.board[me.guesses] = guessResult
//         me.guesses += 1
//         let updateType: PlayerUpdateType
//         if (guess === me.currWord) {
//             me.solved += 1
//             if (me.solved === this.totalWords) {
//                 updateType = "won"
//             } else {
//                 updateType = "solved"
//                 me.currWord = this.words[me.solved]
//                 me.board = emptyBoard()
//                 me.guesses = 0
//             }
//         } else if (me.guesses < this.guessLimit) {
//             updateType = "continue_guessing"
//         } else {
//             // miss
//             if (me.misses === this.missLimit) {
//                 updateType = "lost"
//             } else {
//                 updateType = "missed"
//                 me.board = emptyBoard()
//                 me.currWord = this.missReserve[me.misses]
//                 me.guesses = 0
//                 me.misses += 1
//             }
//         }
//         return {
//             type: "success",
//             update: {
//                 pid: pid,
//                 type: updateType,
//                 board: me.board,
//                 sortedPids: []
//             },
//         }
//     }

//     isValidGuess(guess: string) {
//         return WORD_SET.has(guess) || GUESS_SET.has(guess)
//     }

//     private getGuessResult(currWord: string, guess: string): BoardSpace[] {
//         const ret: BoardSpace[] = []
//         for (let i = 0; i < 5; i++) {
//             const char = guess[i]
//             if (char === currWord[i]) {
//                 ret.push(BoardSpace.correct)
//             } else if (currWord.includes(char)) {
//                 ret.push(BoardSpace.partial)
//             } else {
//                 ret.push(BoardSpace.incorrect)
//             }
//         }
//         return ret
//     }
// }

// export function handleGameUpdate(update: ClientGameStateUpdate) {
//     switch
// }