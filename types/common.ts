export type PlayerID = string

export type Letter =
    | "a"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "h"
    | "i"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "o"
    | "p"
    | "q"
    | "r"
    | "s"
    | "t"
    | "u"
    | "v"
    | "w"
    | "x"
    | "y"
    | "z"

export enum BoardSpace {
    blank = -1,
    incorrect = 0,
    partial = 1,
    correct = 2,
}

export enum PlayerStatus {
    dead = 0,
    playing = 1,
    done = 2,
}

export type BoardRow = BoardSpace[]
export type Board = BoardRow[]

export interface PlayerState {
    pid: PlayerID
    displayName: string
    status: PlayerStatus
    position: number
    solved: number
    missed: number
    board: BoardSpace[][]
    ready: boolean
    lobbyLeader: boolean
}

export interface GameRules {
    allowedGuesses: number
    wordCount: number
    missCount: number
}