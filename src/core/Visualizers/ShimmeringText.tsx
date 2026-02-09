/**
 * ShimmeringText - Animated Text with Gradient Shimmer
 * 
 * Creates text with a smooth, animated gradient that sweeps across continuously.
 * Shows static text on Canvas for design control, dynamically updates based on
 * agent state (listening/thinking) in Preview/Published mode via custom events.
 * 
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 50
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// State labels mapping
// State labels mapping
// Removed hardcoded STATE_LABELS in favor of props


interface ShimmeringTextProps {

    // Labels
    labelListening?: string
    labelSpeaking?: string
    labelThinking?: string
    labelConnecting?: string
    labelInitializing?: string
    isDesignMode?: boolean

    font?: Record<string, any>
    color?: string
    shimmerColor?: string
    errorColor?: string  // NEW: Color for error messages
    duration?: number
    repeat?: boolean
    style?: React.CSSProperties
    className?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: ShimmeringText
// PURPOSE: Animated text with gradient shimmer effect, displays agent state
// NOTE: Receives state updates via CustomEvent, not directly from hooks
// EVENT INTEGRATION:
//   - Listens for 'elevenlabs-state-change' events dispatched by parent
//   - Parent (ElevenLabsVoiceChat) dispatches events when useElevenLabsSession.state changes
// ═══════════════════════════════════════════════════════════════════════════
export default function ShimmeringText({
    labelListening = "Listening",
    labelSpeaking = "Speaking",
    labelThinking = "Thinking",
    labelConnecting = "Connecting",
    labelInitializing = "Initializing",
    isDesignMode = false,
    font,
    color = "rgba(255, 255, 255, 0.4)",
    shimmerColor = "rgba(255, 255, 255, 1)",
    errorColor = "#EF4444",  // Red for errors
    duration = 2,
    repeat = true,
    style,
    className,
}: ShimmeringTextProps) {
    // ═══════════════════════════════════════════════════════════════════════════
    // HOOKS: useState (React) - Local component state
    // PURPOSE: Tracks agent state, error messages, and visibility
    // NOTE: State is updated via CustomEvent listener, not from parent props
    // ═══════════════════════════════════════════════════════════════════════════
    const [agentState, setAgentState] = useState<string>("idle")         // INLINE: Determines which label to show
    const [errorMessage, setErrorMessage] = useState<string | null>(null) // INLINE: Error message to display
    const [isVisible, setIsVisible] = useState(isDesignMode)              // INLINE: Controls component visibility

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useEffect (React) - Agent state event listener
    // PURPOSE: Listens for 'elevenlabs-state-change' CustomEvents
    // EVENT SOURCE: Dispatched by ElevenLabsVoiceChat when useElevenLabsSession.state changes
    // INLINE: Updates agentState, errorMessage, and isVisible based on events
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (isDesignMode) return  // Skip in Canvas mode

        const handleStateChange = (event: CustomEvent) => {
            const newState = event.detail?.state || "idle"
            const error = event.detail?.errorMessage || null

            setAgentState(newState)      // Update local state from event
            setErrorMessage(error)       // Update error message from event

            // Show shimmer for listening, speaking, thinking, connecting states OR if there's an error
            const showStates = ["listening", "speaking", "thinking", "connecting", "initializing"]
            setIsVisible(showStates.includes(newState) || !!error)
        }

        window.addEventListener("elevenlabs-state-change", handleStateChange as EventListener)
        return () => window.removeEventListener("elevenlabs-state-change", handleStateChange as EventListener)
    }, [isDesignMode])

    // Determine display text - prioritize error messages
    const getLabelForState = (state: string) => {
        switch (state) {
            case "listening": return labelListening
            case "speaking": return labelSpeaking
            case "thinking": return labelThinking
            case "connecting": return labelConnecting
            case "initializing": return labelInitializing
            default: return ""
        }
    }

    const hasError = !!errorMessage
    const displayText = isDesignMode
        ? labelListening  // Show listening label on Canvas for design
        : hasError
            ? errorMessage  // Show error message if present
            : getLabelForState(agentState)

    // Hide component if not visible (in Preview mode)
    // if (!isDesignMode && !isVisible) {
    //     return null
    // }

    // Shimmer effect settings
    const spread = 0.15
    const delay = 0

    // Use solid error color (no shimmer) for errors, shimmer gradient for normal states
    const effectiveColor = hasError ? errorColor : color
    const effectiveShimmerColor = hasError ? errorColor : shimmerColor

    return (
        <AnimatePresence mode="wait">
            {(isVisible || isDesignMode) && (
                <motion.div
                    key={displayText}
                    className={`agent-ui ${className || ""}`.trim()}
                    initial={isDesignMode ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        display: "inline-block",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        ...style,
                    }}
                >
                    <motion.span
                        initial={{ backgroundPosition: "100% 0%" }}
                        animate={{ backgroundPosition: hasError ? "100% 0%" : "0% 0%" }}  // No animation for errors
                        transition={{
                            duration: hasError ? 0 : duration,  // Instant for errors
                            delay,
                            repeat: (repeat && !hasError) ? Infinity : 0,  // No repeat for errors
                            repeatDelay: 1,
                            ease: "linear",
                        }}
                        style={{
                            backgroundImage: hasError
                                ? "none"  // Solid color for errors
                                : `linear-gradient(90deg, ${effectiveColor} 0%, ${effectiveColor} ${50 - (spread * 100) / 2}%, ${effectiveShimmerColor} 50%, ${effectiveColor} ${50 + (spread * 100) / 2}%, ${effectiveColor} 100%)`,
                            backgroundSize: "300% 100%",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            color: hasError ? errorColor : "transparent",  // Solid color for errors
                            display: "inline-block",
                            willChange: hasError ? "auto" : "background-position",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                            ...font,
                        }}
                    >
                        {displayText}
                    </motion.span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
