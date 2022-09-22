import { CSSProperties, MouseEventHandler, PropsWithChildren } from "react"
import { Link } from "react-router-dom"
import "./ui.scss"

interface ButtonProps {
    onClick?: MouseEventHandler
    to?: string
    style?: CSSProperties
    className?: string
    disabled?: boolean
}

export const Button = (props: PropsWithChildren<ButtonProps>) => {
    const { to, className, ...rest } = props
    if (to) {
        return <Link 
            to={to} 
            className={"uiButton" + (className ? " " + className : "")}
            {...rest}
        >{props.children}</Link>
    } else {
        return <button 
            {...rest}
            className={"uiButton" + (className ? " " + className : "")}
        >{props.children}</button>
    }
}