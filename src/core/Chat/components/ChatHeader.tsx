import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconClose } from "./icons"

/**
 * ChatHeader - Header component with status indicator
 * 
 * Displays agent status with shimmer text and status dot.
 */

export interface ChatHeaderProps {
    state: string
    statusColor: string
    destructiveColor?: string
    theme: {
        bg: string
        fg: string
        muted: string
        border: string
    }
    ShimmeringTextComponent: React.ComponentType<any>
    resolvedShimmerFont: any
    isDesignMode?: boolean
    micDeniedMessage?: string | null
    /** Callback when close button is clicked (mobile overlay mode) */
    onClose?: () => void
    /** Whether to show the close button (mobile overlay mode) */
    showCloseButton?: boolean
}

const headerStyle: React.CSSProperties = {
    padding: "16px",
    height: "52px",
    minHeight: "52px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "8px",
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: ChatHeader (wrapped with React.memo for performance)
// PURPOSE: Displays agent status with animated indicator and shimmer text
// NOTE: No hooks used directly - all state passed via props from parent
// PROPS FROM HOOKS (in parent ElevenLabsVoiceChat):
//   - state: From useElevenLabsSession hook (agent connection state)
//   - statusColor: Derived from state/error in parent component
//   - micDeniedMessage: From parent useState hook (mic permission error)
// ═══════════════════════════════════════════════════════════════════════════
export const ChatHeader = React.memo<ChatHeaderProps>(({
    state,            // FROM PARENT: useElevenLabsSession.state
    statusColor,      // FROM PARENT: Derived from state/error
    destructiveColor = "#EF4444",
    theme,
    ShimmeringTextComponent,
    resolvedShimmerFont,
    isDesignMode = false,
    micDeniedMessage = null,  // FROM PARENT: useState hook
    onClose,          // Mobile overlay: close callback
    showCloseButton = false  // Mobile overlay: show X button
}) => {
    // DERIVED STATE: Glow effect when connected
    const hasGlow = state === "connected"

    // DERIVED STATE: Indicator styling based on mic permission
    const indicatorColor = micDeniedMessage ? destructiveColor : statusColor
    const indicatorGlow = micDeniedMessage || hasGlow

    return (
        <div style={{ ...headerStyle, backgroundColor: theme.bg, justifyContent: showCloseButton ? "space-between" : "flex-start" }}>
            <motion.div
                animate={{
                    backgroundColor: indicatorColor,
                    boxShadow: indicatorGlow ? `0 0 8px ${indicatorColor}` : "none"
                }}
                transition={{ duration: 0.3 }}
                style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: indicatorColor,
                    boxShadow: indicatorGlow ? `0 0 8px ${indicatorColor}` : "none",
                    flexShrink: 0
                }}
            />
            <AnimatePresence mode="wait">
                {micDeniedMessage ? (
                    <motion.span
                        key="mic-denied"
                        initial={isDesignMode ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            color: destructiveColor,
                            ...resolvedShimmerFont,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        Mic denied
                    </motion.span>
                ) : (
                    <motion.div
                        key="status"
                        initial={isDesignMode ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ShimmeringTextComponent
                            font={resolvedShimmerFont}
                            color={theme.muted}
                            shimmerColor={theme.fg}
                            duration={2}
                            labelListening="Listening"
                            labelSpeaking="Speaking"
                            labelThinking="Thinking"
                            labelConnecting="Connecting"
                            style={{ display: "flex", alignItems: "center" }}
                            isDesignMode={isDesignMode}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Close button for mobile overlay mode */}
            {showCloseButton && onClose && (
                <button
                    onClick={onClose}
                    aria-label="Close chat"
                    style={{
                        background: "transparent",
                        border: `1px solid ${theme.muted}`,
                        padding: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.muted,
                        borderRadius: "8px",
                        marginLeft: "auto",
                        transition: "color 0.15s ease, border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.fg
                        e.currentTarget.style.borderColor = theme.fg
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.muted
                        e.currentTarget.style.borderColor = theme.muted
                    }}
                >
                    <IconClose size={20} />
                </button>
            )}
        </div>
    )
})

ChatHeader.displayName = "ChatHeader"
