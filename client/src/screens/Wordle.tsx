import { createContext, useContext, Fragment } from "react"
import {
    BoardAnimation,
    ConnectedGameContextInterface,
    Letter,
    PlayerStatus,
} from "vsordle-types"
import { useNavigate } from "react-router-dom"
import {
    FinishTable,
    GameBoard,
    Keyboard,
    SideBar,
    StatusBar,
    Button,
} from "../components"
import { getOrdinalSuffix } from "../utils"
import * as Network from "../Network"
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
    const navigate = useNavigate()

    const { gameState, localState, guess, addChar, removeChar, submitGuess } =
        props

    const me = gameState.players[gameState.me]

    const onGameExit = async () => {
        await Network.leaveLobby()
        navigate("/")
    }

    let gameBody: any
    if (me.status !== PlayerStatus.playing || gameState.status === "done") {
        let text = ""
        if (me.status === PlayerStatus.done) {
            text = `You've finished ${me.position}${getOrdinalSuffix(
                me.position
            )} out of ${gameState.totalPlayers}!`
            if (me.position === 1) {
                text += " Congrats!"
            } else {
                text += " Better luck next time."
            }
        } else {
            const beginning =
                gameState.status === "done" ? "You've finished" : "You're in"
            text = `${beginning} ${me.position}${getOrdinalSuffix(
                me.position
            )} out of ${gameState.totalPlayers}! Better luck next time.`
        }
        gameBody = (
            <Fragment>
                <p style={{ color: "white", textAlign: "center" }}>{text}</p>
                <FinishTable gameState={gameState} />
                <Button onClick={onGameExit}>Exit Game</Button>
            </Fragment>
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
