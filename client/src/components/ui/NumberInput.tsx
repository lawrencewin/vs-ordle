import { ChangeEventHandler, CSSProperties, useState } from "react"
import { useRandID } from "../../utils"
import { ReactComponent as ChevronUp } from "../../assets/chevron-up.svg"
import { ReactComponent as ChevronDown } from "../../assets/chevron-down.svg"
import "./ui.scss"

interface NumberInputProps {
    onChange?: (n: number) => void
    className?: string
    min?: number
    max?: number
    label?: string
    labelStyle?: CSSProperties
    value?: number
    placeholder?: string
    style?: CSSProperties
    groupStyle?: CSSProperties
}

export const NumberInput = (props: NumberInputProps) => {
    const { label, className, onChange, ...rest } = props

    const [n, setN] = useState(0)

    const id = useRandID(label ? 12 : 0)

    const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const { value } = e.target
        let val = value !== "" && value !== "-" ? parseInt(value) : 0
        if (!isNaN(val)) {
            const { min, max } = rest
            if (min && val < min) {
                val = min
            } else if (max && val > max) {
                val = max
            }
            if (rest.value !== undefined && onChange) {
                onChange(val)
            } else {
                setN(val)
            }
        }
    }

    const handleIncrement = (inc: number) => () => {
        const { min, max } = rest
        if (rest.value !== undefined && onChange) {
            const newVal = rest.value + inc
            if (!((min && newVal < min) || (max && newVal > max))) {
                onChange(rest.value + inc)
            }
        } else {
            setN((prev) => {
                const newVal = prev + inc
                if ((min && newVal < min) || (max && newVal > max)) {
                    return prev
                }
                return newVal
            })
        }
    }

    const inputEl = (
        <div
            className={
                "uiNumberInput" +
                (className && id.length === 0 ? " " + className : "")
            }
            style={rest.style}
        >
            <input
                id={label ? id : undefined}
                type="text"
                className="uiNumberInput__field"
                onChange={handleChange}
                value={rest.value || n}
                {...rest}
            />
            <div className="uiNumberInput__buttons">
                <button
                    onClick={handleIncrement(1)}
                    className="uiNumberInput__button"
                >
                    <ChevronUp />
                </button>
                <button
                    onClick={handleIncrement(-1)}
                    className="uiNumberInput__button"
                >
                    <ChevronDown />
                </button>
            </div>
        </div>
    )

    if (id.length > 0) {
        return (
            <div
                className={"uiInputGroup" + (className ? " " + className : "")}
                style={rest.groupStyle}
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
