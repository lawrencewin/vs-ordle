import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, TextInput, NumberInput, useLoadingOverlay } from "../components"
import { useGameContext } from "../hook"
import * as Network from "../Network"
import "./CreateLobby.scss"

export const CreateLobby = () => {
    const { setGameState } = useGameContext()
    const [name, setName] = useState("")
    const [wordCount, setWordCount] = useState(7)
    const [missCount, setMissCount] = useState(3)

    const { showLoadingOverlay, hideLoadingOverlay } = useLoadingOverlay()
    const navigate = useNavigate()

    const handleNumberInput = (setter: (n: number) => void) => {
        return (n: number) => { setter(n) }
    }

    const handleSubmit = async () => {
        if (name.length > 0) {
            try {
                showLoadingOverlay("Creating lobby...")
                const initState = await Network.createLobby(name, {
                    wordCount: wordCount,
                    missCount: missCount,
                    allowedGuesses: 6
                })
                setGameState(initState)
                navigate(`/game/${initState.lobbyId}`)
            } catch (error) {
                alert(`Error: ${JSON.stringify(error)}`)
            } finally {
                hideLoadingOverlay()
            }
        } else {
            alert("Fill out the name field. You cannot have an empty name.")
        }
    }

    return (
        <div className="createLobby">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} label="Display Name" />
            <div className="numberInputs">
                <NumberInput 
                    value={wordCount} 
                    onChange={handleNumberInput(setWordCount)} 
                    label="Number of Words" 
                    min={3}
                    max={10}
                    className="numberInputs__input"
                />
                <NumberInput 
                    value={missCount} 
                    onChange={handleNumberInput(setMissCount)} 
                    label="Number of Misses" 
                    min={1}
                    max={5}
                    className="numberInputs__input"
                />
            </div>
            <div style={{
                display: "flex",
                flexDirection: "row"
            }}>
                <Button to="/" style={{ marginRight: ".25rem", textAlign: "center" }}>Back</Button>
                <Button onClick={handleSubmit} style={{ marginLeft: ".25rem" }}>Create Game</Button>
            </div>
        </div>
    )
}