import { range } from "lodash"
import { useState, useEffect } from "react"
import { BoardSpace, PlayerStatus } from "vsordle-types"

const boardSpaceStatusStringMap = {
    [BoardSpace.blank]: "blank",
    [BoardSpace.incorrect]: "incorrect",
    [BoardSpace.partial]: "partial",
    [BoardSpace.correct]: "correct",
}

const playerStatusStringMap = {
    [PlayerStatus.dead]: "dead",
    [PlayerStatus.playing]: "playing",
    [PlayerStatus.done]: "done",
}

export const boardSpaceStatusToString = (status: BoardSpace) =>
    boardSpaceStatusStringMap[status]
export const playerStatusToString = (status: PlayerStatus) =>
    playerStatusStringMap[status]

export function getOrdinalSuffix(num: number): string {
    // special case for 11, 12, and 13
    const tenthRemainder = num % 100
    if (
        tenthRemainder === 11 ||
        tenthRemainder === 12 ||
        tenthRemainder === 13
    ) {
        return "th"
    }
    // default
    switch (num % 10) {
        case 1:
            return "st"
        case 2:
            return "nd"
        case 3:
            return "rd"
        default:
            return "th"
    }
}

export function useRandID(len: number = 12) {
    const [id, setId] = useState("")
    useEffect(() => {
        if (len === 0) {
            setId("")
        } else {
            const randID = range(len)
                .map((v) => Math.floor(Math.random() * 24).toString(24))
                .reduce((p, v) => p + v, "")
            setId(randID)
        }
    }, [len])
    return id
}