import { useEffect, useState } from "react"
import {
    BrowserRouter as Router,
    Navigate,
    Route,
    Routes,
    useNavigate,
} from "react-router-dom"
import { Home, CreateLobby, JoinLobby } from "./screens"
import { HeadBar, LoadingOverlay, LoadingOverlayContext } from "./components"
import { Game } from "./screens/Game"
import { GameContext, useGame } from "./hook"
import "./App.scss"

function App() {
    const [connected, setConnected] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null)

    // const navigate = useNavigate();
    const game = useGame()

    useEffect(() => {
        game.connect("ws://localhost:8080", {
            onConnect: () => {
                console.log("connected")
                setConnected(true)
            },
            onDisconnect: () => {
                console.log("disconnected")
                setConnected(false)
            },
            onError: (err) => console.error(err),
        })
    }, [])

    if (!connected) {
        return (
            <Router>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <LoadingOverlay
                                show
                                message="Connecting to server..."
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        )
    }

    return (
        <LoadingOverlayContext.Provider
            value={{
                showLoadingOverlay: (message) => setLoadingMessage(message),
                hideLoadingOverlay: () => setLoadingMessage(null),
            }}
        >
            <GameContext.Provider value={game}>
                <LoadingOverlay
                    show={loadingMessage !== null}
                    message={loadingMessage || ""}
                />
                <HeadBar />
                <Router>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/game/:lobbyId" element={<Game />} />
                        <Route path="/create" element={<CreateLobby />} />
                        <Route path="/join" element={<JoinLobby />} />
                    </Routes>
                </Router>
            </GameContext.Provider>
        </LoadingOverlayContext.Provider>
    )
}

export default App
