import { ChangeEventHandler, CSSProperties } from "react"
import "./ui.scss"
import { useRandID } from "../../utils"

interface TextInputProps {
    onChange?: ChangeEventHandler<HTMLInputElement>
    label?: string
    labelStyle?: CSSProperties
    value?: string | number | readonly string[]
    placeholder?: string
    style?: CSSProperties
    groupStyle?: CSSProperties
}

export const TextInput = (props: TextInputProps) => {
    const { label, ...rest } = props

    const id = useRandID(label ? 12 : 0)

    const inputEl = (
        <input
            id={label ? id : undefined}
            type="text"
            className="uiTextInput"
            {...rest}
        />
    )

    if (id.length > 0) {
        return (
            <div
                className="uiInputGroup"
                style={{
                    ...rest.groupStyle,
                }}
            >
                <label htmlFor={id} style={rest.labelStyle}>
                    {label}
                </label>
                {inputEl}
            </div>
        )
    } else {
        return inputEl
    }
}
