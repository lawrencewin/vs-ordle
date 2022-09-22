import { createContext, useContext } from "react"
import { LoadingSpinner } from "./ui"
import "./LoadingOverlay.scss"

interface LoadingOverlayProps {
    loading?: boolean
    show?: boolean
    message: string
}

export const LoadingOverlayContext = createContext({
    showLoadingOverlay: (message: string) => {},
    hideLoadingOverlay: () => {}
})

export const useLoadingOverlay = () => useContext(LoadingOverlayContext)

export const LoadingOverlay = (props: LoadingOverlayProps) => {
    if (!props.show) {
        return null
    } else {
        return (
            <div className="loadingOverlay">
                <LoadingSpinner loading={props.loading || true} width={48} thickness={4} />
                <div className="message">{props.message}</div>
            </div>
        )
    }
}