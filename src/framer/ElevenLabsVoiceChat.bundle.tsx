/**
 * ElevenLabsVoiceChat - Bundled Framer Component
 * 
 * Auto-generated bundle. Do not edit directly.
 * Edit source files and run scripts/component/bundle_chat.py to regenerate.
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

// Markdown rendering for formatted agent responses
// NOTE: Uses inline regex-based parser (no external CDN dependencies)
// to ensure consistent rendering on published Framer sites

// Optional useRouter - not available in all Framer versions
let useRouter: any = null
try {
    // @ts-ignore - useRouter may not exist
    const framer = require("framer")
    useRouter = framer.useRouter
} catch (e) {
    // useRouter not available, navigation will use fallback
}


// --- BUNDLED: types.ts ---
type AgentState = "connecting" | "initializing" | "listening" | "speaking" | "thinking" | "disconnected" | "connected"

interface SDKError {
    message: string
    code?: string
    name?: string
}

interface DisconnectDetails {
    reason?: string
}

interface SDKModeChange {
    mode: AgentState
}

interface SDKMessage {
    source: "user" | "ai" | "assistant"
    message: string
    text?: string
    type?: string
}

interface VisitorState {
    isReturning: boolean
    visitCount: number
    daysSinceLastVisit: number
}

interface VisitorHistory {
    visitCount?: number
    lastVisit?: number
    firstSeen?: number
}

interface ElevenLabsSession {
    getOutputByteFrequencyData?: () => Uint8Array
    getOutputVolume?: () => number
    getInputVolume?: () => number
    setVolume?: (config: { volume: number }) => Promise<void>
    setMicMuted?: (muted: boolean) => Promise<void>
    sendText?: (text: string) => Promise<void>
    sendUserMessage?: (text: string) => Promise<void>
    sendContextualUpdate?: (update: string) => void | Promise<void>
    sendUserActivity?: () => void | Promise<void>  // Prevents agent interruption (ElevenLabs best practice)
    endSession: () => Promise<void>
    startSession?: (options: any) => Promise<any>
    // SDK internal - varies by version
    connection?: {
        sendText?: (text: string) => Promise<void>
        sendUserMessage?: (text: string) => Promise<void>
    }
}

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    /** Optional session ID for tracking conversation boundaries */
    sessionId?: string
}

interface LinkRegistryItem {
    name: string
    path: string
}

interface ElevenLabsVoiceChatProps {
    agentId?: string
    debug?: boolean
    startWithText?: boolean
    autoConnect?: boolean
    shareContext?: boolean
    autoScrapeContext?: boolean
    contextAllowlist?: string[]
    linkRegistry?: LinkRegistryItem[]
    style?: React.CSSProperties
    image?: any
    triggerButtonVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
    /** 
     * Display mode for the chat component:
     * - "default": Chat opens above the trigger button
     * - "mobileOverlay": Chat opens as a fullscreen overlay on top of the button (for mobile)
     */
    displayMode?: "default" | "mobileOverlay"
    // Style Groups (includes layout + colors)
    theme?: {
        /** Maximum width of the chat window (default: 400px) */
        maxWidth?: number
        /** Maximum height of the chat window (default: 500px) */
        maxHeight?: number
        /** Corner radius of the chat window (default: 24px) */
        cornerRadius?: number
        /** Border styling (Framer Border control type) */
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        }
        bg?: string
        fg?: string
        muted?: string
        focusRing?: string
    }
    status?: { connected: string, connecting: string, thinking?: string, disconnected?: string, error?: string, font?: any }
    // Button Tokens (By Function) - includes colors, sizing, borders, and optional icons/font
    triggerButton?: {
        bg: string,
        text: string,
        focus?: string,
        borderRadius?: number,
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        },
        borderWidth?: number,
        borderStyle?: string,
        borderColor?: string,
        padding?: string,
        gap?: number,
        labelOpen?: string,
        labelClosed?: string,
        font?: any,
        /** Beta warning text displayed below the button */
        betaText?: string,
        /** Color for the beta warning text */
        betaTextColor?: string
    }
    btnSend?: { bg: string, text: string, icon?: any }
    btnMic?: { bg: string, text: string, icon?: any, iconOff?: any }
    btnEnd?: { bg: string, text: string, icon?: any }
    btnCall?: { bg: string, text: string, icon?: any }
    // UI Groups with nested properties
    // UI Groups with nested properties
    bubbles?: { userBg: string, userText: string, agentBg: string, agentText: string, iconCopy?: any, iconCheck?: any, font?: any }
    input?: {
        bg: string,
        font?: any,
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        }
    }
    // Legacy icon properties (can be overridden by button-specific icons above)
    iconSend?: any
    iconMic?: any
    iconMicOff?: any  // Mic with line (muted state)
    iconEnd?: any     // End session button
    iconDisconnect?: any
    iconCall?: any
    iconKeyboard?: any
    iconCopy?: any
    iconCheck?: any
    // Heatmap Visualizer (Audio-Reactive Effects)
    heatmap?: {
        /** Enable shader effect, when false shows static image only */
        enabled?: boolean
        image?: any
        /** Width as percentage of size (10-100), default 100 */
        width?: number
        /** Height as percentage of size (10-100), default 100 */
        height?: number
        /** Border radius as percentage (0-50, where 50 = circle), default 50 */
        borderRadius?: number
        colors?: string[]
        background?: string
        scale?: number
        speed?: number
        angle?: number
        noise?: number
        innerGlow?: number
        outerGlow?: number
        contour?: number
        fit?: "contain" | "cover" | "fill"
        audioReactivity?: number
        bassToInnerGlow?: number
        midToOuterGlow?: number
        trebleToContour?: number
        volumeToAngle?: number
    }
    /** @deprecated Use heatmap.scale instead */
    visualizerScale?: number
    // Sound Effects (CDN URLs from Framer File controls)
    soundInitializing?: string
    soundConnecting?: string
    soundThinking?: string
    soundListening?: string
    soundError?: string
    soundDisconnected?: string
    // Turn-Taking Configuration
    allowInterruptions?: boolean
    /** 
     * Control agent responsiveness: 
     * - "normal" (default): Balanced turn-taking 
     * - "eager": Quick responses, minimal pause tolerance
     * - "patient": Allows longer user pauses before responding
     */
    turnEagerness?: "normal" | "eager" | "patient"
    /**
     * Seconds of silence before agent considers turn complete
     * Default: 1.2 (optimized for office environments with brief pauses)
     * Range: 0.5-2.0
     */
    turnTimeout?: number
    /**
     * VAD sensitivity threshold
     * Default: 0.5 (balanced - prevents "deaf agent" bug)
     * Range: 0.3 (very sensitive) to 0.7 (aggressive noise rejection)
     * Warning: Values above 0.6 may miss normal speech in some environments
     */
    vadThreshold?: number
    /**
     * Enable background voice detection in VAD
     * Default: true (detect background voices/noise)
     * Set to false to reduce false positives on mobile Safari or in noisy environments
     * When disabled, VAD only responds to primary speaker (microphone focus)
     */
    backgroundVoiceDetection?: boolean
    // Helper
    showDesign?: boolean

    // Unified Layout Mode (Merged Component)
    layoutMode?: "fixed" | "embedded"
    fixedPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
    triggerSettings?: {
        label?: string
        color?: string
        bg?: string
    }
}


// --- BUNDLED: utils/elevenLabsClient.ts ---
// ElevenLabs SDK Loader
// Uses dynamic import for Framer compatibility

let conversationModule: any = null
let isPreloading = false

async function getConversation() {
    if (typeof window === "undefined") return null

    if (conversationModule) return conversationModule

    try {
        // Use locally installed npm package (bundled by Vite)
        // Eliminates CDN cold-start latency
        const mod = await import("https://esm.sh/@elevenlabs/client@0.13.0?deps=livekit-client@2.11.4")
        conversationModule = mod.Conversation
        return conversationModule
    } catch (e) {
        console.error("Failed to load ElevenLabs SDK:", e)
        return null
    }
}

/**
 * Pre-load the ElevenLabs SDK in background on component mount.
 * This eliminates CDN cold-start latency by ensuring the SDK is cached
 * before the user taps "Connect" - especially important on mobile networks.
 * 
 * Safe to call multiple times - will only preload once.
 */
function preloadConversation(): void {
    if (typeof window === "undefined") return
    if (conversationModule || isPreloading) return

    isPreloading = true
    // Fire-and-forget: preload in background without blocking
    getConversation().catch(() => { }).finally(() => {
        isPreloading = false
    })
}


// --- BUNDLED: utils/messageId.ts ---
/**
 * Shared message ID generation utility
 * 
 * Provides a single counter for generating unique message IDs,
 * avoiding duplicate counters across hooks and components.
 */

let messageIdCounter = 0

/**
 * Generate a unique message ID
 * @returns A unique string ID in format "msg-{timestamp}-{counter}"
 */
function generateMessageId(): string {
    return `msg-${Date.now()}-${++messageIdCounter}`
}

/**
 * Reset the message counter (useful for testing)
 */
function resetMessageCounter(): void {
    messageIdCounter = 0
}


// --- BUNDLED: utils/resolveFont.ts ---

type FontInput =
    | string
    | CSSProperties
    | {
        family?: string
        size?: number
        weight?: number
        lineHeight?: number | string
        letterSpacing?: number | string
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number | string
    }

interface FontFallback {
    family?: string
    size?: number
    weight?: number
}

function resolveFontStyles(font: FontInput | undefined, fallback: FontFallback = {}): CSSProperties {
    const fallbackStyles: CSSProperties = {}
    if (fallback.family) fallbackStyles.fontFamily = fallback.family
    if (fallback.size !== undefined) fallbackStyles.fontSize = fallback.size
    if (fallback.weight !== undefined) fallbackStyles.fontWeight = fallback.weight

    if (!font) {
        return fallbackStyles
    }

    if (typeof font === "string") {
        return {
            fontFamily: font,
            ...fallbackStyles,
        }
    }

    const style: CSSProperties = { ...(font as CSSProperties) }
    const fontObject = font as {
        family?: string
        size?: number
        weight?: number
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number | string
    }

    if (fontObject.family && !style.fontFamily) {
        style.fontFamily = fontObject.family
    }
    if (fontObject.size !== undefined && style.fontSize === undefined) {
        style.fontSize = fontObject.size
    }
    if (fontObject.weight !== undefined && style.fontWeight === undefined) {
        style.fontWeight = fontObject.weight
    }

    if (style.fontFamily === undefined && fallbackStyles.fontFamily) {
        style.fontFamily = fallbackStyles.fontFamily
    }
    if (style.fontSize === undefined && fallbackStyles.fontSize !== undefined) {
        style.fontSize = fallbackStyles.fontSize
    }
    if (style.fontWeight === undefined && fallbackStyles.fontWeight !== undefined) {
        style.fontWeight = fallbackStyles.fontWeight
    }

    return style
}


// --- BUNDLED: utils/sessionId.ts ---
/**
 * Session ID utilities for tracking conversation boundaries
 */

/**
 * Generate a unique session ID for tracking conversation boundaries
 * Format: session-{timestamp}-{random}
 */
function generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `session-${timestamp}-${random}`
}


// --- BUNDLED: utils/storage.ts ---
/**
 * Shared localStorage cache utilities
 * 
 * Provides a single Map-based cache for localStorage access,
 * avoiding duplicate cache instances across hooks and components.
 */

const storageCache = new Map<string, string | null>()

/**
 * Get a value from localStorage with caching
 * @param key - The localStorage key
 * @returns The cached/stored value or null
 */
function getCachedStorage(key: string): string | null {
    if (!storageCache.has(key)) {
        try {
            storageCache.set(key, localStorage.getItem(key))
        } catch {
            storageCache.set(key, null)
        }
    }
    return storageCache.get(key) ?? null
}

/**
 * Set a value in localStorage and update the cache
 * @param key - The localStorage key
 * @param value - The value to store
 */
function setCachedStorage(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
        storageCache.set(key, value)
    } catch {
        // localStorage may be unavailable in incognito mode
    }
}

/**
 * Clear a specific key from cache and localStorage
 * @param key - The localStorage key to clear
 */
function clearCachedStorage(key: string): void {
    try {
        localStorage.removeItem(key)
        storageCache.delete(key)
    } catch {
        // Ignore errors
    }
}


// --- BUNDLED: utils/pageReader.ts ---

interface PageContentParams {
    selector?: string
    maxContextLength?: number
    debug?: boolean
    addLog: (msg: string, type: "info" | "error" | "warn" | "success") => void
}

async function getPageContent({
    selector,
    readingMode = "verbatim",
    maxContextLength = 5000,
    debug = false,
    addLog
}: PageContentParams & { readingMode?: "verbatim" | "rephrased" }): Promise<string> {
    const targetSelector = selector || "main, article, [role='main'], body"
    if (debug) console.log(`[ElevenLabs] Tool call: getPageContent. Mode: ${readingMode}. Target selector: "${targetSelector}"`)
    addLog(`Tool call: Get Page Context (${readingMode})`, "info")

    try {
        if (typeof document === "undefined") return "Error: DOM not available"

        addLog("Loading reader engine...", "info")

        // Dynamic import to bypass bundler stripping and easy Framer compat
        // @ts-ignore
        const { Readability } = await import("https://esm.sh/@mozilla/readability@0.5.0")
        // @ts-ignore
        const TurndownService = (await import("https://esm.sh/turndown@7.1.1")).default

        // 1. Clone document to avoid mutating live page
        const documentClone = document.cloneNode(true) as unknown as Document

        // 1.5. Aggressive cleanup of Nav/Header elements (Framer specific and general)
        const navQueries = [
            'nav', 'header', 'footer',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '.framer-nav', '.navigation', '.header', '.footer', '.menu',
            // Generic risky classes often used for navs in frameworks
            '[class*="nav"]', '[class*="menu"]', '[class*="header"]', '[class*="footer"]', '[class*="sidebar"]', '[class*="cookie"]', '[class*="banner"]',
            // Aggressive ID matching
            '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]', '[id*="sidebar"]',
            // Exclude Debug tools and UI overlays
            '[class*="debug"]', '[class*="terminal"]', '[class*="console"]', '[class*="overlay"]', '[class*="agent-ui"]', '[class*="ai-widget"]', '[class*="no-scrape"]',
            // Aggressive ARIA-Label matching (for "Accessibility Label" usage in Framer)
            '[aria-label*="agent-ui"]', '[aria-label*="ai-widget"]', '[aria-label*="no-scrape"]',
            // Exclude secondary content and interactive elements
            'aside', 'form', 'button', 'input', 'select', 'textarea', '.sidebar', '.related', '.comments', '.cookie-banner'
        ]

        // Iterate and remove all matches
        const noisyElements = documentClone.querySelectorAll(navQueries.join(','))
        if (noisyElements.length > 0) {
            if (debug) console.log(`[ElevenLabs] Removed ${noisyElements.length} navigation/header/debug elements before parsing.`)
            noisyElements.forEach(el => el.remove())
        }

        // 1.5.1 Remove specific UI artifacts by text content (brute force)
        // This catches the "Debug Terminal" if it doesn't have a class we guessed
        const allDivs = documentClone.querySelectorAll('div, span, p')
        allDivs.forEach(el => {
            const text = el.textContent?.trim() || ""
            if (text === "Debug Terminal" || text === "Listening" || text.startsWith("Debug Terminal[")) {
                el.remove()
            }
        })

        // 1.6. Extra Framer cleanup: disparate links at top of body often get merged
        // Remove any "a" tags that are direct children of body or near the top
        const topLevelLinks = documentClone.querySelectorAll('body > a, body > div > a')
        topLevelLinks.forEach(el => el.remove())

        // 1.7. Restore strict "Invisible/Technical" cleanup
        // Readability handles script/style, but ignores SVGs (which have text), noscripts, and aria-hidden
        const technicalGarbage = documentClone.querySelectorAll('svg, noscript, iframe, [aria-hidden="true"], [hidden]')
        technicalGarbage.forEach(el => el.remove())

        // 2. Parse with Readability
        const reader = new Readability(documentClone)
        const article = reader.parse()

        if (!article || !article.content) {
            throw new Error("Readability could not extract content from this page.")
        }

        // Log the RAW output from Readability for debugging
        if (debug) {
            console.log("=== READABILITY RAW OUTPUT ===")
            console.log("Title:", article.title)
            console.log("Text Length:", article.textContent.length) // Keep for reference
            console.log("==============================")
        }

        // 3. Convert HTML to Markdown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*'
        })

        // Remove images and links to keep it read-only friendly
        turndownService.addRule('no-images', {
            filter: ['img', 'svg'],
            replacement: () => ''
        })

        turndownService.addRule('simplify-links', {
            filter: 'a',
            replacement: (content: string) => content
        })

        let markdown = turndownService.turndown(article.content)

        if (debug) console.log(`[ElevenLabs] Readability success. Title: "${article.title}"`)
        addLog(`Readability found article: "${article.title}"`, "info")

        // Crtical: Account for prefix in truncation
        const extractedTitle = document.title || "Unknown Page"
        if (debug) console.log(`[ElevenLabs] Extracted title: "${extractedTitle}"`)

        // Use prop value or default 1000
        const maxTotalLen = Math.min(maxContextLength || 1000, 4000) // Increased limit for MD
        const maxContentLen = Math.max(0, maxTotalLen)

        if (markdown.length > maxContentLen) {
            markdown = markdown.slice(0, maxContentLen) + "...\n\n[Content truncated for length]"
            addLog(`Content truncated to ${maxContentLen} chars`, "info")
            if (debug) console.log(`[ElevenLabs] Content truncated to ${maxContentLen} chars`)
        }

        // Return MARKDOWN for direct reading.
        let speechText = markdown

        if (markdown.length < 50) {
            addLog("Content too short or empty.", "warn")
            speechText = "I found the page '" + extractedTitle + "', but I couldn't extract enough readable text content from it. It might be an image-heavy page or an application."
        }

        if (debug) console.log(`[ElevenLabs] Final speechText length: ${speechText.length} chars`)

        addLog(`Returning speech text directly (${speechText.length} chars)`, "success")

        // Return the content directly to the agent
        return JSON.stringify({
            success: true,
            content: speechText,
            instruction: readingMode === "rephrased"
                ? "REPHRASE AND READ ALOUD: Maintain technical depth, make it conversational. Do not simplify unless asked."
                : "READ VERBATIM: Read the content word-for-word. Do not summarize or rephrase."
        })
    } catch (e: any) {
        const errorMsg = `Error reading page: ${e.message || "Unknown error"}`
        if (debug) console.error("[ElevenLabs] getPageContext top-level error:", e)
        addLog(errorMsg, "error")
        return errorMsg
    }
}


// --- BUNDLED: hooks/useChatMessages.ts ---

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

interface UseChatMessagesOptions {
    /** SessionStorage key for message persistence */
    sessionKey: string
    /** Maximum number of messages to persist (default: 50) */
    maxMessages?: number
    /** Enable debug logging */
    debug?: boolean
    /** Callback for logging (optional) */
    addLog?: (msg: string, type?: "info" | "error" | "warn" | "success") => void
}

interface UseChatMessagesReturn {
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
function useChatMessages(options: UseChatMessagesOptions): UseChatMessagesReturn {
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
        setMessages(prev => [...prev, message])
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
function createMessage(
    role: "user" | "assistant",
    content: string
): ChatMessage {
    return {
        id: generateMessageId(),
        role,
        content,
    }
}


// --- BUNDLED: hooks/useAudioControls.ts ---
/**
 * useAudioControls - Audio control functions for ElevenLabs sessions
 * 
 * Extracts audio control logic from useElevenLabsSession for better separation of concerns.
 */


interface UseAudioControlsOptions {
    sessionRef: React.RefObject<ElevenLabsSession | null>
}

interface UseAudioControlsReturn {
    setMicMuted: (muted: boolean) => void
    setVolume: (volume: number) => void
    getOutputVolume: () => number
    getInputVolume: () => number
    getOutputByteFrequencyData: () => Uint8Array | null
}

function useAudioControls(options: UseAudioControlsOptions): UseAudioControlsReturn {
    const { sessionRef } = options

    const setMicMuted = useCallback((muted: boolean) => {
        sessionRef.current?.setMicMuted?.(muted)
    }, [])

    const setVolume = useCallback((volume: number) => {
        sessionRef.current?.setVolume?.({ volume })
    }, [])

    const getOutputVolume = useCallback(() => {
        return sessionRef.current?.getOutputVolume?.() || 0
    }, [])

    const getInputVolume = useCallback(() => {
        return sessionRef.current?.getInputVolume?.() || 0
    }, [])

    const getOutputByteFrequencyData = useCallback(() => {
        return sessionRef.current?.getOutputByteFrequencyData?.() || null
    }, [])

    return {
        setMicMuted,
        setVolume,
        getOutputVolume,
        getInputVolume,
        getOutputByteFrequencyData,
    }
}



// --- BUNDLED: hooks/useSessionTimeout.ts ---
/**
 * useSessionTimeout - Inactivity detection and auto-disconnect for ElevenLabs sessions
 * 
 * Prevents runaway sessions and credit drainage by automatically disconnecting
 * after a configurable period of user inactivity.
 */


interface UseSessionTimeoutOptions {
    /** Whether the feature is enabled (default: true) */
    enabled?: boolean

    /** Current session mode - determines which timeout to use */
    isVoiceMode: boolean

    /** Whether session is currently connected */
    isConnected: boolean

    /** Timeout for text mode in milliseconds (default: 5 minutes) */
    textModeTimeout?: number

    /** Timeout for voice mode in milliseconds (default: 3 minutes) */
    voiceModeTimeout?: number

    /** Callback to execute when timeout is reached */
    onTimeout: () => void

    /** Optional callback fired before timeout (e.g., 30s warning) */
    onWarning?: () => void

    /** Warning time in milliseconds before timeout (default: 30 seconds) */
    warningTime?: number

    /** Debug logging */
    debug?: boolean
}

interface UseSessionTimeoutReturn {
    /** Reset the inactivity timer (call on user activity) */
    resetTimer: () => void

    /** Get remaining time until timeout in milliseconds */
    getRemainingTime: () => number
}

// Default timeouts
const DEFAULT_TEXT_TIMEOUT = 3 * 60 * 1000  // 3 minutes
const DEFAULT_VOICE_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const DEFAULT_WARNING_TIME = 30 * 1000      // 30 seconds

function useSessionTimeout(options: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
    const {
        enabled = true,
        isVoiceMode,
        isConnected,
        textModeTimeout = DEFAULT_TEXT_TIMEOUT,
        voiceModeTimeout = DEFAULT_VOICE_TIMEOUT,
        onTimeout,
        onWarning,
        warningTime = DEFAULT_WARNING_TIME,
        debug = false,
    } = options

    // Refs to avoid stale closures
    const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastActivityRef = useRef<number>(Date.now())
    const hasWarned = useRef(false)

    // Get current timeout based on mode
    const getCurrentTimeout = useCallback(() => {
        return isVoiceMode ? voiceModeTimeout : textModeTimeout
    }, [isVoiceMode, voiceModeTimeout, textModeTimeout])

    // Clear all timers
    const clearTimers = useCallback(() => {
        if (timeoutTimerRef.current) {
            clearTimeout(timeoutTimerRef.current)
            timeoutTimerRef.current = null
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current)
            warningTimerRef.current = null
        }
    }, [])

    // Start timeout timers
    const startTimers = useCallback(() => {
        clearTimers()
        hasWarned.current = false
        lastActivityRef.current = Date.now()

        if (!enabled || !isConnected) return

        const timeout = getCurrentTimeout()

        if (debug) {
            console.log(`[SessionTimeout] Starting timer: ${timeout / 1000}s (${isVoiceMode ? 'voice' : 'text'} mode)`)
        }

        // Set warning timer if callback provided
        if (onWarning && timeout > warningTime) {
            const warningDelay = timeout - warningTime
            warningTimerRef.current = setTimeout(() => {
                if (debug) {
                    console.log(`[SessionTimeout] Warning: ${warningTime / 1000}s until auto-disconnect`)
                }
                hasWarned.current = true
                onWarning()
            }, warningDelay)
        }

        // Set timeout timer
        timeoutTimerRef.current = setTimeout(() => {
            const idleTime = Date.now() - lastActivityRef.current
            if (debug) {
                console.log('[SessionTimeout] Timeout reached - disconnecting session', {
                    event: 'session_timeout',
                    timestamp: new Date().toISOString(),
                    mode: isVoiceMode ? 'voice' : 'text',
                    timeoutMs: timeout,
                    idleMs: idleTime,
                    idleSecs: Math.round(idleTime / 1000)
                })
            }
            onTimeout()
        }, timeout)
    }, [enabled, isConnected, getCurrentTimeout, clearTimers, onTimeout, onWarning, warningTime, debug, isVoiceMode])

    // Reset timer on activity
    const resetTimer = useCallback(() => {
        if (!enabled || !isConnected) return

        if (debug) {
            const elapsed = Date.now() - lastActivityRef.current
            console.log(`[SessionTimeout] Activity detected - resetting timer (was idle for ${elapsed / 1000}s)`)
        }

        startTimers()
    }, [enabled, isConnected, startTimers, debug])

    // Get remaining time
    const getRemainingTime = useCallback(() => {
        if (!enabled || !isConnected) return Infinity

        const timeout = getCurrentTimeout()
        const elapsed = Date.now() - lastActivityRef.current
        return Math.max(0, timeout - elapsed)
    }, [enabled, isConnected, getCurrentTimeout])

    // Start timers when session connects
    useEffect(() => {
        if (enabled && isConnected) {
            startTimers()
        } else {
            clearTimers()
        }

        return () => clearTimers()
    }, [enabled, isConnected, startTimers, clearTimers])

    // Restart timers when mode changes
    useEffect(() => {
        if (enabled && isConnected) {
            if (debug) {
                console.log(`[SessionTimeout] Mode changed to ${isVoiceMode ? 'voice' : 'text'} - restarting timer`)
            }
            startTimers()
        }
    }, [isVoiceMode, enabled, isConnected, startTimers, debug])

    return {
        resetTimer,
        getRemainingTime,
    }
}



// --- BUNDLED: hooks/useClientTools.ts ---
/**
 * useClientTools - Client tools registry for ElevenLabs agents
 * 
 * Extracts tool registration logic from useElevenLabsSession for better separation of concerns.
 */


interface UseClientToolsOptions {
    debug: boolean
    autoScrapeContext: boolean
    addLog: (msg: string, type?: "info" | "error" | "warn" | "success") => void
    setStateSafe: (state: AgentState) => void
    disconnect: () => void
    disconnectAfterSpeakingRef: React.MutableRefObject<boolean>
    stateRef: React.MutableRefObject<AgentState>
    redirectToPage: (params: { url: string; openInNewTab?: boolean } | string) => Promise<string>
    additionalClientTools?: Record<string, (params: any) => Promise<string>>
}

type ClientToolsRegistry = Record<string, (params: any) => Promise<string>>

function useClientTools(options: UseClientToolsOptions): ClientToolsRegistry {
    const {
        debug,
        autoScrapeContext,
        addLog,
        setStateSafe,
        disconnect,
        disconnectAfterSpeakingRef,
        stateRef,
        redirectToPage,
        additionalClientTools = {},
    } = options

    const skipTurn = useCallback(async () => {
        addLog("Tool call: Skip Turn", "info")
        if (stateRef.current !== "disconnected") setStateSafe("listening")
        return "Waiting for user input"
    }, [addLog, setStateSafe, stateRef])

    const endCall = useCallback(async () => {
        addLog("Tool call: End Call", "info")
        if (stateRef.current === "speaking") {
            addLog("Agent is speaking, staggering disconnect...", "info")
            disconnectAfterSpeakingRef.current = true
            // BROWSER FIX: Reduced from 10s to 5s for faster disconnect when
            // mode change events don't fire properly (common on some browsers)
            setTimeout(() => {
                if (disconnectAfterSpeakingRef.current) {
                    addLog("Force disconnecting after timeout", "warn")
                    disconnect()
                }
            }, 5000)
            return "Call will end after speech"
        }
        disconnect()
        return "Call ended"
    }, [addLog, disconnect, disconnectAfterSpeakingRef, stateRef])

    // NOTE: redirectToPage is now passed in from useAgentNavigation (validates against linkRegistry)

    const syncUserData = useCallback(async (params: { topic?: string; page?: string; question?: string; name?: string; email?: string }) => {
        addLog(`Tool call: Syncing user data`, "info")
        if (typeof window !== "undefined") {
            if (params.name) sessionStorage.setItem("ael_user", params.name)
            if (params.email) sessionStorage.setItem("ael_user_email", params.email)
            if (params.topic) {
                const existing = sessionStorage.getItem("ael_user_interests") || ""
                sessionStorage.setItem("ael_user_interests", existing ? `${existing}, ${params.topic}` : params.topic)
            }
            if (params.question) {
                const existing = sessionStorage.getItem("ael_user_questions") || ""
                sessionStorage.setItem("ael_user_questions", existing ? `${existing} | ${params.question}` : params.question)
            }
        }
        return "User data synced"
    }, [addLog])

    const getCurrentTime = useCallback(async () => {
        addLog("Tool call: Get Current Time", "info")
        const now = new Date()
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short"
        }
        const formatted = now.toLocaleDateString("en-US", options)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        return `Current date and time: ${formatted}. Timezone: ${timezone}.`
    }, [addLog])

    const getPageContextTool = useCallback(async (params: { selector?: string; reading_mode?: "verbatim" | "rephrased" }) => {
        const mode = params.reading_mode || "verbatim"
        addLog(`Tool call: Get Page Context (${mode})`, "info")

        if (!autoScrapeContext) {
            addLog("Page reading ignored (Auto Read disabled)", "warn")
            return "I cannot read this page because the 'Auto Read' feature is disabled."
        }

        // Note: "thinking" state is now handled by wrapWithThinkingState wrapper

        return await getPageContent({
            selector: params.selector,
            readingMode: mode,
            maxContextLength: 5000,
            debug,
            addLog
        })
    }, [addLog, autoScrapeContext, debug])

