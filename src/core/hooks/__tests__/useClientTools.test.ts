import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useClientTools } from '../useClientTools'
import type { AgentState } from '../../types'

// Mock getPageContent
vi.mock('../../utils/pageReader', () => ({
    getPageContent: vi.fn(() => Promise.resolve('Mocked page content'))
}))

describe('useClientTools', () => {
    const createDefaultOptions = () => ({
        debug: false,
        autoScrapeContext: true,
        addLog: vi.fn(),
        setStateSafe: vi.fn(),
        disconnect: vi.fn(),
        disconnectAfterSpeakingRef: { current: false },
        stateRef: { current: 'connected' as AgentState },
        redirectToPage: vi.fn(async (params) => `Navigating to ${typeof params === 'string' ? params : params.url}`),
        additionalClientTools: {}
    })

    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
    })

    describe('skip_turn', () => {
        it('returns waiting message', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.skip_turn({})

            expect(response).toBe('Waiting for user input')
        })

        it('sets state to listening when not disconnected', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'speaking'
            const { result } = renderHook(() => useClientTools(options))

            await result.current.skip_turn({})

            expect(options.setStateSafe).toHaveBeenCalledWith('listening')
        })

        it('logs the tool call', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            await result.current.skip_turn({})

            expect(options.addLog).toHaveBeenCalledWith('Tool call: Skip Turn', 'info')
        })
    })

    describe('end_call', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('disconnects immediately when not speaking', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'listening'
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.end_call({})

            expect(options.disconnect).toHaveBeenCalledTimes(1)
            expect(response).toBe('Call ended')
            expect(options.addLog).toHaveBeenCalledWith('Tool call: End Call', 'info')
        })

        it('disconnects immediately when in connected state', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'connected'
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.end_call({})

            expect(options.disconnect).toHaveBeenCalledTimes(1)
            expect(response).toBe('Call ended')
        })

        it('disconnects immediately when thinking', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'thinking'
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.end_call({})

            expect(options.disconnect).toHaveBeenCalledTimes(1)
            expect(response).toBe('Call ended')
        })

        it('defers disconnect when agent is speaking', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'speaking'
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.end_call({})

            expect(options.disconnectAfterSpeakingRef.current).toBe(true)
            expect(options.disconnect).not.toHaveBeenCalled()
            expect(response).toBe('Call will end after speech')
            expect(options.addLog).toHaveBeenCalledWith('Agent is speaking, staggering disconnect...', 'info')
        })

        it('force disconnects after 5 second timeout when speaking', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'speaking'
            const { result } = renderHook(() => useClientTools(options))

            // Call end_call while speaking
            await act(async () => {
                await result.current.end_call({})
            })

            expect(options.disconnect).not.toHaveBeenCalled()

            // Fast-forward time to just before timeout
            act(() => {
                vi.advanceTimersByTime(4000)
            })
            expect(options.disconnect).not.toHaveBeenCalled()

            // Fast-forward to timeout (5 seconds total)
            act(() => {
                vi.advanceTimersByTime(1000)
            })

            expect(options.disconnect).toHaveBeenCalledTimes(1)
            expect(options.addLog).toHaveBeenCalledWith('Force disconnecting after timeout', 'warn')
        })

        it('does not force disconnect if flag is cleared before timeout', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'speaking'
            const { result } = renderHook(() => useClientTools(options))

            // Call end_call while speaking
            await act(async () => {
                await result.current.end_call({})
            })

            expect(options.disconnectAfterSpeakingRef.current).toBe(true)

            // Simulate natural disconnect (e.g., agent finished speaking)
            act(() => {
                options.disconnectAfterSpeakingRef.current = false
                vi.advanceTimersByTime(5000)
            })

            // Should not have called disconnect because flag was cleared
            expect(options.disconnect).not.toHaveBeenCalled()
        })

        it('logs all steps of deferred disconnect', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'speaking'
            const { result } = renderHook(() => useClientTools(options))

            await act(async () => {
                await result.current.end_call({})
            })

            expect(options.addLog).toHaveBeenCalledWith('Tool call: End Call', 'info')
            expect(options.addLog).toHaveBeenCalledWith('Agent is speaking, staggering disconnect...', 'info')

            // Trigger timeout
            act(() => {
                vi.advanceTimersByTime(5000)
            })

            expect(options.addLog).toHaveBeenCalledWith('Force disconnecting after timeout', 'warn')
        })

        it('handles multiple end_call attempts correctly', async () => {
            const options = createDefaultOptions()
            options.stateRef.current = 'speaking'
            const { result } = renderHook(() => useClientTools(options))

            // First call
            const response1 = await act(async () => {
                return await result.current.end_call({})
            })

            expect(response1).toBe('Call will end after speech')
            expect(options.disconnectAfterSpeakingRef.current).toBe(true)

            // Second call (still speaking)
            const response2 = await act(async () => {
                return await result.current.end_call({})
            })

            expect(response2).toBe('Call will end after speech')
            // Flag should still be true
            expect(options.disconnectAfterSpeakingRef.current).toBe(true)
        })
    })

    describe('redirectToPage', () => {
        it('uses the secure redirectToPage passed as parameter', async () => {
            const mockRedirect = vi.fn(async (params) => `Navigating to ${typeof params === 'string' ? params : params.url}`)
            const options = createDefaultOptions()
            options.redirectToPage = mockRedirect

            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.redirectToPage({ url: 'https://example.com' })

            expect(mockRedirect).toHaveBeenCalledWith({ url: 'https://example.com' })
            expect(response).toContain('Navigating to')
        })

        it('passes openInNewTab parameter through', async () => {
            const mockRedirect = vi.fn(async () => 'Opening in new tab')
            const options = createDefaultOptions()
            options.redirectToPage = mockRedirect

            const { result } = renderHook(() => useClientTools(options))

            await result.current.redirectToPage({ url: 'https://example.com', openInNewTab: true })

            expect(mockRedirect).toHaveBeenCalledWith({ url: 'https://example.com', openInNewTab: true })
        })
    })

    describe('syncUserData', () => {
        it('stores user name in sessionStorage', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            await result.current.syncUserData({ name: 'John Doe' })

            expect(sessionStorage.getItem('ael_user')).toBe('John Doe')
        })

        it('stores user email in sessionStorage', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            await result.current.syncUserData({ email: 'john@example.com' })

            expect(sessionStorage.getItem('ael_user_email')).toBe('john@example.com')
        })

        it('appends topics to existing interests', async () => {
            const options = createDefaultOptions()
            sessionStorage.setItem('ael_user_interests', 'AI')
            const { result } = renderHook(() => useClientTools(options))

            await result.current.syncUserData({ topic: 'Machine Learning' })

            expect(sessionStorage.getItem('ael_user_interests')).toBe('AI, Machine Learning')
        })

        it('returns confirmation message', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.syncUserData({ name: 'Test' })

            expect(response).toBe('User data synced')
        })
    })

    describe('getPageContext', () => {
        it('returns error when autoScrapeContext is disabled', async () => {
            const options = createDefaultOptions()
            options.autoScrapeContext = false
            const { result } = renderHook(() => useClientTools(options))

            const response = await result.current.getPageContext({})

            expect(response).toContain("'Auto Read' feature is disabled")
        })

        it('sets state to thinking while processing', async () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            await result.current.getPageContext({})

            expect(options.setStateSafe).toHaveBeenCalledWith('thinking')
        })
    })

    describe('snake_case aliases', () => {
        it('provides sync_user_data alias', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            expect(result.current.sync_user_data).toBeDefined()
            expect(result.current.sync_user_data).toBe(result.current.syncUserData)
        })

        it('provides redirect_to_page alias', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            expect(result.current.redirect_to_page).toBeDefined()
            expect(result.current.redirect_to_page).toBe(result.current.redirectToPage)
        })

        it('provides get_page_context alias', () => {
            const options = createDefaultOptions()
            const { result } = renderHook(() => useClientTools(options))

            expect(result.current.get_page_context).toBeDefined()
            expect(result.current.get_page_context).toBe(result.current.getPageContext)
        })
    })

    describe('additionalClientTools', () => {
        it('merges additional tools into registry', () => {
            const customTool = vi.fn(() => Promise.resolve('Custom response'))
            const options = createDefaultOptions()
            options.additionalClientTools = { customTool }

            const { result } = renderHook(() => useClientTools(options))

            expect(result.current.customTool).toBeDefined()
        })

        it('can call additional tools', async () => {
            const customTool = vi.fn(() => Promise.resolve('Custom response'))
            const options = createDefaultOptions()
            options.additionalClientTools = { customTool }

            const { result } = renderHook(() => useClientTools(options))
            const response = await result.current.customTool({ param: 'value' })

            expect(customTool).toHaveBeenCalledWith({ param: 'value' })
            expect(response).toBe('Custom response')
        })
    })
})
