import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatMessages, createMessage } from '../useChatMessages'

describe('useChatMessages', () => {
    const defaultOptions = {
        sessionKey: 'test_chat_messages',
        debug: false,
        addLog: vi.fn()
    }

    beforeEach(() => {
        sessionStorage.clear()
        vi.clearAllMocks()
    })

    describe('initialization', () => {
        it('initializes with empty messages when no saved data', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            expect(result.current.messages).toEqual([])
        })

        it('restores messages from sessionStorage', () => {
            const savedMessages = [
                { id: 'msg-1', role: 'user' as const, content: 'Hello' },
                { id: 'msg-2', role: 'assistant' as const, content: 'Hi there!' }
            ]
            sessionStorage.setItem(defaultOptions.sessionKey, JSON.stringify(savedMessages))

            const { result } = renderHook(() => useChatMessages(defaultOptions))

            expect(result.current.messages).toEqual(savedMessages)
        })

        it('handles invalid JSON in sessionStorage gracefully', () => {
            sessionStorage.setItem(defaultOptions.sessionKey, 'invalid json')

            const { result } = renderHook(() => useChatMessages(defaultOptions))

            expect(result.current.messages).toEqual([])
        })
    })

    describe('addMessage', () => {
        it('appends message to messages array', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            act(() => {
                result.current.addMessage({ id: 'msg-1', role: 'user', content: 'Hello' })
            })

            expect(result.current.messages).toHaveLength(1)
            expect(result.current.messages[0].content).toBe('Hello')
        })

        it('persists messages to sessionStorage', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            act(() => {
                result.current.addMessage({ id: 'msg-1', role: 'user', content: 'Hello' })
            })

            const saved = sessionStorage.getItem(defaultOptions.sessionKey)
            expect(saved).not.toBeNull()
            expect(JSON.parse(saved!)).toHaveLength(1)
        })
    })

    describe('clearMessages', () => {
        it('clears all messages', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            act(() => {
                result.current.addMessage({ id: 'msg-1', role: 'user', content: 'Hello' })
                result.current.addMessage({ id: 'msg-2', role: 'assistant', content: 'Hi!' })
            })

            act(() => {
                result.current.clearMessages()
            })

            expect(result.current.messages).toEqual([])
        })

        it('removes messages from sessionStorage', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            act(() => {
                result.current.addMessage({ id: 'msg-1', role: 'user', content: 'Hello' })
            })

            act(() => {
                result.current.clearMessages()
            })

            expect(sessionStorage.getItem(defaultOptions.sessionKey)).toBe('[]')
        })
    })

    describe('persistence', () => {
        it('persists "Session ended" messages for history visibility', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            act(() => {
                result.current.addMessage({ id: 'msg-1', role: 'user', content: 'Hello' })
                result.current.addMessage({ id: 'msg-2', role: 'assistant', content: 'Session ended' })
            })

            const saved = JSON.parse(sessionStorage.getItem(defaultOptions.sessionKey)!)
            expect(saved).toHaveLength(2)
            expect(saved[0].content).toBe('Hello')
            expect(saved[1].content).toBe('Session ended')
        })

        it('limits stored messages to maxMessages', () => {
            const { result } = renderHook(() => useChatMessages({
                ...defaultOptions,
                maxMessages: 3
            }))

            act(() => {
                for (let i = 0; i < 5; i++) {
                    result.current.addMessage({ id: `msg-${i}`, role: 'user', content: `Message ${i}` })
                }
            })

            const saved = JSON.parse(sessionStorage.getItem(defaultOptions.sessionKey)!)
            expect(saved).toHaveLength(3)
            expect(saved[0].content).toBe('Message 2') // Oldest kept
            expect(saved[2].content).toBe('Message 4') // Newest
        })
    })

    describe('queueMessage', () => {
        it('queues message for later sending', () => {
            const addLog = vi.fn()
            const { result } = renderHook(() => useChatMessages({
                ...defaultOptions,
                debug: true,
                addLog
            }))

            act(() => {
                result.current.queueMessage('Pending message')
            })

            expect(addLog).toHaveBeenCalledWith(
                expect.stringContaining('Queued message'),
                'info'
            )
        })
    })

    describe('flushPendingMessages', () => {
        it('does nothing when not connected', () => {
            const mockSession = { sendUserMessage: vi.fn() }
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            act(() => {
                result.current.queueMessage('Pending')
            })

            act(() => {
                result.current.flushPendingMessages(null, false)
            })

            expect(mockSession.sendUserMessage).not.toHaveBeenCalled()
        })

        it('sends queued messages when connected', () => {
            const sendUserMessage = vi.fn()
            const mockSession = { sendUserMessage } as any

            const { result } = renderHook(() => useChatMessages({
                ...defaultOptions,
                debug: true
            }))

            act(() => {
                result.current.queueMessage('Pending message')
            })

            act(() => {
                result.current.flushPendingMessages(mockSession, true)
            })

            expect(sendUserMessage).toHaveBeenCalledWith('Pending message')
        })
    })

    describe('messagesEndRef', () => {
        it('provides a ref for auto-scrolling', () => {
            const { result } = renderHook(() => useChatMessages(defaultOptions))

            expect(result.current.messagesEndRef).toBeDefined()
            expect(result.current.messagesEndRef.current).toBeNull() // Not mounted
        })
    })
})

describe('createMessage', () => {
    it('creates a user message with generated ID', () => {
        const message = createMessage('user', 'Hello world')

        expect(message.role).toBe('user')
        expect(message.content).toBe('Hello world')
        expect(message.id).toMatch(/^msg-/)
    })

    it('creates an assistant message with generated ID', () => {
        const message = createMessage('assistant', 'How can I help?')

        expect(message.role).toBe('assistant')
        expect(message.content).toBe('How can I help?')
        expect(message.id).toMatch(/^msg-/)
    })
})
