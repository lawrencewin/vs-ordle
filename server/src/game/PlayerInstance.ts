import { range } from "lodash"
import { ordinalSufix } from "utils"
import {
    BoardSpace,
    GameRules,
    PlayerState,
    PlayerStatus,
    PlayerUpdateType,
} from "vsordle-types"
import { VALID_WORDS, VALID_GUESSES } from "./words"

const WORD_SET = new Set(VALID_WORDS)
const GUESS_SET = new Set(VALID_GUESSES)

export class PlayerInstance implements PlayerState {
    pid: string
    displayName: string
    status: PlayerStatus
    position: number
    solved: number
    missed: number
    board: BoardSpace[][]
    ready: boolean
    lobbyLeader: boolean
    currWord: string
    guesses: string[]
    starters: Set<string>
    gameRules: GameRules

    constructor(
        id: string,
        displayName: string,
        gameRules: GameRules,
        isLobbyLeader: boolean = false
    ) {
        this.pid = id
        this.displayName = displayName
        this.gameRules = gameRules
        this.lobbyLeader = isLobbyLeader

        this.status = PlayerStatus.playing
        this.position = 1
        this.solved = 0
        this.missed = 0
        this.board = PlayerInstance.cleanBoard()
        this.ready = false
        this.currWord = ""
        this.guesses = []
        this.starters = new Set<string>()
    }

    static cleanBoard(): BoardSpace[][] {
        return range(6).map(() => range(5).map(() => BoardSpace.blank))
    }

    private getNextBoardRow(guess: string): BoardSpace[] {
        const ret: BoardSpace[] = [...Array(5)].map(() => BoardSpace.incorrect)
        // first get letter freqs of curr word
        const charFreqsOfCurr: { [c: string]: number } = {}
        for (const c of this.currWord) {
            charFreqsOfCurr[c] = charFreqsOfCurr[c] ? charFreqsOfCurr[c] + 1 : 1
        }
        // 2 passes - one for correct and one for partial
        for (let i = 0; i < 5; i++) {
            const char = guess[i]
            if (char === this.currWord[i]) {
                ret[i] = BoardSpace.correct
                // take away from existing freqs for reasons
                charFreqsOfCurr[char] -= 1
            }
        }
        // for partial - if char exists in remaining freqs, mark it and update freqs
        for (let i = 0; i < 5; i++) {
            const char = guess[i]
            if (char in charFreqsOfCurr && charFreqsOfCurr[char] > 0) {
                ret[i] = BoardSpace.partial
                charFreqsOfCurr[char] -= 1
            }
        }
        return ret
    }

    get numGuesses() {
        return this.guesses.length
    }

    checkGuessValidity(guess: string) {
        if (!(WORD_SET.has(guess) || GUESS_SET.has(guess))) {
            throw new Error("Guess is not valid.")
        }
        if (
            this.gameRules.uniqueStartingWords &&
            this.numGuesses === 0 &&
            this.starters.has(guess)
        ) {
            throw new Error(
                `Non-unique starter: "${guess}" has already been used as a starter.`
            )
        }
        if (this.gameRules.hardMode && this.numGuesses > 0) {
            // check if all clues have been used via the latest board row
            const latestGuessResult = this.board[this.numGuesses - 1]
            const prevGuess = this.guesses[this.numGuesses - 1]

            const yellowLetters = []
            const badGuesses = new Set()
            for (let i = 0; i < 5; i++) {
                if (latestGuessResult[i] === BoardSpace.correct) {
                    // first see if green spaces have the correct letter
                    if (prevGuess[i] !== guess[i]) {
                        throw new Error(
                            `${i + 1}${ordinalSufix(
                                i + 1
                            )} letter must be "${this.currWord[
                                i
                            ].toUpperCase()}".`
                        )
                    }
                } else {
                    // prepping for yellow check
                    if (latestGuessResult[i] === BoardSpace.partial) {
                        yellowLetters.push(prevGuess[i])
                    }
                    badGuesses.add(guess[i])
                }
            }
            // verify that yellow clues are in the guess
            for (const letter of yellowLetters) {
                if (!badGuesses.has(letter)) {
                    throw new Error(
                        `${letter.toUpperCase()} must be in the guess.`
                    )
                }
            }
        }
    }

    readyUp() {
        this.ready = !this.ready
    }

    submitGuess(guess: string): PlayerUpdateType {
        if (this.gameRules.uniqueStartingWords && this.numGuesses === 0) {
            this.starters.add(guess)
        }
        this.guesses.push(guess)
        const boardSpaces = this.getNextBoardRow(guess)
        this.board[this.numGuesses] = boardSpaces
        if (guess === this.currWord) {
            // we solved it
            this.solved += 1
            if (this.solved === this.gameRules.wordCount) {
                return PlayerUpdateType.won
            } else {
                return PlayerUpdateType.solved
            }
        } else if (this.numGuesses < this.gameRules.allowedGuesses) {
            // continue guessing
            return PlayerUpdateType.continue_guessing
        } else {
            // we failed
            this.missed += 1
            if (this.missed === this.gameRules.missCount) {
                return PlayerUpdateType.lost
            } else {
                return PlayerUpdateType.missed
            }
        }
    }

    resetForNewWord(newWord: string) {
        this.guesses = []
        this.board = PlayerInstance.cleanBoard()
        this.currWord = newWord
    }

    start(firstWord: string) {
        this.status = PlayerStatus.playing
        this.position = 1
        this.solved = 0
        this.missed = 0
        this.board = PlayerInstance.cleanBoard()
        this.currWord = firstWord
    }

    serialized(): PlayerState {
        return {
            pid: this.pid,
            displayName: this.displayName,
            status: this.status,
            position: this.position,
            solved: this.solved,
            missed: this.missed,
            board: this.board,
            ready: this.ready,
            lobbyLeader: this.lobbyLeader,
        }
    }
}
