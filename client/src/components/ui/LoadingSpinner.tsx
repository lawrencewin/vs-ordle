import "./ui.scss"

interface LoadingSpinnerProps {
    loading?: boolean
    width?: number
    thickness?: number
    color?: string
}

export const LoadingSpinner = (props: LoadingSpinnerProps) => {
    if (props.loading) {
        return (
            <div
                className="loadingSpinner"
                style={{
                    width: props.width,
                    height: props.width,
                    borderWidth: props.thickness,
                }}
            ></div>
        )
    } else {
        return null
    }
}
