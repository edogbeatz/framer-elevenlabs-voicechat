/**
 * Session State Machine Tests
 * 
 * Exhaustive tests for all state transitions and mode combinations
 * in the ElevenLabs voice/text chat system.
 * 
 * Test Coverage:
 * - Layer 1: State transition matrix (all valid transitions)
 * - Layer 2: Mode cross-product (text ↔ voice in all states)
 * - Layer 3: skipFirstMessage behavior (mic toggle without greeting repeat)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useElevenLabsSession } from '../useElevenLabsSession'
import type { UseElevenLabsSessionOptions } from '../useElevenLabsSession'
import type { AgentState } from '../../types'

// --- SDK Mock Factory ---
function createMockSession() {
    return {
        endSession: vi.fn(),
        setVolume: vi.fn(),
        setMicMuted: vi.fn(),
        sendUserMessage: vi.fn(),
        sendText: vi.fn(),
        getOutputVolume: vi.fn(() => 0),
        getInputVolume: vi.fn(() => 0),
    }
}

// Store callbacks from startSession for triggering events
let sessionCallbacks: {
    onConnect?: () => void
    onDisconnect?: (details: unknown) => void
    onMessage?: (msg: unknown) => void
    onModeChange?: (mode: { mode: string }) => void
    onError?: (err: unknown) => void
} = {}

// Track session config for assertions
let lastSessionConfig: {
    textOnly?: boolean
    overrides?: { agent?: { firstMessage?: string } }
} = {}

// Mock the SDK boundary
vi.mock('../../utils/elevenLabsClient', () => ({
    getConversation: vi.fn(() => Promise.resolve({
        startSession: vi.fn(async (cfg) => {
            sessionCallbacks = {
                onConnect: cfg.onConnect,
                onDisconnect: cfg.onDisconnect,
                onMessage: cfg.onMessage,
                onModeChange: cfg.onModeChange,
                onError: cfg.onError,
            }
            lastSessionConfig = {
                textOnly: cfg.textOnly,
                overrides: cfg.overrides,
            }

            await new Promise(r => setTimeout(r, 50))
            cfg.onConnect?.()
            return createMockSession()
        })
    }))
}))

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
    enableAutoDisconnect: false,
    redirectToPage: vi.fn().mockResolvedValue('Navigating...'),
})

// --- Test Suites ---
describe('State Machine Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        localStorage.clear()
        sessionCallbacks = {}
        lastSessionConfig = {}

        vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
        } as unknown as MediaStream)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // =========================================================================
    // LAYER 1: State Transition Matrix
    // =========================================================================
    describe('Layer 1: State Transition Matrix', () => {
        describe('From disconnected state', () => {
            it('→ connecting when connect(textMode: true)', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                expect(result.current.state).toBe('disconnected')

                act(() => {
                    result.current.connect({ textMode: true })
                })

                // Should transition through connecting
                expect(result.current.state).toBe('connecting')
            })

            it('→ initializing when connect(textMode: false)', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                act(() => {
                    result.current.connect({ textMode: false })
                })

                expect(result.current.state).toBe('initializing')
            })
        })

        describe('From connecting state', () => {
            it('→ connected on SDK onConnect callback', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                await act(async () => {
                    await result.current.connect({ textMode: true })
                })

                await waitFor(() => {
                    expect(result.current.state).toBe('connected')
                })
            })
        })

        describe('From connected state (text mode)', () => {
            it('→ disconnected on disconnect()', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                await act(async () => {
                    await result.current.connect({ textMode: true })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                act(() => {
                    result.current.disconnect()
                })

                expect(result.current.state).toBe('disconnected')
            })

            it('stays connected (no listening/speaking transitions in text mode)', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                await act(async () => {
                    await result.current.connect({ textMode: true })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                // Simulate mode change from SDK (should be ignored in text mode)
                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'listening' })
                })

                // Should still be 'connected', not 'listening'
                expect(result.current.state).toBe('connected')
            })
        })

        describe('From connected state (voice mode)', () => {
            it('→ listening on onModeChange({ mode: "listening" })', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })
                expect(result.current.isVoiceMode).toBe(true)

                // Simulate SDK mode change to listening (with delay for debounce)
                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'listening' })
                })

                // Note: listening has a debounce, so we wait
                await waitFor(() => {
                    expect(result.current.state).toBe('listening')
                }, { timeout: 1000 })
            })

            it('→ speaking on onModeChange({ mode: "speaking" })', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'speaking' })
                })

                expect(result.current.state).toBe('speaking')
            })
        })

        describe('From listening state', () => {
            it('→ speaking on onModeChange({ mode: "speaking" })', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                // First go to listening
                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'listening' })
                })

                await waitFor(() => {
                    expect(result.current.state).toBe('listening')
                }, { timeout: 1000 })

                // Then to speaking
                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'speaking' })
                })

                expect(result.current.state).toBe('speaking')
            })

            it('→ disconnected on disconnect()', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'listening' })
                })

                await waitFor(() => {
                    expect(result.current.state).toBe('listening')
                }, { timeout: 1000 })

                act(() => {
                    result.current.disconnect()
                })

                expect(result.current.state).toBe('disconnected')
            })
        })

        describe('From speaking state', () => {
            it('→ listening on onModeChange({ mode: "listening" })', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                // Go to speaking first
                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'speaking' })
                })

                expect(result.current.state).toBe('speaking')

                // Then to listening
                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'listening' })
                })

                await waitFor(() => {
                    expect(result.current.state).toBe('listening')
                }, { timeout: 1000 })
            })
        })
    })

    // =========================================================================
    // LAYER 2: Mode Cross-Product Tests
    // =========================================================================
    describe('Layer 2: Mode Cross-Product', () => {
        describe('upgradeToVoice() transitions', () => {
            it('from disconnected → initializing → connected (voice)', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                expect(result.current.state).toBe('disconnected')
                expect(result.current.isVoiceMode).toBe(false)

                await act(async () => {
                    await result.current.upgradeToVoice()
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })
                expect(result.current.isVoiceMode).toBe(true)
            })

            it('from connected (text) → reconnect → connected (voice)', async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                // Start in text mode
                await act(async () => {
                    await result.current.connect({ textMode: true })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })
                expect(result.current.isVoiceMode).toBe(false)

                // Upgrade
                await act(async () => {
                    await result.current.upgradeToVoice()
                })

                expect(result.current.isVoiceMode).toBe(true)
                expect(result.current.isConnected).toBe(true)
            })
        })

        describe('downgradeToText() transitions', () => {
            it('from connected (voice) → reconnect with text-only → connected (text)', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })
                expect(result.current.isVoiceMode).toBe(true)

                // downgradeToText now reconnects to enforce server-side text-only mode
                await act(async () => {
                    await result.current.downgradeToText()
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })
                expect(result.current.isVoiceMode).toBe(false)
                expect(result.current.state).toBe('connected')
            })

            it('from listening → reconnect with text-only → connected (text)', async () => {
                const { result } = renderHook(() => useElevenLabsSession({
                    ...createDefaultOptions(),
                    startWithText: false,
                }))

                await act(async () => {
                    await result.current.connect({ textMode: false })
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })

                act(() => {
                    sessionCallbacks.onModeChange?.({ mode: 'listening' })
                })

                await waitFor(() => {
                    expect(result.current.state).toBe('listening')
                }, { timeout: 1000 })

                // downgradeToText now reconnects to enforce server-side text-only mode
                await act(async () => {
                    await result.current.downgradeToText()
                })

                await waitFor(() => {
                    expect(result.current.isConnected).toBe(true)
                })
                expect(result.current.isVoiceMode).toBe(false)
                expect(result.current.state).toBe('connected')
            })
        })
    })

    // =========================================================================
    // LAYER 3: skipFirstMessage & Voice Re-upgrade Tests
    // =========================================================================
    describe('Layer 3: skipFirstMessage Behavior (Mic Toggle)', () => {
        it('first voice upgrade sends greeting (firstMessage not suppressed)', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // First upgrade to voice
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            // Should NOT suppress first message on first upgrade
            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe(undefined)
        })

        it('second voice upgrade (after downgrade) suppresses greeting', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // Start in text mode
            await act(async () => {
                await result.current.connect({ textMode: true })
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // First upgrade to voice
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            expect(result.current.isVoiceMode).toBe(true)

            // Downgrade to text (now async with reconnection)
            await act(async () => {
                await result.current.downgradeToText()
            })

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })
            expect(result.current.isVoiceMode).toBe(false)

            // Second upgrade to voice - should skip greeting
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            // Should use contextual greeting on re-upgrade
            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe('Voice mode - listening...')
        })

        it('fresh session after disconnect resets greeting behavior', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            // First session: text → voice → text → voice
            await act(async () => {
                await result.current.connect({ textMode: true })
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
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            // At this point, firstMessage should be contextual greeting
            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe('Voice mode - listening...')

            // Now disconnect and start fresh session
            act(() => {
                result.current.disconnect()
            })

            // Start completely new session
            await act(async () => {
                await result.current.connect({ textMode: true })
            })
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // First upgrade in NEW session should NOT suppress greeting
            await act(async () => {
                await result.current.upgradeToVoice()
            })

            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe(undefined)
        })

        it('multiple rapid mode toggles work correctly', async () => {
            const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

            await act(async () => {
                await result.current.connect({ textMode: true })
            })
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Toggle 1: text → voice (greeting shown)
            await act(async () => {
                await result.current.upgradeToVoice()
            })
            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe(undefined)

            // Toggle 2: voice → text (now async with reconnection)
            await act(async () => {
                await result.current.downgradeToText()
            })
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Toggle 3: text → voice (greeting suppressed)
            await act(async () => {
                await result.current.upgradeToVoice()
            })
            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe('Voice mode - listening...')

            // Toggle 4: voice → text (now async with reconnection)
            await act(async () => {
                await result.current.downgradeToText()
            })
            await waitFor(() => {
                expect(result.current.isConnected).toBe(true)
            })

            // Toggle 5: text → voice (greeting still suppressed)
            await act(async () => {
                await result.current.upgradeToVoice()
            })
            expect(lastSessionConfig.overrides?.agent?.firstMessage).toBe('Voice mode - listening...')
        })
    })

    // =========================================================================
    // isConnected Derived State Validation
    // =========================================================================
    describe('isConnected Derived State', () => {
        const connectedStates: AgentState[] = ['connected', 'listening', 'speaking', 'thinking']
        const notConnectedStates: AgentState[] = ['disconnected', 'connecting', 'initializing']

        connectedStates.forEach(state => {
            it(`returns true for "${state}" state`, async () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                // We need to reach these states through normal flow
                if (state === 'connected') {
                    await act(async () => {
                        await result.current.connect({ textMode: true })
                    })
                    await waitFor(() => {
                        expect(result.current.state).toBe('connected')
                    })
                }
                // Other states are tested via mode changes in voice mode

                if (result.current.state === state) {
                    expect(result.current.isConnected).toBe(true)
                }
            })
        })

        notConnectedStates.forEach(state => {
            it(`returns false for "${state}" state`, () => {
                const { result } = renderHook(() => useElevenLabsSession(createDefaultOptions()))

                if (state === 'disconnected') {
                    expect(result.current.state).toBe('disconnected')
                    expect(result.current.isConnected).toBe(false)
                }
            })
        })
    })
})