    /**
     * Wraps a tool function to trigger "thinking" state before execution.
     * This ensures the thinking sound plays when any tool is called.
     * Includes a fallback timeout to prevent stuck "thinking" state if SDK events don't fire.
     */
    const wrapWithThinkingState = useCallback(
        <T extends (params: any) => Promise<string>>(toolFn: T, toolName: string): T => {
            return (async (params: any) => {
                addLog(`[Tool Call] ${toolName} - triggering thinking state`, "info")
                setStateSafe("thinking")

                try {
                    const result = await toolFn(params)
                    return result
                } finally {
                    // FALLBACK: 3s after tool completion, check if we're stuck in "thinking"
                    // If SDK hasn't transitioned us to speaking/listening, force to listening
                    // This prevents the agent from getting permanently stuck
                    setTimeout(() => {
                        if (stateRef.current === "thinking") {
                            addLog(`[Tool Fallback] ${toolName} - stuck in thinking, forcing to listening`, "warn")
                            setStateSafe("listening")
                        }
                    }, 3000)
                }
            }) as T
        },
        [addLog, setStateSafe, stateRef]
    )

    // Build registry with aliases
    const clientTools = useMemo(() => {
        // Control tools that should NOT trigger thinking state
        const controlTools: ClientToolsRegistry = {
            skip_turn: skipTurn,
            end_call: endCall,
        }

        // Processing tools that SHOULD trigger thinking state
        const processingTools: ClientToolsRegistry = {
            redirectToPage: wrapWithThinkingState(redirectToPage, "redirectToPage"),
            syncUserData: wrapWithThinkingState(syncUserData, "syncUserData"),
            getPageContext: wrapWithThinkingState(getPageContextTool, "getPageContext"),
            getCurrentTime: wrapWithThinkingState(getCurrentTime, "getCurrentTime"),
        }

        // Wrap additional client tools with thinking state
        const wrappedAdditionalTools: ClientToolsRegistry = {}
        for (const [name, fn] of Object.entries(additionalClientTools)) {
            wrappedAdditionalTools[name] = wrapWithThinkingState(fn, name)
        }

        const tools: ClientToolsRegistry = {
            ...controlTools,
            ...processingTools,
            ...wrappedAdditionalTools,
        }

        // Snake_case aliases for case-insensitive resilience (also wrapped)
        return {
            ...tools,
            sync_user_data: processingTools.syncUserData,
            redirect_to_page: processingTools.redirectToPage,
            get_page_context: processingTools.getPageContext,
            get_current_time: processingTools.getCurrentTime,
        }
    }, [skipTurn, endCall, redirectToPage, syncUserData, getPageContextTool, getCurrentTime, additionalClientTools, wrapWithThinkingState])

    return clientTools
}



// --- BUNDLED: hooks/useSessionConnection.ts ---
/**
 * useSessionConnection - Connection lifecycle management for ElevenLabs sessions
 * 
 * Handles connect/disconnect, retry logic, WebRTC→WebSocket fallback,
 * and session event handlers.
 */


/**
 * Detect iOS Safari - needs special handling for mic cleanup and WebRTC.
 */
const isIOSSafari = (): boolean => {
    if (typeof navigator === "undefined" || typeof window === "undefined") return false
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
    return isIOS && isSafari
}

/**
 * Detect mobile device - needs audio warm-up to prevent first audio cutoff.
 * Mobile browsers often have lazy audio initialization that causes the first
 * few hundred milliseconds of audio to be lost.
 */
const isMobileDevice = (): boolean => {
    if (typeof navigator === "undefined") return false
    const ua = navigator.userAgent
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

// Global AudioContext to keep audio pipeline warm across connections
let globalAudioContext: AudioContext | null = null

/**
 * Warm up AudioContext on mobile to prevent first audio cutoff.
 * Mobile browsers have lazy audio pipeline initialization that can cause
 * the first few hundred milliseconds of TTS audio to be lost.
 * 
 * This function:
 * 1. Creates/resumes a global AudioContext (kept alive across sessions)
 * 2. Plays a short silent buffer to fully activate the audio output pipeline
 * 3. Keeps the context alive for subsequent audio playback
 */
const warmUpAudioContext = async (debug: boolean): Promise<void> => {
    // Only needed on mobile devices
    if (!isMobileDevice()) return

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return

        // Reuse global context or create new one
        if (!globalAudioContext || globalAudioContext.state === "closed") {
            globalAudioContext = new AudioContextClass()
        }

        // Resume if suspended (required for user gesture activation)
        if (globalAudioContext.state === "suspended") {
            await globalAudioContext.resume()
        }

        // Play a slightly longer silent buffer (200ms) to fully activate audio pipeline
        // Short buffers may not be enough to initialize the output on some devices
        const sampleRate = globalAudioContext.sampleRate || 22050
        const bufferLength = Math.floor(sampleRate * 0.2) // 200ms
        const buffer = globalAudioContext.createBuffer(1, bufferLength, sampleRate)
        const source = globalAudioContext.createBufferSource()
        source.buffer = buffer
        source.connect(globalAudioContext.destination)
        source.start(0)

        // Wait for the buffer to finish playing before proceeding
        await new Promise(resolve => setTimeout(resolve, 250))

        if (debug) console.log("[ElevenLabs] Mobile audio context warmed up")
    } catch (e) {
        console.warn("[ElevenLabs] Mobile audio warm-up failed:", e)
    }
}

interface UseSessionConnectionOptions {
    agentId: string
    debug: boolean
    startWithText: boolean
    shareContext: boolean
    contextAllowlist: string[]
    linkRegistry: LinkRegistryItem[]
    allowInterruptions: boolean
    turnEagerness: "normal" | "eager" | "patient"
    turnTimeout: number
    vadThreshold: number
    backgroundVoiceDetection: boolean

    // Callbacks
    onConnect?: () => void
    onDisconnect?: (reason?: { isModeTransition: boolean }) => void
    onAgentDisconnect?: () => void  // Called when SDK/agent initiates disconnect (before cleanup)
    onMessage?: (message: { role: "user" | "assistant", content: string }) => void
    onError?: (error: string) => void

    // Dependencies
    addLog: (msg: string, type?: "info" | "error" | "warn" | "success") => void
    clientTools: ClientToolsRegistry
    navigationStateRef: React.MutableRefObject<{ currentPage: string, previousPage?: string, visitHistory: string[] } | undefined>
}

interface UseSessionConnectionReturn {
    state: AgentState
    error: string
    errorType: "transient" | "permanent" | null
    isConnected: boolean
    isVoiceMode: boolean
    sessionRef: React.RefObject<ElevenLabsSession | null>
    stateRef: React.MutableRefObject<AgentState>
    isVoiceModeRef: React.MutableRefObject<boolean>
    disconnectAfterSpeakingRef: React.MutableRefObject<boolean>

    connect: (options?: { textMode?: boolean, forceWebSocket?: boolean, skipFirstMessage?: boolean, voiceModeGreeting?: string, allowAgentGreeting?: boolean }) => Promise<void>
    disconnect: (options?: { preserveHistory?: boolean }) => Promise<void>
    retryConnect: () => Promise<void>
    sendText: (text: string) => Promise<void>
    setStateSafe: (state: AgentState) => void
    setIsVoiceMode: React.Dispatch<React.SetStateAction<boolean>>
    sendUserActivity: () => void  // Prevents agent interruption while typing
}

function useSessionConnection(options: UseSessionConnectionOptions): UseSessionConnectionReturn {
    const {
        agentId,
        debug,
        startWithText,
        shareContext,
        contextAllowlist,
        linkRegistry,
        allowInterruptions,
        turnEagerness,
        turnTimeout,
        vadThreshold,
        backgroundVoiceDetection,
        onConnect,
        onDisconnect,
        onAgentDisconnect,
        onMessage,
        onError,
        addLog,
        clientTools,
        navigationStateRef,
    } = options

    // --- State ---
    const [state, setState] = useState<AgentState>("disconnected")
    const [error, setError] = useState("")
    const [errorType, setErrorType] = useState<"transient" | "permanent" | null>(null)
    const [isVoiceMode, setIsVoiceMode] = useState(!startWithText)

    // --- Refs ---
    const conversationRef = useRef<ElevenLabsSession | null>(null)
    const stateRef = useRef(state)
    const isConnectingRef = useRef(false)
    const isCleaningUpRef = useRef(false)
    const isTransitioningRef = useRef(false)  // Survives async SDK callbacks during mode transitions
    const connectionAttemptIdRef = useRef(0)
    const disconnectAfterSpeakingRef = useRef(false)
    const listeningDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSentPageRef = useRef<string | null>(null)
    const retryCountRef = useRef(0)
    const isVoiceModeRef = useRef(isVoiceMode)
    const lastConnectOptionsRef = useRef<{ textMode?: boolean, forceWebSocket?: boolean } | undefined>(undefined)
    // iOS Safari Fix: Store MediaStream to properly stop tracks on disconnect
    const mediaStreamRef = useRef<MediaStream | null>(null)
    // PERMANENT disconnect flag - survives cleanup, only reset on new connect
    // This prevents ANY message processing after user requests disconnect
    const userRequestedDisconnectRef = useRef(false)

    // Sync refs
    useEffect(() => { stateRef.current = state }, [state])
    useEffect(() => { isVoiceModeRef.current = isVoiceMode }, [isVoiceMode])

    // Derived state
    const isConnected = state === "connected" || state === "listening" || state === "speaking" || state === "thinking"

    // Session activity tracking for debugging
    const lastActivityTimeRef = useRef<number>(Date.now())
    const sessionStartTimeRef = useRef<number | null>(null)

    // --- Structured Session Event Logging ---
    // Logs session lifecycle events with consistent format for debugging
    const logSessionEvent = useCallback((event: string, data?: Record<string, unknown>) => {
        if (!debug) return
        const elapsed = sessionStartTimeRef.current
            ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
            : 0
        console.log(`[ElevenLabs][Session]`, {
            event,
            timestamp: new Date().toISOString(),
            sessionElapsedSecs: elapsed,
            state: stateRef.current,
            isVoiceMode: isVoiceModeRef.current,
            isIOSSafari: isIOSSafari(),
            ...data
        })
    }, [debug])

    // --- Set State Safely ---
    const setStateSafe = useCallback((newState: AgentState) => {
        if (stateRef.current !== newState) {
            stateRef.current = newState
            setState(newState)
        }
    }, [])

    // --- Disconnect ---
    const disconnect = useCallback(async (options?: { preserveHistory?: boolean }) => {
        // iOS SAFARI FIX: Stop tracks from our STORED MediaStream, not a new one!
        // The previous bug was calling getUserMedia() which OPENS a new stream instead of closing.
        const forceStopMicrophone = () => {
            try {
                // 1. Stop tracks from our stored MediaStream (the one actually in use)
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => {
                        track.stop()
                        if (debug) console.log("[ElevenLabs] Stopped stored track:", track.label)
                    })
                    mediaStreamRef.current = null
                }

                // 2. iOS Safari fallback: Stop any audio/video elements with srcObject
                if (typeof document !== "undefined") {
                    document.querySelectorAll('audio, video').forEach(el => {
                        const mediaEl = el as HTMLMediaElement
                        if (mediaEl.srcObject instanceof MediaStream) {
                            mediaEl.srcObject.getTracks().forEach(track => {
                                track.stop()
                                if (debug) console.log("[ElevenLabs] Stopped orphaned track:", track.label)
                            })
                            mediaEl.srcObject = null
                        }
                    })
                }
            } catch (e) {
                if (debug) console.warn("[ElevenLabs] Force stop mic failed:", e)
            }
        }

        // If already disconnected, just force-stop mic as safety measure and return
        if (stateRef.current === "disconnected" && !isCleaningUpRef.current) {
            forceStopMicrophone()
            return
        }

        // If cleanup is stuck (taking too long on mobile), force reset and proceed
        if (isCleaningUpRef.current) {
            addLog("Cleanup was stuck, forcing reset...", "warn")
            forceStopMicrophone()
            // Force reset the stuck state
            isCleaningUpRef.current = false
            // Don't return - proceed with full cleanup
        }

        // Set transitioning flag BEFORE any async operations (survives SDK callbacks)
        if (options?.preserveHistory) {
            isTransitioningRef.current = true
        }

        isCleaningUpRef.current = true
        userRequestedDisconnectRef.current = true  // PERMANENT flag - survives cleanup
        connectionAttemptIdRef.current++
        isConnectingRef.current = false

        setState("disconnected")
        stateRef.current = "disconnected"
        setError("")
        setErrorType(null)
        addLog("Disconnecting session...", "info")

        // Log session disconnect with timing info
        const sessionDuration = sessionStartTimeRef.current
            ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
            : 0
        const idleSecs = Math.round((Date.now() - lastActivityTimeRef.current) / 1000)
        logSessionEvent("session_disconnect", {
            reason: options?.preserveHistory ? "mode_transition" : "user_requested",
            sessionDurationSecs: sessionDuration,
            lastActivityIdleSecs: idleSecs,
            preserveHistory: options?.preserveHistory ?? false
        })

        // iOS SAFARI FIX: Force-stop mic immediately using stored stream
        // This ensures mic stops even if SDK methods fail or hang
        forceStopMicrophone()

        if (conversationRef.current) {
            // CRITICAL FIX: Capture ref and null immediately to prevent any further voice processing
            // The SDK's VAD can still capture voice and send to agent if ref isn't nulled immediately
            const session = conversationRef.current
            conversationRef.current = null  // Null IMMEDIATELY to prevent any callbacks

            try {
                // CRITICAL: Mute mic FIRST to immediately stop audio input (especially on mobile)
                // This provides instant feedback while endSession() completes async cleanup
                if (session.setMicMuted) {
                    session.setMicMuted(true)
                }
                // Mute output to stop agent audio immediately
                if (session.setVolume) {
                    session.setVolume({ volume: 0 })
                }

                // MOBILE FIX: Wrap endSession in timeout to prevent hanging on mobile
                // Mobile browsers (especially iOS Safari) can hang on WebRTC cleanup
                const endSessionWithTimeout = async () => {
                    return Promise.race([
                        session.endSession(),
                        new Promise<void>((_, reject) =>
                            setTimeout(() => reject(new Error("endSession timeout")), 3000)
                        )
                    ])
                }

                await endSessionWithTimeout()
                addLog("Session ended successfully", "success")
            } catch (e) {
                if (debug) console.warn("Failed to end session:", e)
                addLog(`Session end error: ${e}`, "warn")
                // MOBILE FIX: Force-stop mic again if SDK cleanup failed
                forceStopMicrophone()
            }
        }

        if (listeningDebounceRef.current) clearTimeout(listeningDebounceRef.current)
        disconnectAfterSpeakingRef.current = false
        lastSentPageRef.current = null
        retryCountRef.current = 0

        // MOBILE FIX: Always reset cleanup flag in finally-style pattern
        isCleaningUpRef.current = false

        onDisconnect?.({ isModeTransition: options?.preserveHistory ?? false })
    }, [addLog, debug, onDisconnect])

    // --- Connect ---
    const connect = useCallback(async (connectOptions?: { textMode?: boolean, forceWebSocket?: boolean, skipFirstMessage?: boolean, voiceModeGreeting?: string, allowAgentGreeting?: boolean }) => {
        const isTextMode = connectOptions?.textMode ?? startWithText
        const forceWebSocket = connectOptions?.forceWebSocket ?? false
        const skipFirstMessage = connectOptions?.skipFirstMessage ?? false
        const allowAgentGreeting = connectOptions?.allowAgentGreeting ?? false
        // Text mode: suppress first message UNLESS allowAgentGreeting is true (auto-connect)
        // Voice mode with skipFirstMessage: use contextual greeting or empty.
        // Voice mode fresh start: undefined (use agent's default greeting)
        const firstMessageOverride = isTextMode
            ? (allowAgentGreeting ? undefined : "")  // Allow agent greeting in auto-connect
            : (skipFirstMessage ? (connectOptions?.voiceModeGreeting ?? "") : undefined)
        addLog(`connect: isTextMode=${isTextMode}, skipFirstMessage=${skipFirstMessage}, allowAgentGreeting=${allowAgentGreeting}, firstMessage="${firstMessageOverride}"`, "info")

        if (stateRef.current === "connected" || stateRef.current === "connecting" || stateRef.current === "initializing" || isConnectingRef.current) return
        if (!agentId) { setError("No Agent ID"); return }

        // Retry limit
        if (retryCountRef.current >= 3) {
            setError("Connection failed after 3 attempts")
            addLog("Max retry attempts reached", "error")
            return
        }

        isConnectingRef.current = true
        userRequestedDisconnectRef.current = false  // Reset permanent flag - new connection should receive messages
        const attemptId = ++connectionAttemptIdRef.current
        lastConnectOptionsRef.current = connectOptions
        setError("")
        setErrorType(null)

        const initialState = isTextMode ? "connecting" : "initializing"
        setState(initialState)
        stateRef.current = initialState
        setIsVoiceMode(!isTextMode)

        // Initialize session timing for debugging
        sessionStartTimeRef.current = Date.now()
        lastActivityTimeRef.current = Date.now()
        logSessionEvent("session_start", {
            agentId,
            mode: isTextMode ? "text" : "voice",
            retryCount: retryCountRef.current
        })

        let isRetryingWithFallback = false

        try {
            // Parallelize SDK download and audio warm-up for faster connection
            const [Conversation] = await Promise.all([
                getConversation(),
                warmUpAudioContext(debug)
            ])

            // CROSS-PLATFORM AUDIO FIX: Pre-acquire microphone with optimized audio constraints
            // This ensures echoCancellation and noiseSuppression are active on ALL platforms,
            // not just handled by WebRTC's default settings which may be less aggressive.
            // 
            // On iOS Safari: Also needed to store MediaStream ref for proper cleanup
            // (otherwise the mic indicator stays active after disconnect)
            // 
            // Audio constraints match professional dictation apps like Wispr Flow:
            // - echoCancellation: Prevents speaker audio from being picked up
            // - noiseSuppression: Reduces background noise for cleaner voice capture  
            // - autoGainControl: Maintains consistent volume levels
            // - sampleRate: 48kHz for high-quality audio (browser will downsample if needed)
            if (!isTextMode) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                            sampleRate: 48000,
                            channelCount: 1  // Mono for voice
                        }
                    })
                    mediaStreamRef.current = stream
                    if (debug) console.log("[ElevenLabs] Pre-acquired MediaStream with optimized audio constraints")
                } catch (e) {
                    // Permission denied or unavailable - continue anyway, SDK will handle it
                    if (debug) console.warn("[ElevenLabs] Could not pre-acquire mic:", e)
                }
            }

            // NOTE: Mic permission is NOT requested here - it's deferred to upgradeToVoice()
            // This allows text mode to work without any permission prompts

            if (connectionAttemptIdRef.current !== attemptId) return
            if (!Conversation) throw new Error("Failed to load SDK")

            // Visitor tracking
            let visitorState: VisitorState = { isReturning: false, visitCount: 1, daysSinceLastVisit: 0 }
            if (typeof window !== "undefined") {
                const storageKey = "ael_visitor_history:v1"
                const now = Date.now()
                const raw = getCachedStorage(storageKey)
                if (raw) {
                    try {
                        const history: VisitorHistory = JSON.parse(raw)
                        visitorState = {
                            isReturning: true,
                            visitCount: (history.visitCount || 0) + 1,
                            daysSinceLastVisit: Math.floor((now - (history.lastVisit || now)) / (1000 * 60 * 60 * 24))
                        }
                    } catch { /* Invalid JSON, use defaults */ }
                }
                setCachedStorage(storageKey, JSON.stringify({
                    visitCount: visitorState.visitCount,
                    lastVisit: now,
                    firstSeen: raw ? JSON.parse(raw).firstSeen : now
                }))
            }

            // Start session
            await new Promise<void>((resolve, reject) => {
                let settled = false
                // NOTE: Keep WebRTC for iOS Safari - WebRTC has built-in echo cancellation
                // and noise suppression that WebSocket lacks. The audio warm-up above
                // helps iOS Safari activate its audio pipeline properly.
                const isWebSocket = forceWebSocket || isTextMode
                const connectionType = isWebSocket ? "websocket" : "webrtc"

                // Fallback timer for WebRTC - shorter timeout on iOS where WebRTC is less reliable
                let fallbackTimer: ReturnType<typeof setTimeout> | null = null
                if (!isWebSocket) {
                    const webrtcTimeout = isIOSSafari() ? 3000 : 8000  // 3s on iOS, 8s on desktop
                    fallbackTimer = setTimeout(() => {
                        if (!settled) {
                            settled = true
                            addLog(`WebRTC timeout (${webrtcTimeout}ms), falling back to WebSocket...`, "warn")
                            reject(new Error("webrtc_timeout"))
                        }
                    }, webrtcTimeout)
                }

                // General timeout
                const timeout = setTimeout(() => {
                    if (!settled) {
                        settled = true
                        if (fallbackTimer) clearTimeout(fallbackTimer)
                        reject(new Error("Connection timeout"))
                    }
                }, 10000)

                Conversation.startSession({
                    agentId,
                    connectionType,
                    // Text mode = no mic needed. Voice mode = mic required.
                    // When upgrading from text to voice, we reconnect with textOnly: false
                    textOnly: isTextMode,
                    clientEvents: ["audio", "interruption", "transcript"],
                    clientTools,
                    overrides: {
                        agent: {
                            // Suppress first message in text mode or when explicitly skipped (re-upgrade to voice)
                            // Voice mode only gets greeting on first activation, subsequent toggles skip it
                            firstMessage: firstMessageOverride
                        },
                        // CRITICAL: Server-side text-only mode enforcement
                        // This is required to disable TTS generation and switch to per-message billing
                        // The client textOnly flag only prevents audio context, not server-side audio
                        conversation: {
                            textOnly: isTextMode
                        },
                        // TTS config only matters for voice mode, but include for seamless switching
                        tts: isTextMode ? undefined : {
                            model_id: "eleven_flash_v2_5",
                            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                        },
                        // Voice config for seamless switching
                        conversation_config_override: {
                            turn: {
                                mode: turnEagerness,
                                turn_timeout: turnTimeout,
                                interruption: {
                                    enabled: allowInterruptions,
                                    min_threshold: 0.5
                                }
                            },
                            vad: {
                                // VAD threshold: Default 0.4, range 0.1-0.9 (per ElevenLabs docs)
                                // Lower = more sensitive, Higher = less sensitive to background
                                // Cross-platform hardened to 0.6 to prevent background noise triggers
                                vad_threshold: Math.max(vadThreshold, 0.6),

                                // Filter brief noise bursts (door slams, coughs, TV audio spikes)
                                // Only trigger on sustained speech of 150ms+ 
                                min_speech_duration_ms: 150,

                                // Official API parameter from elevenlabs.io/docs/agents-platform
                                // Disable to prevent agent from picking up background voices/audio
                                background_voice_detection: false
                            }
                        },
                    },
                    dynamicVariables: {
                        current_page: navigationStateRef.current?.currentPage || "",
                        user_is_returning: String(visitorState.isReturning),
                        available_links: linkRegistry.map(l => l.name).join(", "),
                        interaction_mode: isTextMode ? "text" : "voice",
                        // Inject current date/time so agent has immediate context for scheduling
                        // Format: "Wednesday, January 28, 2026 at 08:12 PM (America/Argentina/Buenos_Aires)"
                        current_datetime: new Date().toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'long'
                        }),
                        // Session continuity: pass stored user data from previous sessions
                        // These are populated by syncUserData tool calls
                        stored_user_name: (typeof window !== "undefined" ? sessionStorage.getItem("ael_user") : null) || "",
                        stored_user_email: (typeof window !== "undefined" ? sessionStorage.getItem("ael_user_email") : null) || "",
                        stored_user_interests: (typeof window !== "undefined" ? sessionStorage.getItem("ael_user_interests") : null) || "",
                    },
                    onConnect: () => {
                        if (settled) return
                        addLog("Connected (SDK callback)", "success")
                        logSessionEvent("session_connected", {
                            vadThresholdApplied: Math.max(vadThreshold, 0.6),
                            backgroundVoiceDetection: false,  // Per official API docs
                            mode: isTextMode ? "text" : "voice"
                        })
                        // NOTE: Do NOT setStateSafe("connected") here!
                        // The session ref isn't populated yet. We set connected state
                        // after the .then() resolves and session is assigned.
                        // This ensures flushPendingMessages has a valid session.
                    },
                    onDisconnect: (details: DisconnectDetails) => {
                        // Guard: Don't cascade if we initiated disconnect OR if we're in a mode transition
                        if (stateRef.current === "disconnected" || isCleaningUpRef.current || isTransitioningRef.current) return

                        // Calculate session metrics for debugging
                        const sessionDuration = sessionStartTimeRef.current
                            ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
                            : 0
                        const idleSecs = Math.round((Date.now() - lastActivityTimeRef.current) / 1000)

                        console.warn("[ElevenLabs] Disconnected:", details)
                        addLog(`Disconnected: ${typeof details === 'object' ? JSON.stringify(details) : details}`, "info")

                        // Structured disconnect logging
                        logSessionEvent("sdk_disconnect", {
                            details: typeof details === 'object' ? details : { raw: details },
                            sessionDurationSecs: sessionDuration,
                            lastActivityIdleSecs: idleSecs,
                            wasUserRequested: userRequestedDisconnectRef.current,
                            wasTransitioning: isTransitioningRef.current
                        })

                        // Notify parent hook BEFORE cleanup (so it can add "Session ended" message)
                        onAgentDisconnect?.()
                        disconnect()
                    },
                    onError: (err: SDKError) => {
                        if (!settled) { settled = true; clearTimeout(timeout); reject(err) }
                        else {
                            console.error("SDK Error:", err)
                            addLog(`SDK Error: ${err.message || err}`, "error")
                            logSessionEvent("session_error", {
                                error: err.message || String(err),
                                errorCode: (err as unknown as { code?: string })?.code
                            })
                        }
                    },
                    onModeChange: (mode: SDKModeChange) => {
                        // CRITICAL: Block all mode changes after user requests disconnect
                        if (userRequestedDisconnectRef.current || stateRef.current === "disconnected") {
                            if (debug) console.log("[ElevenLabs] Blocked mode change (user requested disconnect):", mode)
                            return
                        }

                        // Update activity tracking and log mode change
                        lastActivityTimeRef.current = Date.now()
                        logSessionEvent("session_mode_change", { mode: mode.mode })

                        // BROWSER FIX: Check for pending disconnect OUTSIDE voice mode conditional
                        // This ensures end_call works in BOTH text and voice modes, since text mode
                        // also uses "speaking" state when TTS is playing the farewell message.
                        // Previously this only worked in voice mode, causing end_call to hang in text mode.
                        if (mode.mode === "listening" && disconnectAfterSpeakingRef.current) {
                            if (debug) console.log("[ElevenLabs] Triggering delayed disconnect after speaking finished")
                            disconnect()
                            return
                        }

                        const inVoiceMode = isVoiceModeRef.current

                        if (inVoiceMode) {
                            if (listeningDebounceRef.current) {
                                clearTimeout(listeningDebounceRef.current)
                                listeningDebounceRef.current = null
                            }

                            if (mode.mode === "speaking") {
                                setStateSafe("speaking")
                            } else if (mode.mode === "listening") {
                                listeningDebounceRef.current = setTimeout(() => {
                                    const outputVol = conversationRef.current?.getOutputVolume?.() || 0
                                    if (stateRef.current !== "disconnected" && outputVol < 0.01) {
                                        if (conversationRef.current?.setMicMuted) {
                                            conversationRef.current.setMicMuted(false)
                                        }
                                        setStateSafe("listening")
                                    }
                                }, 600)
                            }
                        }
                    },
                    onMessage: (msg: SDKMessage) => {
                        // CRITICAL: Block all messages after user requests disconnect
                        // userRequestedDisconnectRef survives cleanup and stays true until new connect()
                        if (userRequestedDisconnectRef.current || isCleaningUpRef.current || stateRef.current === "disconnected") {
                            if (debug) console.log("[ElevenLabs] Blocked message (user requested disconnect):", msg)
                            return
                        }
                        addLog(`Received message: ${JSON.stringify(msg)}`, "info")

                        // Handle user messages (voice transcripts)
                        // - In TEXT mode: User messages are added locally in handleSend, so ignore SDK echoes
                        // - In VOICE mode: SDK provides transcripts, so we need to show them
                        if (msg.source === "user") {
                            // Only show user messages in voice mode (these are transcripts)
                            if (isVoiceModeRef.current) {
                                const content = msg.message
                                if (content && content !== "None" && content !== "null" && content !== "..." && content.trim() !== "") {
                                    onMessage?.({ role: "user", content })
                                }
                            }
                            return
                        }

                        // Handle assistant messages (filter out internal workflow tools)
                        const content = msg.message
                        if (content && content !== "None" && content !== "null" && content !== "..." && content.trim() !== "") {
                            // Filter out internal ElevenLabs workflow tool messages
                            // These are LLM outputs when calling workflow transition tools and shouldn't be shown to users
                            // Examples: "notify_condition_2_met()", "notifycondition2_met()", etc.
                            const isWorkflowToolMessage = /^notify_?condition\d*_?met\s*\(\s*\)\s*$/i.test(content.trim())
                            if (!isWorkflowToolMessage) {
                                onMessage?.({ role: "assistant", content })
                            } else if (debug) {
                                console.log("[ElevenLabs] Filtered out workflow tool message:", content)
                            }
                        }
                    },
                    onUnhandledClientToolCall: (toolName: string, _params: unknown) => {
                        addLog(`Unhandled tool call: ${toolName}`, "warn")
                        console.warn(`[ElevenLabs] Agent requested undefined client tool: ${toolName}`)
                    },
                    onDebug: (event: unknown) => {
                        if (debug) {
                            console.log("[ElevenLabs Debug]", event)
                            addLog(`Debug: ${JSON.stringify(event)}`, "info")
                        }
                    },
                }).then((session: ElevenLabsSession) => {
                    if (settled) return
                    settled = true
                    clearTimeout(timeout)
                    if (fallbackTimer) clearTimeout(fallbackTimer)

                    conversationRef.current = session
                    isTransitioningRef.current = false  // Clear transition flag after successful connect

                    // Set volume based on mode: mute for text, enable for voice
                    // Enable audio immediately in voice mode to prevent first words from being cut off
                    if (session.setVolume) {
                        session.setVolume({ volume: isTextMode ? 0 : 1 })
                    }
                    if (session.setMicMuted) {
                        session.setMicMuted(true)
                        addLog(`Session started (${isTextMode ? 'text' : 'voice'} mode, audio ${isTextMode ? 'muted' : 'enabled'})`, "info")
                    }

                    // Voice mode: unmute mic after a brief settling delay
                    if (!isTextMode) {
                        setTimeout(() => {
                            if (session.setMicMuted) session.setMicMuted(false)
                            addLog("Voice mode: mic unmuted and ready", "info")
                        }, 300)
                    }

                    // NOTE: Context is passed via dynamicVariables in startSession()
                    // Do NOT use sendText() here - it delays agent responses

                    // NOW set state to connected and fire callback - session ref is ready
                    setStateSafe("connected")
                    onConnect?.()

                    addLog(`Session Started`, "success")
                    resolve()
                }).catch((err: SDKError) => {
                    if (!settled) { settled = true; clearTimeout(timeout); reject(err) }
                })
            })

        } catch (e: unknown) {
            const err = e as SDKError
            console.error("Connection failed", err)

            // WebRTC fallback
            if (err.message === "webrtc_timeout" && !forceWebSocket && !isTextMode) {
                addLog("Retrying connection with WebSocket...", "info")
                isConnectingRef.current = false
                isRetryingWithFallback = true
                setTimeout(() => connect({ textMode: isTextMode, forceWebSocket: true }), 200)
                return
            }

            const isPermissionDenied = err.name === "NotAllowedError" || err.message?.includes("Permission denied")
            const errType = isPermissionDenied ? "permanent" : "transient"

            // In text mode, permission errors shouldn't happen - skip retries for these
            if (isTextMode && isPermissionDenied) {
                addLog("Permission error in text mode - this shouldn't happen, check SDK config", "error")
                console.error("[ElevenLabs] Unexpected permission error in text mode:", err)
            }

            // Retry logic (skip for permission errors)
            if (retryCountRef.current < 3 && err.message !== "webrtc_timeout" && !isPermissionDenied) {
                const delay = Math.pow(2, retryCountRef.current) * 1000
                retryCountRef.current++
                addLog(`Connection failed, retrying in ${delay / 1000}s (attempt ${retryCountRef.current}/3)...`, "warn")
                console.error("[ElevenLabs] Connection error details:", err.name, err.message, err)
                isConnectingRef.current = false
                isRetryingWithFallback = true
                setTimeout(() => connect({ textMode: isTextMode, forceWebSocket }), delay)
                return
            }

            const errorMsg = err.name === "NotAllowedError" ? "Mic Denied" : "Connection Failed"
            addLog(`Failed to connect: ${err.message}`, "error")
            disconnect()
            setError(errorMsg)
            setErrorType(errType)
            onError?.(errorMsg)
        } finally {
            if (!isRetryingWithFallback) {
                isConnectingRef.current = false
            }
        }
    }, [
        agentId, startWithText, shareContext, contextAllowlist,
        linkRegistry, allowInterruptions, turnEagerness, turnTimeout, vadThreshold, backgroundVoiceDetection,
        debug, clientTools, navigationStateRef, setStateSafe, disconnect, addLog, onConnect, onError, onMessage
    ])

    // --- Send Text ---
    const sendText = useCallback(async (text: string) => {
        if (!conversationRef.current) {
            addLog("Cannot send text: not connected", "warn")
            return
        }

        try {
            if (typeof conversationRef.current.sendUserMessage === 'function') {
                await conversationRef.current.sendUserMessage(text)
                addLog("Sent via sendUserMessage", "success")
            } else if (conversationRef.current.sendText) {
                await conversationRef.current.sendText(text)
                addLog("Sent via sendText", "success")
            } else {
                addLog("No send method available", "warn")
            }
        } catch (err: unknown) {
            const error = err as SDKError
            console.error("[ElevenLabs] Message send failed", error)
            addLog(`Failed to send message: ${error.message || String(error)}`, "error")
        }
    }, [addLog])

    // --- Retry Connect ---
    const retryConnect = useCallback(async () => {
        retryCountRef.current = 0
        setError("")
        setErrorType(null)
        await connect(lastConnectOptionsRef.current)
    }, [connect])

    return {
        state,
        error,
        errorType,
        isConnected,
        isVoiceMode,
        sessionRef: conversationRef,
        stateRef,
        isVoiceModeRef,
        disconnectAfterSpeakingRef,

        connect,
        disconnect,
        retryConnect,
        sendText,
        setStateSafe,
        setIsVoiceMode,
        sendUserActivity: useCallback(() => {
            if (!conversationRef.current) return
            try {
                conversationRef.current.sendUserActivity?.()
            } catch (err) {
                if (debug) console.warn("[ElevenLabs] sendUserActivity failed:", err)
            }
        }, [debug]),
    }
}



