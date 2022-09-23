import { range } from "lodash"
import { BoardSpace, PlayerState, PlayerStatus } from "vsordle-types"

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
    guesses: number

    constructor(
        id: string,
        displayName: string,
        isLobbyLeader: boolean = false
    ) {
        this.pid = id
        this.displayName = displayName
        this.lobbyLeader = isLobbyLeader

        this.status = PlayerStatus.playing
        this.position = 1
        this.solved = 0
        this.missed = 0
        this.board = PlayerInstance.cleanBoard()
        this.ready = false
        this.currWord = ""
        this.guesses = 0
    }

    static cleanBoard(): BoardSpace[][] {
        return range(6).map(() => range(5).map(() => BoardSpace.blank))
    }

    readyUp() {
        this.ready = !this.ready
    }

    start() {
        this.status = PlayerStatus.playing
        this.position = 1
        this.solved = 0
        this.missed = 0
        this.board = PlayerInstance.cleanBoard()
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
