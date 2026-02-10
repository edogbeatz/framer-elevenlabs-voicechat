import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionConnection } from '../useSessionConnection'
import type { AgentState } from '../../types'

// Mock the ElevenLabs client
vi.mock('../../utils/elevenLabsClient', () => ({
    getConversation: vi.fn(() => Promise.resolve({
        startSession: vi.fn(() => Promise.resolve({
            endSession: vi.fn(),
            setVolume: vi.fn(),
            setMicMuted: vi.fn(),
            sendUserMessage: vi.fn(),
            sendText: vi.fn(),
            getOutputVolume: vi.fn(() => 0),
        }))
    }))
}))

// Mock storage utilities
vi.mock('../../utils/storage', () => ({
    getCachedStorage: vi.fn(() => null),
    setCachedStorage: vi.fn()
}))

describe('useSessionConnection', () => {
    const createDefaultOptions = () => ({
        agentId: 'test-agent-id',
        debug: false,
        startWithText: true,
        shareContext: true,
        contextAllowlist: [],
        linkRegistry: [],
        allowInterruptions: true,
        turnEagerness: 'normal' as const,
        turnTimeout: 1.2,
        vadThreshold: 0.5,
        backgroundVoiceDetection: true,
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onMessage: vi.fn(),
        onError: vi.fn(),
        addLog: vi.fn(),
        clientTools: {},
        navigationStateRef: { current: { currentPage: 'Home', visitHistory: ['Home'] } }
    })

    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        localStorage.clear()
    })

    describe('initial state', () => {
        it('starts with disconnected state', () => {
            const { result } = renderHook(() => useSessionConnection(createDefaultOptions()))

            expect(result.current.state).toBe('disconnected')
            expect(result.current.error).toBe('')
            expect(result.current.isConnected).toBe(false)
        })

        it('initializes isVoiceMode based on startWithText', () => {
            const options = createDefaultOptions()
            options.startWithText = true

            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.isVoiceMode).toBe(false)
        })

        it('sets isVoiceMode true when startWithText is false', () => {
            const options = createDefaultOptions()
            options.startWithText = false

            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.isVoiceMode).toBe(true)
        })
    })

    describe('connect', () => {
        it('sets error when no agentId provided', async () => {
            const options = createDefaultOptions()
            options.agentId = ''

            const { result } = renderHook(() => useSessionConnection(options))

            await act(async () => {
                await result.current.connect()
            })

            expect(result.current.error).toBe('No Agent ID')
        })

        it('prevents double connection', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            // First connect
            act(() => {
                result.current.connect()
            })

            // Try second connect while connecting - should be no-op
            const secondConnect = result.current.connect()

            expect(secondConnect).resolves.toBeUndefined()
        })

        it('transitions to connecting state in text mode', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.connect({ textMode: true })
            })

            expect(result.current.state).toBe('connecting')
        })

        it('transitions to initializing state in voice mode', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.connect({ textMode: false })
            })

            expect(result.current.state).toBe('initializing')
        })
    })

    describe('disconnect', () => {
        it('does nothing when already disconnected', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.disconnect()
            })

            // Should still be disconnected, no errors
            expect(result.current.state).toBe('disconnected')
            expect(options.onDisconnect).not.toHaveBeenCalled()
        })

        it('calls onDisconnect callback', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            // Simulate connected state via setStateSafe
            act(() => {
                result.current.setStateSafe('connected')
            })

            act(() => {
                result.current.disconnect()
            })

            expect(options.onDisconnect).toHaveBeenCalled()
        })

        it('resets error state', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            // Set to connected first
            act(() => {
                result.current.setStateSafe('connected')
            })

            act(() => {
                result.current.disconnect()
            })

            expect(result.current.error).toBe('')
        })
    })

    describe('setStateSafe', () => {
        it('updates state when different from current', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setStateSafe('connected')
            })

            expect(result.current.state).toBe('connected')
        })

        it('does not trigger re-render when same state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            // Set to disconnected (same as initial)
            const initialRef = result.current.stateRef

            act(() => {
                result.current.setStateSafe('disconnected')
            })

            // Should be same reference (no unnecessary update)
            expect(result.current.stateRef).toBe(initialRef)
        })
    })

    describe('sendText', () => {
        it('logs warning when not connected', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            await act(async () => {
                await result.current.sendText('Hello')
            })

            expect(options.addLog).toHaveBeenCalledWith(
                'Cannot send text: not connected',
                'warn'
            )
        })
    })

    describe('isConnected derived state', () => {
        it('returns true for connected state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setStateSafe('connected')
            })

            expect(result.current.isConnected).toBe(true)
        })

        it('returns true for listening state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setStateSafe('listening')
            })

            expect(result.current.isConnected).toBe(true)
        })

        it('returns true for speaking state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setStateSafe('speaking')
            })

            expect(result.current.isConnected).toBe(true)
        })

        it('returns true for thinking state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setStateSafe('thinking')
            })

            expect(result.current.isConnected).toBe(true)
        })

        it('returns false for disconnected state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.isConnected).toBe(false)
        })

        it('returns false for connecting state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setStateSafe('connecting')
            })

            expect(result.current.isConnected).toBe(false)
        })
    })

    describe('refs', () => {
        it('provides sessionRef', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.sessionRef).toBeDefined()
            expect(result.current.sessionRef.current).toBeNull()
        })

        it('provides stateRef that tracks state', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.stateRef.current).toBe('disconnected')

            act(() => {
                result.current.setStateSafe('connected')
            })

            expect(result.current.stateRef.current).toBe('connected')
        })

        it('provides isVoiceModeRef', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.isVoiceModeRef).toBeDefined()
        })

        it('provides errorType', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.errorType).toBeNull()
        })

        it('provides retryConnect function', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.retryConnect).toBeDefined()
            expect(typeof result.current.retryConnect).toBe('function')
        })

        it('provides disconnectAfterSpeakingRef', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.disconnectAfterSpeakingRef).toBeDefined()
            expect(result.current.disconnectAfterSpeakingRef.current).toBe(false)
        })
    })

    describe('setIsVoiceMode', () => {
        it('allows changing voice mode', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            act(() => {
                result.current.setIsVoiceMode(true)
            })

            expect(result.current.isVoiceMode).toBe(true)
        })
    })

    describe('sendUserActivity', () => {
        it('is defined as a function', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            expect(result.current.sendUserActivity).toBeDefined()
            expect(typeof result.current.sendUserActivity).toBe('function')
        })

        it('does not throw when session is not connected', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useSessionConnection(options))

            // Should not throw even when not connected
            expect(() => {
                act(() => {
                    result.current.sendUserActivity()
                })
            }).not.toThrow()
        })
    })
})
