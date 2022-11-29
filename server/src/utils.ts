export function ordinalSufix(n: number) {
    if (n === 1) {
        return "st"
    } else if (n === 2) {
        return "nd"
    } else if (n === 3) {
        return "rd"
    } else {
        return "th"
    }
}
