import { Letter, BoardSpace, PlayerID, PlayerState, GameRules } from "./common"
import { GameStatus } from "./server"

export interface KeyboardConfig {
    keys: Letter[]
    colors: {
        [key: string]: BoardSpace
    }
}

export interface ClientGameState {
    lobbyId: string
    me: PlayerID
    players: {
        [pid: PlayerID]: PlayerState
    }
    rules: GameRules
    sortedPids: PlayerID[]
    totalPlayers: number
    status: GameStatus
}

export type ClientPlayerStateUpdate = Partial<PlayerState> | null
export type ClientGameStateUpdate = Partial<ClientGameState> | {
    players?: {
        [pid: PlayerID]: ClientPlayerStateUpdate
    }
}

export interface LocalState {
    board: BoardSpace[][]
    guesses: string[]
    keyboard: KeyboardConfig
    boardAnimation?: BoardAnimation
    error?: string
    loading?: boolean
}

export interface GameContextInterface {
    localState: LocalState
    gameState: ClientGameState | null
    guess: string
    addChar: (char: Letter) => void
    removeChar: () => void
    submitGuess: () => void
    setGameState: (v: (ClientGameState | null) | ((prev: ClientGameState | null) => ClientGameState | null)) => void
    connect: (url: string, callbacks: {
        onConnect: () => void,
        onDisconnect: () => void,
        onError: (error: any) => void,
    } ) => void
}

export interface ConnectedGameContextInterface extends GameContextInterface {
    gameState: ClientGameState
}

export type BoardAnimation = BoardAnimationOnAll | BoardAnimationOnRow

type BoardAnimationOnAll = {
    type: "won" | "missed" | "lost"
}

type BoardAnimationOnRow = {
    type: "solved" | "error"
    row: number
}
