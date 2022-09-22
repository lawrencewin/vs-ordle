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
exports.GameInstance = void 0;
const vsordle_types_1 = require("vsordle-types");
const words_1 = require("./words");
const PlayerInstance_1 = require("./PlayerInstance");
const lodash_1 = require("lodash");
const async_mutex_1 = require("async-mutex");
const emptyBoard = () => (0, lodash_1.range)(6).map(() => (0, lodash_1.range)(5).map(() => -1));
const WORD_SET = new Set(words_1.VALID_WORDS);
const GUESS_SET = new Set(words_1.VALID_GUESSES);
class GameInstance {
    constructor(lobbyId, rules) {
        this.lobbyId = lobbyId;
        this.rules = rules;
        this.players = {};
        this.sortedPids = [];
        this.totalPlayers = 0;
        this.words = {
            main: [],
            reserve: []
        };
        this.hasStarted = false;
        this.status = "lobby";
        this.sortLock = new async_mutex_1.Mutex();
    }
    get canStart() {
        if (this.totalPlayers <= 1) {
            return false;
        }
        for (const pid in this.players) {
            if (!this.players[pid].ready)
                return false;
        }
        return true;
    }
    addPlayer(id, name) {
        this.players[id] = new PlayerInstance_1.PlayerInstance(id, name);
        this.sortedPids.push(id);
        this.totalPlayers += 1;
    }
    removePlayer(id) {
        delete this.players[id];
        this.sortedPids = this.sortedPids.filter((val) => val !== id);
        this.totalPlayers -= 1;
    }
    hasPlayer(id) {
        return this.players[id] !== undefined;
    }
    start() {
        if (!this.canStart) {
            return false;
        }
        // generate words
        const mainIndices = [], reserveIndices = [];
        for (let i = 0; i < this.rules.wordCount; i++) {
            let idx = Math.floor(Math.random() * words_1.VALID_WORDS.length);
            while (mainIndices.includes(idx)) {
                idx = Math.floor(Math.random() * words_1.VALID_WORDS.length);
            }
            mainIndices.push(idx);
        }
        for (let j = 0; j < this.rules.missCount - 1; j++) {
            let idx = Math.floor(Math.random() * words_1.VALID_WORDS.length);
            while (reserveIndices.includes(idx)) {
                idx = Math.floor(Math.random() * words_1.VALID_WORDS.length);
            }
            reserveIndices.push(idx);
        }
        this.words.main = mainIndices.map((i) => words_1.VALID_WORDS[i]);
        this.words.reserve = reserveIndices.map((j) => words_1.VALID_WORDS[j]);
        // start game for each player
        for (const pid in this.players) {
            this.players[pid].start();
            this.players[pid].currWord = this.words.main[0];
        }
        console.log(this.words.main);
        console.log(this.words.reserve);
        return true;
    }
    submitGuess(pid, guess) {
        return __awaiter(this, void 0, void 0, function* () {
            const me = this.players[pid];
            const guessResult = this.getGuessResult(me.currWord, guess);
            if (me.status === vsordle_types_1.PlayerStatus.done ||
                me.status === vsordle_types_1.PlayerStatus.dead) {
                return { type: "fail", error: "gameOver" };
            }
            else if (!this.isValidGuess(guess)) {
                return { type: "fail", error: "invalidGuess" };
            }
            // update board
            me.board[me.guesses] = guessResult;
            me.guesses += 1;
            let updateType;
            if (guess === me.currWord) {
                me.solved += 1;
                if (me.solved === this.rules.wordCount) {
                    updateType = "won";
                }
                else {
                    updateType = "solved";
                    me.currWord = this.words.main[me.solved];
                    me.board = emptyBoard();
                    me.guesses = 0;
                    // sort pids
                    yield this.sortLock.runExclusive(this.sortPids);
                }
            }
            else if (me.guesses < this.rules.allowedGuesses) {
                updateType = "continue_guessing";
            }
            else {
                // miss
                if (me.missed === this.rules.missCount) {
                    updateType = "lost";
                }
                else {
                    updateType = "missed";
                    me.board = emptyBoard();
                    me.currWord = this.words.reserve[me.missed];
                    me.guesses = 0;
                    me.missed += 1;
                }
            }
            return {
                type: "success",
                update: {
                    pid: pid,
                    type: updateType,
                    board: me.board,
                    sortedPids: this.sortedPids
                },
            };
        });
    }
    isValidGuess(guess) {
        return WORD_SET.has(guess) || GUESS_SET.has(guess);
    }
    getGuessResult(currWord, guess) {
        const ret = [];
        for (let i = 0; i < 5; i++) {
            const char = guess[i];
            if (char === currWord[i]) {
                ret.push(vsordle_types_1.BoardSpace.correct);
            }
            else if (currWord.includes(char)) {
                ret.push(vsordle_types_1.BoardSpace.partial);
            }
            else {
                ret.push(vsordle_types_1.BoardSpace.incorrect);
            }
        }
        return ret;
    }
    sortPids() {
        this.sortedPids.sort((a, b) => {
            const p1 = this.players[a];
            const p2 = this.players[b];
            return p2.solved - p1.solved;
        });
    }
    serialized() {
        const serializedPlayers = {};
        for (const pid in this.players) {
            serializedPlayers[pid] = this.players[pid].serialized();
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
        };
    }
    clientSerialized(pid) {
        const serializedPlayers = {};
        for (const pid in this.players) {
            serializedPlayers[pid] = this.players[pid].serialized();
        }
        return {
            lobbyId: this.lobbyId,
            players: serializedPlayers,
            rules: this.rules,
            sortedPids: this.sortedPids,
            totalPlayers: this.totalPlayers,
            me: pid,
            status: this.status
        };
    }
}
exports.GameInstance = GameInstance;
