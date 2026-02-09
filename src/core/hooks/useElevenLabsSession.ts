/**
 * useElevenLabsSession - Shared hook for ElevenLabs agent session management
 * 
 * This is the FACADE that composes smaller, focused hooks while maintaining
 * a stable public API for consumers (ElevenLabsVoiceChat, ConversationButton).
 */

import { useCallback, useEffect, useRef } from "react"
import type { AgentState, LinkRegistryItem, ChatMessage } from "../types"
import { useClientTools } from "./useClientTools"
import { useAudioControls } from "./useAudioControls"
import { useSessionConnection } from "./useSessionConnection"
import { useChatMessages } from "./useChatMessages"
import { useSessionTimeout } from "./useSessionTimeout"
import { generateMessageId } from "../utils/messageId"
import { generateSessionId } from "../utils/sessionId"

// --- Types ---

// --- Constants ---
const MESSAGES_STORAGE_KEY = "ael_chat_messages:v1"

export interface UseElevenLabsSessionOptions {
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

export interface UseElevenLabsSessionReturn {
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

export function useElevenLabsSession(options: UseElevenLabsSessionOptions): UseElevenLabsSessionReturn {
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

export default useElevenLabsSession
