/**
 * Tests for useSessionTimeout hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionTimeout } from '../useSessionTimeout'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('useSessionTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('should call onTimeout after configured timeout in text mode', async () => {
        const onTimeout = vi.fn()
        const textTimeout = 5000 // 5 seconds

        const { result } = renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: false,
                isConnected: true,
                textModeTimeout: textTimeout,
                voiceModeTimeout: 3000,
                onTimeout,
            })
        )

        expect(onTimeout).not.toHaveBeenCalled()

        // Fast-forward time to just before timeout
        act(() => {
            vi.advanceTimersByTime(textTimeout - 100)
        })
        expect(onTimeout).not.toHaveBeenCalled()

        // Fast-forward to timeout
        act(() => {
            vi.advanceTimersByTime(100)
        })
        expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('should call onTimeout after configured timeout in voice mode', async () => {
        const onTimeout = vi.fn()
        const voiceTimeout = 3000 // 3 seconds

        const { result } = renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: true,
                isConnected: true,
                textModeTimeout: 5000,
                voiceModeTimeout: voiceTimeout,
                onTimeout,
            })
        )

        expect(onTimeout).not.toHaveBeenCalled()

        // Fast-forward to timeout
        act(() => {
            vi.advanceTimersByTime(voiceTimeout)
        })
        expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('should reset timer when resetTimer is called', () => {
        const onTimeout = vi.fn()
        const timeout = 5000

        const { result } = renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: false,
                isConnected: true,
                textModeTimeout: timeout,
                voiceModeTimeout: 3000,
                onTimeout,
            })
        )

        // Advance to just before timeout
        act(() => {
            vi.advanceTimersByTime(timeout - 1000)
        })
        expect(onTimeout).not.toHaveBeenCalled()

        // Reset timer (simulating user activity)
        act(() => {
            result.current.resetTimer()
        })

        // Advance by original remaining time - should NOT timeout
        act(() => {
            vi.advanceTimersByTime(1000)
        })
        expect(onTimeout).not.toHaveBeenCalled()

        // Advance to new timeout
        act(() => {
            vi.advanceTimersByTime(timeout)
        })
        expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('should call onWarning before timeout', () => {
        const onTimeout = vi.fn()
        const onWarning = vi.fn()
        const timeout = 10000
        const warningTime = 2000

        const { result } = renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: false,
                isConnected: true,
                textModeTimeout: timeout,
                voiceModeTimeout: 5000,
                onTimeout,
                onWarning,
                warningTime,
            })
        )

        expect(onWarning).not.toHaveBeenCalled()
        expect(onTimeout).not.toHaveBeenCalled()

        // Advance to warning time (timeout - warningTime)
        act(() => {
            vi.advanceTimersByTime(timeout - warningTime)
        })
        expect(onWarning).toHaveBeenCalledTimes(1)
        expect(onTimeout).not.toHaveBeenCalled()

        // Advance to timeout
        act(() => {
            vi.advanceTimersByTime(warningTime)
        })
        expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('should not start timer when disabled', () => {
        const onTimeout = vi.fn()

        renderHook(() =>
            useSessionTimeout({
                enabled: false,
                isVoiceMode: false,
                isConnected: true,
                textModeTimeout: 1000,
                voiceModeTimeout: 1000,
                onTimeout,
            })
        )

        // Advance time way past timeout
        act(() => {
            vi.advanceTimersByTime(10000)
        })

        expect(onTimeout).not.toHaveBeenCalled()
    })

    it('should not start timer when not connected', () => {
        const onTimeout = vi.fn()

        renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: false,
                isConnected: false,
                textModeTimeout: 1000,
                voiceModeTimeout: 1000,
                onTimeout,
            })
        )

        // Advance time way past timeout
        act(() => {
            vi.advanceTimersByTime(10000)
        })

        expect(onTimeout).not.toHaveBeenCalled()
    })

    it('should restart timer when mode changes', () => {
        const onTimeout = vi.fn()
        const textTimeout = 5000
        const voiceTimeout = 3000

        const { rerender } = renderHook(
            ({ isVoiceMode }) =>
                useSessionTimeout({
                    enabled: true,
                    isVoiceMode,
                    isConnected: true,
                    textModeTimeout: textTimeout,
                    voiceModeTimeout: voiceTimeout,
                    onTimeout,
                }),
            { initialProps: { isVoiceMode: false } }
        )

        // Advance in text mode
        act(() => {
            vi.advanceTimersByTime(2000)
        })

        // Switch to voice mode
        rerender({ isVoiceMode: true })

        // Should reset timer and use voice timeout (3s)
        act(() => {
            vi.advanceTimersByTime(voiceTimeout)
        })
        expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('should return remaining time correctly', () => {
        const onTimeout = vi.fn()
        const timeout = 10000

        const { result } = renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: false,
                isConnected: true,
                textModeTimeout: timeout,
                voiceModeTimeout: 5000,
                onTimeout,
            })
        )

        // Initial remaining time should be close to timeout
        const initialRemaining = result.current.getRemainingTime()
        expect(initialRemaining).toBeGreaterThan(timeout - 100)
        expect(initialRemaining).toBeLessThanOrEqual(timeout)

        // Advance time
        act(() => {
            vi.advanceTimersByTime(3000)
        })

        const remainingAfter3s = result.current.getRemainingTime()
        expect(remainingAfter3s).toBeGreaterThan(timeout - 3100)
        expect(remainingAfter3s).toBeLessThanOrEqual(timeout - 3000)
    })

    it('should clean up timers on unmount', () => {
        const onTimeout = vi.fn()

        const { unmount } = renderHook(() =>
            useSessionTimeout({
                enabled: true,
                isVoiceMode: false,
                isConnected: true,
                textModeTimeout: 5000,
                voiceModeTimeout: 3000,
                onTimeout,
            })
        )

        // Unmount before timeout
        act(() => {
            unmount()
        })

        // Advance time past timeout
        act(() => {
            vi.advanceTimersByTime(10000)
        })

        // Should not have called timeout because cleanup happened
        expect(onTimeout).not.toHaveBeenCalled()
    })
})
