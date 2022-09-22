"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerInstance = void 0;
const lodash_1 = require("lodash");
const vsordle_types_1 = require("vsordle-types");
class PlayerInstance {
    constructor(id, displayName, isLobbyLeader = false) {
        this.pid = id;
        this.displayName = displayName;
        this.lobbyLeader = isLobbyLeader;
        this.status = vsordle_types_1.PlayerStatus.playing;
        this.position = 0;
        this.solved = 0;
        this.missed = 0;
        this.board = [];
        this.ready = false;
        this.currWord = "";
        this.guesses = 0;
    }
    static cleanBoard() {
        return (0, lodash_1.range)(6).map(() => (0, lodash_1.range)(5).map(() => vsordle_types_1.BoardSpace.blank));
    }
    readyUp() {
        this.ready = !this.ready;
    }
    start() {
        this.status = vsordle_types_1.PlayerStatus.playing;
        this.position = 1;
        this.solved = 0;
        this.missed = 0;
        this.board = PlayerInstance.cleanBoard();
    }
    serialized() {
        return {
            pid: this.pid,
            displayName: this.displayName,
            status: this.status,
            position: this.position,
            solved: this.solved,
            missed: this.missed,
            board: this.board,
            ready: this.ready,
            lobbyLeader: this.lobbyLeader
        };
    }
}
exports.PlayerInstance = PlayerInstance;
