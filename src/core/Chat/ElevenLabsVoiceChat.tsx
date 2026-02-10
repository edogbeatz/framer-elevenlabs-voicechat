import * as React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"

declare const process: { env: { [key: string]: string } };
import { motion, AnimatePresence } from "framer-motion"

import {
    type ElevenLabsVoiceChatProps,
    type AgentState,
    type ChatMessage,
} from "../types"

import { useAgentNavigation } from "../hooks/useAgentNavigation"
import { useElevenLabsSession } from "../hooks/useElevenLabsSession"
import { generateMessageId } from "../utils/messageId"
import { resolveFontStyles } from "../utils/resolveFont"
import { preloadConversation } from "../utils/elevenLabsClient"

import ShimmeringText from "../Visualizers/ShimmeringText"
import { ChatMessageBubble, ChatHeader, IconButton, ChatInput, TriggerButtonBase, TriggerHeatmapIcon } from "./components"
import {
    IconSend, IconWaveform,
    IconDisconnect, IconMicOff
} from "./components/icons"



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

export default function ElevenLabsVoiceChatCore(props: ElevenLabsVoiceChatProps & { isDesignMode?: boolean }) {
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
        zIndex: 9998, // Above backdrop (9997), below trigger (9999)
        border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
        ...style,
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
        <div style={{ position: "relative", minWidth: "fit-content", minHeight: "48px", display: "flex", flexDirection: "column", alignItems: "flex-end", boxSizing: "border-box" }}>
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
                )
                }
            </AnimatePresence >

            {/* Trigger Button - hidden in overlay mode when chat is visible */}
            {
                !(isMobileOverlay && isVisible) && (<div style={{ position: "relative", zIndex: 9999 }}>
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
                </div>)
            }
        </div >
    )
}

// displayName for DevTools debugging
ElevenLabsVoiceChatCore.displayName = "ElevenLabsVoiceChat"
