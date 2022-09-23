import {
    ConnectedGameContextInterface,
    GameContextInterface,
    PlayerState,
} from "vsordle-types"
import { Button } from "../components"
import * as Network from "../Network"
import { ReactComponent as StarSVG } from "../assets/star-fill.svg"
import { ReactComponent as KickPlayerSVG } from "../assets/person-x-fill.svg"
import { ReactComponent as CheckmarkSVG } from "../assets/check-circle-fill.svg"
import { ReactComponent as XSVG } from "../assets/x-circle-fill.svg"
import "./Lobby.scss"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { isEmpty } from "lodash"

const LobbyTableItem = (props: {
    name: string
    ready: boolean
    showLeaderCommands: boolean
    me: boolean
}) => {
    return (
        <div className="lobbyTableItem">
            <div className="playerName">
                {props.me && <StarSVG />} {props.name}
            </div>
            {props.showLeaderCommands && !props.me && (
                <div className="leaderCommands">
                    <button>
                        <KickPlayerSVG />
                    </button>
                </div>
            )}
            <div className="readyStatus">
                {props.ready ? (
                    <CheckmarkSVG className="check" />
                ) : (
                    <XSVG className="x" />
                )}
            </div>
        </div>
    )
}

const LobbyTable = (props: {
    players: { [pid: string]: PlayerState }
    me: string
}) => {
    const { players, me } = props
    return (
        <div className="lobbyTable">
            {Object.values(players).map((player, i) => {
                return (
                    <LobbyTableItem
                        name={player.displayName}
                        ready={player.ready}
                        showLeaderCommands={players[me].lobbyLeader}
                        me={player.pid === me}
                        key={i}
                    />
                )
            })}
        </div>
    )
}

export const Lobby = (
    props: GameContextInterface | ConnectedGameContextInterface
) => {
    const { gameState, setGameState } = props
    const navigate = useNavigate()

    const notInLobby = !gameState || isEmpty(gameState.players)

    useEffect(() => {
        if (notInLobby) {
            navigate("/")
        }
    }, [gameState])

    if (notInLobby) {
        return null
    } else {
        console.log(gameState)
        const { players, me, totalPlayers } = gameState!

        let allPlayersReady = totalPlayers > 1
        for (const pid in players) {
            allPlayersReady = allPlayersReady && players[pid].ready
        }

        const onReadyClick = async () => {
            try {
                await Network.readyUp()
            } catch (error) {
                alert(error)
            }
        }

        const onLeaveClick = async () => {
            try {
                await Network.leaveLobby()
                setGameState(null)
            } catch (error) {
                alert(error)
            }
        }

        const onStartClick = async () => {
            try {
                await Network.startGame()
            } catch (error) {
                alert(error)
            }
        }

        const onCopy = () => {
            navigator.clipboard.writeText(gameState.lobbyId)
        }

        return (
            <div className="lobby">
                <div className="lobbyId">
                    <div className="text">
                        Your lobby ID is: <strong>{gameState.lobbyId}</strong>
                    </div>
                    <Button onClick={onCopy}>Copy Lobby ID</Button>
                </div>
                <LobbyTable players={players} me={me} />
                <div className="lobbyActions">
                    <Button onClick={onLeaveClick}>Leave</Button>
                    <Button onClick={onReadyClick}>
                        {players[me].ready ? "Cancel" : "Ready"}
                    </Button>
                    {players[me].lobbyLeader && (
                        <Button
                            disabled={!allPlayersReady}
                            onClick={onStartClick}
                        >
                            Start Game
                        </Button>
                    )}
                </div>
            </div>
        )
    }
}
