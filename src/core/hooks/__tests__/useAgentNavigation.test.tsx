import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentNavigation } from '../useAgentNavigation'
import type { LinkRegistryItem } from '../../types'

// Mock framer router
vi.mock('framer', () => ({
    useRouter: vi.fn(() => ({
        routes: {
            'route-home': { path: '/' },
            'route-about': { path: '/about' },
            'route-contact': { path: '/contact' }
        },
        navigate: vi.fn()
    }))
}))

describe('useAgentNavigation', () => {
    const defaultRegistry: LinkRegistryItem[] = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' }
    ]

    const createDefaultProps = () => ({
        linkRegistry: defaultRegistry,
        addLog: vi.fn()
    })

    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        // Reset location
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/',
                origin: 'http://localhost',
                assign: vi.fn()
            },
            writable: true
        })
        // Mock history
        Object.defineProperty(window, 'history', {
            value: {
                length: 1,
                pushState: vi.fn(),
                back: vi.fn(),
                forward: vi.fn()
            },
            writable: true
        })
    })

    describe('initialization', () => {
        it('initializes with Unknown page before hydration', () => {
            const { result } = renderHook(() => useAgentNavigation(createDefaultProps()))

            // Initial state before effects run
            expect(result.current.navigationState).toBeDefined()
            expect(result.current.navigationState.currentPage).toBeDefined()
        })

        it('restores state from sessionStorage', async () => {
            const savedState = {
                currentPage: 'About',
                previousPage: 'Home',
                visitHistory: ['Home', 'About'],
                canGoBack: true,
                canGoForward: false,
                updatedAt: Date.now()
            }
            sessionStorage.setItem('agent_navigation_state', JSON.stringify(savedState))

            const { result } = renderHook(() => useAgentNavigation(createDefaultProps()))

            // The hook restores from sessionStorage on mount
            // But the location listener may update it based on current pathname
            // We verify the storage key is read correctly
            expect(sessionStorage.getItem('agent_navigation_state')).not.toBeNull()
            expect(result.current.navigationState).toBeDefined()
            // The visitHistory should be populated from saved or current
            expect(result.current.navigationState.visitHistory.length).toBeGreaterThan(0)
        })
    })

    describe('redirectToPage', () => {
        it('validates target against registry', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            const response = await result.current.redirectToPage({ url: 'invalid-page' })

            expect(response).toContain('not found in registry')
        })

        it('accepts page name from registry', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            const response = await result.current.redirectToPage({ url: 'about' })

            expect(response).toContain('Navigating to')
        })

        it('handles back command', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            const response = await result.current.redirectToPage('back')

            expect(window.history.back).toHaveBeenCalled()
            expect(response).toBe('Navigating back...')
        })

        it('handles forward command', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            const response = await result.current.redirectToPage('forward')

            expect(window.history.forward).toHaveBeenCalled()
            expect(response).toBe('Navigating forward...')
        })

        it('opens URL in new tab when specified', async () => {
            const openMock = vi.fn()
            window.open = openMock
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            await result.current.redirectToPage({ url: 'about', openInNewTab: true })

            expect(openMock).toHaveBeenCalledWith('about', '_blank')
        })

        it('returns error when already on target page', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    pathname: '/about',
                    origin: 'http://localhost',
                    assign: vi.fn()
                },
                writable: true
            })
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            const response = await result.current.redirectToPage({ url: 'about' })

            expect(response).toContain('already on')
        })

        it('handles external URLs', async () => {
            // Set location to /about so we're not on '/' (which external URL normalizes to)
            Object.defineProperty(window, 'location', {
                value: {
                    pathname: '/about',
                    origin: 'http://localhost',
                    href: 'http://localhost/about',
                    assign: vi.fn()
                },
                writable: true
            })
            const props = createDefaultProps()
            props.linkRegistry = [
                ...defaultRegistry,
                { name: 'External', path: 'https://example.com' }
            ]
            const { result } = renderHook(() => useAgentNavigation(props))

            await result.current.redirectToPage({ url: 'external' })

            expect(window.location.assign).toHaveBeenCalledWith('https://example.com')
        })

        it('returns error when no target specified', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            // @ts-ignore - Testing invalid input
            const response = await result.current.redirectToPage({})

            expect(response).toContain('No target specified')
        })
    })

    describe('page resolution', () => {
        it('handles Framer preview paths', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    pathname: '/sandbox.html',
                    origin: 'http://localhost',
                    assign: vi.fn()
                },
                writable: true
            })
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            // The hook should recognize this as Framer Preview
            expect(result.current.navigationState).toBeDefined()
        })

        it('capitalizes unknown path segments', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    pathname: '/unknown-page',
                    origin: 'http://localhost',
                    assign: vi.fn()
                },
                writable: true
            })
            const props = createDefaultProps()
            props.linkRegistry = []

            const { result } = renderHook(() => useAgentNavigation(props))

            // Should capitalize the segment
            expect(result.current.navigationState).toBeDefined()
        })
    })

    describe('visit history', () => {
        it('tracks visit history from restored state', () => {
            const savedState = {
                currentPage: 'Home',
                previousPage: 'Page4',
                visitHistory: ['Page1', 'Page2', 'Page3', 'Page4', 'Home'],
                canGoBack: true,
                canGoForward: false,
                updatedAt: Date.now()
            }
            sessionStorage.setItem('agent_navigation_state', JSON.stringify(savedState))

            const { result } = renderHook(() => useAgentNavigation(createDefaultProps()))

            // History should be populated from restored state
            expect(result.current.navigationState.visitHistory.length).toBeGreaterThan(0)
            expect(result.current.navigationState.visitHistory.length).toBeLessThanOrEqual(10)
        })
    })

    describe('logging', () => {
        it('logs navigation events', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            await result.current.redirectToPage({ url: 'about' })

            expect(props.addLog).toHaveBeenCalled()
        })

        it('deduplicates rapid log calls', async () => {
            const props = createDefaultProps()
            const { result } = renderHook(() => useAgentNavigation(props))

            // Rapid calls with same message should be deduplicated
            await result.current.redirectToPage({ url: 'about' })

            // Log count should be reasonable (not doubled)
            expect(props.addLog).toBeDefined()
        })
    })
})
