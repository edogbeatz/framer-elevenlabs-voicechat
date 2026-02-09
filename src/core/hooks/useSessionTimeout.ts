/**
 * useSessionTimeout - Inactivity detection and auto-disconnect for ElevenLabs sessions
 * 
 * Prevents runaway sessions and credit drainage by automatically disconnecting
 * after a configurable period of user inactivity.
 */

import { useEffect, useRef, useCallback } from "react"

export interface UseSessionTimeoutOptions {
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

export interface UseSessionTimeoutReturn {
    /** Reset the inactivity timer (call on user activity) */
    resetTimer: () => void

    /** Get remaining time until timeout in milliseconds */
    getRemainingTime: () => number
}

// Default timeouts
const DEFAULT_TEXT_TIMEOUT = 3 * 60 * 1000  // 3 minutes
const DEFAULT_VOICE_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const DEFAULT_WARNING_TIME = 30 * 1000      // 30 seconds

export function useSessionTimeout(options: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
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

export default useSessionTimeout
