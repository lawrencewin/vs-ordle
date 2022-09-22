import { useState, useEffect, useContext } from "react"
import { Board, BoardAnimation, BoardRow, BoardSpace, Letter } from "vsordle-types"
import { boardSpaceStatusToString } from "../utils"
import { Particles } from "./Particles"
import "./GameBoard.scss"
import { useWordleContext } from "../screens"

interface GameBoardProps {
    board: Board
    previousGuesses: string[]
    currentGuess: string
}

export function GameBoard({
    board,
    previousGuesses,
    currentGuess,
}: GameBoardProps) {
    const { boardAnimation, wordsSolved } = useWordleContext()
    const [shouldAnimateBoard, setShouldAnimateBoard] = useState(false)

    useEffect(() => {
        if (boardAnimation) {
            setShouldAnimateBoard(true)
            setTimeout(() => setShouldAnimateBoard(false), 250)
        }
    }, [boardAnimation, wordsSolved])

    // useEffect(() => {
    //     if (update === "missed") {
    //         setShouldAnimateMiss(true)
    //         setTimeout(() => setShouldAnimateMiss(false), 250)
    //     }
    // }, [update])

    return (
        <div className="gameboard">
            {board.map((row, i) => {
                const rowProps: GameBoardRowProps = { row: row }
                if (i < previousGuesses.length) {
                    rowProps.guess = previousGuesses[i]
                } else if (i === previousGuesses.length) {
                    rowProps.guess = currentGuess
                }
                // animate solve
                if (boardAnimation && shouldAnimateBoard) {
                    const { type } = boardAnimation
                    if (type === "solved" || type === "error") {
                        rowProps.animation =
                            boardAnimation.row === i
                                ? boardAnimation
                                : undefined
                    } else {
                        rowProps.animation = boardAnimation
                    }
                }
                return <GameBoardRow {...rowProps} key={i} />
            })}
        </div>
    )
}

interface GameBoardRowProps {
    row: BoardRow
    guess?: string
    animation?: BoardAnimation
}

function GameBoardRow({ row, guess, animation }: GameBoardRowProps) {
    return (
        <div className="gameboardRow">
            {row.map((space, i) => {
                let letter: Letter | undefined
                let highlighted = false
                if (guess && i < guess.length) {
                    letter = guess[i] as Letter
                    highlighted = true
                }
                return (
                    <GameBoardSpace
                        space={space}
                        letter={letter}
                        highlighted={highlighted}
                        renderParticles={animation?.type === "solved"}
                        error={
                            animation?.type === "error" ||
                            animation?.type === "missed"
                        }
                        key={i}
                    />
                )
            })}
        </div>
    )
}

interface GameBoardSpaceProps {
    space: BoardSpace
    letter?: Letter
    highlighted?: boolean
    renderParticles?: boolean
    error?: boolean
}

function GameBoardSpace({
    space,
    letter,
    highlighted,
    renderParticles,
    error,
}: GameBoardSpaceProps) {
    let className = "gameboardSpace"
    if (error) {
        className += " error"
    } else if (space > -1) {
        className += " " + boardSpaceStatusToString(space)
    } else if (highlighted) {
        className += " current"
    }
    return (
        <div className={className}>
            {letter}
            {renderParticles === true ? <Particles n={10} /> : null}
        </div>
    )
}
