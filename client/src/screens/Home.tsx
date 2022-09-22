import { Button } from "../components"
import "./Home.scss"

export function Home () {
    return (
        <div className="mainMenu">
            <div className="menuGroup">
                <Button to="/create">Create Game</Button>
                <Button to="/join">Join Game</Button>

            </div>
        </div>
    )
}