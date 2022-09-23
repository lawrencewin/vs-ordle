import { ClientGameState, PlayerState } from "vsordle-types"
import "./FinishTable.scss"

type FinishTableRowProps = {
    isHeader?: boolean
    player?: PlayerState
}

interface FinishTableProps {
    gameState: ClientGameState
}

function FinishTableRow(props: FinishTableRowProps) {
    let position: any, name: any, solved: any, missed: any
    if (props.isHeader) {
        position = "Position"
        name = "Name"
        solved = "Solved"
        missed = "Missed"
    } else {
        position = props.player!.position
        name = props.player!.displayName
        solved = props.player!.solved
        missed = props.player!.missed
    }
    return (
        <div className={"row" + (props.isHeader ? " rowHeader" : "")}>
            <div className="col position">{position}</div>
            <div className="col name">{name}</div>
            <div className="col solved">{solved}</div>
            <div className="col missed">{missed}</div>
        </div>
    )
}

export function FinishTable({ gameState }: FinishTableProps) {
    const players = gameState.sortedPids.map((pid) => gameState.players[pid])

    return (
        <div className="finishTable">
            <FinishTableRow isHeader />
            {players.map((player, i) => (
                <FinishTableRow player={player} key={i} />
            ))}
        </div>
    )
}
