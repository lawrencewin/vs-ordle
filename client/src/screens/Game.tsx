import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ConnectedGameContextInterface } from "vsordle-types"
import {  useGameContext } from "../hook"
import { LoadingSpinner, useLoadingOverlay } from "../components"
import * as Network from "../Network"
import { Wordle, Lobby } from "./"

export const Game = () => {
    const navigate = useNavigate()
    const lobbyIdFromURL = useParams().lobbyId

    const gameInterface = useGameContext()
    const { showLoadingOverlay, hideLoadingOverlay } = useLoadingOverlay()

    let connectedToCorrectLobby = gameInterface.gameState?.lobbyId === lobbyIdFromURL


    useEffect(() => {
        console.log(gameInterface.gameState)
        if (connectedToCorrectLobby && gameInterface.gameState) {
            // // do stuff - bind handlers
            const gameState = gameInterface.gameState
            if (gameState.status === "starting") {
                showLoadingOverlay("Starting game...")
            } else if (gameState.status === "playing") {
                hideLoadingOverlay()
            }
        } else {
            fetch("http://localhost:8080/lobbyExists/" + lobbyIdFromURL)
            .then(async (res) => {
                const lobbyIsValid = await res.json()
                if (lobbyIsValid === true) {
                    navigate("/join?id=" + lobbyIdFromURL)
                } else {
                    navigate("/")
                }
            })
        }
    }, [lobbyIdFromURL, connectedToCorrectLobby, gameInterface])

    const status = gameInterface.gameState!.status

    if (!connectedToCorrectLobby) {
        return <LoadingSpinner loading />
    } else if (status === "lobby") {
        return <Lobby {...gameInterface as ConnectedGameContextInterface} />
    } else {
        return <Wordle {...gameInterface as ConnectedGameContextInterface} />
    }
}