// --- BUNDLED: hooks/useElevenLabsSession.ts ---
/**
 * useElevenLabsSession - Shared hook for ElevenLabs agent session management
 * 
 * This is the FACADE that composes smaller, focused hooks while maintaining
 * a stable public API for consumers (ElevenLabsVoiceChat, ConversationButton).
 */


// --- Types ---

// --- Constants ---
const MESSAGES_STORAGE_KEY = "ael_chat_messages:v1"

interface UseElevenLabsSessionOptions {
    agentId: string
    debug?: boolean

    // Mode configuration
    startWithText?: boolean
    shareContext?: boolean
    autoScrapeContext?: boolean
    contextAllowlist?: string[]
    linkRegistry?: LinkRegistryItem[]

    // Turn-taking configuration
    allowInterruptions?: boolean
    turnEagerness?: "normal" | "eager" | "patient"
    turnTimeout?: number
    vadThreshold?: number
    /** 
     * Enable background voice detection (default: true on desktop, false on iOS Safari)
     * Set to false to reduce false positives from speaker echo on mobile
     */
    backgroundVoiceDetection?: boolean

    // Callbacks (component-specific behavior)
    onConnect?: () => void
    onDisconnect?: (reason?: { isModeTransition: boolean }) => void
    onMessage?: (message: { role: "user" | "assistant", content: string }) => void
    onStateChange?: (state: AgentState) => void
    onError?: (error: string) => void

    // Session timeout configuration
    enableAutoDisconnect?: boolean
    textModeTimeout?: number
    voiceModeTimeout?: number
    onInactivityWarning?: () => void
    inactivityWarningTime?: number

    // Navigation state (from useAgentNavigation)
    navigationState?: { currentPage: string, previousPage?: string, visitHistory: string[] }
    redirectToPage: (params: { url: string; openInNewTab?: boolean } | string) => Promise<string>

    // Additional client tools from component
    additionalClientTools?: Record<string, (params: any) => Promise<string>>
}

interface UseElevenLabsSessionReturn {
    state: AgentState
    error: string
    errorType: "transient" | "permanent" | null
    isConnected: boolean
    isVoiceMode: boolean
    sessionRef: React.RefObject<import("../types").ElevenLabsSession | null>

    // Actions
    connect: (options?: { textMode?: boolean, forceWebSocket?: boolean, skipFirstMessage?: boolean, voiceModeGreeting?: string, allowAgentGreeting?: boolean }) => Promise<void>
    disconnect: () => Promise<void>
    retryConnect: () => Promise<void>
    sendText: (text: string) => Promise<void>
    setMicMuted: (muted: boolean) => void
    setVolume: (volume: number) => void
    upgradeToVoice: () => Promise<void>
    downgradeToText: () => void
    sendUserActivity: () => void  // Prevents agent interruption while typing

    // Audio
    getOutputVolume: () => number
    getInputVolume: () => number
    getOutputByteFrequencyData: () => Uint8Array | null

    // Messages (from useChatMessages)
    messages: ChatMessage[]
    addMessage: (message: ChatMessage) => void
    clearMessages: () => void
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    queueMessage: (text: string) => void
    flushPendingMessages: () => void
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
    scrollToBottom: () => void

    // Logging
    addLog: (msg: string, type?: "info" | "error" | "warn" | "success") => void

    // Inactivity timer
    resetInactivityTimer: () => void
}

// --- Hook Implementation ---

function useElevenLabsSession(options: UseElevenLabsSessionOptions): UseElevenLabsSessionReturn {
    const {
        agentId,
        debug = false,
        startWithText = true,
        shareContext = true,
        autoScrapeContext = false,
        contextAllowlist = [],
        linkRegistry = [],
        allowInterruptions = true,
        turnEagerness = "normal",
        turnTimeout = 1.2,
        vadThreshold = 0.5,
        // Default: false on iOS Safari to reduce speaker echo false positives
        backgroundVoiceDetection = true,
        onConnect,
        onDisconnect,
        onMessage,
        onStateChange,
        onError,
        navigationState,
        redirectToPage,
        additionalClientTools = {},
        enableAutoDisconnect = true,
        textModeTimeout,
        voiceModeTimeout,
        onInactivityWarning,
        inactivityWarningTime,
    } = options

    // Navigation state ref
    const navigationStateRef = useRef(navigationState)
    useEffect(() => { navigationStateRef.current = navigationState }, [navigationState])

    // --- Logging ---
    const addLog = useCallback((msg: string, type: "info" | "error" | "warn" | "success" = "info") => {
        if (debug) console.log(`[ElevenLabs] ${type}: ${msg}`)
        if (debug && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("elevenlabs-chat-log", {
                detail: { id: Math.random().toString(36).substring(7), msg, type, time: new Date().toLocaleTimeString() }
            }))
        }
    }, [debug])

    // --- Session Timeout (Inactivity Detection) ---
    // Use ref to access disconnectWithBoundary (defined later) to ensure "Session ended" message is added
    const disconnectWithBoundaryRef = useRef<(() => void) | null>(null)

    const handleInactivityTimeout = useCallback(() => {
        addLog("Session auto-disconnected due to inactivity", "warn")
        // Use ref to call wrapped disconnect that adds "Session ended" message
        if (disconnectWithBoundaryRef.current) {
            disconnectWithBoundaryRef.current()
        }
    }, [addLog])

    const handleInactivityWarning = useCallback(() => {
        addLog("Inactivity warning: session will disconnect soon", "warn")
        onInactivityWarning?.()
    }, [addLog, onInactivityWarning])

    const {
        messages,
        addMessage,
        clearMessages,
        messagesEndRef,
        queueMessage,
        flushPendingMessages: flushQueue,
        handleScroll,
        scrollToBottom,
    } = useChatMessages({
        sessionKey: MESSAGES_STORAGE_KEY,
        debug,
        addLog,
    })

    // Placeholder for timeout hook (needs refs from connection)
    const timeoutResetRef = useRef<(() => void) | null>(null)

    // We need to create a temporary connection first to get refs for client tools
    // This is a bit of a chicken-and-egg problem, so we use a placeholder approach
    const stateRefForTools = useRef<AgentState>("disconnected")
    // setStateSafe ref - will be updated with real setStateSafe function after connection is created
    const setStateSafeRefForTools = useRef<(state: AgentState) => void>((newState: AgentState) => {
        console.warn('[ElevenLabs] setStateSafe called before initialization, state:', newState)
        stateRefForTools.current = newState
    })
    const setStateSafeForTools = useCallback((newState: AgentState) => {
        stateRefForTools.current = newState
        setStateSafeRefForTools.current(newState)  // Call the real setStateSafe once initialized
    }, [])
    // Disconnect ref - will be updated with real disconnect function after connection is created
    const disconnectRefForTools = useRef<() => void>(() => {
        console.warn('[ElevenLabs] Disconnect called before initialization')
    })
    // disconnectAfterSpeakingRef placeholder - synced with connection ref after initialization
    const disconnectAfterSpeakingRefForTools = useRef(false)

    // --- Client Tools ---
    const clientTools = useClientTools({
        debug,
        autoScrapeContext,
        addLog,
        setStateSafe: setStateSafeForTools,
        disconnect: () => disconnectRefForTools.current(),  // Use ref to get latest disconnect
        disconnectAfterSpeakingRef: disconnectAfterSpeakingRefForTools,
        stateRef: stateRefForTools,
        redirectToPage,
        additionalClientTools,
    })

    // --- Session Connection ---
    const connection = useSessionConnection({
        agentId,
        debug,
        startWithText,
        shareContext,
        contextAllowlist,
        linkRegistry,
        allowInterruptions,
        turnEagerness,
        turnTimeout,
        vadThreshold,
        backgroundVoiceDetection,
        onConnect,
        onDisconnect,
        // Called when SDK/agent initiates disconnect (e.g., user says "bye")
        // Add "Session ended" message BEFORE session cleanup
        onAgentDisconnect: useCallback(() => {
            addMessage({
                id: generateMessageId(),
                role: "assistant",
                content: "Session ended",
                sessionId: currentSessionIdRef.current || undefined,
            })
        }, [addMessage]),
        // Wrap onMessage to add to chat messages
        onMessage: useCallback((msg: { role: "user" | "assistant", content: string }) => {
            // Add to messages array
            addMessage({
                id: generateMessageId(),
                role: msg.role,
                content: msg.content,
            })
            // Call original callback
            onMessage?.(msg)
        }, [onMessage, addMessage]),
        onError,
        addLog,
        clientTools,
        navigationStateRef,
    })

    const {
        state,
        error,
        errorType,
        isConnected,
        isVoiceMode,
        sessionRef,
        stateRef: _connectionStateRef,
        isVoiceModeRef: _connectionIsVoiceModeRef,
        disconnectAfterSpeakingRef,
        connect,
        disconnect,
        retryConnect,
        sendText,
        setStateSafe,
        setIsVoiceMode,
        sendUserActivity,
    } = connection

    // Sync the tools refs with actual connection refs and functions
    useEffect(() => {
        stateRefForTools.current = state
    }, [state])

    useEffect(() => {
        disconnectRefForTools.current = disconnect
    }, [disconnect])

    // Sync setStateSafe ref with real connection setStateSafe
    useEffect(() => {
        setStateSafeRefForTools.current = setStateSafe
    }, [setStateSafe])

    // Sync disconnectAfterSpeaking ref with connection
    useEffect(() => {
        // This syncs the ref values bidirectionally
        const interval = setInterval(() => {
            if (disconnectAfterSpeakingRef.current !== disconnectAfterSpeakingRefForTools.current) {
                disconnectAfterSpeakingRefForTools.current = disconnectAfterSpeakingRef.current
            }
        }, 100)
        return () => clearInterval(interval)
    }, [disconnectAfterSpeakingRef])

    // --- Session Boundary Logic ---
    const currentSessionIdRef = useRef<string | null>(null)
    // Track if we've had a voice session in this conversation (to avoid repeating greeting on re-upgrade)
    const hasHadVoiceSessionRef = useRef(false)

    // Wrapped connect: clears old messages before starting new session
    const connectWithBoundary = useCallback(async (options?: { textMode?: boolean, forceWebSocket?: boolean, skipFirstMessage?: boolean, voiceModeGreeting?: string, allowAgentGreeting?: boolean }) => {
        // Only clear messages and reset history if this is a fresh session (not a mode re-upgrade)
        if (!options?.skipFirstMessage) {
            clearMessages()
            hasHadVoiceSessionRef.current = false  // Reset voice session history for fresh starts
        }
        currentSessionIdRef.current = generateSessionId()
        addLog(`Starting new session: ${currentSessionIdRef.current}`, "info")
        await connect(options)
    }, [connect, clearMessages, addLog])

    // Wrapped disconnect: adds "Session ended" bubble
    const disconnectWithBoundary = useCallback(async () => {
        // Only add "Session ended" if we were actually connected
        if (isConnected) {
            addMessage({
                id: generateMessageId(),
                role: "assistant",
                content: "Session ended",
                sessionId: currentSessionIdRef.current || undefined,
            })
        }
        // CRITICAL: Must await to ensure iOS Safari properly closes WebRTC/audio
        await disconnect()
    }, [disconnect, isConnected, addMessage])

    // Sync ref for inactivity timeout handler (defined before disconnectWithBoundary)
    useEffect(() => {
        disconnectWithBoundaryRef.current = disconnectWithBoundary
    }, [disconnectWithBoundary])

    // --- Audio Controls ---
    const audioControls = useAudioControls({ sessionRef })
    const {
        setMicMuted,
        setVolume,
        getOutputVolume,
        getInputVolume,
        getOutputByteFrequencyData,
    } = audioControls

    // --- Session Timeout Integration ---
    const sessionTimeout = useSessionTimeout({
        enabled: enableAutoDisconnect,
        isVoiceMode,
        isConnected,
        textModeTimeout,
        voiceModeTimeout,
        onTimeout: handleInactivityTimeout,
        onWarning: onInactivityWarning ? handleInactivityWarning : undefined,
        warningTime: inactivityWarningTime,
        debug,
    })

    // Store reset function in ref for use before sessionTimeout is initialized
    useEffect(() => {
        timeoutResetRef.current = sessionTimeout.resetTimer
    }, [sessionTimeout])

    // --- State Broadcasting ---
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Filter voice-specific states when in text mode
            // In text mode, we don't want to show "Listening" or "Speaking"
            const broadcastState = !isVoiceMode && (state === "listening" || state === "speaking")
                ? "connected"
                : state

            window.dispatchEvent(new CustomEvent("elevenlabs-state-change", {
                detail: { state: broadcastState, errorMessage: error }
            }))
        }
        onStateChange?.(state)
    }, [state, error, onStateChange, isVoiceMode])

    // --- Mode Switching ---
    const upgradeToVoice = useCallback(async () => {
        // Already in voice mode
        if (isVoiceMode) return

        addLog("Checking mic permission before upgrading...", "info")

        // Check mic permission FIRST (before any reconnection)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            // Permission granted - stop the test stream
            stream.getTracks().forEach(track => track.stop())
            addLog("Mic permission granted, upgrading to voice...", "success")
        } catch {
            // Permission denied - stay in text mode
            addLog("Mic permission denied - staying in text mode", "warn")
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("elevenlabs-mic-denied", {
                    detail: { message: "Enable microphone to use voice mode" }
                }))
            }
            return
        }

        // Reset inactivity timer on mode change (user activity)
        sessionTimeout.resetTimer()

        // Disconnect current text session (if connected) and reconnect with voice
        // We need to reconnect because text sessions use textOnly: true
        if (isConnected) {
            addLog("Disconnecting text session to upgrade to voice...", "info")
            disconnect({ preserveHistory: true })
        }

        // Always skip greeting when upgrading from text mode (conversation already started)
        // Only play greeting on fresh voice-only sessions
        const shouldSkipGreeting = messages.length > 0 || hasHadVoiceSessionRef.current
        addLog(`upgradeToVoice: messages.length=${messages.length}, hasHadVoice=${hasHadVoiceSessionRef.current}, skipGreeting=${shouldSkipGreeting}`, "info")

        // Start new session with voice mode
        // When switching from text mode, use a contextual greeting instead of repeating full greeting
        await connect({
            textMode: false,
            skipFirstMessage: shouldSkipGreeting,
            voiceModeGreeting: shouldSkipGreeting ? "Voice mode - listening..." : undefined
        })

        // Mark that we've had a voice session (for future re-upgrades)
        hasHadVoiceSessionRef.current = true
        addLog(shouldSkipGreeting ? "Voice mode resumed (contextual greeting)" : "Voice mode active", "success")
    }, [isConnected, isVoiceMode, connect, disconnect, addLog, sessionTimeout, messages.length])

    const downgradeToText = useCallback(async () => {
        if (!isVoiceMode) return

        // Note: sessionRef.current may be null if voice connection is still in progress
        // We should still proceed to cancel the pending voice connection and switch to text mode
        if (!sessionRef.current && !isConnected && state !== "connecting" && state !== "initializing") {
            addLog("Cannot downgrade to text mode: no active or pending session", "warn")
            return
        }

        addLog("Downgrading to text mode...", "info")

        // Reset inactivity timer on mode change (user activity)
        sessionTimeout.resetTimer()

        // IMPORTANT: Per ElevenLabs docs, simply muting client playback does NOT stop
        // server-side audio generation or switch billing to per-message.
        // We MUST disconnect and reconnect with text-only configuration.
        addLog("Disconnecting voice session to switch to text mode...", "info")
        disconnect({ preserveHistory: true })

        // Reconnect with text-only mode (proper server-side enforcement)
        await connect({
            textMode: true,
            skipFirstMessage: true  // Don't repeat greeting when switching modes
        })

        addLog("Text mode active (TTS disabled)", "success")
    }, [isVoiceMode, isConnected, state, addLog, sessionRef, sessionTimeout, disconnect, connect])

    // Wrap flush to use local session ref
    // NOTE: Can't use isConnected from closure - it may be stale when called immediately after connect
    // Instead, check if session exists (if it exists, we're connected)
    const flushPendingMessages = useCallback(() => {
        const session = sessionRef.current
        const connected = session !== null
        flushQueue(session, connected)
    }, [flushQueue, sessionRef])

    // Wrap sendText to reset inactivity timer
    const sendTextWithActivity = useCallback(async (text: string) => {
        // Reset inactivity timer (user is actively sending messages)
        sessionTimeout.resetTimer()
        await sendText(text)
    }, [sendText, sessionTimeout])

    return {
        state,
        error,
        errorType,
        isConnected,
        isVoiceMode,
        sessionRef,

        connect: connectWithBoundary,
        disconnect: disconnectWithBoundary,
        retryConnect,
        sendText: sendTextWithActivity,
        setMicMuted,
        setVolume,
        upgradeToVoice,
        downgradeToText,
        sendUserActivity,

        getOutputVolume,
        getInputVolume,
        getOutputByteFrequencyData,

        // Messages
        messages,
        addMessage,
        clearMessages,
        messagesEndRef,
        queueMessage,
        flushPendingMessages,
        handleScroll,
        scrollToBottom,

        addLog,
        resetInactivityTimer: sessionTimeout.resetTimer,
    }
}



// --- BUNDLED: hooks/useAgentNavigation.tsx ---



interface AgentNavigationState {
    currentPage: string
    previousPage: string | null
    visitHistory: string[] // max 5 entries
    canGoBack: boolean
    canGoForward: boolean
    updatedAt: number
}

const STORAGE_KEY = "agent_navigation_state"

interface UseAgentNavigationProps {
    linkRegistry: LinkRegistryItem[]
    addLog?: (msg: string, type?: "info" | "warn" | "error" | "success") => void
}

const listeners = new Set<() => void>()
let isListening = false
let pollingIntervalId: ReturnType<typeof setInterval> | null = null

// Global dedup to prevent multiple components (Chat + Button) from flooding logs
let globalLastLog: { msg: string; time: number } | null = null

const handleGlobalLocationChange = () => {
    listeners.forEach((listener) => listener())
}

const startListening = () => {
    if (typeof window === "undefined" || isListening) return
    isListening = true
    window.addEventListener("popstate", handleGlobalLocationChange)
    // Polling as fallback (cleanup-able)
    pollingIntervalId = setInterval(handleGlobalLocationChange, 1000)
}

// Optional: Allow cleanup when all components unmount (future-proof)
const stopListening = () => {
    if (!isListening) return
    isListening = false
    window.removeEventListener("popstate", handleGlobalLocationChange)
    if (pollingIntervalId !== null) {
        clearInterval(pollingIntervalId)
        pollingIntervalId = null
    }
}

