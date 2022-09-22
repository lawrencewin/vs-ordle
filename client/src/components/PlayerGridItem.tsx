import { GameRules, PlayerState } from "vsordle-types"
import {
    boardSpaceStatusToString,
    playerStatusToString,
    getOrdinalSuffix,
} from "../utils"
import "./PlayerGridItem.scss"

interface PlayerGridItemProps {
    isMe?: boolean
    playerState: PlayerState
    gameRules: GameRules
}

export function PlayerGridItem({
    isMe,
    playerState,
    gameRules,
}: PlayerGridItemProps) {
    const { board, status, displayName, solved, missed, position } = playerState
    const { wordCount, missCount } = gameRules
    return (
        <div className={"playerGridItem " + playerStatusToString(status)}>
            <div className="board">
                {board.map((row, i) => {
                    return (
                        <div className="row" key={i}>
                            {row.map((space, j) => (
                                <div
                                    className={
                                        "space " +
                                        boardSpaceStatusToString(space)
                                    }
                                    key={j}
                                ></div>
                            ))}
                        </div>
                    )
                })}
            </div>
            <div className="text">
                <div className="name">
                    {isMe && "(You) "}
                    {displayName}
                </div>
                <div className="status">
                    <div className="statusItem">
                        {position}
                        <span>{getOrdinalSuffix(position)}</span>
                    </div>
                    <div className="statusItem">
                        {solved} / {wordCount}
                    </div>
                    <div className="statusItem">
                        {missed} / {missCount}
                    </div>
                </div>
            </div>
        </div>
    )
}
