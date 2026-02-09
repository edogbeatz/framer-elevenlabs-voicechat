import * as React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { IconButton } from "./IconButton"
import { FormattedMessage } from "./FormattedMessage"
import type { ChatMessage } from "../../types"

/**
 * ChatMessageBubble - Message display component for chat
 * 
 * Renders user and agent messages with different styles.
 * Includes copy-to-clipboard functionality for agent messages.
 * Has special rendering for "Session ended" system messages.
 */

export interface ChatMessageBubbleProps {
    message: ChatMessage
    bubbles: {
        userBg: string
        userText: string
        agentBg: string
        agentText: string
    }
    theme: {
        bg: string
        fg: string
        muted: string
        border: string
        focusRing?: string
    }
    iconCopy?: React.ReactNode
    iconCheck?: React.ReactNode
    renderIcon: (
        custom: React.ReactNode,
        Default: React.ComponentType<{ size?: number } & React.SVGProps<SVGSVGElement>>,
        size?: number
    ) => React.ReactNode
    fontSessionEnded?: any
    isDesignMode?: boolean
}

// Default icon components (simplified to avoid React type conflicts)
const IconCopy = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
)

const IconCheck = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
)

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: ChatMessageBubble (wrapped with React.memo for performance)
// PURPOSE: Renders individual chat messages with copy functionality
// PROPS FROM HOOKS (in parent ElevenLabsVoiceChat):
//   - message: From useElevenLabsSession.messages array (via useChatMessages sub-hook)
//   - bubbles/theme: Props passed from parent, not from hooks
// ═══════════════════════════════════════════════════════════════════════════
export const ChatMessageBubble = React.memo<ChatMessageBubbleProps>(({
    message,       // FROM PARENT: useElevenLabsSession.messages array item
    bubbles,
    theme,
    iconCopy,
    iconCheck,
    renderIcon,
    fontSessionEnded,
    isDesignMode = false,
}) => {
    // DERIVED STATE: Computed from message prop
    const isUser = message.role === "user"
    const isSessionEnded = message.content === "Session ended"

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useState (React) - Copy feedback state
    // PURPOSE: Tracks whether message was recently copied to clipboard
    // INLINE: Used to toggle copy/check icon, auto-resets after 2 seconds
    // ═══════════════════════════════════════════════════════════════════════════
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!message.content) return
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    // Special rendering for Session Ended system message
    if (isSessionEnded) {
        return (
            <motion.div
                initial={isDesignMode ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    width: "calc(100% + 40px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    margin: "16px -20px",
                    opacity: 0.6
                }}
            >
                <div style={{ flex: 1, height: "1px", backgroundColor: theme.border }} />
                <div style={{
                    ...fontSessionEnded, // Apply specific font
                    fontSize: "12px",
                    color: theme.muted,
                    whiteSpace: "nowrap"
                }}>Session ended</div>
                <div style={{ flex: 1, height: "1px", backgroundColor: theme.border }} />
            </motion.div>
        )
    }


    return (
        <motion.div
            initial={isDesignMode ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={isUser ? {
                alignSelf: "flex-end",
                backgroundColor: bubbles.userBg,
                color: bubbles.userText,
                padding: "8px 16px",
                borderRadius: "20px",
                maxWidth: "80%",
                wordWrap: "break-word",
                fontSize: "15px",
                lineHeight: "1.5",
                opacity: 0.6,
                // Performance: Skip rendering for off-screen messages (rendering-content-visibility)
                contentVisibility: "auto",
                containIntrinsicSize: "auto 50px", // Estimated height for layout stability
            } : {
                alignSelf: "flex-start",
                backgroundColor: bubbles.agentBg,
                color: bubbles.agentText,
                padding: "12px 18px",
                borderRadius: "16px",
                borderBottomLeftRadius: "4px",
                maxWidth: "80%",
                wordWrap: "break-word",
                fontSize: "15px",
                lineHeight: "1.5",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
                // Performance: Skip rendering for off-screen messages (rendering-content-visibility)
                contentVisibility: "auto",
                containIntrinsicSize: "auto 80px", // Estimated height for layout stability
            }}
        >
            {isUser ? (
                <div style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                    {message.content}
                </div>
            ) : (
                <FormattedMessage
                    content={message.content || ""}
                    textColor={bubbles.agentText}
                />
            )}

            {!isUser && (
                <div style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginTop: "4px",
                }}>
                    <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label={copied ? "Copied to clipboard" : "Copy message"}
                        onClick={handleCopy}
                    >
                        {copied ? renderIcon(iconCheck, IconCheck, 14) : renderIcon(iconCopy, IconCopy, 14)}
                    </IconButton>
                </div>
            )}
        </motion.div>
    )
})

ChatMessageBubble.displayName = "ChatMessageBubble"
