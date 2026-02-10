/**
 * useSessionConnection - Connection lifecycle management for ElevenLabs sessions
 * 
 * Handles connect/disconnect, retry logic, WebRTC→WebSocket fallback,
 * and session event handlers.
 */

import { useState, useRef, useCallback, useEffect } from "react"
import type {
    AgentState,
    ElevenLabsSession,
    SDKError,
    SDKModeChange,
    SDKMessage,
    DisconnectDetails,
    VisitorState,
    VisitorHistory,
    LinkRegistryItem
} from "../types"
import { getConversation } from "../utils/elevenLabsClient"
import { getCachedStorage, setCachedStorage } from "../utils/storage"
import type { ClientToolsRegistry } from "./useClientTools"

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

        // Play a longer silent buffer (400ms) to fully activate audio pipeline
        // Mobile devices need more time to initialize audio output, preventing first words cutoff
        const sampleRate = globalAudioContext.sampleRate || 22050
        const bufferLength = Math.floor(sampleRate * 0.4) // 400ms - extended for mobile reliability
        const buffer = globalAudioContext.createBuffer(1, bufferLength, sampleRate)
        const source = globalAudioContext.createBufferSource()
        source.buffer = buffer
        source.connect(globalAudioContext.destination)
        source.start(0)

        // Wait for the buffer to finish plus settling time before proceeding
        // 500ms total ensures audio pipeline is fully active on all mobile browsers
        await new Promise(resolve => setTimeout(resolve, 500))

        if (debug) console.log("[ElevenLabs] Mobile audio context warmed up")
    } catch (e) {
        console.warn("[ElevenLabs] Mobile audio warm-up failed:", e)
    }
}

export interface UseSessionConnectionOptions {
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

export interface UseSessionConnectionReturn {
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

export function useSessionConnection(options: UseSessionConnectionOptions): UseSessionConnectionReturn {
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
        retryCountRef.current = 0  // Reset so each user-initiated click gets a fresh retry budget
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
                                // iOS Safari: 0.85 - CRITICAL for echo prevention (no hardware AEC)
                                // Other platforms: 0.7 - still strict for background voice filtering
                                vad_threshold: isIOSSafari() ? 0.85 : Math.max(vadThreshold, 0.7),

                                // Filter brief noise bursts and background chatter
                                // iOS Safari: 500ms to prevent echo from TTS bleeding into mic
                                // Other platforms: 300ms for sustained speech detection
                                min_speech_duration_ms: isIOSSafari() ? 500 : 300,

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

                        // CRITICAL FIX: Set flag IMMEDIATELY to block any pending mode changes
                        // This prevents race condition where onModeChange fires after disconnect begins
                        userRequestedDisconnectRef.current = true

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
                                    // CRITICAL FIX: Check disconnect flag during debounce callback
                                    // State could have changed to disconnected during the 600ms delay
                                    if (userRequestedDisconnectRef.current || stateRef.current === "disconnected") {
                                        return  // Don't update state if disconnect has begun
                                    }

                                    const outputVol = conversationRef.current?.getOutputVolume?.() || 0
                                    if ((stateRef.current as string) !== "disconnected" && outputVol < 0.01) {
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
            // SAFETY NET: If isConnectingRef is still true after 15s, force-reset
            // Covers edge cases where fallback chains fail silently (e.g., unmount during retry)
            setTimeout(() => {
                if (isConnectingRef.current) {
                    isConnectingRef.current = false
                    if (debug) console.warn("[ElevenLabs] Safety: reset stale isConnectingRef after 15s")
                }
            }, 15000)
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

export default useSessionConnection