const useAgentNavigation = ({
    linkRegistry,
    addLog,
}: UseAgentNavigationProps) => {
    const router = useRouter ? useRouter() : null
    const isRestored = useRef(false)
    const hasLogged = useRef(false)

    // Helper to dedup logs globally
    const logOnce = useCallback((msg: string, type: "info" | "warn" | "error" | "success" = "info") => {
        const now = Date.now()
        if (
            globalLastLog &&
            globalLastLog.msg === msg &&
            now - globalLastLog.time < 500
        ) {
            return // Duplicate suppressed globally
        }
        globalLastLog = { msg, time: now }
        addLog?.(msg, type)
    }, [addLog])

    // Resolve current URL to link registry page name
    const resolvePageName = useCallback((pathname: string): string => {
        if (typeof window === "undefined") return "Unknown"

        // FRAMER FIX: Merge internal Framer preview paths to a single stable name
        // This prevents infinite loops when switching between canvas/preview contexts
        if (pathname.includes("sandbox.html") || pathname.includes("module.html")) {
            return "Framer Preview"
        }

        const normalized = pathname.replace(/\/$/, "") || "/"

        // Try to find matching entry in link registry
        const entry = linkRegistry.find(
            (l) => {
                // Support both 'path' (Framer) and 'target' (Legacy)
                // @ts-ignore
                const targetUrl = l.path || l.target || ""
                const targetNormalized = targetUrl.replace(/\/$/, "") || "/"
                return targetNormalized === normalized
            }
        )

        if (entry) return entry.name

        // Fallback to path segment (capitalized)
        const segment = pathname.split("/").pop() || "Home"
        return segment.charAt(0).toUpperCase() + segment.slice(1)
    }, [linkRegistry])

    const getInitialState = (): AgentNavigationState => {
        // Always return a consistent default for initial render to prevent hydration mismatch
        // We will restore from session storage in useEffect
        return {
            currentPage: "Unknown", // Placeholder, will update immediately on client
            previousPage: null,
            visitHistory: [],
            canGoBack: false,
            canGoForward: false,
            updatedAt: Date.now(),
        }
    }

    const [navigationState, setNavigationState] = useState<AgentNavigationState>(getInitialState)
    const [isMounted, setIsMounted] = useState(false)

    // Store resolvePageName in a ref to avoid triggering effects on every render
    const resolvePageNameRef = useRef(resolvePageName)
    resolvePageNameRef.current = resolvePageName

    // Hydration and State Restoration - runs only once on mount
    useEffect(() => {
        setIsMounted(true)
        if (typeof window === "undefined") return

        // 1. Try to restore from session storage
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Verify saved state matches current URL
                const currentPage = resolvePageNameRef.current(window.location.pathname)
                if (parsed.currentPage !== currentPage) {
                    // URL changed since last visit - update state with correct page
                    addLog?.(`Navigation restored but URL changed: ${parsed.currentPage} → ${currentPage}`, "info")
                    setNavigationState({
                        ...parsed,
                        previousPage: parsed.currentPage,
                        currentPage,
                        visitHistory: [...(parsed.visitHistory || []), currentPage],
                        updatedAt: Date.now(),
                    })
                    isRestored.current = true
                    return
                }
                isRestored.current = true
                setNavigationState(parsed)
                return // Found saved state, done
            } catch (e) {
                console.error("Failed to parse navigation state", e)
                addLog?.("Failed to restore navigation state from session", "warn")
            }
        }

        // 2. Fallback to current location if no saved state
        const currentPage = resolvePageNameRef.current(window.location.pathname)
        setNavigationState({
            currentPage,
            previousPage: null,
            visitHistory: [currentPage],
            canGoBack: false,
            canGoForward: false,
            updatedAt: Date.now(),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once on mount

    // Sync state to sessionStorage
    useEffect(() => {
        if (typeof window !== "undefined" && isMounted) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(navigationState))
        }
    }, [navigationState, isMounted])

    // Store logOnce in a ref to avoid triggering effects on every render
    const logOnceRef = useRef(logOnce)
    logOnceRef.current = logOnce

    // Log initialization once (after hydration)
    useEffect(() => {
        if (!hasLogged.current && isMounted) {
            hasLogged.current = true
            if (isRestored.current) {
                logOnceRef.current(`Loaded navigation state from session: ${navigationState.currentPage}`, "success")
            } else {
                logOnceRef.current(`Initialized navigation: ${navigationState.currentPage}`, "info")
            }
        }
    }, [isMounted, navigationState.currentPage])

    // Track navigation changes (Singleton Listener) - runs once on mount
    useEffect(() => {
        if (typeof window === "undefined") return

        startListening()

        const handleLocationChange = () => {
            const newPage = resolvePageNameRef.current(window.location.pathname)

            setNavigationState((prev: AgentNavigationState) => {
                if (prev.currentPage === newPage) return prev

                logOnceRef.current(`Navigation detected: ${prev.currentPage} -> ${newPage}`, "info")
                const newHistory = [...prev.visitHistory, newPage].slice(-5)
                return {
                    ...prev,
                    previousPage: prev.currentPage,
                    currentPage: newPage,
                    visitHistory: newHistory,
                    canGoBack: window.history.length > 1,
                    canGoForward: false, // Hard to detect reliably without wrapper
                    updatedAt: Date.now(),
                }
            })
        }

        listeners.add(handleLocationChange)
        // Initial check
        handleLocationChange()

        return () => {
            listeners.delete(handleLocationChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once on mount - refs keep functions up to date

    const normalizeUrl = (url: string) => {
        try {
            const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost")
            return u.pathname.replace(/\/$/, "") || "/"
        } catch (e) {
            return url.trim().replace(/\/$/, "") || "/"
        }
    }

    const redirectToPage = async (params: { url: string; openInNewTab?: boolean } | string) => {
        // @ts-ignore
        let target = typeof params === "string" ? params : params?.url || params?.path
        const openInNewTab = typeof params === "object" && params?.openInNewTab

        if (!target) return "Error: No target specified."
        target = target.trim()

        if (typeof window === "undefined") return "Navigation queued (SSR)."

        if (openInNewTab) {
            window.open(target, "_blank")
            return `Opening ${target} in new tab...`
        }

        const normalizedTarget = target.toLowerCase().replace(/^\//, "").trim()

        // Handle Back/Forward directly
        if (normalizedTarget === "__back__" || normalizedTarget === "back") {
            addLog?.("Executing history.back()", "success")
            window.history.back()
            // Kickstart Framer router detection for history changes
            setTimeout(() => window.dispatchEvent(new Event('popstate')), 50)
            return "Navigating back..."
        }
        if (normalizedTarget === "__forward__" || normalizedTarget === "forward") {
            addLog?.("Executing history.forward()", "success")
            window.history.forward()
            // Kickstart Framer router detection for history changes
            setTimeout(() => window.dispatchEvent(new Event('popstate')), 50)
            return "Navigating forward..."
        }

        // Validate against registry
        addLog?.(`Redirect target: "${target}" (normalized: "${normalizedTarget}")`, "info")
        addLog?.(`Registry entries: ${linkRegistry.length}`, "info")

        const entry = linkRegistry.find(
            (l) =>
                l.name.toLowerCase().trim() === normalizedTarget ||
                // @ts-ignore
                (l.target || l.path || "").toLowerCase().replace(/^\//, "").trim() === normalizedTarget ||
                // @ts-ignore
                normalizeUrl(l.target || l.path) === normalizeUrl(target)
        )

        if (!entry) {
            const validNames = linkRegistry.map((l) => l.name).join(", ")
            console.warn("Blocked redirect attempt to:", target)
            return `Error: Page "${target}" not found in registry. Valid pages are: ${validNames}.`
        }

        // @ts-ignore
        const finalUrl = entry.target || entry.path

        // Extract hash/anchor from the URL (e.g., "/home#services" -> "#services")
        const hashIndex = finalUrl.indexOf('#')
        const hasAnchor = hashIndex !== -1
        const pathPart = hasAnchor ? finalUrl.substring(0, hashIndex) : finalUrl
        const anchorPart = hasAnchor ? finalUrl.substring(hashIndex) : ''

        const normalizedPath = normalizeUrl(pathPart || '/')
        const currentPath = normalizeUrl(window.location.pathname)

        addLog?.(`Resolved "${target}" to URL: ${finalUrl} (path: ${pathPart}, anchor: ${anchorPart})`, "info")

        // Helper function to scroll to anchor element
        const scrollToAnchor = (hash: string) => {
            if (!hash || hash === '#') return

            const elementId = hash.replace('#', '')
            addLog?.(`Scrolling to anchor: #${elementId}`, "info")

            // Try multiple times with increasing delays (Framer may need time to render)
            const attemptScroll = (attempt: number) => {
                const element = document.getElementById(elementId) ||
                    document.querySelector(`[data-framer-name="${elementId}"]`) ||
                    document.querySelector(`[name="${elementId}"]`)

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    addLog?.(`✅ Scrolled to #${elementId}`, "success")
                    // Also update the URL hash
                    if (window.location.hash !== hash) {
                        window.history.replaceState(null, '', hash)
                    }
                } else if (attempt < 5) {
                    // Retry after a delay (Framer pages may load elements asynchronously)
                    setTimeout(() => attemptScroll(attempt + 1), 100 * attempt)
                } else {
                    addLog?.(`⚠️ Could not find anchor element: #${elementId}`, "warn")
                }
            }

            // Start scroll attempts after a small delay to let the page settle
            setTimeout(() => attemptScroll(1), 50)
        }

        // If it's an anchor-only link on the SAME page, just scroll
        if (hasAnchor && (pathPart === '' || currentPath === normalizedPath)) {
            addLog?.(`Same-page anchor navigation to ${anchorPart}`, "info")
            scrollToAnchor(anchorPart)
            return `Scrolling to ${anchorPart}...`
        }

        // If we're already on this page (and no anchor), no need to navigate
        if (!hasAnchor && currentPath === normalizedPath) {
            addLog?.(`Ignored redirect to current page: ${finalUrl}`, "info")
            return `User is already on the ${entry.name} page.`
        }

        if (finalUrl.startsWith("http")) {
            window.location.assign(finalUrl)
            return `Navigating to external URL: ${finalUrl}`
        }

        // Navigate to the page first
        let navigated = false

        // PRIMARY METHOD: Click Simulation
        // Instead of calling router.navigate(), find and click the actual link element.
        // This is the most reliable method because it uses Framer's built-in navigation.
        const tryClickNavigation = () => {
            // Try multiple selectors to find the link
            const selectors = [
                `a[href="${pathPart}"]`,
                `a[href="${pathPart}/"]`,
                `a[href="${normalizedPath}"]`,
                `a[href*="${pathPart}"]`
            ]

            for (const selector of selectors) {
                const links = document.querySelectorAll(selector)
                if (links.length > 0) {
                    const link = links[0] as HTMLElement
                    addLog?.(`✅ Found link element, clicking: ${selector}`, "success")
                    link.click()
                    return true
                }
            }
            return false
        }

        const clickSuccess = tryClickNavigation()
        if (clickSuccess) {
            navigated = true
            addLog?.(`Navigation via click simulation successful`, "success")
            // Still scroll to anchor if present
            if (hasAnchor) {
                setTimeout(() => scrollToAnchor(anchorPart), 300)
            }
            return `Navigating to ${finalUrl}...`
        }

        // FALLBACK: Router API (if click simulation fails)
        if (router && router.routes) {
            addLog?.(`Click simulation failed, trying router.navigate...`, "info")
            let foundRouteId = null
            for (const [routeId, routeConfig] of Object.entries(router.routes)) {
                // @ts-ignore
                const routePath = routeConfig.path || ""
                if (normalizeUrl(routePath) === normalizedPath) {
                    foundRouteId = routeId
                    break
                }
            }

            if (foundRouteId) {
                addLog?.(`Using Framer router.navigate(${foundRouteId})`, "info")
                try {
                    router.navigate(foundRouteId)
                } catch (e) {
                    addLog?.(`Router.navigate failed: ${e}`, "warn")
                }
                navigated = true

                // IMMEDIATE popstate dispatch - don't wait for Framer to maybe pick it up
                window.dispatchEvent(new PopStateEvent('popstate', { state: { path: pathPart || '/' } }))

                // Verification: Check if router.navigate actually rendered the page
                const urlBefore = window.location.href
                const getPageIdentifier = () => {
                    // Try to get Framer's current page identifier
                    const framerPage = document.querySelector('[data-framer-page], [data-framer-name]')
                    return framerPage?.getAttribute('data-framer-page') ||
                        framerPage?.getAttribute('data-framer-name') ||
                        document.title
                }
                const contentBefore = getPageIdentifier()

                setTimeout(() => {
                    const urlAfter = window.location.href
                    const contentAfter = getPageIdentifier()

                    addLog?.(`Navigation check: URL ${urlBefore} -> ${urlAfter}, content: "${contentBefore}" -> "${contentAfter}"`, "info")

                    // If URL changed but content is still the same, try additional soft navigation methods
                    if (urlAfter.includes(normalizedPath) && contentAfter === contentBefore) {
                        addLog?.(`⚠️ Zombie Navigation detected - URL changed but page didn't render`, "warn")

                        // AGGRESSIVE RETRY: Force navigation with pushState + event flooding
                        addLog?.(`Attempting aggressive retry with pushState + event flooding`, "info")
                        window.history.pushState({ path: pathPart || '/' }, '', pathPart || '/')

                        // Flood with multiple event types immediately
                        window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
                        window.dispatchEvent(new Event('popstate'))
                        window.dispatchEvent(new PopStateEvent('popstate', { state: { path: pathPart || '/' } }))

                        // Delayed retries
                        setTimeout(() => {
                            window.dispatchEvent(new Event('popstate'))
                            window.dispatchEvent(new PopStateEvent('popstate', { state: { path: pathPart || '/' } }))
                        }, 100)

                        // Final verification after 500ms total
                        setTimeout(() => {
                            const finalContent = getPageIdentifier()
                            if (finalContent === contentBefore) {
                                addLog?.(`⚠️ Zombie navigation persists. Attempting extended retry (NO page reload)...`, "warn")

                                // CRITICAL: Never use location.assign() - it causes full page reload and kills agent session
                                let retryCount = 0
                                const maxRetries = 10

                                const continuousRetry = () => {
                                    retryCount++

                                    // Try all event signatures + re-calling router
                                    window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
                                    window.dispatchEvent(new Event('popstate'))
                                    window.dispatchEvent(new PopStateEvent('popstate', { state: { path: pathPart || '/' } }))
                                    window.dispatchEvent(new Event('hashchange'))

                                    if (router && typeof router.navigate === 'function') {
                                        try { router.navigate(foundRouteId) } catch (e) { }
                                    }

                                    const currentContent = getPageIdentifier()
                                    if (currentContent !== contentBefore) {
                                        addLog?.(`✅ Extended retry successful after ${retryCount} attempts!`, "success")
                                        return
                                    }

                                    if (retryCount < maxRetries) {
                                        setTimeout(continuousRetry, 200)
                                    } else {
                                        addLog?.(`⚠️ Navigation zombie - URL updated but page didn't render. Session preserved (no reload).`, "warn")
                                    }
                                }

                                continuousRetry()

                            } else {
                                addLog?.(`✅ Retry successful - page rendered after aggressive retry`, "success")
                            }
                        }, 500)
                    } else {
                        addLog?.(`✅ Navigation successful`, "success")
                    }
                }, 400)
            } else {
                addLog?.(`⚠️ No matching route found in Framer router, falling back to History API`, "warn")
            }
        } else {
            addLog?.(`⚠️ Framer router not available (router: ${!!router}, routes: ${!!(router && router.routes)})`, "warn")
        }

        if (!navigated) {
            // Fallback: History API (if router fails/missing)
            // Use pushState + popstate for soft navigation (preserves agent session)
            addLog?.(`Using History API fallback: pushState(${pathPart || '/'})`, "info")
            window.history.pushState({ path: pathPart || '/' }, "", pathPart || '/')
            window.dispatchEvent(new PopStateEvent('popstate', { state: { path: pathPart || '/' } }))

            // Dispatch additional popstate events as Framer may need multiple triggers
            setTimeout(() => {
                window.dispatchEvent(new Event('popstate'))
            }, 50)
            setTimeout(() => {
                window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
            }, 100)
        }

        // If there's an anchor, scroll to it after navigation completes
        if (hasAnchor) {
            // Wait for page to load/render before scrolling
            setTimeout(() => scrollToAnchor(anchorPart), 300)
        }

        return `Navigating to ${finalUrl}...`
    }

    return { redirectToPage, navigationState }
}


// --- BUNDLED: hooks/useScribe.ts ---

interface SpeechInputData {
    transcript: string
    isFinal?: boolean
}

interface UseScribeProps {
    agentId?: string // New Primary Auth
    getToken?: () => Promise<string>
    apiKey?: string
    onStart?: () => void
    onStop?: () => void
    onChange?: (data: SpeechInputData) => void
    onError?: (error: Error) => void
    modelId?: string
    languageCode?: string
}

function useScribe({
    agentId,
    getToken,
    apiKey,
    onStart,
    onStop,
    onChange,
    onError,
    modelId = "scribe_v2_realtime", // Only used for Scribe fallback
}: UseScribeProps) {
    const [isConnecting, setIsConnecting] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [transcript, setTranscript] = useState("")

    const socketRef = useRef<WebSocket | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const stopRecording = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }

        setIsConnected(false)
        setIsConnecting(false)
        onStop?.()
    }, [onStop])

    const startRecording = useCallback(async () => {
        try {
            setIsConnecting(true)

            // 2. Setup Audio
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            let wsUrl: URL

            if (agentId) {
                // --- AGENT MODE ---
                // Connect to Conversational Agent API
                wsUrl = new URL(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`)
            } else {
                // --- SCRIBE MODE ---
                let token = ""
                if (getToken) {
                    token = await getToken()
                } else if (!apiKey) {
                    throw new Error("No authentication provided (agentId, getToken, or apiKey)")
                }

                wsUrl = new URL(`wss://api.elevenlabs.io/v1/speech-to-text/stream`)
                if (token) wsUrl.searchParams.append("token", token)
                else if (apiKey) wsUrl.searchParams.append("xi-api-key", apiKey)

                wsUrl.searchParams.append("model_id", modelId)
            }

            const socket = new WebSocket(wsUrl.toString())
            socketRef.current = socket

            socket.onopen = () => {
                setIsConnecting(false)
                setIsConnected(true)
                onStart?.()

                // Start MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "audio/webm;codecs=opus",
                })
                mediaRecorderRef.current = mediaRecorder

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                        // Protocol difference: Agent might expect JSON wrapping or binary
                        // ConvAI usually accepts binary audio chunks directly for user input.
                        if (socket.readyState === WebSocket.OPEN) {

                            // For Agent, we often send a specific initial "start" frame, but strictly speaking 
                            // binary chunks often auto-start the session or are accepted.
                            // However, let's just send binary for both for simplicity unless protocol differs.
                            // Scribe: Binary OK.
                            // Agent: Binary OK (user audio).

                            socket.send(event.data)
                        }
                    }
                }

                mediaRecorder.start(100) // 100ms chunks
            }

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    if (agentId) {
                        // --- AGENT RESPONSE HANDLING ---
                        // We are looking for user_transcription events
                        if (data.type === "user_transcription") {
                            const text = data.user_transcription_event?.user_transcription
                            // Also look for "is_final" logic if available, usually implicitly final in some events
                            // but partials can come too.
                            if (text) {
                                setTranscript(text)
                                onChange?.({ transcript: text, isFinal: false }) // Agent usually sends accumulating partials?
                            }
                        }
                        // Ignore agent_response (audio) - we are just inputting.
                        // Ideally we would send a configuration to mute the agent, 
                        // but if we just don't play the audio blob, it works for this "Input" component use case.
                    } else {
                        // --- SCRIBE RESPONSE HANDLING ---
                        if (data.type === "transcription" || data.text) {
                            const text = data.text || data.transcription
                            if (text) {
                                setTranscript(prev => {
                                    onChange?.({ transcript: text, isFinal: data.is_final })
                                    return text
                                })
                            }
                        }
                    }
                } catch (e) {
                    // Ignore non-JSON
                }
            }

            socket.onerror = (event) => {
                console.error("WebSocket Error", event)
                onError?.(new Error("WebSocket connection error"))
                stopRecording()
            }

            socket.onclose = () => {
                stopRecording()
            }

        } catch (err: any) {
            console.error("Connection Failed", err)
            setIsConnecting(false)
            setIsConnected(false)
            onError?.(err)
        }
    }, [agentId, apiKey, getToken, modelId, onStart, onChange, onError, stopRecording])

    // Cleanup
    useEffect(() => {
        return () => {
            stopRecording()
        }
    }, [])

    return {
        isConnecting,
        isConnected,
        start: startRecording,
        stop: stopRecording,
        transcript,
        cancel: () => {
            setTranscript("")
            stopRecording()
        }
    }
}


// --- BUNDLED: Visualizers/ShimmeringText.tsx ---
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
function ShimmeringText({
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


// --- BUNDLED: Visualizers/AudioHeatmap.tsx ---
/**
 * Audio-Reactive Heatmap Shader - Framer Component (Self-Contained)
 * Based on Paper Design's heatmap shader
 * Responds to voice audio from ElevenLabs via CustomEvent
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */


// ============================================
// Heatmap Fragment Shader (from Paper Shaders)
// ============================================

const MAX_COLOR_COUNT = 10

const heatmapFragmentShader = `#version 300 es
precision highp float;

in mediump vec2 v_imageUV;
in mediump vec2 v_objectUV;
out vec4 fragColor;

uniform sampler2D u_image;
uniform float u_time;
uniform mediump float u_imageAspectRatio;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${MAX_COLOR_COUNT}];
uniform float u_colorsCount;

uniform float u_angle;
uniform float u_noise;
uniform float u_innerGlow;
uniform float u_outerGlow;
uniform float u_contour;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

float getImgFrame(vec2 uv, float th) {
  float frame = 1.;
  frame *= smoothstep(0., th, uv.y);
  frame *= 1. - smoothstep(1. - th, 1., uv.y);
  frame *= smoothstep(0., th, uv.x);
  frame *= 1. - smoothstep(1. - th, 1., uv.x);
  return frame;
}

float circle(vec2 uv, vec2 c, vec2 r) {
  return 1. - smoothstep(r[0], r[1], length(uv - c));
}

float lst(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

float sst(float edge0, float edge1, float x) {
  return smoothstep(edge0, edge1, x);
}

float shadowShape(vec2 uv, float t, float contour) {
  vec2 scaledUV = uv;
  float posY = mix(-1., 2., t);
  scaledUV.y -= .5;
  float mainCircleScale = sst(0., .8, posY) * lst(1.4, .9, posY);
  scaledUV *= vec2(1., 1. + 1.5 * mainCircleScale);
  scaledUV.y += .5;
  float innerR = .4;
  float outerR = 1. - .3 * (sst(.1, .2, t) * (1. - sst(.2, .5, t)));
  float s = circle(scaledUV, vec2(.5, posY - .2), vec2(innerR, outerR));
  float shapeSizing = sst(.2, .3, t) * sst(.6, .3, t);
  s = pow(s, 1.4);
  s *= 1.2;
  float topFlattener = 0.;
  {
    float pos = posY - uv.y;
    float edge = 1.2;
    topFlattener = lst(-.4, 0., pos) * (1. - sst(.0, edge, pos));
    topFlattener = pow(topFlattener, 3.);
    float topFlattenerMixer = (1. - sst(.0, .3, pos));
    s = mix(topFlattener, s, topFlattenerMixer);
  }
  {
    float visibility = sst(.6, .7, t) * (1. - sst(.8, .9, t));
    float angle = -2. -t * TWO_PI;
    float rightCircle = circle(uv, vec2(.95 - .2 * cos(angle), .4 - .1 * sin(angle)), vec2(.15, .3));
    rightCircle *= visibility;
    s = mix(s, 0., rightCircle);
  }
  {
    float topCircle = circle(uv, vec2(.5, .19), vec2(.05, .25));
    topCircle += 2. * contour * circle(uv, vec2(.5, .19), vec2(.2, .5));
    float visibility = .55 * sst(.2, .3, t) * (1. - sst(.3, .45, t));
    topCircle *= visibility;
    s = mix(s, 0., topCircle);
  }
  float leafMask = circle(uv, vec2(.53, .13), vec2(.08, .19));
  leafMask = mix(leafMask, 0., 1. - sst(.4, .54, uv.x));
  leafMask = mix(0., leafMask, sst(.0, .2, uv.y));
  leafMask *= (sst(.5, 1.1, posY) * sst(1.5, 1.3, posY));
  s += leafMask;
  {
    float visibility = sst(.0, .4, t) * (1. - sst(.6, .8, t));
    s = mix(s, 0., visibility * circle(uv, vec2(.52, .92), vec2(.09, .25)));
  }
  {
    float pos = sst(.0, .6, t) * (1. - sst(.6, 1., t));
    s = mix(s, .5, circle(uv, vec2(.0, 1.2 - .5 * pos), vec2(.1, .3)));
    s = mix(s, .0, circle(uv, vec2(1., .5 + .5 * pos), vec2(.1, .3)));
    s = mix(s, 1., circle(uv, vec2(.95, .2 + .2 * sst(.3, .4, t) * sst(.7, .5, t)), vec2(.07, .22)));
    s = mix(s, 1., circle(uv, vec2(.95, .2 + .2 * sst(.3, .4, t) * (1. - sst(.5, .7, t))), vec2(.07, .22)));
    s /= max(1e-4, sst(1., .85, uv.y));
  }
  s = clamp(0., 1., s);
  return s;
}

float blurEdge3x3(sampler2D tex, vec2 uv, vec2 dudx, vec2 dudy, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;
  float w1 = 1.0, w2 = 2.0, w4 = 4.0;
  float norm = 16.0;
  float sum = w4 * centerSample;
  sum += w2 * textureGrad(tex, uv + vec2(0.0, -r.y), dudx, dudy).g;
  sum += w2 * textureGrad(tex, uv + vec2(0.0, r.y), dudx, dudy).g;
  sum += w2 * textureGrad(tex, uv + vec2(-r.x, 0.0), dudx, dudy).g;
  sum += w2 * textureGrad(tex, uv + vec2(r.x, 0.0), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(-r.x, -r.y), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, -r.y), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(-r.x, r.y), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, r.y), dudx, dudy).g;
  return sum / norm;
}

void main() {
  vec2 uv = v_objectUV + .5;
  uv.y = 1. - uv.y;
  vec2 imgUV = v_imageUV;
  imgUV -= .5;
  imgUV *= 0.5; // Adjust crop to be tighter to image
  imgUV += .5;
  float imgSoftFrame = getImgFrame(imgUV, .03);
  vec4 img = texture(u_image, imgUV);
  vec2 dudx = dFdx(imgUV);
  vec2 dudy = dFdy(imgUV);
  if (img.a == 0.) {
    fragColor = u_colorBack;
    return;
  }
  float t = .1 * u_time;
  t -= .3;
  float tCopy = t + 1. / 3.;
  float tCopy2 = t + 2. / 3.;
  t = mod(t, 1.);
  tCopy = mod(tCopy, 1.);
  tCopy2 = mod(tCopy2, 1.);
  vec2 animationUV = imgUV - vec2(.5);
  float angle = -u_angle * PI / 180.;
  float cosA = cos(angle);
  float sinA = sin(angle);
  animationUV = vec2(
    animationUV.x * cosA - animationUV.y * sinA,
    animationUV.x * sinA + animationUV.y * cosA
  ) + vec2(.5);
  float shape = img[0];
  img[1] = blurEdge3x3(u_image, imgUV, dudx, dudy, 8., img[1]);
  float outerBlur = 1. - mix(1., img[1], shape);
  float innerBlur = mix(img[1], 0., shape);
  float contour = mix(img[2], 0., shape);
  outerBlur *= imgSoftFrame;
  float shadow = shadowShape(animationUV, t, innerBlur);
  float shadowCopy = shadowShape(animationUV, tCopy, innerBlur);
  float shadowCopy2 = shadowShape(animationUV, tCopy2, innerBlur);
  float inner = .8 + .8 * innerBlur;
  inner = mix(inner, 0., shadow);
  inner = mix(inner, 0., shadowCopy);
  inner = mix(inner, 0., shadowCopy2);
  inner *= mix(0., 2., u_innerGlow);
  inner += (u_contour * 2.) * contour;
  inner = min(1., inner);
  inner *= (1. - shape);
  float outer = 0.;
  {
    t *= 3.;
    t = mod(t - .1, 1.);
    outer = .9 * pow(outerBlur, .8);
    float y = mod(animationUV.y - t, 1.);
    float animatedMask = sst(.3, .65, y) * (1. - sst(.65, 1., y));
    animatedMask = .5 + animatedMask;
    outer *= animatedMask;
    outer *= mix(0., 5., pow(u_outerGlow, 2.));
    outer *= imgSoftFrame;
  }
  inner = pow(inner, 1.2);
  float heat = clamp(inner + outer, 0., 1.);
  heat += (.005 + .35 * u_noise) * (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453123) - .5);
  float mixer = heat * u_colorsCount;
  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;
  float outerShape = 0.;
  for (int i = 1; i < ${MAX_COLOR_COUNT + 1}; i++) {
    if (i > int(u_colorsCount)) break;
    float m = clamp(mixer - float(i - 1), 0., 1.);
    if (i == 1) {
      outerShape = m;
    }
    vec4 c = u_colors[i - 1];
    c.rgb *= c.a;
    gradient = mix(gradient, c, m);
  }
  vec3 color = gradient.rgb * outerShape;
  float opacity = gradient.a * outerShape;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1.0 - opacity);
  opacity = opacity + u_colorBack.a * (1.0 - opacity);
  color += .02 * (fract(sin(dot(uv + 1., vec2(12.9898, 78.233))) * 43758.5453123) - .5);
  fragColor = vec4(color, opacity);
}
`

// ============================================
// Image Processing for Heatmap
// ============================================

function blurGray(
    gray: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
): Uint8ClampedArray {
    if (radius <= 0) return gray.slice()

    const out = new Uint8ClampedArray(width * height)
    const integral = new Uint32Array(width * height)

    for (let y = 0; y < height; y++) {
        let rowSum = 0
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const v = gray[idx] ?? 0
            rowSum += v
            integral[idx] = rowSum + (y > 0 ? (integral[idx - width] ?? 0) : 0)
        }
    }

    for (let y = 0; y < height; y++) {
        const y1 = Math.max(0, y - radius)
        const y2 = Math.min(height - 1, y + radius)
        for (let x = 0; x < width; x++) {
            const x1 = Math.max(0, x - radius)
            const x2 = Math.min(width - 1, x + radius)
            const idxA = y2 * width + x2
            const idxB = y2 * width + (x1 - 1)
            const idxC = (y1 - 1) * width + x2
            const idxD = (y1 - 1) * width + (x1 - 1)
            const A = integral[idxA] ?? 0
            const B = x1 > 0 ? (integral[idxB] ?? 0) : 0
            const C = y1 > 0 ? (integral[idxC] ?? 0) : 0
            const D = x1 > 0 && y1 > 0 ? (integral[idxD] ?? 0) : 0
            const sum = A - B - C + D
            const area = (x2 - x1 + 1) * (y2 - y1 + 1)
            out[y * width + x] = Math.round(sum / area)
        }
    }
    return out
}

function multiPassBlurGray(
    gray: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
    passes: number
): Uint8ClampedArray {
    if (radius <= 0 || passes <= 1) {
        return blurGray(gray, width, height, radius)
    }
    let input = gray
    let tmp = gray
    for (let p = 0; p < passes; p++) {
        tmp = blurGray(input, width, height, radius)
        input = tmp
    }
    return tmp
}

async function toProcessedHeatmap(file: string): Promise<{ blob: Blob }> {
    const canvas = document.createElement("canvas")
    const canvasSize = 1000

    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = "anonymous"

        image.addEventListener("load", () => {
            // Check if SVG - handle Framer CDN URLs that may contain svg in path
            const isSvg = file.endsWith(".svg") || file.toLowerCase().includes("svg") || file.includes(".svg")
            if (isSvg) {
                image.width = canvasSize
                image.height = canvasSize
            }

            const naturalWidth = image.naturalWidth || image.width || canvasSize
            const naturalHeight = image.naturalHeight || image.height || canvasSize
            const ratio = naturalWidth / naturalHeight
            const maxBlur = Math.floor(canvasSize * 0.15)
            const padding = Math.ceil(maxBlur * 2.5)

            let imgWidth = canvasSize
            let imgHeight = canvasSize
            if (ratio > 1) {
                imgHeight = Math.floor(canvasSize / ratio)
            } else {
                imgWidth = Math.floor(canvasSize * ratio)
            }

            canvas.width = imgWidth + 2 * padding
            canvas.height = imgHeight + 2 * padding

            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (!ctx) {
                reject(new Error("Failed to get canvas 2d context"))
                return
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(image, padding, padding, imgWidth, imgHeight)

            const { width, height } = canvas
            const srcImageData = ctx.getImageData(0, 0, width, height)
            const src = srcImageData.data
            const totalPixels = width * height

            const gray = new Uint8ClampedArray(totalPixels)
            for (let i = 0; i < totalPixels; i++) {
                const px = i * 4
                const r = src[px] ?? 0
                const g = src[px + 1] ?? 0
                const b = src[px + 2] ?? 0
                const a = src[px + 3] ?? 0
                const lum = 0.299 * r + 0.587 * g + 0.114 * b
                const alpha = a / 255
                const compositeLum = lum * alpha + 255 * (1 - alpha)
                gray[i] = Math.round(compositeLum)
            }

            const bigBlurRadius = maxBlur
            const innerBlurRadius = Math.max(1, Math.round(0.12 * maxBlur))
            const contourRadius = 5

            const bigBlurGray = multiPassBlurGray(
                gray,
                width,
                height,
                bigBlurRadius,
                3
            )
            const innerBlurGray = multiPassBlurGray(
                gray,
                width,
                height,
                innerBlurRadius,
                3
            )
            const contourGray = multiPassBlurGray(
                gray,
                width,
                height,
                contourRadius,
                1
            )

            const processedImageData = ctx.createImageData(width, height)
            const dst = processedImageData.data

            for (let i = 0; i < totalPixels; i++) {
                const px = i * 4
                dst[px] = contourGray[i] ?? 0
                dst[px + 1] = bigBlurGray[i] ?? 0
                dst[px + 2] = innerBlurGray[i] ?? 0
                dst[px + 3] = 255
            }

            ctx.putImageData(processedImageData, 0, 0)

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Failed to create PNG blob"))
                    return
                }
                resolve({ blob })
            }, "image/png")
        })

        image.addEventListener("error", () => {
            reject(new Error("Failed to load image"))
        })

        image.src = file
    })
}

// ============================================
// Vertex Shader
// ============================================

const vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;

uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_imageUV;

