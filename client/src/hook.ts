import { range } from "lodash"
import React, { useState, useRef, createContext, useContext, useEffect } from "react"
import {
    BoardSpace,
    ClientGameState,
    Letter,
    LocalState,
    PlayerStatus,
    GuessError,
    PlayerUpdate,
    GuessResponse,
    GameContextInterface,
} from "vsordle-types"
import { VALID_WORDS, VALID_GUESSES } from "./assets/words"
import * as Network from "./Network"

const GUESS_SET = new Set([...VALID_WORDS, ...VALID_GUESSES])

const emptyBoard = () =>
    range(6).map(() => range(5).map(() => BoardSpace.blank))

function useGameStates(): [
    ClientGameState | null,
    LocalState,
    React.Dispatch<React.SetStateAction<ClientGameState | null>>,
    React.Dispatch<React.SetStateAction<LocalState>>
] {
    const [gameState, setGameState] = useState<ClientGameState | null>({
        lobbyId: "",
        me: "",
        players: {},
        rules: { allowedGuesses: 6, wordCount: 7, missCount: 3 },
        sortedPids: [],
        totalPlayers: 0,
        status: "lobby"
    })

    const [localState, setLocalState] = useState<LocalState>({
        board: emptyBoard(),
        guesses: [],
        keyboard: {
            keys: [
                "q",
                "w",
                "e",
                "r",
                "t",
                "y",
                "u",
                "i",
                "o",
                "p",
                "a",
                "s",
                "d",
                "f",
                "g",
                "h",
                "j",
                "k",
                "l",
                "z",
                "x",
                "c",
                "v",
                "b",
                "n",
                "m",
            ],
            colors: {},
        },
    })
    return [gameState, localState, setGameState, setLocalState]
}

export function useGame(): GameContextInterface {
    const [gameState, localState, setGameState, setLocalState] = useGameStates()

    const [currentGuess, setCurrentGuess] = useState<string>("")
    const guessRef = useRef(currentGuess) // to prevent staleness in closures

    const guessCountRef = useRef(0)

    function addChar(char: Letter) {
        setCurrentGuess((guess) => {
            if (guess.length < 5) {
                guess += char
            }
            guessRef.current = guess
            return guess
        })
    }

    function removeChar() {
        setCurrentGuess((guess) => {
            if (guess.length > 0) {
                guess = guess.substring(0, guess.length - 1)
            }
            guessRef.current = guess
            return guess
        })
    }

    function submitGuess() {
        const guess = guessRef.current
        if (guess.length !== 5) {
            setLocalState((state) => ({
                ...state,
                boardAnimation: {
                    type: "error",
                    row: state.guesses.length,
                },
                error: "Guess is not 5 letters long.",
            }))
        } else if (!GUESS_SET.has(guess)) {
            setLocalState((state) => ({
                ...state,
                boardAnimation: {
                    type: "error",
                    row: state.guesses.length,
                },
                error: "Inputted not a valid guess.",
            }))
        } else if (gameState) {
            Network.submitGuess(guess).then((result) => {
                if (result.type === "success") {
                    // clear guess
                    setCurrentGuess("")
                    guessRef.current = ""
                    if (result.update.pid === gameState.me) {
                        updateLocalState(guess, result.update)
                    }
                } else {
                    handleFail(result)
                }
            })
        }
    }

    function updateLocalState(guess: string, update: PlayerUpdate) {
        if (update.type === "continue_guessing") {
            const numGuesses = guessCountRef.current
            // get newRow
            const newRow = update.board[numGuesses]
            // update n guesses
            guessCountRef.current += 1
            setLocalState((state) => {
                // for coloring keyboard
                const newColors: { [k: string]: BoardSpace } = {}
                for (let i = 0; i < 5; i++) {
                    const status = newRow[i]
                    if (
                        status > newColors[guess[i]] ||
                        newColors[guess[i]] === undefined
                    ) {
                        newColors[guess[i]] = status
                    }
                }
                return {
                    ...state,
                    board: update.board,
                    boardAnimation: undefined,
                    guesses: [...state.guesses, guess],
                    keyboard: {
                        ...state.keyboard,
                        colors: {
                            ...state.keyboard.colors,
                            ...newColors,
                        },
                    },
                    error: undefined,
                }
            })
        } else if (update.type === "solved" || update.type === "missed") {
            // clear main board and keyboard
            guessCountRef.current = 0
            setLocalState((state) => {
                return {
                    ...state,
                    board: emptyBoard(),
                    boardAnimation:
                        update.type === "solved"
                            ? {
                                  type: "solved",
                                  row: state.guesses.length,
                              }
                            : { type: "missed" },
                    guesses: [],
                    keyboard: {
                        ...state.keyboard,
                        colors: {},
                    },
                    error: undefined,
                }
            })
        } else {
            setLocalState((state) => ({
                ...state,
                boardAnimation: {
                    type: update.type === "won" ? "won" : "lost",
                },
                error: undefined,
            }))
        }
    }

    const handleFail = (result: GuessError) => {
        setLocalState((state) => ({
            ...state,
            error: result.error,
        }))
        setTimeout(() => {
            setLocalState((state) => ({
                ...state,
                error: undefined,
            }))
        }, 500)
    }

    const guess = guessRef.current

    return { 
        localState, 
        gameState, 
        guess, 
        addChar, 
        removeChar, 
        submitGuess, 
        setGameState,
        connect: (url, { onConnect, onDisconnect, onError }) => {
            Network.connect(url, () => {
                console.log("HEYYYY")
                Network.bindGameToSocket((update) => {
                    console.log("here's an update", update)
                    // merge update
                    setGameState(state => {
                        if (state) {
                            return {
                                ...state,
                                ...update,
                                players: {
                                    ...state.players,
                                    ...update.players
                                }
                            }
                        }
                        console.log("whoops")
                        console.log(state)
                        return state
                    })
                })
                onConnect()
            }, onDisconnect, onError)
        }
    }
}

export const useCurrentLobby = () => {
    const state = useState<string | null>(null)
    useEffect(() => {
        return Network.listenToLobbyChange((id) => {
            console.log("current lobby:", id)
            state[1](id)
        })
    }, [])
    return state
}

export const GameContext = createContext({} as GameContextInterface)
export const useGameContext = () => useContext(GameContext)