import { useState, useEffect, useRef, useCallback } from "react"
import type { ChatMessage, ElevenLabsSession } from "../types"
import { generateMessageId } from "../utils/messageId"

/**
 * Custom hook for managing chat message state and persistence
 * 
 * @description
 * Handles message state management, sessionStorage persistence, and pending message queue.
 * Automatically restores messages on mount and persists them on every change.
 * 
 * @example
 * ```tsx
 * const { messages, addMessage, flushPendingMessages, messagesEndRef } = useChatMessages({
 *   sessionKey: "ael_chat_messages:v1",
 *   debug: true
 * })
 * ```
 */

export interface UseChatMessagesOptions {
    /** SessionStorage key for message persistence */
    sessionKey: string
    /** Maximum number of messages to persist (default: 50) */
    maxMessages?: number
    /** Enable debug logging */
    debug?: boolean
    /** Callback for logging (optional) */
    addLog?: (msg: string, type?: "info" | "error" | "warn" | "success") => void
}

export interface UseChatMessagesReturn {
    /** Current message history */
    messages: ChatMessage[]
    /** Add a new message to the history */
    addMessage: (message: ChatMessage) => void
    /** Clear all messages */
    clearMessages: () => void
    /** Flush pending messages to the session */
    flushPendingMessages: (session: ElevenLabsSession | null, isConnected: boolean) => void
    /** Ref for auto-scrolling to the latest message */
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    /** Queue a message to be sent when connection is established */
    queueMessage: (text: string) => void
    /** Scroll handler for tracking user scroll position */
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
    /** Programmatically scroll to the bottom of the chat */
    scrollToBottom: () => void
    /** Whether user is near the bottom of the chat (for smart auto-scroll) */
    isNearBottom: boolean
}

/**
 * Hook for managing chat messages with persistence and queueing
 */
