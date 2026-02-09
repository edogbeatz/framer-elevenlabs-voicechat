import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAudioControls } from '../useAudioControls'
import type { ElevenLabsSession } from '../../types'

describe('useAudioControls', () => {
    const createMockSession = (overrides: Partial<ElevenLabsSession> = {}): ElevenLabsSession => ({
        endSession: vi.fn(),
        setMicMuted: vi.fn(),
        setVolume: vi.fn(),
        getOutputVolume: vi.fn(() => 0.5),
        getInputVolume: vi.fn(() => 0.3),
        getOutputByteFrequencyData: vi.fn(() => new Uint8Array([1, 2, 3])),
        ...overrides
    })

    describe('setMicMuted', () => {
        it('calls session.setMicMuted with correct value', () => {
            const mockSession = createMockSession()
            const sessionRef = { current: mockSession }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            result.current.setMicMuted(true)

            expect(mockSession.setMicMuted).toHaveBeenCalledWith(true)
        })

        it('does not throw when session is null', () => {
            const sessionRef = { current: null }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))

            expect(() => result.current.setMicMuted(true)).not.toThrow()
        })
    })

    describe('setVolume', () => {
        it('calls session.setVolume with volume object', () => {
            const mockSession = createMockSession()
            const sessionRef = { current: mockSession }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            result.current.setVolume(0.8)

            expect(mockSession.setVolume).toHaveBeenCalledWith({ volume: 0.8 })
        })

        it('does not throw when session is null', () => {
            const sessionRef = { current: null }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))

            expect(() => result.current.setVolume(0.5)).not.toThrow()
        })
    })

    describe('getOutputVolume', () => {
        it('returns session output volume', () => {
            const mockSession = createMockSession({
                getOutputVolume: vi.fn(() => 0.75)
            })
            const sessionRef = { current: mockSession }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            const volume = result.current.getOutputVolume()

            expect(volume).toBe(0.75)
        })

        it('returns 0 when session is null', () => {
            const sessionRef = { current: null }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            const volume = result.current.getOutputVolume()

            expect(volume).toBe(0)
        })
    })

    describe('getInputVolume', () => {
        it('returns session input volume', () => {
            const mockSession = createMockSession({
                getInputVolume: vi.fn(() => 0.42)
            })
            const sessionRef = { current: mockSession }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            const volume = result.current.getInputVolume()

            expect(volume).toBe(0.42)
        })

        it('returns 0 when session is null', () => {
            const sessionRef = { current: null }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            const volume = result.current.getInputVolume()

            expect(volume).toBe(0)
        })
    })

    describe('getOutputByteFrequencyData', () => {
        it('returns session frequency data', () => {
            const expectedData = new Uint8Array([10, 20, 30, 40])
            const mockSession = createMockSession({
                getOutputByteFrequencyData: vi.fn(() => expectedData)
            })
            const sessionRef = { current: mockSession }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            const data = result.current.getOutputByteFrequencyData()

            expect(data).toBe(expectedData)
        })

        it('returns null when session is null', () => {
            const sessionRef = { current: null }

            const { result } = renderHook(() => useAudioControls({ sessionRef }))
            const data = result.current.getOutputByteFrequencyData()

            expect(data).toBeNull()
        })
    })
})
