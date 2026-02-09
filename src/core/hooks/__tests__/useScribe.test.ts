import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScribe } from '../useScribe'

// Mock WebSocket - avoid recursion by not auto-calling onclose
class MockWebSocket {
    static instances: MockWebSocket[] = []
    url: string
    readyState = 0 // CONNECTING
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: ((event: unknown) => void) | null = null
    onclose: (() => void) | null = null

    constructor(url: string) {
        this.url = url
        MockWebSocket.instances.push(this)
    }

    send = vi.fn()
    close = vi.fn(() => {
        this.readyState = 3 // CLOSED
        // Don't auto-call onclose - let the hook handle it
    })

    // Helper to simulate connection
    simulateOpen() {
        this.readyState = 1 // OPEN
        this.onopen?.()
    }

    simulateMessage(data: object) {
        this.onmessage?.({ data: JSON.stringify(data) })
    }

    simulateError() {
        this.onerror?.(new Error('Connection error'))
    }

    simulateClose() {
        this.readyState = 3 // CLOSED
        this.onclose?.()
    }
}

// @ts-ignore
global.WebSocket = MockWebSocket

// Mock MediaRecorder
class MockMediaRecorder {
    static instances: MockMediaRecorder[] = []
    state = 'inactive'
    ondataavailable: ((event: { data: Blob }) => void) | null = null

    constructor() {
        MockMediaRecorder.instances.push(this)
    }

    start = vi.fn(() => { this.state = 'recording' })
    stop = vi.fn(() => { this.state = 'inactive' })

    simulateData(data: Blob) {
        this.ondataavailable?.({ data })
    }
}

// @ts-ignore
global.MediaRecorder = MockMediaRecorder

describe('useScribe', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        MockWebSocket.instances = []
        MockMediaRecorder.instances = []
    })

    describe('initialization', () => {
        it('starts with disconnected state', () => {
            const { result } = renderHook(() => useScribe({}))

            expect(result.current.isConnecting).toBe(false)
            expect(result.current.isConnected).toBe(false)
            expect(result.current.transcript).toBe('')
        })
    })

    describe('startRecording (Agent Mode)', () => {
        it('connects to agent WebSocket URL', async () => {
            const { result } = renderHook(() => useScribe({ agentId: 'test-agent-id' }))

            await act(async () => {
                result.current.start()
                // Allow promises to resolve
                await new Promise(r => setTimeout(r, 10))
            })

            expect(MockWebSocket.instances.length).toBe(1)
            expect(MockWebSocket.instances[0].url).toContain('agent_id=test-agent-id')
            expect(MockWebSocket.instances[0].url).toContain('convai/conversation')
        })

        it('sets isConnecting to true while connecting', async () => {
            const { result } = renderHook(() => useScribe({ agentId: 'test-agent' }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            // Before socket opens, should be connecting
            expect(result.current.isConnecting).toBe(true)
        })

        it('sets isConnected to true after socket opens', async () => {
            const onStart = vi.fn()
            const { result } = renderHook(() => useScribe({
                agentId: 'test-agent',
                onStart
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateOpen()
            })

            expect(result.current.isConnected).toBe(true)
            expect(result.current.isConnecting).toBe(false)
            expect(onStart).toHaveBeenCalled()
        })

        it('handles agent transcription messages', async () => {
            const onChange = vi.fn()
            const { result } = renderHook(() => useScribe({
                agentId: 'test-agent',
                onChange
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateOpen()
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateMessage({
                    type: 'user_transcription',
                    user_transcription_event: {
                        user_transcription: 'Hello world'
                    }
                })
            })

            expect(result.current.transcript).toBe('Hello world')
            expect(onChange).toHaveBeenCalledWith({
                transcript: 'Hello world',
                isFinal: false
            })
        })
    })

    describe('startRecording (Scribe Mode)', () => {
        it('connects to scribe WebSocket URL with API key', async () => {
            const { result } = renderHook(() => useScribe({
                apiKey: 'test-api-key'
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            expect(MockWebSocket.instances[0].url).toContain('speech-to-text/stream')
            expect(MockWebSocket.instances[0].url).toContain('xi-api-key=test-api-key')
        })

        it('uses getToken when provided', async () => {
            const getToken = vi.fn(() => Promise.resolve('dynamic-token'))
            const { result } = renderHook(() => useScribe({ getToken }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            expect(getToken).toHaveBeenCalled()
            expect(MockWebSocket.instances[0].url).toContain('token=dynamic-token')
        })

        it('handles scribe transcription messages', async () => {
            const onChange = vi.fn()
            const { result } = renderHook(() => useScribe({
                apiKey: 'test-key',
                onChange
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateOpen()
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateMessage({
                    type: 'transcription',
                    text: 'Scribe result',
                    is_final: true
                })
            })

            expect(result.current.transcript).toBe('Scribe result')
            expect(onChange).toHaveBeenCalledWith({
                transcript: 'Scribe result',
                isFinal: true
            })
        })

        it('throws error when no auth provided', async () => {
            const onError = vi.fn()
            const { result } = renderHook(() => useScribe({ onError }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            expect(onError).toHaveBeenCalled()
        })
    })

    describe('stopRecording', () => {
        it('closes WebSocket connection', async () => {
            const onStop = vi.fn()
            const { result } = renderHook(() => useScribe({
                agentId: 'test-agent',
                onStop
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateOpen()
            })

            await act(async () => {
                result.current.stop()
            })

            expect(MockWebSocket.instances[0].close).toHaveBeenCalled()
            expect(result.current.isConnected).toBe(false)
            expect(onStop).toHaveBeenCalled()
        })
    })

    describe('cancel', () => {
        it('clears transcript and stops recording', async () => {
            const { result } = renderHook(() => useScribe({
                agentId: 'test-agent'
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateOpen()
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateMessage({
                    type: 'user_transcription',
                    user_transcription_event: { user_transcription: 'Some text' }
                })
            })

            await act(async () => {
                result.current.cancel()
            })

            expect(result.current.transcript).toBe('')
            expect(result.current.isConnected).toBe(false)
        })
    })

    describe('error handling', () => {
        it('calls onError when WebSocket fails', async () => {
            const onError = vi.fn()
            const { result } = renderHook(() => useScribe({
                agentId: 'test-agent',
                onError
            }))

            await act(async () => {
                result.current.start()
                await new Promise(r => setTimeout(r, 10))
            })

            await act(async () => {
                MockWebSocket.instances[0].simulateError()
            })

            expect(onError).toHaveBeenCalled()
            expect(result.current.isConnected).toBe(false)
        })
    })
})
