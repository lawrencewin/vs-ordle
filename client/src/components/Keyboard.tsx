import { useState, useEffect, useRef } from "react"
import { KeyboardConfig, Letter } from "vsordle-types"
import { ReactComponent as Backspace } from "../assets/backspace.svg"
import "./Keyboard.scss"
import { boardSpaceStatusToString } from "../utils"
import { useWordleContext } from "../screens"

interface KeyboardProps {
    keyboardConfig: KeyboardConfig
    disabled: boolean
}

const KEY_INDICES: { [k: string]: number } = {
    q: 0,
    w: 1,
    e: 2,
    r: 3,
    t: 4,
    y: 5,
    u: 6,
    i: 7,
    o: 8,
    p: 9,
    a: 10,
    s: 11,
    d: 12,
    f: 13,
    g: 14,
    h: 15,
    j: 16,
    k: 17,
    l: 18,
    z: 19,
    x: 20,
    c: 21,
    v: 22,
    b: 23,
    n: 24,
    m: 25,
}

export function Keyboard({
    keyboardConfig: { keys, colors },
    disabled: disabledProp,
}: KeyboardProps) {
    const { addChar, removeChar, submitGuess } = useWordleContext()

    const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({})
    const [disabledState, setDisabledState] = useState(false)

    const disabled = disabledProp || disabledState
    const disabledRef = useRef(disabled)

    const handleKey = (key: Letter) => addChar(key)
    const handleBackspace = () => removeChar()

    const KeyboardButton = (letter: Letter, i: number) => {
        let className = "keyboardButton"
        if (activeKeys[letter] === true) {
            className += " down"
        } else if (colors[letter] !== undefined) {
            className += " " + boardSpaceStatusToString(colors[letter])
        }
        return (
            <button
                disabled={disabled}
                className={className}
                onClick={() => handleKey(letter)}
                key={i}
            >
                {letter}
            </button>
        )
    }

    const keyDownListener = (e: KeyboardEvent) => {
        if (disabledRef.current === true) {
            return
        }
        const key = e.key.toLowerCase()
        if (
            KEY_INDICES[key] !== undefined ||
            key === "backspace" ||
            key === "enter"
        ) {
            setActiveKeys((prev) => ({ ...prev, [key]: true }))
            if (KEY_INDICES[key] !== undefined) {
                addChar(key as Letter)
            } else if (key === "backspace") {
                removeChar()
            } else {
                submitGuess()
                setDisabledState(true)
                setTimeout(() => setDisabledState(false), 750)
            }
        }
    }
    const keyUpListener = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (
            KEY_INDICES[key] !== undefined ||
            key === "backspace" ||
            key === "enter"
        ) {
            setActiveKeys((prev) => ({ ...prev, [key]: false }))
        }
    }

    useEffect(() => {
        window.addEventListener("keydown", keyDownListener)
        window.addEventListener("keyup", keyUpListener)
        return () => {
            window.removeEventListener("keydown", keyDownListener)
            window.removeEventListener("keyup", keyUpListener)
        }
    }, [])

    useEffect(() => {
        disabledRef.current = disabledProp || disabledState
    }, [disabledProp, disabledState])

    const enterClassName = "keyboardButton" + (activeKeys.enter ? " down" : "")
    const backspaceClassName =
        "keyboardButton" + (activeKeys.backspace ? " down" : "")

    return (
        <div className="keyboard">
            <div className="keyboardRow">
                {keys.slice(0, 10).map(KeyboardButton)}
            </div>
            <div className="keyboardRow">
                {keys.slice(10, 19).map(KeyboardButton)}
            </div>
            <div className="keyboardRow">
                <button disabled={disabled} className={enterClassName}>
                    ENTER
                </button>
                {keys.slice(19, 26).map(KeyboardButton)}
                <button
                    disabled={disabled}
                    className={backspaceClassName}
                    onClick={handleBackspace}
                >
                    <Backspace style={{ strokeWidth: 2 }} />
                </button>
            </div>
        </div>
    )
}
