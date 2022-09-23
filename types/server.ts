import { BoardSpace, GameRules, PlayerID, PlayerState } from "./common"

// mocked back-end types
export interface GuessResponse {
    type: "success"
    update: PlayerUpdate
}
export interface GuessError {
    type: "fail"
    error: "gameOver" | "invalidGuess" | "serverError"
    message?: string
}
export type GuessResult = GuessResponse | GuessError

export type PlayerUpdateType =
    | "won"
    | "solved"
    | "missed"
    | "continue_guessing"
    | "lost"
export type PlayerUpdate =
    | {
          pid: PlayerID
          type: "won"
          solved: number
      }
    | {
          pid: PlayerID
          type: "lost"
      }
    | {
          pid: PlayerID
          type: "continue_guessing"
          board: BoardSpace[][]
      }
    | {
          pid: PlayerID
          type: "solved"
          board: BoardSpace[][]
          sortedPids: PlayerID[]
          solved: number
      }
    | {
          pid: PlayerID
          type: "missed"
          board: BoardSpace[][]
          sortedPids: PlayerID[]
          missed: number
      }

export type PlayerStateUpdate = Partial<PlayerState>

export type GameStatus = "lobby" | "starting" | "playing" | "done"

export type GameUpdate =
    | {
          type: "game_status_update"
          status: GameStatus
      }
    | {
          type: "lobby_joined"
          lobbyId: string
          player: PlayerState
          playerCount: number
          sortedPids: PlayerID[]
      }
    | {
          type: "lobby_left"
          lobbyId: string
          pid: PlayerID
          playerCount: number
          sortedPids: PlayerID[]
      }
    | {
          type: "ready_update"
          pid: PlayerID
          ready: boolean
      }
    | {
          type: "guess_result"
          result: GuessResult
      }

export interface ServerGameState {
    lobbyId: string
    players: {
        [pid: PlayerID]: PlayerState
    }
    rules: GameRules
    sortedPids: PlayerID[]
    totalPlayers: number
    words: {
        main: string[]
        reserve: string[]
    }
    hasStarted: boolean
    status: GameStatus
}

export type ServerGameStateUpdate = Partial<ServerGameState>

export enum ClientEvent {
    create_lobby = "create_lobby",
    join_lobby = "join_lobby",
    leave_lobby = "leave_lobby",
    ready = "ready",
    guess = "guess",
}