void main() {
    gl_Position = a_position;

    vec2 uv = gl_Position.xy * 0.5;
    vec2 boxOrigin = vec2(0.5 - u_originX, u_originY - 0.5);
    
    float r = u_rotation * 3.14159265358979323846 / 180.0;
    mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
    vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

    v_objectUV = uv;
    v_objectUV += graphicOffset;
    v_objectUV /= u_scale;
    v_objectUV = graphicRotation * v_objectUV;

    // Calculate canvas aspect ratio
    float canvasAspectRatio = u_resolution.x / u_resolution.y;
    
    vec2 imageBoxSize;
    if (u_fit == 1.0) {
        // CONTAIN: fit entire image inside canvas, maintain aspect ratio
        if (u_imageAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas
            imageBoxSize.x = u_resolution.x;
            imageBoxSize.y = u_resolution.x / u_imageAspectRatio;
        } else {
            // Image is taller than canvas
            imageBoxSize.y = u_resolution.y;
            imageBoxSize.x = u_resolution.y * u_imageAspectRatio;
        }
    } else if (u_fit == 2.0) {
        // COVER: fill canvas, crop image if needed, maintain aspect ratio
        if (u_imageAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas
            imageBoxSize.y = u_resolution.y;
            imageBoxSize.x = u_resolution.y * u_imageAspectRatio;
        } else {
            // Image is taller than canvas
            imageBoxSize.x = u_resolution.x;
            imageBoxSize.y = u_resolution.x / u_imageAspectRatio;
        }
    } else {
        // FILL: stretch to fill canvas (no aspect ratio preservation)
        imageBoxSize = u_resolution;
    }
    vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

    v_imageUV = uv;
    v_imageUV *= imageBoxScale;
    v_imageUV += boxOrigin * (imageBoxScale - 1.0);
    v_imageUV += graphicOffset;
    v_imageUV /= u_scale;
    v_imageUV.x *= u_imageAspectRatio;
    v_imageUV = graphicRotation * v_imageUV;
    v_imageUV.x /= u_imageAspectRatio;

    v_imageUV += 0.5;
    v_imageUV.y = 1.0 - v_imageUV.y;
}`

// ============================================
// Shader Mount Class
// ============================================

class HeatmapShaderMount {
    private parentElement: HTMLElement
    private canvasElement: HTMLCanvasElement
    private gl: WebGL2RenderingContext
    private program: WebGLProgram | null = null
    private uniformLocations: Record<string, WebGLUniformLocation | null> = {}
    private rafId: number | null = null
    private lastRenderTime = 0
    private currentFrame = 0
    private speed = 1
    private hasBeenDisposed = false
    private textures: Map<string, WebGLTexture> = new Map()
    private textureUnitMap: Map<string, number> = new Map()

    constructor(parentElement: HTMLElement, isCanvas = false) {
        this.parentElement = parentElement

        const canvasElement = document.createElement("canvas")
        this.canvasElement = canvasElement
        this.parentElement.prepend(canvasElement)

        canvasElement.style.position = "absolute"
        canvasElement.style.top = "50%"
        canvasElement.style.left = "50%"
        canvasElement.style.transform = "translate(-50%, -50%)"
        canvasElement.style.aspectRatio = "1 / 1"
        canvasElement.style.width = "100%"
        canvasElement.style.height = "auto"
        canvasElement.style.maxWidth = "100%"
        canvasElement.style.maxHeight = "100%"
        canvasElement.style.objectFit = "contain"
        canvasElement.style.backgroundColor = "transparent"

        // Ensure parent is also transparent
        this.parentElement.style.background = "transparent"

        // In canvas mode (Framer preview), show immediately at full opacity
        // In preview mode, use fade-in animation
        if (isCanvas) {
            canvasElement.style.opacity = "1"
        } else {
            canvasElement.style.opacity = "0"
            canvasElement.style.transition =
                "opacity 0.8s cubic-bezier(0.33, 1, 0.68, 1)"

            // Trigger fade-in after a delay to layer with container animation
            setTimeout(() => {
                canvasElement.style.opacity = "1"
            }, 200)
        }

        // Add WebGL context loss handling
        canvasElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault()
            console.warn("[HeatmapShader] WebGL context lost")
            this.stop()
        })

        canvasElement.addEventListener("webglcontextrestored", () => {
            console.log("[HeatmapShader] WebGL context restored")
            this.initProgram()
            this.setupPositionAttribute()
            this.setupUniforms()
            this.start()
        })

        const gl = canvasElement.getContext("webgl2", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        })

        if (!gl) {
            console.error("[HeatmapShader] WebGL2 not supported")
            throw new Error(
                "WebGL2 is not supported. Please use a modern browser."
            )
        }

        console.log("[HeatmapShader] WebGL2 context created successfully")
        this.gl = gl

        // Set default clear color to transparent (will be updated when uniforms are set)
        gl.clearColor(0, 0, 0, 0)

        // Enable blending for proper transparency
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        this.initProgram()
        this.setupPositionAttribute()
        this.setupUniforms()
        this.setupResizeObserver()
    }

    private initProgram() {
        const gl = this.gl

        console.log("[HeatmapShader] Compiling vertex shader...")
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        if (!vertexShader) {
            console.error("[HeatmapShader] Failed to create vertex shader")
            return
        }
        gl.shaderSource(vertexShader, vertexShaderSource)
        gl.compileShader(vertexShader)

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(vertexShader)
            console.error(
                "[HeatmapShader] Vertex shader compilation error:",
                error
            )
            throw new Error(`Vertex shader error: ${error}`)
        }

        console.log("[HeatmapShader] Compiling fragment shader...")
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        if (!fragmentShader) {
            console.error("[HeatmapShader] Failed to create fragment shader")
            return
        }
        gl.shaderSource(fragmentShader, heatmapFragmentShader)
        gl.compileShader(fragmentShader)

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(fragmentShader)
            console.error(
                "[HeatmapShader] Fragment shader compilation error:",
                error
            )
            throw new Error(`Fragment shader error: ${error}`)
        }

        console.log("[HeatmapShader] Linking shader program...")
        const program = gl.createProgram()
        if (!program) {
            console.error("[HeatmapShader] Failed to create program")
            return
        }
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program)
            console.error("[HeatmapShader] Program link error:", error)
            throw new Error(`Program link error: ${error}`)
        }

        console.log(
            "[HeatmapShader] Shader program compiled and linked successfully"
        )
        this.program = program

        gl.detachShader(program, vertexShader)
        gl.detachShader(program, fragmentShader)
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
    }

    private setupPositionAttribute() {
        const gl = this.gl
        const positionAttributeLocation = gl.getAttribLocation(
            this.program!,
            "a_position"
        )
        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

        const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW
        )
        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        )
    }

    private setupUniforms() {
        const gl = this.gl
        if (!this.program) return

        const uniformNames = [
            "u_time",
            "u_resolution",
            "u_pixelRatio",
            "u_imageAspectRatio",
            "u_originX",
            "u_originY",
            "u_worldWidth",
            "u_worldHeight",
            "u_fit",
            "u_scale",
            "u_rotation",
            "u_offsetX",
            "u_offsetY",
            "u_image",
            "u_colorBack",
            "u_colors",
            "u_colorsCount",
            "u_angle",
            "u_noise",
            "u_innerGlow",
            "u_outerGlow",
            "u_contour",
        ]

        for (const name of uniformNames) {
            this.uniformLocations[name] = gl.getUniformLocation(
                this.program,
                name
            )
        }
    }

    private resizeObserver: ResizeObserver | null = null

    private setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(([entry]) => {
            if (entry) {
                this.handleResize(
                    entry.contentRect.width,
                    entry.contentRect.height
                )
            }
        })
        this.resizeObserver.observe(this.parentElement)
    }

    private handleResize(width: number, height: number) {
        const dpr = Math.min(window.devicePixelRatio, 2)

        // Maintain 1:1 aspect ratio for square heatmap
        const canvasAspectRatio = 1
        let canvasWidth = Math.min(width, height)
        let canvasHeight = canvasWidth

        // If calculated height exceeds container height, scale based on height instead
        if (canvasHeight > height) {
            canvasHeight = height
            canvasWidth = height * canvasAspectRatio
        }

        const w = Math.round(canvasWidth * dpr)
        const h = Math.round(canvasHeight * dpr)

        if (this.canvasElement.width !== w || this.canvasElement.height !== h) {
            this.canvasElement.width = w
            this.canvasElement.height = h
            this.gl.viewport(0, 0, w, h)
        }

        this.gl.useProgram(this.program)
        // Use actual canvas dimensions for resolution
        this.gl.uniform2f(this.uniformLocations.u_resolution!, w, h)
        this.gl.uniform1f(this.uniformLocations.u_pixelRatio!, dpr)
        this.render(performance.now())
    }

    setTextureUniform(uniformName: string, image: HTMLImageElement) {
        const gl = this.gl

        if (!this.textureUnitMap.has(uniformName)) {
            this.textureUnitMap.set(uniformName, this.textureUnitMap.size)
        }
        const textureUnit = this.textureUnitMap.get(uniformName)!
        gl.activeTexture(gl.TEXTURE0 + textureUnit)

        const existingTexture = this.textures.get(uniformName)
        if (existingTexture) {
            gl.deleteTexture(existingTexture)
        }

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        )
        gl.generateMipmap(gl.TEXTURE_2D)

        this.textures.set(uniformName, texture!)

        const location = this.uniformLocations[uniformName]
        if (location) {
            gl.uniform1i(location, textureUnit)
        }

        const aspectRatio = image.naturalWidth / image.naturalHeight
        const aspectLocation = this.uniformLocations.u_imageAspectRatio
        if (aspectLocation) {
            gl.uniform1f(aspectLocation, aspectRatio)
        }
    }

    setUniformValues(uniforms: Record<string, any>) {
        const gl = this.gl
        gl.useProgram(this.program)

        for (const [key, value] of Object.entries(uniforms)) {
            if (value === undefined) continue

            const location = this.uniformLocations[key]
            if (!location) continue

            if (value instanceof HTMLImageElement) {
                this.setTextureUniform(key, value)
            } else if (Array.isArray(value)) {
                if (value.length > 0 && Array.isArray(value[0])) {
                    const flat = value.flat()
                    gl.uniform4fv(location, flat)
                } else if (value.length === 4) {
                    gl.uniform4fv(location, value)
                    // Don't update clearColor - keep canvas transparent so container background shows through

                } else if (value.length === 2) {
                    gl.uniform2fv(location, value)
                }
            } else if (typeof value === "number") {
                gl.uniform1f(location, value)
            }
        }
    }

    render = (currentTime: number) => {
        if (this.hasBeenDisposed) return
        if (!this.program) return

        const dt = currentTime - this.lastRenderTime
        this.lastRenderTime = currentTime
        this.currentFrame += dt * this.speed

        const gl = this.gl
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.program)
        gl.uniform1f(this.uniformLocations.u_time!, this.currentFrame * 0.001)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.rafId = requestAnimationFrame(this.render)
    }

    setSpeed(speed: number) {
        this.speed = speed
    }

    start() {
        if (this.rafId === null) {
            this.lastRenderTime = performance.now()
            this.rafId = requestAnimationFrame(this.render)
        }
    }

    stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    dispose() {
        this.hasBeenDisposed = true
        this.stop()
        this.resizeObserver?.disconnect()
        this.textures.forEach((texture) => this.gl.deleteTexture(texture))
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program)
        }
        this.canvasElement.remove()
    }
}

// ============================================
// Color Helper
// ============================================

function hexToVec4(hex: string): [number, number, number, number] {
    // Handle rgba() format
    const rgbaMatch =
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.exec(hex)
    if (rgbaMatch) {
        return [
            parseInt(rgbaMatch[1], 10) / 255,
            parseInt(rgbaMatch[2], 10) / 255,
            parseInt(rgbaMatch[3], 10) / 255,
            rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0,
        ]
    }

    // Handle 8-digit hex (RGBA)
    const rgba8 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
        hex
    )
    if (rgba8) {
        return [
            parseInt(rgba8[1], 16) / 255,
            parseInt(rgba8[2], 16) / 255,
            parseInt(rgba8[3], 16) / 255,
            parseInt(rgba8[4], 16) / 255,
        ]
    }

    // Handle 6-digit hex (RGB)
    const rgb6 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (rgb6) {
        return [
            parseInt(rgb6[1], 16) / 255,
            parseInt(rgb6[2], 16) / 255,
            parseInt(rgb6[3], 16) / 255,
            1.0,
        ]
    }

    // Handle 3-digit hex shorthand
    const rgb3 = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)
    if (rgb3) {
        return [
            parseInt(rgb3[1] + rgb3[1], 16) / 255,
            parseInt(rgb3[2] + rgb3[2], 16) / 255,
            parseInt(rgb3[3] + rgb3[3], 16) / 255,
            1.0,
        ]
    }

    console.warn("[HeatmapShader] Invalid color format:", hex, "using black")
    return [0, 0, 0, 1]
}

// ============================================
// Types
// ============================================

interface AudioHeatmapProps {
    image: string
    colors: string[]
    colorBack: string
    contour: number
    innerGlow: number
    outerGlow: number
    noise: number
    angle: number
    speed: number
    scale: number
    fit: "contain" | "cover" | "fill"
    audioReactivity: number
    bassToInnerGlow: number
    midToOuterGlow: number
    trebleToContour: number
    volumeToAngle: number
    getVolume?: () => number
    width?: number
    height?: number
    isDesignMode?: boolean
    style?: React.CSSProperties
    // className?: string
}

function AudioHeatmap({
    // getVolume,
    image = "https://framerusercontent.com/images/33s7K51323Jz9622k6dKk3yV2s.png",
    colors = ["#11206A", "#1F3BA2", "#2F63E7", "#6BD7FF", "#FFE679", "#FF991E", "#FF4C00"],
    colorBack = "#0d1117",
    scale = 0.6,
    speed = 0.4,
    angle = 30,
    noise = 0,
    innerGlow = 0.3,
    outerGlow = 0.5,
    contour = 0.6,
    fit = "cover",
    style,
    // width,
    // height,
    audioReactivity = 1.2,
    volumeToAngle = 30,
    bassToInnerGlow = 0.5,
    midToOuterGlow = 0.8,
    trebleToContour = 0.3,
    isDesignMode = false,
}: AudioHeatmapProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const shaderRef = React.useRef<HeatmapShaderMount | null>(null)
    const [processedImage, setProcessedImage] = React.useState<HTMLImageElement | null>(null)
    const [isMounted, setIsMounted] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Alias for compatibility with existing logic
    const isCanvas = isDesignMode

    // SSR guard - only run on client
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    // Audio state from ElevenLabs
    const [audioData, setAudioData] = React.useState({
        bass: 0,
        mid: 0,
        treble: 0,
        volume: 0,
    })

    // Track if agent is talking based on volume threshold
    const [isTalking, setIsTalking] = React.useState(false)
    const [shouldScale, setShouldScale] = React.useState(false)
    const scaleDownTimerRef = React.useRef<number | null>(null)

    // Listen for audio data from ElevenLabs component via CustomEvent
    React.useEffect(() => {
        if (typeof window === "undefined") return

        const handleAudioData = (event: CustomEvent) => {
            const detail = event.detail

            // Handle new array format (from BarVisualizer update)
            if (detail.volume && Array.isArray(detail.volume)) {
                const bands = detail.volume as number[]
                const len = bands.length

                // Calculate average volume
                const avgVolume = bands.reduce((sum, v) => sum + v, 0) / len

                // Split into 3 ranges for bass/mid/treble
                const third = Math.floor(len / 3)

                let bass = 0,
                    mid = 0,
                    treble = 0

                if (len > 0) {
                    // Simple average for each third
                    const bassBands = bands.slice(0, third || 1)
                    const midBands = bands.slice(third || 1, (third * 2) || 2)
                    const trebleBands = bands.slice((third * 2) || 2)

                    bass =
                        bassBands.reduce((s, v) => s + v, 0) /
                        (bassBands.length || 1)
                    mid =
                        midBands.reduce((s, v) => s + v, 0) /
                        (midBands.length || 1)
                    treble =
                        trebleBands.reduce((s, v) => s + v, 0) /
                        (trebleBands.length || 1)
                }

                setAudioData({
                    bass,
                    mid,
                    treble,
                    volume: avgVolume,
                })

                setIsTalking(avgVolume > 0.05)
                return
            }

            // Handle legacy object format
            if (
                typeof detail.volume === "number" &&
                typeof detail.bass === "number"
            ) {
                setAudioData({
                    bass: detail.bass,
                    mid: detail.mid,
                    treble: detail.treble,
                    volume: detail.volume,
                })
                setIsTalking(detail.volume > 0.05)
            }
        }

        window.addEventListener(
            "elevenlabs-audio-data",
            handleAudioData as EventListener
        )
        return () => {
            window.removeEventListener(
                "elevenlabs-audio-data",
                handleAudioData as EventListener
            )
        }
    }, [])

    // Handle delayed scale down when agent stops talking
    React.useEffect(() => {
        if (isTalking) {
            // Agent is talking - immediately scale up and cancel any pending scale down
            if (scaleDownTimerRef.current) {
                clearTimeout(scaleDownTimerRef.current)
                scaleDownTimerRef.current = null
            }
            setShouldScale(true)
        } else {
            // Agent stopped talking - wait 2 seconds before scaling down
            scaleDownTimerRef.current = window.setTimeout(() => {
                setShouldScale(false)
            }, 1000)
        }

        return () => {
            if (scaleDownTimerRef.current) {
                clearTimeout(scaleDownTimerRef.current)
            }
        }
    }, [isTalking])

    // Process the image for heatmap effect
    React.useEffect(() => {
        // SSR guard
        if (typeof window === "undefined" || typeof document === "undefined")
            return
        if (!isMounted) return

        let cancelled = false
        setError(null)

        // Generate default image if none provided
        let imageUrl = ""
        if (!image) {
            console.log(
                "[AudioHeatmap] No image provided, generating default base..."
            )
            const canvas = document.createElement("canvas")
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext("2d")
            if (ctx) {
                // Clear
                ctx.clearRect(0, 0, 512, 512)

                // Draw white circle with soft edge
                const cx = 256
                const cy = 256
                const radius = 200

                // Create radial gradient for soft edge
                const grad = ctx.createRadialGradient(
                    cx,
                    cy,
                    radius * 0.5,
                    cx,
                    cy,
                    radius
                )
                grad.addColorStop(0, "rgba(255, 255, 255, 1)")
                grad.addColorStop(0.8, "rgba(255, 255, 255, 0.8)")
                grad.addColorStop(1, "rgba(255, 255, 255, 0)")

                ctx.fillStyle = grad
                ctx.beginPath()
                ctx.arc(cx, cy, radius, 0, Math.PI * 2)
                ctx.fill()

                imageUrl = canvas.toDataURL("image/png")
            }
        } else {
            // Resolve Framer image URL if needed
            imageUrl =
                typeof image === "string" ? image : (image as any)?.src || image
        }

        console.log("[AudioHeatmap] Processing image source...")

        toProcessedHeatmap(imageUrl)
            .then((result) => {
                if (cancelled) return

                const url = URL.createObjectURL(result.blob)
                const img = new Image()
                img.crossOrigin = "anonymous"

                img.onload = () => {
                    if (!cancelled) {
                        console.log(
                            "[AudioHeatmap] Image processed successfully"
                        )
                        setProcessedImage(img)
                    }
                }

                img.onerror = (e) => {
                    console.error(
                        "[AudioHeatmap] Failed to load processed image:",
                        e
                    )
                    setError("Failed to load processed image")
                }

                img.src = url
            })
            .catch((err) => {
                console.error(
                    "[AudioHeatmap] Failed to process heatmap image:",
                    err
                )
                setError(`Failed to process image: ${err.message}`)
            })

        return () => {
            cancelled = true
        }
    }, [image, isMounted])

    // Initialize shader when processed image is ready
    React.useEffect(() => {
        // SSR guard
        if (typeof window === "undefined") return
        if (!isMounted) return

        const container = containerRef.current
        if (!container || !processedImage) return

        try {
            console.log(
                "[AudioHeatmap] Initializing shader...",
                isCanvas ? "(Canvas mode)" : "(Preview mode)"
            )
            const shader = new HeatmapShaderMount(container, isCanvas)
            shaderRef.current = shader
            shader.setSpeed(speed)

            return () => {
                shader.dispose()
            }
        } catch (err: any) {
            console.error("[AudioHeatmap] Failed to initialize shader:", err)
            setError(`Shader error: ${err.message}`)
        }
    }, [processedImage, isMounted, isCanvas, speed])

    // Update uniforms when props or audio data change
    React.useEffect(() => {
        const shader = shaderRef.current
        if (!shader || !processedImage) return

        // Audio-reactive values (disabled on Canvas for static preview)
        const audioMultiplier = isCanvas ? 0 : 1
        const dynamicInnerGlow =
            innerGlow +
            audioData.bass * audioReactivity * bassToInnerGlow * audioMultiplier
        const dynamicOuterGlow =
            outerGlow +
            audioData.volume *
            audioReactivity *
            midToOuterGlow *
            audioMultiplier +
            audioData.mid * audioReactivity * 0.5 * audioMultiplier
        const dynamicContour =
            contour +
            audioData.treble *
            audioReactivity *
            trebleToContour *
            audioMultiplier
        const dynamicAngle =
            angle +
            audioData.volume * audioReactivity * volumeToAngle * audioMultiplier

        if (!isCanvas) {
            shader.setSpeed(
                speed * (1 + audioData.volume * audioReactivity * 0.5)
            )
        }

        // Debug: log background color from Framer


        // Convert fit string to shader value
        const fitValue = fit === "contain" ? 1 : fit === "cover" ? 2 : 0

        shader.setUniformValues({
            u_image: processedImage,
            u_contour: Math.min(1, dynamicContour),
            u_angle: dynamicAngle,
            u_noise: noise,
            u_innerGlow: Math.min(1, dynamicInnerGlow),
            u_outerGlow: Math.min(1, dynamicOuterGlow),
            u_colorBack: hexToVec4(colorBack),
            u_colors: colors.map(hexToVec4),
            u_colorsCount: colors.length,

            // Sizing
            u_fit: fitValue,
            u_offsetX: 0,
            u_offsetY: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_rotation: 0,
            u_scale: scale,
            u_worldWidth: 0,
            u_worldHeight: 0,
        })

        // Start animation in Preview mode after uniforms are set
        if (!isCanvas) {
            shader.start()
            console.log("[AudioHeatmap] Shader animation started (Preview) after uniforms set")
        } else {
            // Update static frame on Canvas when props change
            shader.render(performance.now())
            console.log("[AudioHeatmap] Shader static frame rendered (Canvas)")
        }
    }, [
        processedImage,
        colors,
        colorBack,
        contour,
        innerGlow,
        outerGlow,
        noise,
        angle,
        speed,
        scale,
        fit,
        audioReactivity,
        audioData,
        bassToInnerGlow,
        midToOuterGlow,
        trebleToContour,
        volumeToAngle,
        isCanvas,
    ])

    // Don't render anything on server
    if (!isMounted) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: colorBack,
                    ...style,
                }}
            />
        )
    }

    return (
        <div
            className={`agent-ui`.trim()}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background: colorBack,
                ...style,
            }}
        >
            <motion.div
                ref={containerRef}
                initial={
                    isCanvas
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.8 }
                }
                animate={
                    isCanvas
                        ? { opacity: 1, scale: 1 }
                        : {
                            opacity: processedImage ? 1 : 0,
                            scale: processedImage
                                ? shouldScale
                                    ? 1
                                    : 0.8
                                : 0.8,
                        }
                }
                transition={
                    isCanvas
                        ? { duration: 0 }
                        : {
                            opacity: {
                                duration: 0.8,
                                ease: [0.33, 1, 0.68, 1],
                                delay: 0.1,
                            },
                            scale: {
                                duration: 0.8,
                                ease: [0.33, 1, 0.68, 1],
                            },
                        }
                }
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "transparent",
                }}
            >
                {error && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "#ff4444",
                            fontSize: "12px",
                            textAlign: "center",
                            padding: "8px",
                            zIndex: 1000,
                        }}
                    >
                        {error}
                    </div>
                )}
            </motion.div>
        </div>
    )
}


// --- BUNDLED: Chat/components/icons.tsx ---

const IconSend = ({ size = 18, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
)

const IconMic = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
)

const IconMicOff = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
)

const IconEnd = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <rect x="9" y="9" width="6" height="6"></rect>
    </svg>
)

const IconWaveform = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 12h2"></path>
        <path d="M6 8v8"></path>
        <path d="M10 6v12"></path>
        <path d="M14 4v16"></path>
        <path d="M18 6v12"></path>
        <path d="M22 8v8"></path>
    </svg>
)

const IconDisconnect = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
        <line x1="23" y1="1" x2="1" y2="23"></line>
    </svg>
)

const IconCopy = ({ size = 14, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
)

const IconCheck = ({ size = 14, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
)

const IconKeyboard = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
        <line x1="6" y1="8" x2="6.01" y2="8"></line>
        <line x1="10" y1="8" x2="10.01" y2="8"></line>
        <line x1="14" y1="8" x2="14.01" y2="8"></line>
        <line x1="18" y1="8" x2="18.01" y2="8"></line>
        <line x1="8" y1="12" x2="8.01" y2="12"></line>
        <line x1="12" y1="12" x2="12.01" y2="12"></line>
        <line x1="16" y1="12" x2="16.01" y2="12"></line>
        <line x1="7" y1="16" x2="17" y2="16"></line>
    </svg>
)

const IconClose = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
)



// --- BUNDLED: Chat/components/IconButton.tsx ---

/**
 * IconButton - Unified button component with Shadcn/UI colors
 * 
 * Supports multiple variants (default, secondary, outline, ghost, destructive)
 * and sizes (sm, md). Includes keyboard-only focus rings and Framer Motion animations.
 */

type IconButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive"
type IconButtonSize = "sm" | "md" | "lg"

interface IconButtonProps {
    variant: IconButtonVariant
    size?: IconButtonSize
    disabled?: boolean
    "aria-label": string
    onClick?: () => void
    children: React.ReactNode
    withEntryAnimation?: boolean
    focusRingColor?: string
    /** Custom background color - overrides variant style */
    backgroundColor?: string
    /** Custom text/icon color - overrides variant style */
    textColor?: string
}


const IconButton = React.memo(React.forwardRef<HTMLButtonElement, IconButtonProps>((
    {
        variant,
        size = "md",
        disabled = false,
        "aria-label": ariaLabel,
        onClick,
        children,
        withEntryAnimation = false,
        focusRingColor = "rgba(255,255,255,0.4)",
        backgroundColor,
        textColor,
    },
    ref
) => {
    const [isKeyboardFocus, setIsKeyboardFocus] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    // Track if touch already handled the click (prevents double-fire on mobile)
    const touchHandledRef = React.useRef(false)

    // Blur button and clear focus ring when it becomes disabled
    React.useEffect(() => {
        if (disabled && buttonRef.current) {
            // Always clear outline styles when disabled
            buttonRef.current.style.outline = "none"
            buttonRef.current.style.outlineOffset = "0"
            // Blur if currently focused
            if (document.activeElement === buttonRef.current) {
                buttonRef.current.blur()
            }
            // Reset keyboard focus state
            setIsKeyboardFocus(false)
        }
    }, [disabled])

    const sizeConfig = size === "sm"
        ? { size: 28, radius: "6px" }
        : size === "lg"
            ? { size: 48, radius: "24px" }
            : { size: 32, radius: "50%" }

    /**
     * Shadcn/UI Dark Theme Color Tokens
     * Based on the Zinc dark palette from shadcn/ui theming docs
     * 
     * Semantic tokens:
     * - primary/primary-foreground: Main action buttons
     * - secondary/secondary-foreground: Secondary actions  
     * - muted/muted-foreground: Disabled/ghost states
     * - accent/accent-foreground: Hover states
     * - destructive/destructive-foreground: Dangerous actions
     * - ring: Focus ring color
     */
    const shadcnDarkTokens = {
        // Primary: White on near-black (high contrast for main actions)
        primary: "#FAFAFA",           // zinc-50
        primaryForeground: "#18181B", // zinc-900

        // Secondary: Subtle background with muted text
        secondary: "#27272A",         // zinc-800
        secondaryForeground: "#FAFAFA", // zinc-50

        // Muted: For ghost/disabled states
        muted: "#27272A",             // zinc-800  
        mutedForeground: "#A1A1AA",   // zinc-400

        // Accent: For hover states
        accent: "#27272A",            // zinc-800
        accentForeground: "#FAFAFA",  // zinc-50

        // Destructive: Red for dangerous actions
        destructive: "#DC2626",       // red-600
        destructiveForeground: "#FAFAFA", // zinc-50

        // Border and ring
        border: "#27272A",            // zinc-800
        ring: "#D4D4D8",              // zinc-300 (visible focus ring)
    }

    // Button variant styles following Shadcn/UI patterns
    const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
        default: {
            backgroundColor: shadcnDarkTokens.primary,
            color: shadcnDarkTokens.primaryForeground,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
        secondary: {
            backgroundColor: shadcnDarkTokens.secondary,
            color: shadcnDarkTokens.secondaryForeground,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
        outline: {
            backgroundColor: "transparent",
            color: shadcnDarkTokens.secondaryForeground,
            border: `1px solid ${shadcnDarkTokens.border}`,
        },
        ghost: {
            backgroundColor: "transparent",
            color: shadcnDarkTokens.mutedForeground,
        },
        destructive: {
            backgroundColor: shadcnDarkTokens.destructive,
            color: shadcnDarkTokens.destructiveForeground,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
    }

    // Hover state - simple opacity reduction
    const hoverStyle = { opacity: 0.9 }

    return (
        <motion.button
            ref={(node) => {
                buttonRef.current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
            }}
            initial={withEntryAnimation ? { opacity: 0, scale: 0.8 } : undefined}
            animate={withEntryAnimation ? { opacity: disabled ? 0.3 : 1, scale: 1 } : undefined}
            exit={withEntryAnimation ? { opacity: 0 } : undefined}
            transition={withEntryAnimation ? buttonEntryTransition : undefined}
            whileHover={disabled ? undefined : hoverStyle}
            whileTap={disabled ? undefined : { scale: 0.95, transition: buttonTapTransition }}
            onClick={(e) => {
                // Prevent double-fire: if touch handled this, skip onClick
                if (disabled || touchHandledRef.current) return
                onClick?.()
            }}
            onTouchStart={(e) => {
                // Stop touch propagation immediately to prevent event from reaching
                // elements that appear/animate into the touch area
                e.stopPropagation()
                // Mark that touch is handling this interaction
                touchHandledRef.current = true
            }}
            onTouchEnd={(e) => {
                // Mobile: ensure touch triggers click even during animations
                // preventDefault stops the synthetic click that would fire ~300ms later
                // stopPropagation prevents touch from bubbling to other elements
                // (fixes session restart when end button animates away and mic button appears)
                e.preventDefault()
                e.stopPropagation()
                if (!disabled && onClick) {
                    onClick()
                }
                // Reset touch tracking after a short delay (allow for any queued events)
                setTimeout(() => { touchHandledRef.current = false }, 50)
            }}
            onMouseDown={() => setIsKeyboardFocus(false)} // Mouse click = no focus ring
            disabled={disabled}
            type="button" // CRITICAL: Prevents form submission on mobile (buttons default to submit inside forms)
            aria-label={ariaLabel}
            style={{
                width: sizeConfig.size,
                height: sizeConfig.size,
                minWidth: sizeConfig.size,
                minHeight: sizeConfig.size,
                maxWidth: sizeConfig.size,
                maxHeight: sizeConfig.size,
                borderRadius: sizeConfig.radius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.3 : 1,
                padding: 0,
                flexShrink: 0,
                outline: "none", // Remove default browser outline
                border: "none", // Override global CSS hover border
                touchAction: "manipulation", // Remove 300ms tap delay on mobile
                ...variantStyles[variant],
                // Allow custom colors from Framer property controls to override variant styles
                ...(backgroundColor && { backgroundColor }),
                ...(textColor && { color: textColor }),
                // Use box-shadow for focus ring (follows border-radius) - must come after spread
                boxShadow: isKeyboardFocus ? `0 0 0 3px ${focusRingColor}` : (variantStyles[variant].boxShadow || "none"),
            }}
            onFocus={(e) => {
                // Show focus ring only for keyboard navigation (not mouse clicks)
                // We check if mouse was NOT used to reach this element
                if (!e.currentTarget.matches(":focus-visible")) return
                setIsKeyboardFocus(true)
            }}
            onKeyDown={(e) => {
                // Tab key detected - this triggers focus-visible
                if (e.key === "Tab") {
                    setIsKeyboardFocus(true)
                }
            }}
            onBlur={() => {
                setIsKeyboardFocus(false)
            }}
        >
            {children}
        </motion.button>
    )
}))

IconButton.displayName = "IconButton"


// --- BUNDLED: Chat/components/Button.tsx ---

/**
 * Button - Unified button component with icon-only and icon+text support
 * 
 * Supports multiple variants (default, secondary, outline, ghost, destructive)
 * and sizes (sm, md, lg). Includes keyboard-only focus rings and Framer Motion animations.
 * 
 * Usage:
 * - Icon-only: <Button iconPosition="only" icon={<Icon />} aria-label="Action" />
 * - Icon+text: <Button iconPosition="left" icon={<Icon />}>Label</Button>
 */

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive"
type ButtonSize = "sm" | "md" | "lg"
type ButtonIconPosition = "left" | "right" | "only"

interface ButtonProps {
    variant: ButtonVariant
    size?: ButtonSize
    iconPosition?: ButtonIconPosition
    icon?: React.ReactNode
    disabled?: boolean
    "aria-label"?: string
    onClick?: () => void
    children?: React.ReactNode
    withEntryAnimation?: boolean
    focusRingColor?: string
    hoverAnimation?: Record<string, any>
    tapAnimation?: Record<string, any>
    backgroundColor?: string  // Override background color from token
    textColor?: string        // Override text color from token
    style?: React.CSSProperties
}

// Unified animation config for all buttons
// Using Material Design Standard Easing for sleek, professional feel
const buttonTapTransition = { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] as const }
const buttonEntryTransition = { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] as const }

const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>((
    {
        variant,
        size = "md",
        iconPosition = "only",
        icon,
        disabled = false,
        "aria-label": ariaLabel,
        onClick,
        children,
        withEntryAnimation = false,
        focusRingColor = "rgba(255,255,255,0.4)",
        hoverAnimation,
        tapAnimation,
        backgroundColor,
        textColor,
        style,
    },
    ref
) => {
    const [isKeyboardFocus, setIsKeyboardFocus] = React.useState(false)

    // Validate: icon-only buttons must have aria-label
    if (iconPosition === "only" && !ariaLabel) {
        console.warn("Button with iconPosition='only' requires aria-label for accessibility")
    }

    // Size configuration
    const isIconOnly = iconPosition === "only"
    const sizeConfig = isIconOnly
        ? (size === "sm"
            ? { size: 28, radius: "6px" }
            : size === "lg"
                ? { size: 48, radius: "16px", padding: 4 } // 48px inner size, 16px radius accounts for padding
                : { size: 32, radius: "50%" })
        : (size === "sm"
            ? { height: 32, paddingX: 12, fontSize: 13, radius: "12px" }
            : size === "lg"
                ? { height: 48, paddingX: 20, fontSize: 16, radius: "16px" }
                : { height: 40, paddingX: 16, fontSize: 14, radius: "16px" })

    /**
     * ShadCN-style Color Token System
     * Centralized color tokens following shadcn/ui design patterns
     * Based on Zinc dark palette with semantic naming
     * 
     * Benefits:
     * - Single source of truth for all variant colors
     * - Easy to maintain and extend
     * - Follows established design system patterns
     * - Prepared for future CSS-in-JS or Tailwind migration
     */
    const colorTokens = {
        variants: {
            default: {
                bg: "#000000",           // Pure black for heatmap button
                fg: "#FFFFFF",           // White text for maximum contrast
                shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            },
            secondary: {
                bg: "#27272A",           // zinc-800
                fg: "#FAFAFA",           // zinc-50  
                shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            },
            outline: {
                bg: "transparent",
                fg: "#FAFAFA",           // zinc-50
                border: "#27272A",       // zinc-800
            },
            ghost: {
                bg: "transparent",
                fg: "#A1A1AA",           // zinc-400 (muted foreground)
            },
            destructive: {
                bg: "#DC2626",           // red-600
                fg: "#FAFAFA",           // zinc-50
                shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            },
        },
        focus: {
            ring: "#D4D4D8",             // zinc-300 (visible focus ring)
        },
    }

    /**
     * Generate variant styles from color tokens
     * Supports backgroundColor and textColor prop overrides for flexibility
     */
    const getVariantStyles = (variant: ButtonVariant): React.CSSProperties => {
        const tokens = colorTokens.variants[variant]
        const styles: React.CSSProperties = {
            backgroundColor: backgroundColor || tokens.bg,
            color: textColor || tokens.fg,
        }

        // Add border for outline variant (type guard using 'in' operator)
        if ("border" in tokens && tokens.border) {
            styles.border = `1px solid ${tokens.border}`
        }

        // Add shadow for variants that have it (type guard using 'in' operator)
        if ("shadow" in tokens && tokens.shadow) {
            styles.boxShadow = tokens.shadow
        }

        return styles
    }

    // Hover state - simple opacity reduction
    const hoverStyle = { opacity: 0.9 }
    const hoverEffect = hoverAnimation || hoverStyle
    const tapEffect = tapAnimation ? { ...tapAnimation } : { scale: 0.95 }
    if (tapEffect.transition === undefined) {
        tapEffect.transition = buttonTapTransition
    }

    // Icon-only button styles
    const iconOnlyStyles: React.CSSProperties = {
        width: (sizeConfig as any).size,
        height: (sizeConfig as any).size,
        minWidth: (sizeConfig as any).size,
        minHeight: (sizeConfig as any).size,
        maxWidth: (sizeConfig as any).size,
        maxHeight: (sizeConfig as any).size,
        borderRadius: (sizeConfig as any).radius,
        padding: (sizeConfig as any).padding || 0,
    }

    // Icon+text button styles
    const iconTextStyles: React.CSSProperties = {
        height: (sizeConfig as any).height,
        paddingLeft: (sizeConfig as any).paddingX,
        paddingRight: (sizeConfig as any).paddingX,
        borderRadius: (sizeConfig as any).radius,
        fontSize: (sizeConfig as any).fontSize,
        gap: 8, // Space between icon and text
    }

    return (
        <motion.button
            ref={ref}
            initial={withEntryAnimation ? { opacity: 0, scale: 0.8 } : undefined}
            animate={withEntryAnimation ? { opacity: 1, scale: 1 } : undefined}
            exit={withEntryAnimation ? { opacity: 0 } : undefined}
            transition={withEntryAnimation ? buttonEntryTransition : undefined}
            whileHover={disabled ? undefined : hoverEffect}
            whileTap={disabled ? undefined : tapEffect}
            onClick={disabled ? undefined : onClick}
            onMouseDown={() => setIsKeyboardFocus(false)} // Mouse click = no focus ring
            disabled={disabled}
            type="button" // CRITICAL: Prevents form submission on mobile (buttons default to submit inside forms)
            aria-label={ariaLabel}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                flexShrink: 0,
                outline: "none", // Remove default browser outline
                border: "none", // Override global CSS hover border
                WebkitAppearance: "none", // Reset browser button defaults
                appearance: "none", // Reset button appearance
                ...getVariantStyles(variant),
                ...(isIconOnly ? iconOnlyStyles : iconTextStyles),
                ...style, // Allow overrides
            }}
            // ...
            onFocus={(e) => {
                // Only show focus ring if not triggered by mouse
                if (isKeyboardFocus === false && e.currentTarget === document.activeElement) {
                    // This is likely keyboard focus (Tab key)
                    setIsKeyboardFocus(true)
                    e.currentTarget.style.outline = `3px solid ${focusRingColor}`
                    e.currentTarget.style.outlineOffset = "2px"
                }
            }}
            onKeyDown={(e) => {
                // Tab key detected - enable keyboard focus mode
                if (e.key === "Tab") {
                    setIsKeyboardFocus(true)
                }
            }}
            onBlur={(e) => {
                e.currentTarget.style.outline = "none"
                e.currentTarget.style.outlineOffset = "0"
            }}
        >
            {/* Icon position: left or only */}
            {icon && (iconPosition === "left" || iconPosition === "only") && icon}

            {/* Text label (only for icon+text variants) */}
            {children && iconPosition !== "only" && (
                <span style={{ whiteSpace: "nowrap" }}>{children}</span>
            )}

            {/* Icon position: right */}
            {icon && iconPosition === "right" && icon}
        </motion.button>
    )
}))

Button.displayName = "Button"


// --- BUNDLED: Chat/components/TriggerButton.tsx ---

interface TriggerHeatmapIconProps {
    size: number
    /** Width as percentage of size (0-100), default 100 */
    width?: number
    /** Height as percentage of size (0-100), default 100 */
    height?: number
    /** Border radius as percentage (0-50, where 50 = circle), default 0 */
    borderRadius?: number | string
    /** Enable shader effect, when false shows static image only */
    enabled?: boolean
    background?: string
    image?: any
    colors?: string[]
    colorBack?: string
    contour?: number
    innerGlow?: number
    outerGlow?: number
    noise?: number
    angle?: number
    speed?: number
    scale?: number
    fit?: "contain" | "cover" | "fill"
    audioReactivity?: number
    bassToInnerGlow?: number
    midToOuterGlow?: number
    trebleToContour?: number
    volumeToAngle?: number
    isDesignMode?: boolean
    style?: React.CSSProperties
}

const TriggerHeatmapIcon = React.memo<TriggerHeatmapIconProps>(({
    size,
    width = 100,
    height = 100,
    borderRadius = 0,
    enabled = true,
    background,
    image,
    colors,
    colorBack,
    contour,
    innerGlow,
    outerGlow,
    noise,
    angle,
    speed,
    scale,
    fit = "cover",
    audioReactivity,
    bassToInnerGlow,
    midToOuterGlow,
    trebleToContour,
    volumeToAngle,
    isDesignMode,
    style,
}) => {
    // Use the background color for the vignette fade, default to black
    const fadeColor = background || "#000000"

    // Calculate actual dimensions from percentage
    const actualWidth = (width / 100) * size
    const actualHeight = (height / 100) * size

    // Normalize borderRadius to percentage string for CSS
    const resolvedBorderRadius = typeof borderRadius === "number"
        ? `${borderRadius}%`
        : borderRadius

    // Get image source for static mode
    const imageSrc = image?.src || (typeof image === "string" ? image : undefined)

    return (
        <div
            style={{
                width: actualWidth,
                height: actualHeight,
                flexShrink: 0,
                position: "relative",
                background,
                borderRadius: resolvedBorderRadius,
                overflow: "hidden", // Clips content to border radius
                ...style,
            }}
        >
            {enabled ? (
                <>
                    <AudioHeatmap
                        image={image}
                        colors={colors}
                        colorBack={colorBack}
                        scale={scale}
                        speed={speed}
                        angle={angle}
                        noise={noise}
                        innerGlow={innerGlow}
                        outerGlow={outerGlow}
                        contour={contour}
                        fit={fit}
                        audioReactivity={audioReactivity}
                        volumeToAngle={volumeToAngle}
                        bassToInnerGlow={bassToInnerGlow}
                        midToOuterGlow={midToOuterGlow}
                        trebleToContour={trebleToContour}
                        isDesignMode={isDesignMode}
                        style={{ width: "100%", height: "100%" }}
                    />
                    {/* Vignette overlay - radial gradient fades edges smoothly */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background: `radial-gradient(circle at center, transparent 30%, ${fadeColor} 85%)`,
                        }}
                    />
                </>
            ) : (
                // Static image mode - no shader, no animation
                imageSrc && (
                    <img
                        src={imageSrc}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fit,
                            display: "block",
                        }}
                    />
                )
            )}
        </div>
    )
})

TriggerHeatmapIcon.displayName = "TriggerHeatmapIcon"

interface TriggerButtonBaseProps {
    label: string
    ariaLabel?: string
    icon: React.ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    onClick?: () => void
    disabled?: boolean
    backgroundColor?: string
    textColor?: string
    focusRingColor?: string
    padding?: string | number
    borderRadius?: number
    gap?: number
    align?: "flex-start" | "center" | "flex-end"
    labelFont?: FontInput
    labelFontFallback?: FontFallback
    animateLabel?: boolean
    isDesignMode?: boolean
    hoverAnimation?: Record<string, any>
    tapAnimation?: Record<string, any>
    style?: React.CSSProperties
}

const TriggerButtonBase = React.memo<TriggerButtonBaseProps>(({
    label,
    ariaLabel,
    icon,
    variant = "default",
    size = "lg",
    onClick,
    disabled = false,
    backgroundColor,
    textColor,
    focusRingColor,
    padding,
    borderRadius,
    gap,
    align = "center",
    labelFont,
    labelFontFallback,
    animateLabel = true, // Default to true for animations
    isDesignMode = false,
    hoverAnimation,
    tapAnimation,
    style,
}) => {
    const { family, size: fallbackSize, weight } = labelFontFallback || {}

    const resolvedLabelFont = React.useMemo(
        () => resolveFontStyles(labelFont, { family, size: fallbackSize, weight }),
        [labelFont, family, fallbackSize, weight]
    )

    const labelStyle: React.CSSProperties = {
        display: "inline-block",
        whiteSpace: "nowrap",
        ...resolvedLabelFont,
    }

    const resolvedPadding = typeof padding === "number" ? `${padding}px` : padding
    const resolvedBorderRadius = borderRadius !== undefined ? `${borderRadius}px` : undefined

    const buttonStyle: React.CSSProperties = {
        justifyContent: align,
        ...style,
    }

    if (gap !== undefined) {
        buttonStyle.gap = gap
    }
    if (resolvedPadding) {
        buttonStyle.padding = resolvedPadding
        buttonStyle.height = "auto"
    }
    if (resolvedBorderRadius) {
        buttonStyle.borderRadius = resolvedBorderRadius
    }

    // Spring-based transition for smooth, natural motion
    const springTransition = {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
    }

    // Label crossfade animation (slide down on exit, slide up on enter)
    const labelNode = animateLabel && !isDesignMode ? (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
                style={labelStyle}
            >
                {label}
            </motion.span>
        </AnimatePresence>
    ) : (
        <span style={labelStyle}>{label}</span>
    )

    // Icon with scale animation
    const animatedIcon = animateLabel && !isDesignMode ? (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key="trigger-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
                {icon}
            </motion.div>
        </AnimatePresence>
    ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
        </div>
    )

    // Right-aligned wrapper to keep right edge fixed during width changes
    return (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <motion.div
                layout
                transition={springTransition}
                style={{ display: "inline-flex" }}
            >
                <Button
                    variant={variant}
                    size={size}
                    iconPosition="left"
                    icon={animatedIcon}
                    disabled={disabled}
                    onClick={onClick}
                    aria-label={ariaLabel || label}
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                    focusRingColor={focusRingColor}
                    hoverAnimation={hoverAnimation}
                    tapAnimation={tapAnimation}
                    style={buttonStyle}
                >
                    {labelNode}
                </Button>
            </motion.div>
        </div>
    )
})

TriggerButtonBase.displayName = "TriggerButtonBase"


// --- BUNDLED: Chat/components/ChatHeader.tsx ---

/**
 * ChatHeader - Header component with status indicator
 * 
 * Displays agent status with shimmer text and status dot.
 */

interface ChatHeaderProps {
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
const ChatHeader = React.memo<ChatHeaderProps>(({
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


// --- BUNDLED: Chat/components/FormattedMessage.tsx ---

/**
 * FormattedMessage - Renders markdown content with themed styling
 * 
 * Supports: bold, italic, links, lists, code blocks, headings
 * Links open in new tab with security attributes
 * 
 * NOTE: Uses inline regex-based parsing instead of react-markdown
 * to avoid external CDN dependencies that may fail on published Framer sites.
 * 
 * IMPORTANT: Do NOT use lookbehind assertions ((?<!...)) as they are not
 * supported in Safari &lt; 16.4 and cause silent parsing failures.
 */

interface FormattedMessageProps {
    content: string
    textColor: string
    linkColor?: string
}

/**
 * Auto-format key terms with markdown bold
 * 
 * Solves the Gemini LLM markdown stripping issue by automatically wrapping
 * service names, pricing, URLs, and emails in **bold** on the client side.
 * 
 * This ensures formatting consistency regardless of LLM behavior.
 */
const autoFormatKeyTerms = (text: string): string => {
    let formatted = text

    // Define terms to auto-bold (case-insensitive matching, but preserve original case)
    const terms = [
        // Service names (longer phrases first to avoid partial matches)
        'AI agent integration',
        'frontend development',
        'brand identity',
        'AI integration',
        'TypeScript',
        'Next.js',
        'ShadCN',
        'Framer',
        'React',
        'AI agents',
    ]

    // Pricing patterns (regex)
    const pricingPattern = /\$\d+k(?:-\$?\d+k)?\+?/gi

    // Email pattern - captures ANY asterisks before/after email (handles malformed markdown)
    const emailPattern = /(\**)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\**)/g

    // Helper: check if already wrapped in bold
    const isWrappedInBold = (before: string, after: string): boolean => {
        return before === '**' && after === '**'
    }

    // Auto-bold pricing first (using offset check for Safari compatibility)
    formatted = formatted.replace(pricingPattern, (match, offset) => {
        const before = formatted.substring(Math.max(0, offset - 2), offset)
        const after = formatted.substring(offset + match.length, offset + match.length + 2)
        if (isWrappedInBold(before, after)) return match
        return `**${match}**`
    })

    // Auto-bold emails (handles plain, correct, and malformed asterisks)
    formatted = formatted.replace(emailPattern, (_, beforeStars, email, afterStars) => {
        // Always normalize to exactly ** on each side
        // This handles: plain, already-correct, and malformed (*, ***, ****, etc.)
        return `**${email}**`
    })

    // Auto-bold skai.dev/work (using offset check for Safari compatibility)
    // Skip if preceded by @ (part of email)
    formatted = formatted.replace(/\bskai\.dev\/work\b/gi, (match, offset) => {
        const before = formatted.substring(Math.max(0, offset - 2), offset)
        const after = formatted.substring(offset + match.length, offset + match.length + 2)
        const charBefore = offset > 0 ? formatted[offset - 1] : ''
        // Skip if part of email (preceded by @)
        if (charBefore === '@') return match
        if (isWrappedInBold(before, after)) return match
        return `**${match}**`
    })

    // Auto-bold skai.dev (but not if in URL path or email)
    // Skip if preceded by @ (part of email) or followed by / or @
    formatted = formatted.replace(/\bskai\.dev\b(?!\/|@)/gi, (match, offset) => {
        const before = formatted.substring(Math.max(0, offset - 2), offset)
        const after = formatted.substring(offset + match.length, offset + match.length + 2)
        const charBefore = offset > 0 ? formatted[offset - 1] : ''
        // Skip if part of email (preceded by @)
        if (charBefore === '@') return match
        if (isWrappedInBold(before, after)) return match
        return `**${match}**`
    })

    // Auto-bold service/tech terms (using offset check for Safari compatibility)
    for (const term of terms.filter(t => !t.includes('@') && !t.includes('skai'))) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi')

        formatted = formatted.replace(regex, (match, _, offset) => {
            const before = formatted.substring(Math.max(0, offset - 2), offset)
            const after = formatted.substring(offset + match.length, offset + match.length + 2)
            if (isWrappedInBold(before, after)) return match
            return `**${match}**`
        })
    }

    return formatted
}

/**
 * Inline markdown parser - converts markdown text to React elements
 * Supports: **bold**, *italic*, [links](url), `code`
 * 
 * Uses a sequential replacement approach instead of lookbehind assertions
 * for cross-browser compatibility (including Safari).
 */
const parseInlineMarkdown = (
    text: string,
    linkColor: string
): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let key = 0

    // Use placeholder tokens to prevent double-processing
    const BOLD_TOKEN = '\u0000BOLD\u0000'
    const ITALIC_TOKEN = '\u0000ITALIC\u0000'
    const CODE_TOKEN = '\u0000CODE\u0000'
    const LINK_TOKEN = '\u0000LINK\u0000'

    // Store extracted elements with their tokens
    const extracted: { token: string; element: React.ReactNode }[] = []

    let processed = text

    // 1. Extract code first (to protect ** and * inside code)
    processed = processed.replace(/`([^`]+)`/g, (_, code) => {
        const token = `${CODE_TOKEN}${extracted.length}${CODE_TOKEN}`
        extracted.push({
            token,
            element: (
                <code
                    key={`code-${key++}`}
                    style={{
                        backgroundColor: "rgba(0,0,0,0.08)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                    }}
                >
                    {code}
                </code>
            ),
        })
        return token
    })

    // 2. Extract links (to protect ** and * inside link text)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
        const token = `${LINK_TOKEN}${extracted.length}${LINK_TOKEN}`
        extracted.push({
            token,
            element: (
                <a
                    key={`link-${key++}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: linkColor,
                        textDecoration: "underline",
                    }}
                >
                    {linkText}
                </a>
            ),
        })
        return token
    })

    // 3. Extract bold (**text** or __text__) - must come before italic
    processed = processed.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, bold1, bold2) => {
        const content = bold1 || bold2
        const token = `${BOLD_TOKEN}${extracted.length}${BOLD_TOKEN}`
        extracted.push({
            token,
            element: (
                <strong key={`bold-${key++}`} style={{ fontWeight: 700 }}>
                    {content}
                </strong>
            ),
        })
        return token
    })

    // 4. Extract italic (*text* or _text_)
    // Only match single * or _ that aren't part of ** or __
    processed = processed.replace(/(?:^|[^*])\*([^*]+)\*(?:[^*]|$)|(?:^|[^_])_([^_]+)_(?:[^_]|$)/g, (match, italic1, italic2) => {
        const content = italic1 || italic2
        if (!content) return match // No match, return original

        const token = `${ITALIC_TOKEN}${extracted.length}${ITALIC_TOKEN}`
        extracted.push({
            token,
            element: (
                <em key={`italic-${key++}`} style={{ fontStyle: "italic" }}>
                    {content}
                </em>
            ),
        })

        // Preserve characters before/after the italic markers
        const prefix = match.startsWith('*') || match.startsWith('_') ? '' : match[0]
        const suffix = match.endsWith('*') || match.endsWith('_') ? '' : match[match.length - 1]
        return prefix + token + suffix
    })

    // Now split by all tokens and reconstruct
    const allTokenPattern = new RegExp(
        `(${BOLD_TOKEN}\\d+${BOLD_TOKEN}|${ITALIC_TOKEN}\\d+${ITALIC_TOKEN}|${CODE_TOKEN}\\d+${CODE_TOKEN}|${LINK_TOKEN}\\d+${LINK_TOKEN})`,
        'g'
    )

    const parts = processed.split(allTokenPattern)

    for (const part of parts) {
        if (!part) continue

        // Check if this part is a token
        const extractedItem = extracted.find((e) => e.token === part)
        if (extractedItem) {
            elements.push(extractedItem.element)
        } else {
            // Plain text
            elements.push(part)
        }
    }

    return elements
}

/**
 * Parse block-level markdown (paragraphs, lists, headings, code blocks)
 */
const parseBlockMarkdown = (
    content: string,
    textColor: string,
    linkColor: string
): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let key = 0

    // Split by double newlines for paragraphs, or single for list items
    const lines = content.split('\n')
    let currentBlock: string[] = []
    let inList = false
    let listType: 'ul' | 'ol' | null = null
    let listItems: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []

    const flushParagraph = () => {
        if (currentBlock.length > 0) {
            const text = currentBlock.join('\n').trim()
            if (text) {
                elements.push(
                    <p key={key++} style={{ margin: "0 0 8px 0" }}>
                        {parseInlineMarkdown(text, linkColor)}
                    </p>
                )
            }
            currentBlock = []
        }
    }

    const flushList = () => {
        if (listItems.length > 0) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul'
            elements.push(
                <ListTag
                    key={key++}
                    style={{
                        margin: "8px 0",
                        paddingLeft: "20px",
                        listStyleType: listType === 'ol' ? "decimal" : "disc",
                    }}
                >
                    {listItems}
                </ListTag>
            )
            listItems = []
            inList = false
            listType = null
        }
    }

    const flushCodeBlock = () => {
        if (codeBlockContent.length > 0) {
            elements.push(
                <pre key={key++} style={{ margin: "8px 0", overflow: "hidden" }}>
                    <code
                        style={{
                            display: "block",
                            backgroundColor: "rgba(0,0,0,0.1)",
                            padding: "12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            overflowX: "auto",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {codeBlockContent.join('\n')}
                    </code>
                </pre>
            )
            codeBlockContent = []
            inCodeBlock = false
        }
    }

    for (const line of lines) {
        // Code block detection
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                flushCodeBlock()
            } else {
                flushParagraph()
                flushList()
                inCodeBlock = true
            }
            continue
        }

        if (inCodeBlock) {
            codeBlockContent.push(line)
            continue
        }

        // Heading detection (# ## ###)
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
        if (headingMatch) {
            flushParagraph()
            flushList()
            const level = headingMatch[1].length
            const headingText = headingMatch[2]
            const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3'
            const styles: Record<string, React.CSSProperties> = {
                h1: { fontSize: "1.25em", fontWeight: 700, margin: "12px 0 8px 0" },
                h2: { fontSize: "1.15em", fontWeight: 600, margin: "10px 0 6px 0" },
                h3: { fontSize: "1.05em", fontWeight: 600, margin: "8px 0 4px 0" },
            }
            elements.push(
                React.createElement(HeadingTag, { key: key++, style: styles[HeadingTag] },
                    parseInlineMarkdown(headingText, linkColor)
                )
            )
            continue
        }

        // Unordered list item (- or *)
        const ulMatch = line.match(/^[\-\*]\s+(.+)$/)
        if (ulMatch) {
            flushParagraph()
            if (listType !== 'ul') {
                flushList()
            }
            inList = true
            listType = 'ul'
            listItems.push(
                <li key={key++} style={{ marginBottom: "4px" }}>
                    {parseInlineMarkdown(ulMatch[1], linkColor)}
                </li>
            )
            continue
        }

        // Ordered list item (1. 2. etc)
        const olMatch = line.match(/^\d+\.\s+(.+)$/)
        if (olMatch) {
            flushParagraph()
            if (listType !== 'ol') {
                flushList()
            }
            inList = true
            listType = 'ol'
            listItems.push(
                <li key={key++} style={{ marginBottom: "4px" }}>
                    {parseInlineMarkdown(olMatch[1], linkColor)}
                </li>
            )
            continue
        }

        // Blockquote
        const blockquoteMatch = line.match(/^>\s*(.*)$/)
        if (blockquoteMatch) {
            flushParagraph()
            flushList()
            elements.push(
                <blockquote
                    key={key++}
                    style={{
                        borderLeft: `3px solid ${linkColor}`,
                        paddingLeft: "12px",
                        margin: "8px 0",
                        opacity: 0.9,
                    }}
                >
                    {parseInlineMarkdown(blockquoteMatch[1], linkColor)}
                </blockquote>
            )
            continue
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(line.trim())) {
            flushParagraph()
            flushList()
            elements.push(
                <hr
                    key={key++}
                    style={{
                        border: "none",
                        borderTop: "1px solid rgba(0,0,0,0.15)",
                        margin: "12px 0",
                    }}
                />
            )
            continue
        }

        // Empty line - flush paragraph
        if (line.trim() === '') {
            flushParagraph()
            flushList()
            continue
        }

        // If we were in a list but this line isn't a list item, flush the list
        if (inList) {
            flushList()
        }

        // Regular text - add to current paragraph
        currentBlock.push(line)
    }

    // Flush remaining content
    flushCodeBlock()
    flushList()
    flushParagraph()

    return elements
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({
    content,
    textColor,
    linkColor = "#3b82f6", // Default blue for links
}) => {
    // Auto-format key terms first, then parse markdown
    const parsedContent = React.useMemo(() => {
        const formatted = autoFormatKeyTerms(content)
        return parseBlockMarkdown(formatted, textColor, linkColor)
    }, [content, textColor, linkColor])

    return (
        <div
            style={{
                wordBreak: "break-word",
                color: textColor,
            }}
        >
            {parsedContent}
        </div>
    )
}

FormattedMessage.displayName = "FormattedMessage"


// --- BUNDLED: Chat/components/ChatMessageBubble.tsx ---

/**
 * ChatMessageBubble - Message display component for chat
 * 
 * Renders user and agent messages with different styles.
 * Includes copy-to-clipboard functionality for agent messages.
 * Has special rendering for "Session ended" system messages.
 */

interface ChatMessageBubbleProps {
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


// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: ChatMessageBubble (wrapped with React.memo for performance)
// PURPOSE: Renders individual chat messages with copy functionality
// PROPS FROM HOOKS (in parent ElevenLabsVoiceChat):
//   - message: From useElevenLabsSession.messages array (via useChatMessages sub-hook)
//   - bubbles/theme: Props passed from parent, not from hooks
// ═══════════════════════════════════════════════════════════════════════════
const ChatMessageBubble = React.memo<ChatMessageBubbleProps>(({
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


// --- BUNDLED: Chat/ElevenLabsVoiceChat.tsx ---



// --- Components ---

// Icons and ChatMessageBubble moved to separate files


// --- Components ---

// Icons and ChatMessageBubble moved to separate files

/**
 * renderIcon - Module-level icon renderer (rerender-memo best practice)
 * 
 * This function is intentionally defined at module level (not inside a component)
 * to avoid recreation on every render. Since it's pure and has no dependencies on
 * component state, hoisting it here is the optimal pattern.
 * 
 * Fixed to follow Radix best practices (merge props, preserve styles)
 */
function renderIcon(
    customIcon: React.ReactNode,
    DefaultIcon: React.ComponentType<{ size?: number } & React.SVGProps<SVGSVGElement>>,
    size = 20
): React.ReactNode {
    if (customIcon) {
        const icon = Array.isArray(customIcon) ? customIcon[0] : customIcon
        if (React.isValidElement(icon)) {
            // Safe clone with style merging
            return React.cloneElement(icon as React.ReactElement<any>, {
                width: size,
                height: size,
                style: {
                    ...((icon as React.ReactElement<any>).props.style || {}),
                    width: size,
                    height: size,
                    minWidth: size,
                    minHeight: size,
                    flexShrink: 0
                }
            })
        }
    }
    return <DefaultIcon size={size} style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0 }} />
}

// --- SOUND PLAYER (module-level cache, js-cache-function-results) ---
const soundCache = new Map<string, HTMLAudioElement>()

function playSound(url: string | undefined) {
    if (!url) return

    try {
        if (!soundCache.has(url)) {
            const audio = new Audio(url)
            audio.volume = 0.5 // Default to 50% volume
            soundCache.set(url, audio)
        }

        const audio = soundCache.get(url)!
        audio.currentTime = 0 // Reset to start
        audio.play().catch(err => {
            // Autoplay blocked - this is expected on first load
            console.warn('[ElevenLabs] Sound autoplay blocked:', err)
        })
    } catch (err) {
        console.error('[ElevenLabs] Failed to play sound:', err)
    }
}

// --- HOISTED STYLES (rendering-hoist-jsx) ---

const containerBaseStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
}


const chatAreaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0, // Critical for Safari: allows flex child to shrink when keyboard opens
    padding: "20px",
    paddingBottom: "80px", // Buffer zone to prevent messages from hiding under input
    overflowY: "auto",
    overflowX: "hidden", // Prevent horizontal scroll from Session ended divider
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    // Prevent layout shift when scrollbar appears/disappears
    scrollbarGutter: "stable",
}

const emptyStateStyle: React.CSSProperties = {
    margin: "auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "32px",
}

const visualizerContainerStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
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
    fontSize: "15px",
    backgroundColor: "transparent",
    alignSelf: "center",
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useVisualViewportHeight - Detects iOS keyboard height via Visual Viewport API
// PURPOSE: iOS Safari doesn't resize the layout viewport when keyboard opens,
//          only the visual viewport shrinks. This hook detects the difference
//          to calculate keyboard height for proper positioning.
// REF: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
// ═══════════════════════════════════════════════════════════════════════════
function useVisualViewportHeight(): number {
    const [keyboardOffset, setKeyboardOffset] = useState(0)

    useEffect(() => {
        // SSR guard and feature detection
        if (typeof window === "undefined" || !window.visualViewport) return

        const handleResize = () => {
            // Keyboard height = difference between full window height and visual viewport
            const keyboardHeight = window.innerHeight - window.visualViewport!.height
            setKeyboardOffset(Math.max(0, keyboardHeight))
        }

        handleResize() // Initial calculation
        window.visualViewport.addEventListener("resize", handleResize)
        window.visualViewport.addEventListener("scroll", handleResize)

        return () => {
            window.visualViewport?.removeEventListener("resize", handleResize)
            window.visualViewport?.removeEventListener("scroll", handleResize)
        }
    }, [])

    return keyboardOffset
}

/**
 * ElevenLabsVoiceChat - A complete voice/text chat interface for ElevenLabs Conversational AI
 * 
 * @description
 * Production-ready React component for integrating ElevenLabs voice agents into web applications.
 * Supports both voice and text modes with seamless switching, session persistence, and 
 * extensive customization through design tokens.
 * 
 * @example
 * ```tsx
 * <ElevenLabsVoiceChat
 *   agentId="your-agent-id"
 *   startWithText={true}
 *   theme={{ bg: "#1C1C1C", fg: "#FFFFFF" }}
 * />
 * ```
 * 
 * @remarks
 * - Follows Vercel React Best Practices (2026)
 * - Zero external icon dependencies (inline SVG)
 * - Accessible with proper ARIA attributes
 * - Session persistence via sessionStorage
 * 
 * @see https://elevenlabs.io/docs/conversational-ai
 */

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN MODE: Mock Messages for Canvas Preview
// PURPOSE: Provides representative content for designers to calibrate tokens
// NOTE: Auto-format terms (React, TypeScript, $5k, hello@skai.dev) are bolded automatically
// ═══════════════════════════════════════════════════════════════════════════
const DESIGN_MODE_MOCK_MESSAGES: ChatMessage[] = [
    { id: "mock-user-1", role: "user", content: "What services do you offer and how much do they cost?" },
    { id: "mock-agent-1", role: "assistant", content: "I specialize in React and TypeScript development! Our services include:\n\n- **Frontend development** with Next.js and Framer\n- AI agent integration for conversational interfaces\n- Brand identity and design systems\n\nPricing starts at $5k for small projects. Feel free to reach out at hello@skai.dev for a detailed quote!" },
]

function ElevenLabsVoiceChatCore(props: ElevenLabsVoiceChatProps & { isDesignMode?: boolean }) {
    const {
        agentId = "",
        debug = false,
        startWithText = true,
        autoConnect = false,
        shareContext = true,
        autoScrapeContext = false,
        contextAllowlist = [],
        linkRegistry = [],
        style,
        image,
        triggerButtonVariant = "default",
        isDesignMode = false,
        visualizerScale = 0.6,
        // Style Groups (includes layout + colors)
        theme: themeProps = {},
        bubbles = { userBg: "#FFFFFF", userText: "#1C1C1C", agentBg: "#2C2C2C", agentText: "#FFFFFF" },
        input = { bg: "#2C2C2C" },
        visualizer = { bg: undefined as string | undefined },
        // Button Tokens (By Function)
        triggerButton = { bg: "#000000", text: "#FFFFFF", focus: "rgba(255,255,255,0.4)" },
        btnSend = { bg: "#000000", text: "#FFFFFF" },
        btnMic = { bg: "#27272A", text: "#FAFAFA" },
        btnEnd = { bg: "#DC2626", text: "#FAFAFA" },
        btnCall = { bg: "#27272A", text: "#FAFAFA" },
        // Status Tokens (Grouped)
        status = { connected: "#22c55e", connecting: "#eab308", disconnected: "#ef4444" },
        // Heatmap Visualizer
        heatmap = {},
        // Custom Icons
        iconSend,
        iconMic,
        iconMicOff,
        iconDisconnect,
        iconCall,
        iconCopy,
        iconCheck,
        // Standalone status font
        // Sound Effects (CDN URLs)
        soundInitializing,
        soundConnecting,
        soundThinking,
        soundListening,
        soundError,
        soundDisconnected,
        // Turn-Taking Configuration
        allowInterruptions = true,
        turnEagerness = "normal",
        turnTimeout = 1.2,  // Increased from 1.0 for better pause handling in office environments
        vadThreshold = 0.5,
        // Default: true (enabled), but useSessionConnection will auto-disable for iOS Safari
        backgroundVoiceDetection = true,
        // Display mode: default (chat above button) or mobileOverlay (fullscreen overlay)
        displayMode = "default",
    } = props

    // Is mobile overlay mode?
    const isMobileOverlay = displayMode === "mobileOverlay"

    // Visual Viewport API: detect iOS keyboard height for proper positioning
    const keyboardOffset = useVisualViewportHeight()

    // Destructure heatmap properties with defaults
    const {
        enabled: heatmapEnabled = true,
        image: heatmapImage,
        width: heatmapWidth = 100,
        height: heatmapHeight = 100,
        borderRadius: heatmapBorderRadius = 50,
        colors: heatmapColors = ["#FFFFFF", "#CCCCCC"],
        background: heatmapBackground = "transparent",
        scale: heatmapScale = 0.8,
        speed: heatmapSpeed = 0.5,
        angle: heatmapAngle = 0,
        noise: heatmapNoise = 0,
        innerGlow: heatmapInnerGlow = 0,
        outerGlow: heatmapOuterGlow = 0.5,
        contour: heatmapContour = 0,
        fit: heatmapFit = "cover",
        audioReactivity: heatmapAudioReactivity = 1,
        bassToInnerGlow: heatmapBassToInnerGlow = 0,
        midToOuterGlow: heatmapMidToOuterGlow = 0.5,
        trebleToContour: heatmapTrebleToContour = 0,
        volumeToAngle: heatmapVolumeToAngle = 0,
    } = heatmap

    // Destructure theme properties with defaults (layout + colors)
    const {
        maxWidth = 400,
        maxHeight = 500,
        cornerRadius = 24,
        border: themeBorder,
        borderWidth: themeBorderWidth,
        borderStyle: themeBorderStyle,
        borderColor: themeBorderColor,
        bg: themeBg = "#1C1C1C",
        fg: themeFg = "#FFFFFF",
        muted: themeMuted = "#6E6E6E",
        focusRing: themeFocusRing = "rgba(255,255,255,0.4)",
    } = themeProps as {
        maxWidth?: number,
        maxHeight?: number,
        cornerRadius?: number,
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        },
        borderWidth?: number,
        borderStyle?: string,
        borderColor?: string,
        bg?: string,
        fg?: string,
        muted?: string,
        focusRing?: string
    }

    // Extract border properties with defaults
    // Framer Border control can provide values either as object or direct properties
    const borderWidth = themeBorder?.borderWidth ?? themeBorderWidth ?? 0
    const borderColor = themeBorder?.borderColor ?? themeBorderColor ?? "rgba(255,255,255,0.2)"
    const borderStyle = themeBorder?.borderStyle ?? themeBorderStyle ?? "solid"

    // Create theme object for backward compatibility
    const theme = {
        bg: themeBg,
        fg: themeFg,
        muted: themeMuted,
        border: borderColor,  // Use border color for internal border styling
        focusRing: themeFocusRing,
    }

    // Destructure trigger button properties including padding, gap, and border
    const {
        bg: triggerBg = "#000000",
        text: triggerText = "#FFFFFF",
        focus: triggerFocus = "rgba(255,255,255,0.4)",
        borderRadius: triggerBorderRadius = 28,
        border: triggerBorderObj,
        borderWidth: triggerBorderDirectWidth,
        borderStyle: triggerBorderDirectStyle,
        borderColor: triggerBorderDirectColor,
        padding: triggerPadding = "4px 20px 4px 12px",
        gap: triggerGap = 8,
        labelOpen = "Close",
        labelClosed = "Chat",
        font: triggerFont,
        betaText,
        betaTextColor = "#71717A",
    } = triggerButton

    // Extract trigger button border properties with defaults
    // Framer Border control can provide values either as object or direct properties
    const triggerBorderWidth = triggerBorderObj?.borderWidth ?? triggerBorderDirectWidth ?? 0
    const triggerBorderColor = triggerBorderObj?.borderColor ?? triggerBorderDirectColor ?? "rgba(255,255,255,0.2)"
    const triggerBorderStyle = triggerBorderObj?.borderStyle ?? triggerBorderDirectStyle ?? "solid"

    // Derive final icon values: prefer button-scoped icons, fallback to legacy props
    const finalIconSend = btnSend?.icon || iconSend
    const finalIconMic = btnMic?.icon || iconMic
    const finalIconMicOff = btnMic?.iconOff || iconMicOff
    const finalIconEnd = btnEnd?.icon || iconDisconnect

    // Derive message bubble icons: prefer bubbles-scoped icons, fallback to legacy props
    const finalIconCopy = bubbles?.iconCopy || iconCopy
    const finalIconCheck = bubbles?.iconCheck || iconCheck

    // Derive call button icon: prefer btnCall scoped, fallback to legacy iconCall
    const finalIconCall = btnCall?.icon || iconCall


    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useState (React) - Visibility State
    // PURPOSE: Controls chat window visibility (toggled by built-in trigger button)
    // ═══════════════════════════════════════════════════════════════════════════
    const [isVisible, setIsVisible] = useState(() => {
        // Start with chat hidden, trigger button visible
        // In design mode, show chat for styling
        return isDesignMode
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useEffect (React) - SDK Pre-loading
    // PURPOSE: Pre-load the ElevenLabs SDK in background on component mount.
    // This eliminates CDN cold-start latency by ensuring the SDK is cached
    // before the user taps "Connect" - especially important on mobile networks.
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isDesignMode && agentId) {
            preloadConversation()
        }
    }, [isDesignMode, agentId])


    // PURPOSE: Prevents re-computing font objects on every render
    const resolvedFontMessages = useMemo(() => {
        return resolveFontStyles(bubbles?.font, { family: "Inter", size: 15, weight: 400 })
    }, [bubbles?.font])

    const resolvedFontStatus = useMemo(() => {
        return resolveFontStyles(status?.font, { family: "Inter", size: 13, weight: 400 })
    }, [status?.font])

    const resolvedFontInput = useMemo(() => {
        return resolveFontStyles(input?.font, { family: "Inter", size: 15, weight: 400 })
    }, [input?.font])


    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useAgentNavigation (Custom)
    // ═══════════════════════════════════════════════════════════════════════════
    const { navigationState, redirectToPage } = useAgentNavigation({
        linkRegistry, addLog: (msg, type) => {
            if (debug) console.log(`[ElevenLabs Chat] ${type}: ${msg}`)
        }
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useElevenLabsSession (Custom - FACADE HOOK)
    // ═══════════════════════════════════════════════════════════════════════════
    const {
        state,
        error,
        isConnected,
        isVoiceMode,
        connect,
        disconnect,
        sendText,
        upgradeToVoice,
        downgradeToText,
        getOutputVolume,
        getInputVolume,
        addLog,
        messages,
        addMessage,
        messagesEndRef,
        queueMessage,
        flushPendingMessages,
        sendUserActivity,
        handleScroll,
        scrollToBottom,
    } = useElevenLabsSession({
        agentId,
        debug,
        startWithText,
        shareContext,
        autoScrapeContext,
        contextAllowlist,
        linkRegistry,
        allowInterruptions,
        turnEagerness,
        turnTimeout,
        vadThreshold,
        backgroundVoiceDetection,
        redirectToPage,
        navigationState: {
            currentPage: navigationState.currentPage,
            previousPage: navigationState.previousPage ?? undefined,
            visitHistory: navigationState.visitHistory,
        },
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // EFFECT: Scroll to bottom when chat panel opens
    // PURPOSE: Ensures user sees latest messages when opening the chat
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (isVisible && messages.length > 0) {
            // Small delay to allow DOM to render the chat panel
            const timer = setTimeout(() => {
                scrollToBottom()
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [isVisible, scrollToBottom, messages.length])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOKS: useState, useRef (React) - Local UI state
    // ═══════════════════════════════════════════════════════════════════════════
    const [textInput, setTextInput] = useState("")
    const [micDeniedMessage, setMicDeniedMessage] = useState<string | null>(null)
    // iOS Safari fix: Debounce after disconnect to prevent touch bleed-through
    // Uses BOTH local ref AND global window flag to survive component remounts
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const isDisconnectingRef = useRef(false)
    const disconnectCooldownTimerRef = useRef<number | null>(null)
    const [isInputFocused, setIsInputFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Global cooldown check - uses sessionStorage to survive page navigation (Framer routing)
    const isInGlobalCooldown = useCallback(() => {
        try {
            const cooldownUntil = parseInt(sessionStorage.getItem('__elevenLabsDisconnectCooldownUntil') || '0', 10)
            const inCooldown = Date.now() < cooldownUntil
            if (inCooldown) console.log('[DEBUG] isInGlobalCooldown = true, expires in', cooldownUntil - Date.now(), 'ms')
            return inCooldown
        } catch { return false }
    }, [])

    const setGlobalCooldown = useCallback((durationMs: number) => {
        try {
            const until = Date.now() + durationMs
            sessionStorage.setItem('__elevenLabsDisconnectCooldownUntil', String(until))
            console.log('[DEBUG] setGlobalCooldown =', durationMs, 'ms (until', until, ')')
        } catch { /* sessionStorage unavailable */ }
    }, [])

    // Global connection lock - uses sessionStorage to survive page navigation
    const isInGlobalConnectionLock = useCallback(() => {
        try {
            return sessionStorage.getItem('__elevenLabsConnectionInProgress') === 'true'
        } catch { return false }
    }, [])

    const setGlobalConnectionLock = useCallback((locked: boolean) => {
        try {
            if (locked) {
                sessionStorage.setItem('__elevenLabsConnectionInProgress', 'true')
            } else {
                sessionStorage.removeItem('__elevenLabsConnectionInProgress')
            }
            console.log('[DEBUG] setGlobalConnectionLock =', locked)
        } catch { /* sessionStorage unavailable */ }
    }, [])

    // Global disconnect lock - uses sessionStorage to survive page navigation
    const isInGlobalDisconnectLock = useCallback(() => {
        try {
            return sessionStorage.getItem('__elevenLabsDisconnectInProgress') === 'true'
        } catch { return false }
    }, [])

    const setGlobalDisconnectLock = useCallback((locked: boolean) => {
        try {
            if (locked) {
                sessionStorage.setItem('__elevenLabsDisconnectInProgress', 'true')
            } else {
                sessionStorage.removeItem('__elevenLabsDisconnectInProgress')
            }
            console.log('[DEBUG] setGlobalDisconnectLock =', locked)
        } catch { /* sessionStorage unavailable */ }
    }, [])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useEffect (React) - Mic denied event listener
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const handleMicDenied = (e: CustomEvent<{ message: string }>) => {
            setMicDeniedMessage(e.detail.message)
            setTimeout(() => setMicDeniedMessage(null), 3000)
        }
        window.addEventListener("elevenlabs-mic-denied", handleMicDenied as EventListener)
        return () => window.removeEventListener("elevenlabs-mic-denied", handleMicDenied as EventListener)
    }, [])

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER: Thinking Timeout for Text Mode
    // PURPOSE: Shows "thinking" state after 2 seconds if agent doesn't respond
    // PREVENTS: User confusion when agent is slow or silent
    // ═══════════════════════════════════════════════════════════════════════════
    const startThinkingTimeout = useCallback(() => {
        // Clear any existing timeout
        if (thinkingTimeoutRef.current) {
            clearTimeout(thinkingTimeoutRef.current)
        }
        // Start new timeout - show "thinking" after 2 seconds of no response
        thinkingTimeoutRef.current = setTimeout(() => {
            // Only broadcast thinking if we're still connected and NOT already in a different state
            if (state === "connected" || state === "listening") {
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("elevenlabs-state-change", {
                        detail: { state: "thinking", errorMessage: null }
                    }))
                }
                addLog("Started thinking timeout indicator", "info")
            }
        }, 2000)
    }, [state, addLog])

    const clearThinkingTimeout = useCallback(() => {
        if (thinkingTimeoutRef.current) {
            clearTimeout(thinkingTimeoutRef.current)
            thinkingTimeoutRef.current = null
        }
    }, [])

    // Clear thinking timeout when agent responds (messages array changes with agent message)
    useEffect(() => {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage?.role === "assistant") {
            clearThinkingTimeout()
        }
    }, [messages, clearThinkingTimeout])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useRef (React) - Sound configuration ref
    // ═══════════════════════════════════════════════════════════════════════════
    const soundConfigRef = useRef({
        soundInitializing,
        soundConnecting,
        soundThinking,
        soundListening,
        soundError,
        soundDisconnected,
    })

    useEffect(() => {
        soundConfigRef.current = {
            soundInitializing,
            soundConnecting,
            soundThinking,
            soundListening,
            soundError,
            soundDisconnected,
        }
    }, [soundInitializing, soundConnecting, soundThinking, soundListening, soundError, soundDisconnected])


    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useRef (React) - Track if session was ever connected
    // PURPOSE: Prevents soundDisconnected from playing on initial mount or page navigation
    // ═══════════════════════════════════════════════════════════════════════════
    const wasEverConnectedRef = useRef(false)

    // Track when we become connected
    useEffect(() => {
        if (state === "connected" || state === "listening" || state === "speaking" || state === "thinking") {
            wasEverConnectedRef.current = true
        }
        // Reset when component unmounts (handled by cleanup returning)
    }, [state])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useEffect (React) - Sound effects on state change
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        // DESIGN MODE: Never play sounds on Framer canvas
        if (isDesignMode) return

        const sounds = soundConfigRef.current
        const soundMap: Record<AgentState, string | undefined> = {
            initializing: sounds.soundInitializing,
            connecting: sounds.soundConnecting,
            thinking: sounds.soundThinking,
            listening: sounds.soundListening,
            disconnected: sounds.soundDisconnected,
            connected: undefined,
            speaking: undefined,
        }

        // CRITICAL FIX: Only play soundDisconnected if there was an active session
        // This prevents the sound from playing on:
        // - Initial page load (state starts as "disconnected")
        // - Page navigation (component remounts with "disconnected" state)
        if (state === "disconnected") {
            if (wasEverConnectedRef.current) {
                playSound(sounds.soundDisconnected)
                wasEverConnectedRef.current = false  // Reset for next session
            }
            // Don't play any sound if we were never connected
        } else {
            playSound(soundMap[state])
        }

        if (error && sounds.soundError) {
            playSound(sounds.soundError)
        }
    }, [state, error, isDesignMode])

    useEffect(() => {
        console.log("ElevenLabs Chat Redesign v7 Loaded (Unified)")
    }, [])

    useEffect(() => {
        if (isConnected) {
            flushPendingMessages()
        }
    }, [isConnected, flushPendingMessages])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useEffect (React) - Auto-connect on mount
    // PURPOSE: When autoConnect is true, connects in text mode and allows agent greeting
    // NOTE: Agent sends first message, initiating the conversation
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        console.log('[DEBUG] autoConnect effect running, autoConnect =', autoConnect, 'isDesignMode =', isDesignMode, 'agentId =', agentId)
        if (autoConnect && !isDesignMode && agentId) {
            console.log('[DEBUG] autoConnect triggering connect()')
            // Show the chat window
            setIsVisible(true)
            // Connect in text mode with agent greeting enabled
            connect({ textMode: true, allowAgentGreeting: true })
        }
        // Run only on mount (agentId/autoConnect are stable config props)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useCallback (React) - Volume polling for visualizer
    // ═══════════════════════════════════════════════════════════════════════════
    const getVisualizerVolume = useCallback(() => {
        try {
            const outVol = getOutputVolume?.() || 0
            if (outVol > 0.01) return outVol
            const inVol = getInputVolume?.() || 0
            return inVol * 0.5
        } catch (e) {
            return 0
        }
    }, [getOutputVolume, getInputVolume])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useCallback (React) - Send message handler
    // ═══════════════════════════════════════════════════════════════════════════
    const handleSend = useCallback(async () => {
        if (!textInput.trim()) return
        const msg = textInput
        setTextInput("")

        addLog(`Sending text: "${msg}"`, "info")

        if (state === "disconnected") {
            console.log('[DEBUG] handleSend: state is disconnected, initiating connection')
            addLog("Not connected, initiating connection...", "info")
            queueMessage(msg)
            await connect({ textMode: true })
            addMessage({
                id: generateMessageId(),
                role: "user",
                content: msg
            })
            flushPendingMessages()
            // Start thinking timeout for initial message too
            startThinkingTimeout()
            return
        }

        addMessage({
            id: generateMessageId(),
            role: "user",
            content: msg
        })

        if (state === "connecting") {
            addLog("Connecting, queuing message...", "info")
            queueMessage(msg)
            return
        }

        await sendText(msg)

        // Start thinking timeout - shows "thinking" if agent doesn't respond within 2 seconds
        startThinkingTimeout()

        if (textareaRef.current) {
            textareaRef.current.style.height = "24px"
        }
    }, [textInput, state, connect, sendText, addMessage, addLog, queueMessage, flushPendingMessages, startThinkingTimeout])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useCallback (React) - Safe disconnect with touch debounce
    // PURPOSE: Prevents touch bleed-through on iOS Safari where End button
    //          animates out and touch passes to mic button underneath
    // ═══════════════════════════════════════════════════════════════════════════
    const handleDisconnect = useCallback(async () => {
        // Guard: Check global disconnect lock FIRST (synchronous, prevents race between instances)
        if (isInGlobalDisconnectLock()) {
            console.log('[DEBUG] handleDisconnect BLOCKED by globalDisconnectLock')
            return
        }
        // Also check local ref and cooldown
        if (isDisconnectingRef.current || isInGlobalCooldown()) {
            console.log('[DEBUG] handleDisconnect BLOCKED by local state or cooldown')
            return
        }

        // Set global disconnect lock IMMEDIATELY (sync, before any async)
        setGlobalDisconnectLock(true)
        console.log('[DEBUG] handleDisconnect proceeding')

        // Set debounce flag BEFORE disconnect to prevent any touch bleed-through
        isDisconnectingRef.current = true
        setIsDisconnecting(true)
        // Set GLOBAL cooldown that survives page navigation (1.5 seconds)
        setGlobalCooldown(1500)
        // Also clear any stale connection lock
        setGlobalConnectionLock(false)
        if (disconnectCooldownTimerRef.current) {
            clearTimeout(disconnectCooldownTimerRef.current)
            disconnectCooldownTimerRef.current = null
        }
        // Clear any pending thinking timeout
        clearThinkingTimeout()
        try {
            await disconnect()
        } finally {
            // Release global disconnect lock
            setGlobalDisconnectLock(false)
            // Keep LOCAL flag set for animation duration (1s for iOS Safari/Framer safety)
            disconnectCooldownTimerRef.current = window.setTimeout(() => {
                isDisconnectingRef.current = false
                setIsDisconnecting(false)
            }, 1000)
        }
    }, [disconnect, setGlobalConnectionLock, isInGlobalCooldown, isInGlobalDisconnectLock, setGlobalDisconnectLock, setGlobalCooldown, clearThinkingTimeout])

    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useCallback (React) - Mic toggle handler
    // ═══════════════════════════════════════════════════════════════════════════
    const handleMicClick = useCallback(async () => {
        const globalCooldown = isInGlobalCooldown()
        const connectionLocked = isInGlobalConnectionLock()
        console.log('[DEBUG] handleMicClick called, isDisconnectingRef =', isDisconnectingRef.current, 'globalCooldown =', globalCooldown, 'connectionLocked =', connectionLocked, 'isConnected =', isConnected)

        // iOS Safari fix: Block if we just disconnected (prevents touch bleed-through)
        // Check BOTH local ref AND global cooldown (global survives component remounts)
        if (isDisconnectingRef.current || globalCooldown) {
            console.log('[DEBUG] handleMicClick BLOCKED by', isDisconnectingRef.current ? 'isDisconnectingRef' : 'globalCooldown')
            return
        }

        // Block if another instance is already connecting
        if (connectionLocked) {
            console.log('[DEBUG] handleMicClick BLOCKED by connectionLocked')
            return
        }

        // When disconnected, always start a new voice session
        // (isVoiceMode may be stale from previous session)
        if (!isConnected) {
            setGlobalConnectionLock(true)
            try {
                await connect({ textMode: false })
            } finally {
                setGlobalConnectionLock(false)
            }
            return
        }
        // When connected, toggle between voice and text modes
        if (!isVoiceMode) {
            await upgradeToVoice()
        } else {
            await downgradeToText()
        }
    }, [isConnected, isVoiceMode, connect, upgradeToVoice, downgradeToText, isInGlobalCooldown, isInGlobalConnectionLock, setGlobalConnectionLock]);

    // Clean up disconnect cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (disconnectCooldownTimerRef.current) {
                clearTimeout(disconnectCooldownTimerRef.current)
            }
        }
    }, [])


    // ═══════════════════════════════════════════════════════════════════════════
    // HOOK: useEffect (React) - Audio data dispatch
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (state === "disconnected") return
        let animationFrameId: number

        const loop = () => {
            const vol = getVisualizerVolume()
            if (vol > 0.001 || state === "speaking") {
                window.dispatchEvent(new CustomEvent("elevenlabs-audio-data", {
                    detail: {
                        volume: vol,
                        bass: vol,
                        mid: vol,
                        treble: vol
                    }
                }))
            }
            animationFrameId = requestAnimationFrame(loop)
        }
        loop()
        return () => cancelAnimationFrame(animationFrameId)
    }, [state, getVisualizerVolume])

    // ═══════════════════════════════════════════════════════════════════════════
    // DESIGN MODE: Override state and messages for canvas preview
    // PURPOSE: Show all UI elements for styling (connected state, mock messages)
    // ═══════════════════════════════════════════════════════════════════════════
    const displayState = isDesignMode ? "listening" : state
    const displayMessages = isDesignMode ? DESIGN_MODE_MOCK_MESSAGES : messages

    // ═══════════════════════════════════════════════════════════════════════════
    // DERIVED STATE: Status dot color
    // ═══════════════════════════════════════════════════════════════════════════
    const statusColor = error
        ? (status.error || "#ef4444")
        : displayState === "thinking"
            ? (status.thinking || "#3b82f6")  // Blue for thinking mode
            : displayState === "connected" || displayState === "listening" || displayState === "speaking"
                ? status.connected
                : displayState === "connecting" || displayState === "initializing"
                    ? status.connecting
                    : theme.muted

    // Extract input border properties with defaults
    const inputBorderObj = input?.border
    const inputBorderWidth = inputBorderObj?.borderWidth ?? 0
    const inputBorderColor = inputBorderObj?.borderColor ?? "transparent"
    const inputBorderStyle = inputBorderObj?.borderStyle ?? "solid"

    // Container style - responsive width for mobile, fixed width on desktop
    const containerStyle: React.CSSProperties = {
        ...containerBaseStyle,
        width: `min(${maxWidth}px, calc(100vw - 32px))`,  // Responsive: fill screen on mobile, fixed on desktop
        maxWidth: maxWidth,
        height: maxHeight,
        borderRadius: cornerRadius,
        backgroundColor: theme.bg,
        zIndex: 9998, // Above backdrop (9997), below mobileOverlay (9999)
        border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
    }

    // Mobile overlay container style - 80% height anchored to bottom
    // Uses dynamic viewport height (dvh) which adapts when mobile keyboard opens
    const overlayContainerStyle: React.CSSProperties = {
        position: isDesignMode ? "absolute" as const : "fixed" as const, // Absolute in design mode so it stays in canvas
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: isDesignMode ? "100%" : "80dvh", // 80% viewport height, full height in design mode
        maxWidth: "100vw",
        maxHeight: isDesignMode ? "100%" : "80dvh",
        borderRadius: isDesignMode ? cornerRadius : `${cornerRadius}px ${cornerRadius}px 0 0`, // Round top corners only
        backgroundColor: theme.bg,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
    }

    return (
        <div style={{ ...style, position: "relative", minWidth: "fit-content", minHeight: "48px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end", boxSizing: "border-box" }}>
            {/* Click-outside backdrop: dismisses chat when tapping outside */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setIsVisible(false)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9997, // Below chat (9998) and trigger (9999) but above page content
                            backgroundColor: isMobileOverlay ? "rgba(0, 0, 0, 0.5)" : "transparent",
                            cursor: "default",
                        }}
                        aria-label={isMobileOverlay ? "Close chat" : undefined}
                        aria-hidden={isMobileOverlay ? undefined : true}
                    />
                )}
            </AnimatePresence>
            {/* Chat Window (collapsible) */}
            <AnimatePresence mode="wait">
                {isVisible && (
                    <motion.div
                        className="agent-ui"
                        initial={isDesignMode ? false : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                            ...(isMobileOverlay ? overlayContainerStyle : containerStyle),
                            marginBottom: isMobileOverlay ? 0 : "12px", // No margin in overlay mode
                            // Visual Viewport API: shrink container and anchor from BOTTOM when iOS keyboard is open
                            // This keeps the input field positioned just above the keyboard
                            ...(isMobileOverlay && keyboardOffset > 0 && !isDesignMode ? {
                                bottom: 0,   // Anchor from bottom (just above keyboard)
                                height: `calc(80dvh - ${keyboardOffset}px)`,
                                maxHeight: `calc(80dvh - ${keyboardOffset}px)`,
                            } : {}),
                        }}
                    >

                        {/* ... Header, Chat Area, Input ... */}
                        {/* (Existing content) */}
                        <ChatHeader
                            state={displayState}
                            statusColor={statusColor}
                            destructiveColor={btnEnd.bg}
                            theme={theme}
                            ShimmeringTextComponent={ShimmeringText}
                            resolvedShimmerFont={resolvedFontStatus}
                            isDesignMode={isDesignMode}
                            micDeniedMessage={micDeniedMessage}
                            showCloseButton={isMobileOverlay}
                            onClose={() => setIsVisible(false)}
                        />

                        {/* Chat Area */}
                        <div style={chatAreaStyle} onScroll={handleScroll}>
                            {displayMessages.length === 0 ? (
                                <div style={{ ...emptyStateStyle, color: theme.muted }}>
                                    {/* Call Button - 40x40px, triggers voice session */}
                                    <motion.div
                                        animate={
                                            state === "connecting" || state === "initializing"
                                                ? { opacity: [1, 0.5, 1] }
                                                : { opacity: 1 }
                                        }
                                        transition={
                                            state === "connecting" || state === "initializing"
                                                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                                                : { duration: 0.15 }
                                        }
                                        style={{
                                            width: 40,
                                            height: 40,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            // iOS Safari: Block touch events during disconnect
                                            pointerEvents: isDisconnecting ? "none" : "auto",
                                        }}
                                    >
                                        <IconButton
                                            variant="secondary"
                                            size="lg"
                                            disabled={state === "connecting" || state === "initializing" || isDisconnecting}
                                            aria-label="Start voice call"
                                            onClick={handleMicClick}
                                            withEntryAnimation={!isDesignMode}
                                            focusRingColor={triggerButton.focus}
                                            backgroundColor={btnCall?.bg}
                                            textColor={btnCall?.text}
                                        >
                                            {renderIcon(finalIconCall, IconWaveform, 20)}
                                        </IconButton>
                                    </motion.div>
                                    {/* Label & Beta text container */}
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "16px",
                                    }}>
                                        <div style={{ ...resolvedFontMessages }}>
                                            {error ? <span style={{ color: "#ef4444" }}>{error}</span> : "Start a conversation"}
                                        </div>
                                        {/* Beta warning text (optional) */}
                                        {betaText && (
                                            <span style={{
                                                display: "block",
                                                fontSize: "11px",
                                                lineHeight: "1.4",
                                                color: betaTextColor,
                                                fontWeight: 500,
                                                opacity: 0.9,
                                                WebkitFontSmoothing: "antialiased",
                                                MozOsxFontSmoothing: "grayscale",
                                            } as React.CSSProperties}>
                                                {betaText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                            <AnimatePresence mode="popLayout">
                                {displayMessages.map((m) => (
                                    <ChatMessageBubble
                                        key={m.id}
                                        message={m}
                                        bubbles={bubbles}
                                        theme={theme}
                                        iconCopy={finalIconCopy}
                                        iconCheck={finalIconCheck}
                                        renderIcon={renderIcon}
                                        fontSessionEnded={resolvedFontMessages}
                                        isDesignMode={isDesignMode}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </AnimatePresence>
                        </div>

                        {/* Input Area */}
                        <ChatInput
                            value={textInput}
                            onChange={setTextInput}
                            onSubmit={handleSend}
                            onFocus={() => {
                                setIsInputFocused(true)
                                // Mobile keyboard fix: scroll messages into view after keyboard animation
                                if (isMobileOverlay) {
                                    setTimeout(() => scrollToBottom(), 350)
                                }
                            }}
                            onBlur={() => setIsInputFocused(false)}
                            onUserActivity={sendUserActivity}
                            theme={theme}
                            inputBgColor={input.bg}
                            isFocused={isInputFocused}
                            textareaRef={textareaRef}
                            isMobileOverlay={isMobileOverlay}
                        >
                            {/* Button group - inline inside text field, bottom-aligned for multi-line text */}
                            {/* Unified layout animation with sleek spring physics - no stagger */}
                            <motion.div
                                layout="position"
                                style={{
                                    display: "flex",
                                    gap: "6px",
                                    alignItems: "flex-end",
                                    flexShrink: 0,
                                    pointerEvents: isDisconnecting ? "none" : "auto",
                                    // iOS Safari: visibility:hidden is more reliable than pointerEvents:none
                                }}
                                transition={{
                                    layout: {
                                        duration: 0.2,
                                        ease: [0.4, 0.0, 0.2, 1], // Material Design Standard Easing
                                    }
                                }}
                            >
                                {/* Send Button */}
                                <IconButton
                                    variant={textInput.trim() ? "default" : "ghost"}
                                    size="md"
                                    disabled={!textInput.trim()}
                                    aria-label="Send message"
                                    onClick={handleSend}
                                    withEntryAnimation={!isDesignMode}
                                    focusRingColor={triggerButton.focus}
                                    backgroundColor={textInput.trim() ? btnSend?.bg : undefined}
                                    textColor={textInput.trim() ? btnSend?.text : undefined}
                                >
                                    {renderIcon(finalIconSend, IconSend, 16)}
                                </IconButton>

                                {/* Mic Toggle Button - with pulse animation during initialization */}
                                <motion.div
                                    animate={
                                        state === "connecting" || state === "initializing"
                                            ? { opacity: [1, 0.5, 1] }
                                            : { opacity: 1 }
                                    }
                                    transition={
                                        state === "connecting" || state === "initializing"
                                            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                                            : { duration: 0.15 }
                                    }
                                    style={{
                                        // iOS Safari: Block touch events during disconnect to prevent bleed-through
                                        pointerEvents: isDisconnecting ? "none" : "auto",
                                    }}
                                >
                                    <IconButton
                                        variant="secondary"
                                        size="md"
                                        disabled={state === "connecting" || state === "initializing" || isDisconnecting}
                                        aria-label={isVoiceMode && isConnected ? "Switch to text mode" : "Switch to voice mode"}
                                        onClick={handleMicClick}
                                        withEntryAnimation={!isDesignMode}
                                        focusRingColor={triggerButton.focus}
                                        backgroundColor={btnMic?.bg}
                                        textColor={btnMic?.text}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isVoiceMode && isConnected ? (
                                                <motion.div
                                                    key="mic-off"
                                                    initial={isDesignMode ? false : { opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{
                                                        duration: 0.15,
                                                        ease: [0.4, 0.0, 0.2, 1], // Material Design Standard Easing
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    {renderIcon(finalIconMicOff, IconMicOff, 16)}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="waveform"
                                                    initial={isDesignMode ? false : { opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{
                                                        duration: 0.15,
                                                        ease: [0.4, 0.0, 0.2, 1], // Material Design Standard Easing
                                                    }}
                                                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    {renderIcon(finalIconMic, IconWaveform, 16)}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </IconButton>
                                </motion.div>

                                {/* End Call button - DESIGN MODE: Always visible */}
                                <AnimatePresence>
                                    {(isDesignMode || displayState !== "disconnected") && (
                                        <motion.div
                                            layout="position"
                                            initial={isDesignMode ? false : { opacity: 0, width: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, width: "auto", scale: 1 }}
                                            exit={{ opacity: 0, width: 0, scale: 0.9 }}
                                            transition={{
                                                duration: 0.2,
                                                ease: [0.4, 0.0, 0.2, 1], // Material Design Standard Easing
                                                opacity: { duration: 0.15 },
                                                width: { duration: 0.2 },
                                            }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <IconButton
                                                variant="destructive"
                                                size="md"
                                                aria-label="End call"
                                                onClick={handleDisconnect}
                                                focusRingColor={triggerButton.focus}
                                                backgroundColor={btnEnd?.bg}
                                                textColor={btnEnd?.text}
                                            >
                                                {renderIcon(finalIconEnd, IconDisconnect, 16)}
                                            </IconButton>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </ChatInput>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button - hidden in overlay mode when chat is visible */}
            {!(isMobileOverlay && isVisible) && (<div style={{ position: "relative", zIndex: 9999 }}>
                <TriggerButtonBase
                    label={isVisible ? labelOpen : labelClosed}
                    ariaLabel={isVisible ? "Close chat" : "Open chat"}
                    variant={triggerButtonVariant}
                    size="lg"
                    icon={
                        <TriggerHeatmapIcon
                            size={40}
                            enabled={heatmapEnabled}
                            width={heatmapWidth}
                            height={heatmapHeight}
                            borderRadius={heatmapBorderRadius}
                            background={triggerBg}
                            image={heatmapImage || image}
                            colors={heatmapColors}
                            colorBack="transparent"
                            scale={heatmapScale}
                            speed={heatmapSpeed}
                            angle={heatmapAngle}
                            noise={heatmapNoise}
                            innerGlow={heatmapInnerGlow}
                            outerGlow={heatmapOuterGlow}
                            contour={heatmapContour}
                            fit={heatmapFit}
                            audioReactivity={heatmapAudioReactivity}
                            bassToInnerGlow={heatmapBassToInnerGlow}
                            midToOuterGlow={heatmapMidToOuterGlow}
                            trebleToContour={heatmapTrebleToContour}
                            volumeToAngle={heatmapVolumeToAngle}
                            isDesignMode={isDesignMode}
                        />
                    }
                    onClick={() => setIsVisible(!isVisible)}
                    backgroundColor={triggerBg}
                    textColor={triggerText}
                    focusRingColor={triggerFocus}
                    padding={triggerPadding}
                    borderRadius={triggerBorderRadius}
                    gap={triggerGap}
                    labelFont={triggerFont}
                    labelFontFallback={{ size: 14, weight: 600 }}
                    style={{ height: "48px" }}
                />
            </div>)}
        </div>
    )
}

// displayName for DevTools debugging
ElevenLabsVoiceChatCore.displayName = "ElevenLabsVoiceChat"


// --- INLINE: ChatInput (Framer-compatible, no Radix) ---

interface ChatInputProps {
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
    inputBorderWidth?: number
    inputBorderColor?: string
    inputBorderStyle?: string
    isFocused: boolean
    textareaRef: React.RefObject<HTMLTextAreaElement | null>
    children?: React.ReactNode
}

const ChatInput = React.memo<ChatInputProps>(({
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
    inputBorderWidth = 0,
    inputBorderColor = "transparent",
    inputBorderStyle = "solid",
    isFocused,
    textareaRef,
    children,
}) => {
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

    const chatInputAreaStyle: React.CSSProperties = {
        padding: "16px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-end",
    }

    const chatInputContainerStyle: React.CSSProperties = {
        flex: 1,
        display: "flex",
        alignItems: "center",
        borderRadius: "24px",
        padding: "6px 6px 6px 20px",
        minHeight: "48px",
        boxSizing: "border-box",
    }

    const chatTextInputStyle: React.CSSProperties = {
        flex: 1,
        padding: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        fontFamily: "inherit",
        fontSize: "15px",
        alignSelf: "center",
    }

    return (
        <div style={chatInputAreaStyle}>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <div
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        ...chatInputContainerStyle,
                        backgroundColor: inputBgColor,
                        padding: "6px 6px 6px 16px",
                        gap: "8px",
                        minHeight: "44px",
                        alignItems: "flex-end",
                        position: "relative",
                        border: inputBorderWidth > 0
                            ? `${inputBorderWidth}px ${inputBorderStyle} ${inputBorderColor}`
                            : `1px solid ${isFocused
                                ? (theme.focusRing || 'rgba(255,255,255,0.3)')
                                : isHovered
                                    ? (theme.border || 'rgba(255,255,255,0.15)')
                                    : 'transparent'
                            }`,
                        outline: `2px solid ${isFocused
                            ? (theme.focusRing || 'rgba(255,255,255,0.15)')
                            : 'transparent'}`,
                        outlineOffset: "2px",
                        transition: "border-color 0.15s ease-in-out, outline-color 0.15s ease-in-out",
                    }}>
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
                        style={{
                            ...chatTextInputStyle,
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
                    {children}
                    {error && (
                        <div style={{
                            fontSize: "12px",
                            color: "hsl(0 84.2% 60.2%)",
                            marginTop: "4px",
                            marginLeft: "16px",
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
})

ChatInput.displayName = "ChatInput"



// --- MAIN FRAMER WRAPPER ---
function ElevenLabsVoiceChat(props: any) {
    // Extract nested sounds object and map to flat props expected by core component
    const { sounds, customSounds, ...restProps } = props

    // Only apply sound props if custom sounds are enabled
    const soundProps = customSounds && sounds ? {
        soundInitializing: sounds.initializing,
        soundConnecting: sounds.connecting,
        soundThinking: sounds.thinking,
        soundListening: sounds.listening,
        soundError: sounds.error,
        soundDisconnected: sounds.disconnected,
    } : {}

    return (
        <ElevenLabsVoiceChatCore
            {...restProps}
            {...soundProps}
            isDesignMode={RenderTarget.current() === RenderTarget.canvas}
        />
    )
}

addPropertyControls(ElevenLabsVoiceChat, {
    // ════════════════════════════════════════════════════════════════════════
    // AGENT CONFIGURATION
    // ════════════════════════════════════════════════════════════════════════
    agentId: {
        type: ControlType.String,
        title: "Agent ID",
        defaultValue: "",
        placeholder: "Enter ElevenLabs Agent ID",
        description: "Your ElevenLabs Conversational AI Agent ID"
    },
    startWithText: {
        type: ControlType.Boolean,
        title: "Start with Text",
        defaultValue: true,
        description: "Start in text-only mode (no mic permission on load)"
    },
    autoConnect: {
        type: ControlType.Boolean,
        title: "Auto Connect",
        defaultValue: false,
        description: "Automatically connect when component mounts"
    },
    debug: {
        type: ControlType.Boolean,
        title: "Debug Mode",
        defaultValue: false,
        description: "Log detailed events to browser console"
    },
    displayMode: {
        type: ControlType.Enum,
        title: "Display Mode",
        defaultValue: "default",
        options: ["default", "mobileOverlay"],
        optionTitles: ["Default", "Mobile Overlay"],
        description: "Default: chat opens above button. Mobile Overlay: fullscreen overlay with close button"
    },

    // ════════════════════════════════════════════════════════════════════════
    // TRIGGER BUTTON
    // ════════════════════════════════════════════════════════════════════════
    triggerButton: {
        type: ControlType.Object,
        title: "Trigger Button",
        icon: "interact",
        controls: {
            bg: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
            focusRing: { type: ControlType.Color, title: "Focus Ring", defaultValue: "rgba(255,255,255,0.4)" },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 28,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            // Border (using Framer's Border control type)
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "rgba(255,255,255,0.2)",
                },
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "4px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 24,
                step: 1,
                unit: "px",
                description: "Space between icon and label"
            },
            labelOpen: {
                type: ControlType.String,
                title: "Label (Open)",
                defaultValue: "Close",
                description: "Text when chat is open"
            },
            labelClosed: {
                type: ControlType.String,
                title: "Label (Closed)",
                defaultValue: "Chat",
                description: "Text when chat is closed"
            },
            font: { type: ControlType.Font, title: "Font", controls: "extended" },
            betaText: {
                type: ControlType.String,
                title: "Beta Text",
                defaultValue: "",
                placeholder: "Optional beta warning message",
                description: "Text shown below the button (leave empty to hide)"
            },
            betaTextColor: { type: ControlType.Color, title: "Beta Text Color", defaultValue: "#71717A" },
        }
    },

    // ════════════════════════════════════════════════════════════════════════
    // VISUALIZER (in Trigger Button)
    // ════════════════════════════════════════════════════════════════════════
    heatmap: {
        type: ControlType.Object,
        title: "Visualizer",
        icon: "effect",
        controls: {
            // Effect toggle
            enabled: {
                type: ControlType.Boolean,
                title: "Effect Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Toggle shader effect on/off (static image when off)"
            },
            // Image source
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                description: "Source image for heatmap effect"
            },
            // Size controls
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 100,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                displayStepper: true,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 100,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                displayStepper: true,
            },
            // Border radius for masking
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 50,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                description: "50% = fully circular"
            },
            // Sizing (shader-specific, hidden when disabled)
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0.6,
                min: 0.1,
                max: 2,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            // Colors (hidden when disabled)
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0d1117",
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            colors: {
                type: ControlType.Array,
                title: "Gradient Colors",
                control: { type: ControlType.Color },
                defaultValue: ["#11206A", "#1F3BA2", "#2F63E7", "#6BD7FF", "#FFE679", "#FF991E", "#FF4C00"],
                maxCount: 10,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            // Animation (hidden when disabled)
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.4,
                min: 0.1,
                max: 2,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 30,
                min: 0,
                max: 360,
                step: 5,
                unit: "°",
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            // Glow Effects (hidden when disabled)
            innerGlow: {
                type: ControlType.Number,
                title: "Inner Glow",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            outerGlow: {
                type: ControlType.Number,
                title: "Outer Glow",
                defaultValue: 0.5,
                min: 0,
                max: 3,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            contour: {
                type: ControlType.Number,
                title: "Contour",
                defaultValue: 0.6,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            noise: {
                type: ControlType.Number,
                title: "Noise",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            // Audio Reactivity (hidden when disabled)
            audioReactivity: {
                type: ControlType.Number,
                title: "Audio Reactivity",
                defaultValue: 1.2,
                min: 0,
                max: 3,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            bassToInnerGlow: {
                type: ControlType.Number,
                title: "Bass → Glow",
                defaultValue: 0.5,
                min: 0,
                max: 2,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            midToOuterGlow: {
                type: ControlType.Number,
                title: "Mid → Outer",
                defaultValue: 0.8,
                min: 0,
                max: 2,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            trebleToContour: {
                type: ControlType.Number,
                title: "Treble → Contour",
                defaultValue: 0.3,
                min: 0,
                max: 2,
                step: 0.1,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
            volumeToAngle: {
                type: ControlType.Number,
                title: "Volume → Angle",
                defaultValue: 30,
                min: 0,
                max: 90,
                step: 5,
                hidden: (props: any) => props.heatmap?.enabled === false,
            },
        }
    },

    // ════════════════════════════════════════════════════════════════════════
    // THEME (Window Layout + Colors)
    // ════════════════════════════════════════════════════════════════════════
    theme: {
        type: ControlType.Object,
        title: "Theme",
        icon: "frame",
        controls: {
            // Window Layout
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 24,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            // Border (using Framer's Border control type)
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "rgba(255,255,255,0.2)",
                },
            },
            // Colors
            bg: { type: ControlType.Color, title: "Background", defaultValue: "#1C1C1C" },
            fg: { type: ControlType.Color, title: "Foreground", defaultValue: "#FFFFFF" },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6E6E6E" },
            focusRing: { type: ControlType.Color, title: "Focus Ring", defaultValue: "rgba(255,255,255,0.4)" },
        }
    },
    status: {
        type: ControlType.Object,
        title: "Status Colors",
        icon: "color",
        controls: {
            connected: { type: ControlType.Color, title: "Connected", defaultValue: "#22c55e" },
            connecting: { type: ControlType.Color, title: "Connecting", defaultValue: "#eab308" },
            thinking: { type: ControlType.Color, title: "Thinking", defaultValue: "#3b82f6" },
            disconnected: { type: ControlType.Color, title: "Disconnected", defaultValue: "#6E6E6E" },
            error: { type: ControlType.Color, title: "Error", defaultValue: "#ef4444" },
        }
    },

    // ════════════════════════════════════════════════════════════════════════
    // CHAT INTERFACE
    // ════════════════════════════════════════════════════════════════════════
    bubbles: {
        type: ControlType.Object,
        title: "Message Bubbles",
        icon: "object",
        controls: {
            userBg: { type: ControlType.Color, title: "User BG", defaultValue: "#FFFFFF" },
            userText: { type: ControlType.Color, title: "User Text", defaultValue: "#1C1C1C" },
            agentBg: { type: ControlType.Color, title: "Agent BG", defaultValue: "#2C2C2C" },
            agentText: { type: ControlType.Color, title: "Agent Text", defaultValue: "#FFFFFF" },
            iconCopy: { type: ControlType.ComponentInstance, title: "Copy Icon" },
            iconCheck: { type: ControlType.ComponentInstance, title: "Check Icon" },
            font: { type: ControlType.Font, title: "Font", controls: "extended" },
        }
    },
    input: {
        type: ControlType.Object,
        title: "Input Field",
        icon: "object",
        controls: {
            bg: { type: ControlType.Color, title: "Background", defaultValue: "#2C2C2C" },
            border: { type: ControlType.Border, title: "Border" },
            font: { type: ControlType.Font, title: "Font", controls: "extended" },
        }
    },

    // ════════════════════════════════════════════════════════════════════════
    // ACTION BUTTONS
    // ════════════════════════════════════════════════════════════════════════
    btnSend: {
        type: ControlType.Object,
        title: "Send Button",
        icon: "interact",
        controls: {
            bg: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
            icon: { type: ControlType.ComponentInstance, title: "Icon" },
        }
    },
    btnMic: {
        type: ControlType.Object,
        title: "Mic Button",
        icon: "interact",
        controls: {
            bg: { type: ControlType.Color, title: "Background", defaultValue: "transparent" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#A1A1AA" },
            icon: { type: ControlType.ComponentInstance, title: "Icon (Active)" },
            iconOff: { type: ControlType.ComponentInstance, title: "Icon (Muted)" },
        }
    },
    btnEnd: {
        type: ControlType.Object,
        title: "End Call Button",
        icon: "interact",
        controls: {
            bg: { type: ControlType.Color, title: "Background", defaultValue: "#DC2626" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FAFAFA" },
            icon: { type: ControlType.ComponentInstance, title: "Icon" },
        }
    },
    btnCall: {
        type: ControlType.Object,
        title: "Call Button",
        icon: "interact",
        description: "The 40x40 button above 'Start a conversation' text",
        controls: {
            bg: { type: ControlType.Color, title: "Background", defaultValue: "#27272A" },
            text: { type: ControlType.Color, title: "Icon Color", defaultValue: "#FAFAFA" },
            icon: { type: ControlType.ComponentInstance, title: "Icon" },
        }
    },
    fontStatus: {
        type: ControlType.Font,
        title: "Status Font",
        description: "Font for status text (Listening, Speaking, etc.)",
        controls: "extended",
    },

    // ════════════════════════════════════════════════════════════════════════
    // ICONS (Top-level for Framer Connector Node Support)
    // ════════════════════════════════════════════════════════════════════════
    iconSend: {
        type: ControlType.ComponentInstance,
        title: "Send Icon",
        description: "Custom icon for the send button"
    },
    iconMic: {
        type: ControlType.ComponentInstance,
        title: "Mic Icon (Active)",
        description: "Icon when microphone is active"
    },
    iconMicOff: {
        type: ControlType.ComponentInstance,
        title: "Mic Icon (Muted)",
        description: "Icon when microphone is muted"
    },
    iconDisconnect: {
        type: ControlType.ComponentInstance,
        title: "End Call Icon",
        description: "Icon for the end call button"
    },
    iconCall: {
        type: ControlType.ComponentInstance,
        title: "Call Button Icon",
        description: "Icon for the call button above 'Start a conversation'"
    },
    iconCopy: {
        type: ControlType.ComponentInstance,
        title: "Copy Icon",
        description: "Icon for copying message content"
    },
    iconCheck: {
        type: ControlType.ComponentInstance,
        title: "Check Icon",
        description: "Icon shown after copy is complete"
    },

    // ════════════════════════════════════════════════════════════════════════
    // SOUND EFFECTS
    // ════════════════════════════════════════════════════════════════════════
    customSounds: {
        type: ControlType.Boolean,
        title: "Custom Sounds",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
        description: "Use custom sound effects for status changes"
    },
    sounds: {
        type: ControlType.Object,
        title: "Sound Effects",
        icon: "effect",
        hidden: (props: any) => !props.customSounds,
        controls: {
            initializing: {
                type: ControlType.File,
                allowedFileTypes: ["mp3", "wav"],
                title: "Initializing",
            },
            connecting: {
                type: ControlType.File,
                allowedFileTypes: ["mp3", "wav"],
                title: "Connecting",
            },
            thinking: {
                type: ControlType.File,
                allowedFileTypes: ["mp3", "wav"],
                title: "Thinking",
            },
            listening: {
                type: ControlType.File,
                allowedFileTypes: ["mp3", "wav"],
                title: "Listening",
            },
            error: {
                type: ControlType.File,
                allowedFileTypes: ["mp3", "wav"],
                title: "Error",
            },
            disconnected: {
                type: ControlType.File,
                allowedFileTypes: ["mp3", "wav"],
                title: "Disconnected",
            },
        }
    },

    // ════════════════════════════════════════════════════════════════════════
    // VOICE SETTINGS
    // ════════════════════════════════════════════════════════════════════════
    voiceSettings: {
        type: ControlType.Object,
        title: "Voice Settings",
        icon: "object",
        hidden: (props: any) => props.startWithText,
        controls: {
            allowInterruptions: {
                type: ControlType.Boolean,
                title: "Allow Interruptions",
                defaultValue: true,
                description: "Allow user to interrupt agent"
            },
            turnEagerness: {
                type: ControlType.Enum,
                title: "Turn Eagerness",
                options: ["patient", "normal", "eager"],
                optionTitles: ["Patient", "Normal", "Eager"],
                defaultValue: "normal",
            },
            turnTimeout: {
                type: ControlType.Number,
                title: "Turn Timeout",
                defaultValue: 1.2,
                min: 0.5,
                max: 3.0,
                step: 0.1,
                unit: "s",
            },
            vadThreshold: {
                type: ControlType.Number,
                title: "VAD Threshold",
                defaultValue: 0.5,
                min: 0.3,
                max: 0.7,
                step: 0.05,
                description: "Voice detection sensitivity"
            },
            backgroundVoiceDetection: {
                type: ControlType.Boolean,
                title: "Background Detection",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Filter background noise (disable for iOS speaker echo)"
            },
        }
    },

    // ════════════════════════════════════════════════════════════════════════
    // CONTEXT & NAVIGATION
    // ════════════════════════════════════════════════════════════════════════
    shareContext: {
        type: ControlType.Boolean,
        title: "Share Context",
        defaultValue: true,
        description: "Send page info to agent"
    },
    autoScrapeContext: {
        type: ControlType.Boolean,
        title: "Auto Scrape",
        defaultValue: false,
        hidden: (props: any) => !props.shareContext,
        description: "Allow agent to read page content"
    },
    contextAllowlist: {
        type: ControlType.Array,
        title: "Context Fields",
        hidden: (props: any) => !props.shareContext,
        control: {
            type: ControlType.Enum,
            options: ["visitorState", "currentPage", "previousPage", "visitHistory", "navigationState"],
            optionTitles: ["Visitor History", "Current Page", "Previous Page", "Visit History", "Available Links"]
        },
        description: "Select specific context to share"
    },
    linkRegistry: {
        type: ControlType.Array,
        title: "Page Links",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name" },
                path: { type: ControlType.Link, title: "Link" }
            }
        },
        description: "Pages the agent can navigate to"
    },
})

export default ElevenLabsVoiceChat
