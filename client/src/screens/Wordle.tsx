import { createContext, useContext, Fragment } from "react"
import { BoardAnimation, ConnectedGameContextInterface, Letter, PlayerStatus } from "vsordle-types"
import { GameBoard, Keyboard, SideBar, StatusBar } from "../components"
import "./Wordle.scss"

interface WordleContextType {
    guess: string
    boardAnimation?: BoardAnimation
    wordsSolved: number
    addChar: (char: Letter) => void
    removeChar: () => void
    submitGuess: () => void
}

export const WordleContext = createContext<WordleContextType>({
    guess: "",
    wordsSolved: 0,
    addChar: (char: Letter) => {},
    removeChar: () => {},
    submitGuess: () => {},
})

export const useWordleContext = () => useContext(WordleContext)

export function Wordle(props: ConnectedGameContextInterface) {
    const { gameState, localState, guess, addChar, removeChar, submitGuess } = props

    const status = gameState.players[gameState.me].status

    let gameBody: any
    if (status !== PlayerStatus.playing) {
        let text = ""
        if (status === PlayerStatus.done) {
            text = "You've finished!"
        } else {
            text = "You're out!"
        }
        gameBody = (
            <h1 style={{ color: "white", textAlign: "center" }}>{text}</h1>
        )
    } else {
        gameBody = (
            <Fragment>
                <StatusBar error={localState.error} />
                <GameBoard
                    board={localState.board}
                    previousGuesses={localState.guesses}
                    currentGuess={guess}
                />
                <Keyboard
                    disabled={gameState.status !== "playing"}
                    keyboardConfig={localState.keyboard}
                />
            </Fragment>
        )
    }

    return (
        <WordleContext.Provider
            value={{
                guess: guess,
                boardAnimation: localState.boardAnimation,
                wordsSolved: gameState.players[gameState.me].solved,
                addChar: addChar,
                removeChar: removeChar,
                submitGuess: submitGuess,
            }}
        >
            <main className="game">
                <SideBar gameState={gameState} />
                <div className="gamebody">{gameBody}</div>
            </main>
        </WordleContext.Provider>
    )
}
