import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, TextInput, useLoadingOverlay } from "../components"
import * as Network from "../Network"
import { useGameContext } from "../hook"
import "./JoinLobby.scss"

export const JoinLobby = () => {
    const { setGameState } = useGameContext()
    const [name, setName] = useState("")
    const [lobbyId, setLobbyId] = useState("")

    const { showLoadingOverlay, hideLoadingOverlay } = useLoadingOverlay()
    const navigate = useNavigate()

    const handleSubmit = async () => {
        if (name.length > 0 && lobbyId.length > 0) {
            try {
                showLoadingOverlay("Joining lobby...")
                const initState = await Network.joinLobby(name, lobbyId)
                setGameState(initState)
                navigate(`/game/${lobbyId}`)
            } catch (error) {
                alert(`Error: ${JSON.stringify(error)}`)
            } finally {
                hideLoadingOverlay()
            }
        } else {
            let message = ""
            if (name.length === 0) {
                message =
                    "Fill out the name field. You cannot have an empty name."
            } else {
                message = "Fill out the lobby field."
            }
            alert(message)
        }
    }

    return (
        <div className="joinLobby">
            <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Display Name"
            />
            <TextInput
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value)}
                label="Lobby ID"
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                }}
            >
                <Button
                    to="/"
                    style={{ marginRight: ".25rem", textAlign: "center" }}
                >
                    Back
                </Button>
                <Button onClick={handleSubmit} style={{ marginLeft: ".25rem" }}>
                    Join Game
                </Button>
            </div>
        </div>
    )
}
