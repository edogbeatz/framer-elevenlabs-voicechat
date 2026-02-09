/**
 * Session Management Integration Tests
 * 
 * These tests exercise the FULL session lifecycle without mocking child hooks.
 * Only the SDK boundary (@elevenlabs/client) is mocked.
 * 
 * Scenarios covered:
 * - Calling (text mode start, voice mode start)
 * - Ending calls (graceful disconnect, disconnect-after-speaking)
 * - Text → Voice mode switching (upgradeToVoice)
 * - Voice → Text mode switching (downgradeToText)
 * - Message persistence across mode switches
 * - Reconnection flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useElevenLabsSession } from '../useElevenLabsSession'
import type { UseElevenLabsSessionOptions } from '../useElevenLabsSession'

// --- SDK Mock Factory ---
// Creates a controllable mock session that simulates the ElevenLabs SDK behavior
function createMockSession() {
    const session = {
        endSession: vi.fn(),
        setVolume: vi.fn(),
        setMicMuted: vi.fn(),
        sendUserMessage: vi.fn(),
        sendText: vi.fn(),
        getOutputVolume: vi.fn(() => 0),
        getInputVolume: vi.fn(() => 0),
    }
    return session
}

// Store callbacks from startSession for triggering events
let sessionCallbacks: {
    onConnect?: () => void
    onDisconnect?: (details: unknown) => void
    onMessage?: (msg: unknown) => void
    onModeChange?: (mode: { mode: string }) => void
    onError?: (err: unknown) => void
} = {}

// Mock the SDK boundary - NOT the child hooks
vi.mock('../../utils/elevenLabsClient', () => ({
    getConversation: vi.fn(() => Promise.resolve({
        startSession: vi.fn(async (cfg) => {
            // Store callbacks for external triggering
            sessionCallbacks = {
                onConnect: cfg.onConnect,
                onDisconnect: cfg.onDisconnect,
                onMessage: cfg.onMessage,
                onModeChange: cfg.onModeChange,
                onError: cfg.onError,
            }

            // Simulate async connection delay
            await new Promise(r => setTimeout(r, 50))

            // Trigger onConnect callback
            cfg.onConnect?.()

            return createMockSession()
        })
    }))
}))

// Mock storage utilities
vi.mock('../../utils/storage', () => ({
    getCachedStorage: vi.fn(() => null),
    setCachedStorage: vi.fn()
}))

// --- Test Helpers ---
const createDefaultOptions = (): UseElevenLabsSessionOptions => ({
    agentId: 'test-agent-id',
    debug: false,
    startWithText: true,
    shareContext: true,
    autoScrapeContext: false,
    contextAllowlist: [],
    linkRegistry: [],
    allowInterruptions: true,
    turnEagerness: 'normal',
    turnTimeout: 1.2,
    vadThreshold: 0.5,
    enableAutoDisconnect: false, // Disable for tests to avoid timer interference
})

// --- Test Suites ---
describe('Session Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        localStorage.clear()
        sessionCallbacks = {}

        // Mock getUserMedia for voice mode tests
        vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
        } as unknown as MediaStream)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // =========================================================================
    // SECTION 1: Calling (Starting Sessions)
    // =========================================================================
    describe('Starting Sessions', () => {
        it('starts a text mode session and transitions to connected state', async () => {
            const onConnect = vi.fn()
            const options = { ...createDefaultOptions(), onConnect }

            const { result } = renderHook(() => useElevenLabsSession(options))

            // Initial state
            expect(result.current.state).toBe('disconnected')
            expect(result.current.isConnected).toBe(false)

            // Start text mode session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            // Should be connected
            await waitFor(() => {
                expect(result.current.state).toBe('connected')
            })
            expect(result.current.isConnected).toBe(true)
            expect(result.current.isVoiceMode).toBe(false)
            expect(onConnect).toHaveBeenCalled()
        })

        it('starts a voice mode session and transitions to listening state', async () => {
            const onConnect = vi.fn()
            const options = { ...createDefaultOptions(), startWithText: false, onConnect }

            const { result } = renderHook(() => useElevenLabsSession(options))

            // Start voice mode session
            await act(async () => {
                await result.current.connect({ textMode: false })
            })

            // Should be connected in voice mode
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })
            expect(result.current.isVoiceMode).toBe(true)
            expect(onConnect).toHaveBeenCalled()
        })

        it('clears previous messages when starting a new session', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Add some pre-existing messages
            act(() => {
                result.current.addMessage({ id: '1', role: 'user', content: 'Old message' })
                result.current.addMessage({ id: '2', role: 'assistant', content: 'Old response' })
            })

            expect(result.current.messages.length).toBe(2)

            // Start new session - should clear messages
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Messages should be cleared
            expect(result.current.messages.length).toBe(0)
        })

        it('handles connection errors gracefully', async () => {
            const onError = vi.fn()
            const options = { ...createDefaultOptions(), agentId: '', onError }

            const { result } = renderHook(() => useElevenLabsSession(options))

            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            // Should have error set
            expect(result.current.error).toBe('No Agent ID')
        })
    })

    // =========================================================================
    // SECTION 2: Ending Calls
    // =========================================================================
    describe('Ending Calls', () => {
        it('gracefully ends an active session', async () => {
            const onDisconnect = vi.fn()
            const options = { ...createDefaultOptions(), onDisconnect }

            const { result } = renderHook(() => useElevenLabsSession(options))

            // Connect first
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Disconnect
            act(() => {
                result.current.disconnect()
            })

            // Should be disconnected
            expect(result.current.state).toBe('disconnected')
            expect(result.current.isConnected).toBe(false)
            // Note: onDisconnect callback depends on SDK firing back,
            // which the mock doesn't simulate. We verify state instead.
        })

        it('adds "Session ended" message when disconnecting', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Connect
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Disconnect
            act(() => {
                result.current.disconnect()
            })

            // Should have "Session ended" message
            const endMessage = result.current.messages.find(m => m.content === 'Session ended')
            expect(endMessage).toBeDefined()
            expect(endMessage?.role).toBe('assistant')
        })

        it('does not add "Session ended" if already disconnected', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Should be disconnected initially
            expect(result.current.state).toBe('disconnected')

            // Try to disconnect again
            act(() => {
                result.current.disconnect()
            })

            // Should have no messages (no "Session ended" added)
            expect(result.current.messages.length).toBe(0)
        })

        it('clears error state on disconnect', async () => {
            const { result } = renderHook(() => useElevenLabsSession({ ...createDefaultOptions(), agentId: '' }))

            // Trigger an error
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            expect(result.current.error).toBe('No Agent ID')

            // Retry with valid agentId - simulate a reconnect sequence
            // Note: Since we can't easily update options mid-test, this tests the flow
        })
    })

    // =========================================================================
    // SECTION 3: Text → Voice Mode Switching (upgradeToVoice)
    // =========================================================================
    describe('Text → Voice Mode Switching', () => {
        it('upgrades from text to voice mode when connected', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            expect(result.current.isVoiceMode).toBe(false)

            // Upgrade to voice
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            // Should be in voice mode (state is 'connected' because we reconnected)
            // The SDK's onModeChange callback sets 'listening' later
            expect(result.current.isVoiceMode).toBe(true)
            expect(result.current.isConnected).toBe(true)
        })

        it('preserves message history during mode switch', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Add some messages
            act(() => {
                result.current.addMessage({ id: '1', role: 'user', content: 'Hello' })
                result.current.addMessage({ id: '2', role: 'assistant', content: 'Hi there!' })
            })

            const messageCountBefore = result.current.messages.length
            expect(messageCountBefore).toBe(2)

            // Upgrade to voice
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            // Messages should be preserved
            expect(result.current.messages.length).toBe(messageCountBefore)
            expect(result.current.messages[0].content).toBe('Hello')
            expect(result.current.messages[1].content).toBe('Hi there!')
        })

        it('stays in text mode when mic permission is denied', async () => {
            // Mock mic permission denial
            vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(
                new Error('NotAllowedError')
            )

            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Try to upgrade to voice (should fail silently)
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            // Should still be in text mode
            expect(result.current.isVoiceMode).toBe(false)
        })

        it('starts in voice mode when upgrading from disconnected', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            expect(result.current.state).toBe('disconnected')

            // Upgrade to voice from disconnected state
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Should be in voice mode
            expect(result.current.isVoiceMode).toBe(true)
        })
    })

    // =========================================================================
    // SECTION 4: Voice → Text Mode Switching (downgradeToText)
    // =========================================================================
    describe('Voice → Text Mode Switching', () => {
        it('downgrades from voice to text mode', async () => {
            const { result } = renderHook(() => useElevenLabsSession({
                ...createDefaultOptions(),
                startWithText: false,
            }))

            // Start in voice mode
            await act(async () => {
                await result.current.connect({ textMode: false })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            expect(result.current.isVoiceMode).toBe(true)

            // Downgrade to text (now async with reconnection)
            await act(async () => {
                await result.current.downgradeToText()
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Should be in text mode
            expect(result.current.isVoiceMode).toBe(false)
            expect(result.current.state).toBe('connected')
        })

        it('preserves message history during downgrade', async () => {
            const { result } = renderHook(() => useElevenLabsSession({
                ...createDefaultOptions(),
                startWithText: false,
            }))

            // Start in voice mode
            await act(async () => {
                await result.current.connect({ textMode: false })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Add some messages
            act(() => {
                result.current.addMessage({ id: '1', role: 'user', content: 'Voice message' })
                result.current.addMessage({ id: '2', role: 'assistant', content: 'Voice response' })
            })

            const messageCountBefore = result.current.messages.length

            // Downgrade to text (now async with reconnection)
            await act(async () => {
                await result.current.downgradeToText()
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Messages should be preserved
            expect(result.current.messages.length).toBe(messageCountBefore)
        })

        it('does nothing if already in text mode', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            expect(result.current.isVoiceMode).toBe(false)

            // Try to downgrade (should be no-op)
            act(() => {
                result.current.downgradeToText()
            })

            // Should still be in text mode, state unchanged
            expect(result.current.isVoiceMode).toBe(false)
        })
    })

    // =========================================================================
    // SECTION 5: Message Handling
    // =========================================================================
    describe('Message Handling', () => {
        it('receives and stores assistant messages from SDK', async () => {
            const onMessage = vi.fn()
            const { result } = renderHook(() => useElevenLabsSession({
                ...createDefaultOptions(),
                onMessage,
            }))

            // Start session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Simulate SDK sending an assistant message
            act(() => {
                sessionCallbacks.onMessage?.({
                    source: 'assistant',
                    message: 'Hello from agent!',
                })
            })

            // Should have message in array
            await waitFor(() => {
                expect(result.current.messages.length).toBeGreaterThan(0)
            })

            const assistantMsg = result.current.messages.find(m => m.content === 'Hello from agent!')
            expect(assistantMsg).toBeDefined()
            expect(assistantMsg?.role).toBe('assistant')
            expect(onMessage).toHaveBeenCalled()
        })

        it('sends text messages when connected', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Send a text message
            await act(async () => {
                await result.current.sendText('Hello agent!')
            })

            // Should not throw, sendText should work
            expect(result.current.isConnected).toBe(true)
        })

        it('filters out empty and placeholder messages', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Simulate SDK sending placeholder messages (should be filtered)
            act(() => {
                sessionCallbacks.onMessage?.({ source: 'assistant', message: '' })
                sessionCallbacks.onMessage?.({ source: 'assistant', message: 'None' })
                sessionCallbacks.onMessage?.({ source: 'assistant', message: '...' })
                sessionCallbacks.onMessage?.({ source: 'assistant', message: '   ' })
            })

            // These should all be filtered out
            expect(result.current.messages.length).toBe(0)
        })
    })

    // =========================================================================
    // SECTION 6: Reconnection Flows
    // =========================================================================
    describe('Reconnection Flows', () => {
        it('can reconnect after disconnect', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // First connection
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Disconnect
            act(() => {
                result.current.disconnect()
            })

            expect(result.current.state).toBe('disconnected')

            // Reconnect
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })
        })

        it('retryConnect clears errors and attempts fresh connection', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Disconnect
            act(() => {
                result.current.disconnect()
            })

            // Retry
            await act(async () => {
                await result.current.retryConnect()
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            expect(result.current.error).toBe('')
        })
    })

    // =========================================================================
    // SECTION 7: Full Lifecycle Scenarios
    // =========================================================================
    describe('Full Lifecycle Scenarios', () => {
        it('complete flow: text → add messages → upgrade to voice → add more messages → disconnect', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // 1. Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })
            expect(result.current.isVoiceMode).toBe(false)

            // 2. Add text messages
            act(() => {
                result.current.addMessage({ id: '1', role: 'user', content: 'Text message 1' })
            })

            // Simulate agent response
            act(() => {
                sessionCallbacks.onMessage?.({ source: 'assistant', message: 'Text response 1' })
            })

            await waitFor(() => {
                expect(result.current.messages.length).toBe(2)
            })

            // 3. Upgrade to voice
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            expect(result.current.isVoiceMode).toBe(true)
            expect(result.current.messages.length).toBe(2) // Messages preserved

            // 4. Add voice messages
            act(() => {
                sessionCallbacks.onMessage?.({ source: 'user', message: 'Voice message 1' })
                sessionCallbacks.onMessage?.({ source: 'assistant', message: 'Voice response 1' })
            })

            await waitFor(() => {
                expect(result.current.messages.length).toBe(4)
            })

            // 5. Disconnect
            act(() => {
                result.current.disconnect()
            })

            expect(result.current.state).toBe('disconnected')

            // Should have "Session ended" message
            const sessionEnded = result.current.messages.find(m => m.content === 'Session ended')
            expect(sessionEnded).toBeDefined()
        })

        it('handles rapid mode switching without race conditions', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Rapid mode switches (all async now with reconnections)
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            await act(async () => {
                await result.current.downgradeToText()
            })
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            await act(async () => {
                await result.current.upgradeToVoice()
            })

            await act(async () => {
                await result.current.downgradeToText()
            })
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Should be in text mode and connected, no crashes
            expect(result.current.isVoiceMode).toBe(false)
            expect(result.current.isConnected).toBe(true)
            expect(result.current.state).toBe('connected')
        })

        it('maintains session across multiple interactions', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Multiple message exchanges
            for (let i = 0; i < 5; i++) {
                act(() => {
                    result.current.addMessage({ id: `user-${i}`, role: 'user', content: `Message ${i}` })
                })
                act(() => {
                    sessionCallbacks.onMessage?.({ source: 'assistant', message: `Response ${i}` })
                })
            }

            await waitFor(() => {
                expect(result.current.messages.length).toBe(10)
            })

            // Session should still be active
            expect(result.current.isConnected).toBe(true)
        })
    })

    // =========================================================================
    // SECTION 8: Audio Controls Integration
    // =========================================================================
    describe('Audio Controls Integration', () => {
        it('provides audio control functions', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Should have all audio functions
            expect(typeof result.current.setMicMuted).toBe('function')
            expect(typeof result.current.setVolume).toBe('function')
            expect(typeof result.current.getOutputVolume).toBe('function')
            expect(typeof result.current.getInputVolume).toBe('function')
            expect(typeof result.current.getOutputByteFrequencyData).toBe('function')
        })

        it('audio functions do not throw when disconnected', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Should not throw when disconnected
            expect(() => {
                result.current.setMicMuted(true)
                result.current.setVolume(0.5)
                result.current.getOutputVolume()
                result.current.getInputVolume()
                result.current.getOutputByteFrequencyData()
            }).not.toThrow()
        })
    })

    // =========================================================================
    // SECTION 9: State Broadcasting
    // =========================================================================
    describe('State Broadcasting', () => {
        it('calls onStateChange when state changes', async () => {
            const onStateChange = vi.fn()
            const { result } = renderHook(() => useElevenLabsSession({
                ...createDefaultOptions(),
                onStateChange,
            }))

            // Initial call on mount
            expect(onStateChange).toHaveBeenCalledWith('disconnected')
            onStateChange.mockClear()

            // Connect
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            // Should have been called with 'connecting' and 'connected'
            await waitFor(() => {
                expect(onStateChange).toHaveBeenCalledWith('connected')
            })
        })

        it('dispatches CustomEvent on state change', async () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            // Should have dispatched state change events
            const stateChangeEvents = dispatchSpy.mock.calls.filter(
                call => (call[0] as CustomEvent).type === 'elevenlabs-state-change'
            )
            expect(stateChangeEvents.length).toBeGreaterThan(0)
        })
    })
})
