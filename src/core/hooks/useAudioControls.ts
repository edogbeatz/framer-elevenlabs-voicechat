/**
 * useAudioControls - Audio control functions for ElevenLabs sessions
 * 
 * Extracts audio control logic from useElevenLabsSession for better separation of concerns.
 */

import { useCallback } from "react"
import type { ElevenLabsSession } from "../types"

export interface UseAudioControlsOptions {
    sessionRef: React.RefObject<ElevenLabsSession | null>
}

export interface UseAudioControlsReturn {
    setMicMuted: (muted: boolean) => void
    setVolume: (volume: number) => void
    getOutputVolume: () => number
    getInputVolume: () => number
    getOutputByteFrequencyData: () => Uint8Array | null
}

export function useAudioControls(options: UseAudioControlsOptions): UseAudioControlsReturn {
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

export default useAudioControls
