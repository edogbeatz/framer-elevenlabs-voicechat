/**
 * BarVisualizer - Standalone Audio Bars Component
 * 
 * Animated audio visualization bars for Framer.
 * Shows static gray bars on Canvas for design control, dynamically animates
 * with color changes based on agent state in Preview/Published mode.
 * 
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

// Agent states that show the visualizer
const ACTIVE_STATES = ["listening", "thinking", "speaking", "connecting"]

interface BarVisualizerProps {
    barCount?: number
    minHeight?: number
    maxHeight?: number
    primaryColor?: string
    barColorInactive?: string
    barWidth?: number
    barGap?: number
    barRadius?: number
    fadeEdges?: boolean
    fadeWidth?: number
    style?: React.CSSProperties
    className?: string
}

// --- Bar Animator Hook (from bundle) ---
function useBarAnimator(state: string, columns: number, interval: number): number[] {
    const indexRef = useRef(0)
    const [currentFrame, setCurrentFrame] = useState<number[]>([])
    const animationFrameId = useRef<number | null>(null)

    const sequence = useMemo(() => {
        if (state === "thinking" || state === "listening") {
            const center = Math.floor(columns / 2)
            return [[center], [-1]]
        } else if (state === "connecting") {
            const seq: number[][] = []
            const half = Math.floor(columns / 2)
            for (let x = 0; x <= half; x++) {
                seq.push([x, columns - 1 - x])
            }
            for (let x = half - 1; x > 0; x--) {
                seq.push([x, columns - 1 - x])
            }
            return seq
        } else if (state === "speaking") {
            // FIX: Don't highlight all bars by default for speaking
            // The audio data alone should drive the visualization
            return [[]]
        } else {
            return [[]]
        }
    }, [state, columns])

    useEffect(() => {
        indexRef.current = 0
        setCurrentFrame(sequence[0] || [])
    }, [sequence])

    useEffect(() => {
        let startTime = performance.now()
        const animate = (time: DOMHighResTimeStamp) => {
            const timeElapsed = time - startTime
            if (timeElapsed >= interval) {
                indexRef.current = (indexRef.current + 1) % sequence.length
                setCurrentFrame(sequence[indexRef.current] || [])
                startTime = time
            }
            animationFrameId.current = requestAnimationFrame(animate)
        }
        animationFrameId.current = requestAnimationFrame(animate)
        return () => {
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current)
            }
        }
    }, [interval, sequence])

    return currentFrame
}

export default function BarVisualizer({
    barCount = 15,
    minHeight = 20,
    maxHeight = 100,
    primaryColor = "#4D9CFF",
    barColorInactive = "rgba(255,255,255,0.1)",
    barWidth = 8,
    barGap = 6,
    barRadius = 9999,
    fadeEdges = false,
    fadeWidth = 2,
    style,
    className,
}: BarVisualizerProps) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [agentState, setAgentState] = useState<string>("idle")
    const [isVisible, setIsVisible] = useState(isCanvas)
    const [volumeBands, setVolumeBands] = useState<number[]>(() =>
        new Array(barCount).fill(0)
    )
    const [hasMounted, setHasMounted] = useState(false)
    const animationRef = useRef<number | undefined>(undefined)

    useEffect(() => setHasMounted(true), [])

    // Animation timing based on state (from bundle)
    const animInterval = useMemo(() => {
        if (agentState === "connecting") return 2000 / barCount
        if (agentState === "thinking") return 150
        if (agentState === "listening") return 500
        return 1000
    }, [agentState, barCount])

    const highlightedIndices = useBarAnimator(agentState, barCount, animInterval)

    // Listen for agent state changes in Preview/Published mode
    useEffect(() => {
        if (isCanvas) return

        const handleStateChange = (event: CustomEvent) => {
            const newState = event.detail?.state || "idle"
            // Ensure we update state but ignore color to respect component props
            setAgentState(newState)
            setIsVisible(ACTIVE_STATES.includes(newState))

            // Reset volume bands on state change to prevent "stuck" bars
            if (newState === "connecting" || newState === "idle" || newState === "disconnected") {
                setVolumeBands(new Array(barCount).fill(0))
            }
        }

        window.addEventListener("elevenlabs-state-change", handleStateChange as EventListener)
        return () => window.removeEventListener("elevenlabs-state-change", handleStateChange as EventListener)
    }, [isCanvas, barCount])

    // Listen for audio data in Preview mode
    useEffect(() => {
        if (isCanvas) return

        const handleAudioData = (event: CustomEvent) => {
            const volume = event.detail?.volume
            if (Array.isArray(volume)) {
                setVolumeBands(volume.slice(0, barCount))
            }
        }

        window.addEventListener("elevenlabs-audio-data", handleAudioData as EventListener)
        return () => window.removeEventListener("elevenlabs-audio-data", handleAudioData as EventListener)
    }, [isCanvas, barCount])

    // Demo animation for Canvas
    useEffect(() => {
        if (!isCanvas) return

        const startTime = Date.now() / 1000
        const animate = () => {
            const time = Date.now() / 1000 - startTime
            const newBands = new Array(barCount)
            for (let i = 0; i < barCount; i++) {
                const waveOffset = i * 0.5
                const baseVolume = Math.sin(time * 2 + waveOffset) * 0.3 + 0.5
                const randomNoise = Math.random() * 0.1
                newBands[i] = Math.max(0.2, Math.min(1, baseVolume + randomNoise))
            }
            setVolumeBands(newBands)
            animationRef.current = requestAnimationFrame(animate)
        }
        animationRef.current = requestAnimationFrame(animate)
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [isCanvas, barCount])

    // Always visible - component shows inactive (gray) when idle, active colors when agent is on
    // Use primaryColor directly to respect property controls
    const activeColor = primaryColor
    const isActive = ACTIVE_STATES.includes(agentState)

    return (
        <div
            className={`agent-ui ${className || ""}`.trim()}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: `${barGap}px`,
                height: "100%",
                width: "100%",
                padding: "16px",
                boxSizing: "border-box",
                ...style,
            }}
        >
            {volumeBands.map((volume: number, index: number) => {
                const heightPx = isCanvas
                    ? minHeight  // Static height on canvas for cleaner design view
                    : minHeight + volume * (maxHeight - minHeight)

                // Highlight logic from bundle
                const isHighlighted = highlightedIndices?.includes(index) ?? false
                const shouldHighlight = agentState === "speaking" || isHighlighted
                const backgroundColor = shouldHighlight ? activeColor : barColorInactive

                // Staggered entrance animation
                const center = (barCount - 1) / 2
                const distanceFromCenter = Math.abs(index - center)
                const delay = distanceFromCenter * 0.05
                const shouldAnimate = !isCanvas && !hasMounted

                const targetOpacity = fadeEdges
                    ? index < fadeWidth
                        ? (index + 1) / (fadeWidth + 1)
                        : index >= barCount - fadeWidth
                            ? (barCount - index) / (fadeWidth + 1)
                            : 1
                    : 1

                return (
                    <motion.div
                        key={index}
                        initial={{
                            opacity: shouldAnimate ? 0 : targetOpacity,
                            scaleY: shouldAnimate ? 0 : 1,
                            height: `${heightPx}px`,
                        }}
                        animate={{
                            opacity: targetOpacity,
                            scaleY: 1,
                            height: `${heightPx}px`,
                        }}
                        transition={{
                            opacity: { duration: 0.3, delay: shouldAnimate ? delay : 0 },
                            scaleY: { duration: 0.3, delay: shouldAnimate ? delay : 0 },
                            height: { duration: 0.15, ease: "easeOut" },
                        }}
                        style={{
                            width: `${barWidth}px`,
                            flex: "0 0 auto",
                            borderRadius: `${barRadius}px`,
                            backgroundColor,
                            transformOrigin: "bottom",
                            transition: "background-color 0.15s ease-out",
                            minHeight: `${minHeight}px`,
                        }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(BarVisualizer, {
    barCount: {
        type: ControlType.Number,
        title: "Bars",
        defaultValue: 15,
        min: 3,
        max: 30,
        step: 1,
    },

    primaryColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#4D9CFF",
    },
    barColorInactive: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "rgba(255,255,255,0.1)",
    },

    minHeight: {
        type: ControlType.Number,
        title: "Min Height",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
    },
    maxHeight: {
        type: ControlType.Number,
        title: "Max Height",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
    },

    barWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 1,
    },
    barGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 6,
        min: 1,
        max: 20,
        step: 1,
    },
    barRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 9999,
        min: 0,
        max: 9999,
        step: 1,
    },
    fadeEdges: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: false,
    },
    fadeWidth: {
        type: ControlType.Number,
        title: "Fade Width",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        hidden: (props: any) => !props.fadeEdges,
    },
})
