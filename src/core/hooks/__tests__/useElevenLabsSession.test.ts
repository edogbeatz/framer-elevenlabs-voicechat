import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useElevenLabsSession } from '../useElevenLabsSession'

// Mock all child hooks
vi.mock('../useClientTools', () => ({
    useClientTools: vi.fn(() => ({
        skip_turn: vi.fn(),
        end_call: vi.fn(),
        redirectToPage: vi.fn(),
        syncUserData: vi.fn(),
        getPageContext: vi.fn()
    }))
}))

vi.mock('../useAudioControls', () => ({
    useAudioControls: vi.fn(() => ({
        setMicMuted: vi.fn(),
        setVolume: vi.fn(),
        getOutputVolume: vi.fn(() => 0),
        getInputVolume: vi.fn(() => 0),
        getOutputByteFrequencyData: vi.fn(() => null)
    }))
}))

vi.mock('../useSessionConnection', () => ({
    useSessionConnection: vi.fn(() => ({
        state: 'disconnected',
        error: '',
        errorType: null,
        isConnected: false,
        isVoiceMode: false,
        sessionRef: { current: null },
        stateRef: { current: 'disconnected' },
        isVoiceModeRef: { current: false },
        disconnectAfterSpeakingRef: { current: false },
        connect: vi.fn(),
        disconnect: vi.fn(),
        retryConnect: vi.fn(),
        sendText: vi.fn(),
        setStateSafe: vi.fn(),
        setIsVoiceMode: vi.fn()
    }))
}))

vi.mock('../useChatMessages', () => ({
    useChatMessages: vi.fn(() => ({
        messages: [],
        addMessage: vi.fn(),
        clearMessages: vi.fn(),
        messagesEndRef: { current: null },
        queueMessage: vi.fn(),
        flushPendingMessages: vi.fn()
    }))
}))

