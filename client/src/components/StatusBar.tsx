import { useState, useEffect, Fragment } from "react"
import { range } from "lodash"
import "./StatusBar.scss"

interface StatusBarProps {
    loading?: boolean
    error?: string
    message?: string
}

export function StatusBar(props: StatusBarProps) {
    const { loading, error, message } = props

    const [spinnerClass, setSpinnerClass] = useState("")
    const [dotCount, setDotCount] = useState(0)
    const [dotInterval, setDotInterval] = useState(0)

    useEffect(() => {
        if (loading) {
            setSpinnerClass("entering")
            setTimeout(() => setSpinnerClass("spinning"), 250)
            const interval = setInterval(() => {
                setDotCount((count) => (count + 1) % 4)
            }, 150)
            setDotInterval(interval as any)
        } else {
            setSpinnerClass("")
            clearInterval(dotInterval)
        }
    }, [props])

    return (
        <div
            className={
                "gameBoardStatusBar" +
                (loading || error || message ? " shown" : "")
            }
        >
            {loading && (
                <Fragment>
                    <div className={`loadingSpinner ${spinnerClass}`}></div>
                    <div className="statusText">
                        Loading
                        {range(dotCount).reduce((prev, curr) => prev + ".", "")}
                    </div>
                </Fragment>
            )}
            {error && (
                <div className="error">
                    <span>{error}</span>
                </div>
            )}
            {message && <div className="statusText">{message}</div>}
        </div>
    )
}