export function useChatMessages(options: UseChatMessagesOptions): UseChatMessagesReturn {
    const { sessionKey, maxMessages = 50, debug = false, addLog } = options

    // Message state - restore from sessionStorage on mount
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (typeof window === "undefined") return []

        try {
            const saved = sessionStorage.getItem(sessionKey)
            if (saved) {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    if (debug) {
                        console.log(`[useChatMessages] Restored ${parsed.length} messages from session`)
                    }
                    return parsed
                }
            }
        } catch (e) {
            console.error("[useChatMessages] Failed to restore messages from sessionStorage", e)
        }

        return []
    })

    // Pending messages queue
    const pendingMessagesRef = useRef<string[]>([])

    // Ref for auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Track if user is near the bottom (for smart scroll behavior)
    const [isNearBottom, setIsNearBottom] = useState(true)

    // Smart auto-scroll: only scroll to bottom when user is near bottom
    // Uses double requestAnimationFrame to ensure scroll happens AFTER:
    // 1. React completes rendering
    // 2. Browser paints the new content (critical for markdown-rendered messages)
    useEffect(() => {
        if (isNearBottom) {
            // Double RAF ensures DOM is fully painted before scrolling
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                })
            })
        }
    }, [messages, isNearBottom])

    // Initial mount scroll: When component mounts with restored messages from sessionStorage,
    // the above effect runs but the container may not be fully laid out yet.
    // This separate effect uses setTimeout to allow the browser to complete layout
    // before scrolling to the bottom.
    useEffect(() => {
        if (messages.length > 0) {
            // Use a small delay to ensure the container is laid out
            const timer = setTimeout(() => {
                // Use instant scroll on mount for better UX (user expects to see latest)
                messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
            }, 100)
            return () => clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty deps: only run on mount

    // Scroll handler to track user position
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        // Consider user "near bottom" if within 150px (increased for large messages)
        setIsNearBottom(distanceFromBottom < 150)
    }, [])

    // Programmatic scroll to bottom (for external triggers like panel open)
    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
            })
        })
    }, [])

    // Persist messages to sessionStorage on every change
    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            // Limit to last N messages to avoid storage bloat
            const limitedMessages = messages.slice(-maxMessages)

            sessionStorage.setItem(sessionKey, JSON.stringify(limitedMessages))
        } catch (e) {
            // sessionStorage may be unavailable in incognito mode
            console.warn("[useChatMessages] Failed to save messages to sessionStorage", e)
        }
    }, [messages, sessionKey, maxMessages])

    /**
     * Add a new message to the history
     */
    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => {
            const msg = { ...message, timestamp: message.timestamp || Date.now() }

            // Voice mode ASR lag compensation:
            // When user's transcript arrives AFTER the agent's response (because ASR
            // finalization is slower than LLM generation), reorder so user message
            // appears before the assistant messages it triggered.
            if (msg.role === "user" && prev.length > 0) {
                const REORDER_WINDOW_MS = 2000 // Only reorder within 2s window
                let insertIndex = prev.length

                // Walk backwards through recent assistant messages
                for (let i = prev.length - 1; i >= 0; i--) {
                    const p = prev[i]
                    if (
                        p.role === "assistant" &&
                        p.timestamp &&
                        (msg.timestamp - p.timestamp) < REORDER_WINDOW_MS
                    ) {
                        insertIndex = i
                    } else {
                        break // Stop at first non-assistant or old message
                    }
                }

                if (insertIndex < prev.length) {
                    return [...prev.slice(0, insertIndex), msg, ...prev.slice(insertIndex)]
                }
            }

            return [...prev, msg]
        })
    }, [])

    /**
     * Clear all messages and sessionStorage
     */
    const clearMessages = useCallback(() => {
        setMessages([])
        if (typeof window !== "undefined") {
            try {
                sessionStorage.removeItem(sessionKey)
            } catch (e) {
                console.warn("[useChatMessages] Failed to clear sessionStorage", e)
            }
        }
    }, [sessionKey])

    /**
     * Queue a message to be sent when connection is established
     */
    const queueMessage = useCallback((text: string) => {
        pendingMessagesRef.current.push(text)
        if (debug && addLog) {
            addLog(`Queued message: "${text.substring(0, 20)}..."`, "info")
        }
    }, [debug, addLog])

    /**
     * Flush pending messages to the session
     * Called when connection is established
     */
    const flushPendingMessages = useCallback((
        session: ElevenLabsSession | null,
        isConnected: boolean
    ) => {
        if (!isConnected || !session || pendingMessagesRef.current.length === 0) {
            return
        }

        const queue = [...pendingMessagesRef.current]
        pendingMessagesRef.current = []

        if (debug && addLog) {
            addLog(`Flushing ${queue.length} pending messages`, "info")
        }

        queue.forEach(msg => {
            try {
                // Try multiple method locations (SDK version compatibility)
                const sendFn =
                    (typeof session.sendUserMessage === 'function' && session.sendUserMessage.bind(session)) ||
                    (typeof session.sendText === 'function' && session.sendText.bind(session)) ||
                    (session.connection && typeof session.connection.sendUserMessage === 'function' && session.connection.sendUserMessage.bind(session.connection)) ||
                    (session.connection && typeof session.connection.sendText === 'function' && session.connection.sendText.bind(session.connection))

                if (sendFn) {
                    const result = sendFn(msg)
                    if (result && typeof result.catch === 'function') {
                        result.catch((err: unknown) => {
                            console.error("[useChatMessages] Failed to flush message", err)
                        })
                    }

                    if (debug && addLog) {
                        addLog(`Flushed message: "${msg.substring(0, 20)}..."`, "success")
                    }
                } else {
                    if (debug && addLog) {
                        addLog("No send method found on session", "warn")
                    }
                }
            } catch (err) {
                console.error("[useChatMessages] Error flushing message", err)
            }
        })
    }, [debug, addLog])

    return {
        messages,
        addMessage,
        clearMessages,
        flushPendingMessages,
        messagesEndRef,
        queueMessage,
        handleScroll,
        scrollToBottom,
        isNearBottom,
    }
}

/**
 * Helper function to create a chat message
 */
export function createMessage(
    role: "user" | "assistant",
    content: string
): ChatMessage {
    return {
        id: generateMessageId(),
        role,
        content,
    }
}