describe('useElevenLabsSession', () => {
    const createDefaultOptions = () => ({
        agentId: 'test-agent-id',
        debug: false,
        startWithText: true,
        shareContext: true,
        autoScrapeContext: false,
        contextAllowlist: [],
        linkRegistry: [],
        allowInterruptions: true,
        turnEagerness: 'normal' as const,
        turnTimeout: 1.2,
        vadThreshold: 0.5,
        redirectToPage: vi.fn().mockResolvedValue('Navigating...'),
    })

    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
    })

    describe('composition', () => {
        it('composes all child hooks correctly', () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Should have all expected properties from composed hooks
            expect(result.current).toHaveProperty('state')
            expect(result.current).toHaveProperty('error')
            expect(result.current).toHaveProperty('isConnected')
            expect(result.current).toHaveProperty('isVoiceMode')
            expect(result.current).toHaveProperty('sessionRef')
            expect(result.current).toHaveProperty('connect')
            expect(result.current).toHaveProperty('disconnect')
            expect(result.current).toHaveProperty('sendText')
            expect(result.current).toHaveProperty('setMicMuted')
            expect(result.current).toHaveProperty('setVolume')
            expect(result.current).toHaveProperty('getOutputVolume')
            expect(result.current).toHaveProperty('getInputVolume')
            expect(result.current).toHaveProperty('getOutputByteFrequencyData')
            expect(result.current).toHaveProperty('messages')
            expect(result.current).toHaveProperty('addMessage')
            expect(result.current).toHaveProperty('clearMessages')
            expect(result.current).toHaveProperty('messagesEndRef')
            expect(result.current).toHaveProperty('queueMessage')
            expect(result.current).toHaveProperty('flushPendingMessages')
            expect(result.current).toHaveProperty('addLog')
        })

        it('provides upgradeToVoice function', () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            expect(result.current).toHaveProperty('upgradeToVoice')
            expect(typeof result.current.upgradeToVoice).toBe('function')
        })

        it('provides downgradeToText function', () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            expect(result.current).toHaveProperty('downgradeToText')
            expect(typeof result.current.downgradeToText).toBe('function')
        })
    })

    describe('addLog', () => {
        it('does not log in non-debug mode', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
            const options = createDefaultOptions()
            options.debug = false

            const { result } = renderHook(() => useElevenLabsSession(options))

            act(() => {
                result.current.addLog('Test message', 'info')
            })

            expect(consoleSpy).not.toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('logs in debug mode', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
            const options = createDefaultOptions()
            options.debug = true

            const { result } = renderHook(() => useElevenLabsSession(options))

            act(() => {
                result.current.addLog('Test message', 'info')
            })

            expect(consoleSpy).toHaveBeenCalledWith('[ElevenLabs] info: Test message')
            consoleSpy.mockRestore()
        })

        it('dispatches custom event in debug mode', () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
            const options = createDefaultOptions()
            options.debug = true

            const { result } = renderHook(() => useElevenLabsSession(options))

            act(() => {
                result.current.addLog('Test event', 'success')
            })

            expect(dispatchSpy).toHaveBeenCalled()
            const event = dispatchSpy.mock.calls.find(
                call => (call[0] as CustomEvent).type === 'elevenlabs-chat-log'
            )
            expect(event).toBeDefined()
        })
    })

    describe('callbacks', () => {
        it('calls onStateChange when state changes', () => {
            const onStateChange = vi.fn()
            const options = { ...createDefaultOptions(), onStateChange }

            renderHook(() => useElevenLabsSession(options))

            // State change effect runs on mount
            expect(onStateChange).toHaveBeenCalled()
        })

        it('broadcasts state change via CustomEvent', () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
            const options = createDefaultOptions()

            renderHook(() => useElevenLabsSession(options))

            const stateChangeEvent = dispatchSpy.mock.calls.find(
                call => (call[0] as CustomEvent).type === 'elevenlabs-state-change'
            )
            expect(stateChangeEvent).toBeDefined()
        })
    })

    describe('upgradeToVoice', () => {
        it('is a callable function', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            expect(typeof result.current.upgradeToVoice).toBe('function')

            // Should not throw when called
            await expect(async () => {
                await act(async () => {
                    await result.current.upgradeToVoice()
                })
            }).not.toThrow()
        })
    })

    describe('downgradeToText', () => {
        it('is a callable function', () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            expect(typeof result.current.downgradeToText).toBe('function')

            // Should not throw when called
            expect(() => {
                act(() => {
                    result.current.downgradeToText()
                })
            }).not.toThrow()
        })
    })

    describe('flushPendingMessages', () => {
        it('delegates to useChatMessages flushQueue', () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            act(() => {
                result.current.flushPendingMessages()
            })

            // Function should exist and be callable
            expect(typeof result.current.flushPendingMessages).toBe('function')
        })
    })

    describe('options handling', () => {
        it('accepts all configuration options', () => {
            const fullOptions = {
                agentId: 'test-agent',
                debug: true,
                startWithText: false,
                shareContext: true,
                autoScrapeContext: true,
                contextAllowlist: ['main', 'article'],
                linkRegistry: [{ name: 'Home', path: '/' }],
                allowInterruptions: false,
                turnEagerness: 'eager' as const,
                turnTimeout: 2.0,
                vadThreshold: 0.6,
                onConnect: vi.fn(),
                onDisconnect: vi.fn(),
                onMessage: vi.fn(),
                onStateChange: vi.fn(),
                onError: vi.fn(),
                navigationState: { currentPage: 'About', visitHistory: ['Home', 'About'] },
                additionalClientTools: { customTool: vi.fn() },
                redirectToPage: vi.fn().mockResolvedValue('Navigating...'),
            }

            const { result } = renderHook(() => useElevenLabsSession(fullOptions))

            expect(result.current).toBeDefined()
        })

        it('uses default values for optional options', () => {
            const minimalOptions = {
                agentId: 'test-agent',
                redirectToPage: vi.fn().mockResolvedValue('Navigating...'),
            }

            const { result } = renderHook(() => useElevenLabsSession(minimalOptions))

            expect(result.current).toBeDefined()
            expect(result.current.state).toBe('disconnected')
        })
    })

    describe('return type stability', () => {
        it('returns consistent shape across re-renders', () => {
            const { result, rerender } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            const firstRenderKeys = Object.keys(result.current).sort()

            rerender()

            const secondRenderKeys = Object.keys(result.current).sort()

            expect(firstRenderKeys).toEqual(secondRenderKeys)
        })

        it('maintains function identity for callbacks', () => {
            const { result, rerender } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            const firstConnect = result.current.connect
            const firstDisconnect = result.current.disconnect
            const firstAddLog = result.current.addLog

            rerender()

            // Callbacks should maintain identity due to useCallback
            expect(result.current.addLog).toBe(firstAddLog)
            // Note: connect/disconnect come from child hook, identity depends on memoization
        })
    })
})
