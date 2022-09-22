import { ClientGameState } from "vsordle-types"
import { getOrdinalSuffix } from "../utils"
import { PlayerGridItem } from "./PlayerGridItem"
import "./SideBar.scss"

interface SideBarProps {
    gameState: ClientGameState
}

export function SideBar({ gameState }: SideBarProps) {
    const { me, players, rules, sortedPids, totalPlayers } = gameState
    const { position, solved, missed } = players[me]
    return (
        <aside className="sidebar">
            <section className="statusBar">
                <div className="status bordered">
                    <div className="label">Position</div>
                    <div className="info">
                        {position}
                        <span>{getOrdinalSuffix(position)}</span> /{" "}
                        {totalPlayers}
                    </div>
                </div>
                <div className="status bordered">
                    <div className="label">Words Solved</div>
                    <div className="info">
                        {solved} / {rules.wordCount}
                    </div>
                </div>
                <div className="status">
                    <div className="label">Words Missed</div>
                    <div className="info">
                        {missed} / {rules.missCount}
                    </div>
                </div>
            </section>
            <section className="overview">
                <h4>Player Overview</h4>
                <div className="playerGrid">
                    {sortedPids.map((pid, i) => (
                        <PlayerGridItem
                            key={i}
                            playerState={players[pid]}
                            gameRules={rules}
                            isMe={me === pid}
                        />
                    ))}
                </div>
            </section>
        </aside>
    )
}
