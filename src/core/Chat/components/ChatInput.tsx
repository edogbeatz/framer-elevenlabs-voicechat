import * as React from "react"
import * as Form from "@radix-ui/react-form"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

/**
 * ChatInput - Radix Form wrapper with auto-resize textarea
 * 
 * Accessible chat input with:
 * - Auto-resizing textarea (max 120px)
 * - Enter to send, Shift+Enter for newline
 * - User activity signaling
 * - Error message display
 * - Focus ring accessibility
 */

export interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    onFocus?: () => void
    onBlur?: () => void
    onUserActivity?: () => void
    error?: string
    disabled?: boolean
    placeholder?: string
    theme: {
        bg: string
        fg: string
        muted: string
        border: string
        focusRing?: string
    }
    inputBgColor: string
    isFocused: boolean
    textareaRef: React.RefObject<HTMLTextAreaElement | null>
    /** Inline buttons to render inside the input container (send, mic, disconnect) */
    children?: React.ReactNode
    /** When true, applies sticky positioning to keep input visible when mobile keyboard opens */
    isMobileOverlay?: boolean
}

const inputAreaStyle: React.CSSProperties = {
    padding: "16px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
}

const inputContainerStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    borderRadius: "24px",
    padding: "6px 6px 6px 20px",
    minHeight: "48px",
    boxSizing: "border-box",
}

const textInputStyle: React.CSSProperties = {
    flex: 1,
    padding: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "inherit",
    fontSize: "15px",
    alignSelf: "center",
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: ChatInput (wrapped with React.memo for performance)
// PURPOSE: Accessible chat input with auto-resize, keyboard handling
// ═══════════════════════════════════════════════════════════════════════════
export const ChatInput = React.memo<ChatInputProps>(({
    value,
    onChange,
    onSubmit,
    onFocus,
    onBlur,
    onUserActivity,
    error,
    disabled = false,
    placeholder = "Ask anything",
    theme,
    inputBgColor,
    isFocused,
    textareaRef,
    children,
    isMobileOverlay = false,
}) => {
    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useState (React) - Hover state for border styling
    // PURPOSE: Tracks mouse hover for visual feedback on input container
    // INLINE: Used in border color calculation for hover state
    // ═══════════════════════════════════════════════════════════════════════════
    const [isHovered, setIsHovered] = React.useState(false)
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value)

        // Auto-resize
        e.target.style.height = "auto"
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`

        // Signal activity to agent
        onUserActivity?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSubmit()

            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = "24px"
            }
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit()
    }

    return (
        <div style={{
            ...inputAreaStyle,
            backgroundColor: theme.bg,
            // Mobile overlay: sticky to bottom so input stays visible when keyboard opens
            ...(isMobileOverlay && {
                position: 'sticky' as const,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                flexShrink: 0,
            }),
        }}>
            <Form.Root
                onSubmit={handleSubmit}
                style={{ width: "100%" }}
            >
                <Form.Field name="message">
                    <VisuallyHidden.Root>
                        <Form.Label>Message input</Form.Label>
                    </VisuallyHidden.Root>

                    <div
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{
                            ...inputContainerStyle,
                            backgroundColor: inputBgColor,
                            padding: "6px 6px 6px 16px",
                            gap: "8px",
                            minHeight: "44px",
                            alignItems: "flex-end",
                            position: "relative",
                            // Border: transparent by default, visible on hover/focus
                            border: `1px solid ${isFocused
                                ? (theme.focusRing || 'rgba(255,255,255,0.3)')
                                : isHovered
                                    ? (theme.border || 'rgba(255,255,255,0.15)')
                                    : 'transparent'
                                }`,
                            // Focus ring (outline) - use transparent instead of 'none' to avoid blink
                            outline: `2px solid ${isFocused
                                ? (theme.focusRing || 'rgba(255,255,255,0.15)')
                                : 'transparent'}`,
                            outlineOffset: "2px",
                            transition: "border-color 0.15s ease-in-out, outline-color 0.15s ease-in-out",
                        }}>
                        <Form.Control asChild>
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                onFocus={onFocus}
                                onBlur={onBlur}
                                placeholder={placeholder}
                                disabled={disabled}
                                aria-label="Type your message"
                                aria-keyshortcuts="Enter"
                                aria-invalid={error ? "true" : "false"}
                                aria-describedby={error ? "message-error" : undefined}
                                style={{
                                    ...textInputStyle,
                                    color: theme.fg,
                                    resize: "none",
                                    height: "24px",
                                    maxHeight: "120px",
                                    minWidth: 0,
                                    width: "100%",
                                    overflowY: value.length > 0 ? "auto" : "hidden",
                                    lineHeight: "1.5",
                                    margin: 0,
                                }}
                                rows={1}
                            />
                        </Form.Control>

                        {/* Inline buttons (send, mic, disconnect) */}
                        {children}

                        {/* Error message for accessibility */}
                        {error && (
                            <Form.Message
                                id="message-error"
                                style={{
                                    fontSize: "12px",
                                    color: "hsl(0 84.2% 60.2%)", // destructive color
                                    marginTop: "4px",
                                    marginLeft: "16px",
                                }}
                            >
                                {error}
                            </Form.Message>
                        )}
                    </div>
                </Form.Field>
            </Form.Root>
        </div>
    )
})

ChatInput.displayName = "ChatInput"
