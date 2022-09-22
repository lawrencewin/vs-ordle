import { useEffect, useRef } from "react"

interface ParticlesProps {
    n: number
}

function withNoise(n: number, offset: number = 10) {
    return n + (Math.random() > 0.5 ? 1 : -1) * offset
}

function randRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min
}

function createParticle(
    [minH, maxH]: [number, number],
    rotDeg: number,
    noiseOffset: number = 10
) {
    const particle = document.createElement("div")
    particle.className = "particle"
    // base transform
    rotDeg = withNoise(rotDeg)
    const rotate = `rotateZ(${rotDeg}deg)`
    // styles
    const height = Math.floor(Math.random() * (maxH - minH)) + minH
    particle.style.width = "2px"
    particle.style.height = `${height}px`
    particle.style.backgroundColor = "white"
    particle.style.position = "fixed"
    particle.style.transform = rotate
    particle.style.opacity = "0"
    // animate
    const duration = randRange(500, 750)
    const animation = particle.animate(
        [
            {
                transform: `${rotate} translateX(${randRange(0, 10)}px)`,
                opacity: 1,
            },
            {
                transform: `${rotate} translateY(${randRange(40, 70)}px)`,
                opacity: 0,
            },
        ],
        {
            easing: "cubic-bezier(.13,.86,.41,.99)",
            duration: duration,
            delay: 0,
        }
    )
    animation.onfinish = () => {
        particle.remove()
    }
    return particle
}

export function Particles({ n = 30 }: ParticlesProps) {
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        // on mount, create x amount of particles
        const degIncrement = 360 / n
        for (let i = 0; i < n; i++) {
            ref.current!.appendChild(createParticle([10, 30], i * degIncrement))
        }
    }, [])

    return <span className="particleRoot" ref={ref}></span>
}
