import { useRouter } from "framer"
import { useState, useEffect, useCallback, useRef } from "react"

import { type LinkRegistryItem } from "../types"
export type { LinkRegistryItem }

export interface AgentNavigationState {
    currentPage: string
    previousPage: string | null
    visitHistory: string[] // max 5 entries
    canGoBack: boolean
    canGoForward: boolean
    updatedAt: number
}

const STORAGE_KEY = "agent_navigation_state"

export interface UseAgentNavigationProps {
    linkRegistry: LinkRegistryItem[]
    addLog?: (msg: string, type?: "info" | "warn" | "error" | "success") => void
}

const listeners = new Set<() => void>()
let isListening = false
let pollingIntervalId: ReturnType<typeof setInterval> | null = null

// Global dedup to prevent multiple components (Chat + Button) from flooding logs
let globalLastLog: { msg: string; time: number } | null = null

const handleGlobalLocationChange = () => {
    listeners.forEach((listener) => listener())
}

const startListening = () => {
    if (typeof window === "undefined" || isListening) return
    isListening = true
    window.addEventListener("popstate", handleGlobalLocationChange)
    // Polling as fallback (cleanup-able)
    pollingIntervalId = setInterval(handleGlobalLocationChange, 1000)
}

// Optional: Allow cleanup when all components unmount (future-proof)
const stopListening = () => {
    if (!isListening) return
    isListening = false
    window.removeEventListener("popstate", handleGlobalLocationChange)
    if (pollingIntervalId !== null) {
        clearInterval(pollingIntervalId)
        pollingIntervalId = null
    }
}

export const useAgentNavigation = ({
    linkRegistry,
    addLog,
}: UseAgentNavigationProps) => {
    const router = useRouter ? useRouter() : null
    const isRestored = useRef(false)
    const hasLogged = useRef(false)

    // Helper to dedup logs globally
    const logOnce = useCallback((msg: string, type: "info" | "warn" | "error" | "success" = "info") => {
        const now = Date.now()
        if (
            globalLastLog &&
            globalLastLog.msg === msg &&
            now - globalLastLog.time < 500
        ) {
            return // Duplicate suppressed globally
        }
        globalLastLog = { msg, time: now }
        addLog?.(msg, type)
    }, [addLog])

    // Resolve current URL to link registry page name
    const resolvePageName = useCallback((pathname: string): string => {
        if (typeof window === "undefined") return "Unknown"

        // FRAMER FIX: Merge internal Framer preview paths to a single stable name
        // This prevents infinite loops when switching between canvas/preview contexts
        if (pathname.includes("sandbox.html") || pathname.includes("module.html")) {
            return "Framer Preview"
        }

        const normalized = pathname.replace(/\/$/, "") || "/"

        // Try to find matching entry in link registry
        const entry = linkRegistry.find(
            (l) => {
                // Support both 'path' (Framer) and 'target' (Legacy)
                // @ts-ignore
                const targetUrl = l.path || l.target || ""
                const targetNormalized = targetUrl.replace(/\/$/, "") || "/"
                return targetNormalized === normalized
            }
        )

        if (entry) return entry.name

        // Fallback to path segment (capitalized)
        const segment = pathname.split("/").pop() || "Home"
        return segment.charAt(0).toUpperCase() + segment.slice(1)
    }, [linkRegistry])

    const getInitialState = (): AgentNavigationState => {
        // Always return a consistent default for initial render to prevent hydration mismatch
        // We will restore from session storage in useEffect
        return {
            currentPage: "Unknown", // Placeholder, will update immediately on client
            previousPage: null,
            visitHistory: [],
            canGoBack: false,
            canGoForward: false,
            updatedAt: Date.now(),
        }
    }

    const [navigationState, setNavigationState] = useState<AgentNavigationState>(getInitialState)
    const [isMounted, setIsMounted] = useState(false)

    // Store resolvePageName in a ref to avoid triggering effects on every render
    const resolvePageNameRef = useRef(resolvePageName)
    resolvePageNameRef.current = resolvePageName

    // Hydration and State Restoration - runs only once on mount
    useEffect(() => {
        setIsMounted(true)
        if (typeof window === "undefined") return

        // 1. Try to restore from session storage
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Verify saved state matches current URL
                const currentPage = resolvePageNameRef.current(window.location.pathname)
                if (parsed.currentPage !== currentPage) {
                    // URL changed since last visit - update state with correct page
                    addLog?.(`Navigation restored but URL changed: ${parsed.currentPage} → ${currentPage}`, "info")
                    setNavigationState({
                        ...parsed,
                        previousPage: parsed.currentPage,
                        currentPage,
                        visitHistory: [...(parsed.visitHistory || []), currentPage],
                        updatedAt: Date.now(),
                    })
                    isRestored.current = true
                    return
                }
                isRestored.current = true
                setNavigationState(parsed)
                return // Found saved state, done
            } catch (e) {
                console.error("Failed to parse navigation state", e)
                addLog?.("Failed to restore navigation state from session", "warn")
            }
        }

        // 2. Fallback to current location if no saved state
        const currentPage = resolvePageNameRef.current(window.location.pathname)
        setNavigationState({
            currentPage,
            previousPage: null,
            visitHistory: [currentPage],
            canGoBack: false,
            canGoForward: false,
            updatedAt: Date.now(),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once on mount

    // Sync state to sessionStorage
    useEffect(() => {
        if (typeof window !== "undefined" && isMounted) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(navigationState))
        }
    }, [navigationState, isMounted])

    // Store logOnce in a ref to avoid triggering effects on every render
    const logOnceRef = useRef(logOnce)
    logOnceRef.current = logOnce

    // Log initialization once (after hydration)
    useEffect(() => {
        if (!hasLogged.current && isMounted) {
            hasLogged.current = true
            if (isRestored.current) {
                logOnceRef.current(`Loaded navigation state from session: ${navigationState.currentPage}`, "success")
            } else {
                logOnceRef.current(`Initialized navigation: ${navigationState.currentPage}`, "info")
            }
        }
    }, [isMounted, navigationState.currentPage])

    // Track navigation changes (Singleton Listener) - runs once on mount
    useEffect(() => {
        if (typeof window === "undefined") return

        startListening()

        const handleLocationChange = () => {
            const newPage = resolvePageNameRef.current(window.location.pathname)

            setNavigationState((prev: AgentNavigationState) => {
                if (prev.currentPage === newPage) return prev

                logOnceRef.current(`Navigation detected: ${prev.currentPage} -> ${newPage}`, "info")
                const newHistory = [...prev.visitHistory, newPage].slice(-5)
                return {
                    ...prev,
                    previousPage: prev.currentPage,
                    currentPage: newPage,
                    visitHistory: newHistory,
                    canGoBack: window.history.length > 1,
                    canGoForward: false, // Hard to detect reliably without wrapper
                    updatedAt: Date.now(),
                }
            })
        }

        listeners.add(handleLocationChange)
        // Initial check
        handleLocationChange()

        return () => {
            listeners.delete(handleLocationChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once on mount - refs keep functions up to date

    const normalizeUrl = (url: string) => {
        try {
            const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost")
            return u.pathname.replace(/\/$/, "") || "/"
        } catch (e) {
            return url.trim().replace(/\/$/, "") || "/"
        }
    }

    const redirectToPage = async (params: { url: string; openInNewTab?: boolean } | string) => {
        // @ts-ignore
        let target = typeof params === "string" ? params : params?.url || params?.path
        const openInNewTab = typeof params === "object" && params?.openInNewTab

        if (!target) return "Error: No target specified."
        target = target.trim()

        if (typeof window === "undefined") return "Navigation queued (SSR)."

        // MOBILE NAVIGATION BLOCK: Disable navigation on mobile devices
        // Mobile overlay mode has DOM isolation issues that prevent reliable navigation
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (isMobile) {
            addLog?.(`❌ Navigation blocked on mobile device`, "warn")
            return "Navigation is not currently supported on mobile devices. Please use the site's menu to navigate manually."
        }

        if (openInNewTab) {
            window.open(target, "_blank")
            return `Opening ${target} in new tab...`
        }

        const normalizedTarget = target.toLowerCase().replace(/^\//, "").trim()

        // Handle Back/Forward directly
        if (normalizedTarget === "__back__" || normalizedTarget === "back") {
            addLog?.("Executing history.back()", "success")
            window.history.back()
            // Kickstart Framer router detection for history changes
            setTimeout(() => window.dispatchEvent(new Event('popstate')), 50)
            return "Navigating back..."
        }
        if (normalizedTarget === "__forward__" || normalizedTarget === "forward") {
            addLog?.("Executing history.forward()", "success")
            window.history.forward()
            // Kickstart Framer router detection for history changes
            setTimeout(() => window.dispatchEvent(new Event('popstate')), 50)
            return "Navigating forward..."
        }

        // Validate against registry
        addLog?.(`Redirect target: "${target}" (normalized: "${normalizedTarget}")`, "info")
        addLog?.(`Registry entries: ${linkRegistry.length}`, "info")

        const entry = linkRegistry.find(
            (l) =>
                l.name.toLowerCase().trim() === normalizedTarget ||
                // @ts-ignore
                (l.target || l.path || "").toLowerCase().replace(/^\//, "").trim() === normalizedTarget ||
                // @ts-ignore
                normalizeUrl(l.target || l.path) === normalizeUrl(target)
        )

        if (!entry) {
            const validNames = linkRegistry.map((l) => l.name).join(", ")
            console.warn("Blocked redirect attempt to:", target)
            return `Error: Page "${target}" not found in registry. Valid pages are: ${validNames}.`
        }

        // @ts-ignore
        const finalUrl = entry.target || entry.path

        // Extract hash/anchor from the URL (e.g., "/home#services" -> "#services")
        const hashIndex = finalUrl.indexOf('#')
        const hasAnchor = hashIndex !== -1
        const pathPart = hasAnchor ? finalUrl.substring(0, hashIndex) : finalUrl
        const anchorPart = hasAnchor ? finalUrl.substring(hashIndex) : ''

        const normalizedPath = normalizeUrl(pathPart || '/')
        const currentPath = normalizeUrl(window.location.pathname)

        addLog?.(`Resolved "${target}" to URL: ${finalUrl} (path: ${pathPart}, anchor: ${anchorPart})`, "info")

        // Helper function to scroll to anchor element
        const scrollToAnchor = (hash: string) => {
            if (!hash || hash === '#') return

            const elementId = hash.replace('#', '')
            addLog?.(`Scrolling to anchor: #${elementId}`, "info")

            // Try multiple times with increasing delays (Framer may need time to render)
            const attemptScroll = (attempt: number) => {
                const element = document.getElementById(elementId) ||
                    document.querySelector(`[data-framer-name="${elementId}"]`) ||
                    document.querySelector(`[name="${elementId}"]`)

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    addLog?.(`✅ Scrolled to #${elementId}`, "success")
                    // Also update the URL hash
                    if (window.location.hash !== hash) {
                        window.history.replaceState(null, '', hash)
                    }
                } else if (attempt < 5) {
                    // Retry after a delay (Framer pages may load elements asynchronously)
                    setTimeout(() => attemptScroll(attempt + 1), 100 * attempt)
                } else {
                    addLog?.(`⚠️ Could not find anchor element: #${elementId}`, "warn")
                }
            }

            // Start scroll attempts after a small delay to let the page settle
            setTimeout(() => attemptScroll(1), 50)
        }

        // If it's an anchor-only link on the SAME page, just scroll
        if (hasAnchor && (pathPart === '' || currentPath === normalizedPath)) {
            addLog?.(`Same-page anchor navigation to ${anchorPart}`, "info")
            scrollToAnchor(anchorPart)
            return `Scrolling to ${anchorPart}...`
        }

        // If we're already on this page (and no anchor), no need to navigate
        if (!hasAnchor && currentPath === normalizedPath) {
            addLog?.(`Ignored redirect to current page: ${finalUrl}`, "info")
            return `User is already on the ${entry.name} page.`
        }

        if (finalUrl.startsWith("http")) {
            window.location.assign(finalUrl)
            return `Navigating to external URL: ${finalUrl}`
        }

        // Navigate to the page first
        let navigated = false

        // PRIMARY METHOD: Click Simulation
        // Instead of calling router.navigate(), find and click the actual link element.
        // This is the most reliable method because it uses Framer's built-in navigation.
        const tryClickNavigation = () => {
            // Try multiple selectors to find the link
            const selectors = [
                `a[href="${pathPart}"]`,
                `a[href="${pathPart}/"]`,
                `a[href="${normalizedPath}"]`,
                `a[href*="${pathPart}"]`
            ]

            for (const selector of selectors) {
                const links = document.querySelectorAll(selector)
                if (links.length > 0) {
                    const link = links[0] as HTMLElement
                    addLog?.(`✅ Found link element, attempting navigation: ${selector}`, "success")

                    try {
                        // Try standard click first
                        link.click()
                        addLog?.(`Navigation via click() executed`, "info")
                    } catch (e) {
                        // Fallback to touch event simulation for mobile browsers
                        addLog?.(`Click failed, trying TouchEvent simulation for mobile`, "info")
                        try {
                            // Create a synthetic touch object
                            const touchObj = {
                                identifier: Date.now(),
                                target: link,
                                clientX: 0,
                                clientY: 0,
                                screenX: 0,
                                screenY: 0,
                                pageX: 0,
                                pageY: 0
                            }

                            // Dispatch touchstart
                            link.dispatchEvent(new TouchEvent('touchstart', {
                                bubbles: true,
                                cancelable: true,
                                touches: [touchObj as any],
                                targetTouches: [touchObj as any],
                                changedTouches: [touchObj as any]
                            }))

                            // Dispatch touchend after a brief delay
                            setTimeout(() => {
                                link.dispatchEvent(new TouchEvent('touchend', {
                                    bubbles: true,
                                    cancelable: true,
                                    changedTouches: [touchObj as any]
                                }))
                            }, 10)

                            addLog?.(`TouchEvent simulation dispatched for mobile`, "success")
                        } catch (touchError) {
                            addLog?.(`TouchEvent simulation also failed: ${touchError}`, "warn")
                        }
                    }
                    return true
                }
            }
            return false
        }

        const clickSuccess = tryClickNavigation()
        if (clickSuccess) {
            navigated = true
            addLog?.(`Navigation via click simulation successful`, "success")
            // Still scroll to anchor if present
            if (hasAnchor) {
                setTimeout(() => scrollToAnchor(anchorPart), 300)
            }
            return `Navigating to ${finalUrl}...`
        }

        // CRITICAL MOBILE OVERLAY FIX: Missing Link Fallback
        // In mobile overlay mode, the main site's <a> tags are often missing from the DOM
        // because the chat is rendered in an isolated layer (React portal, etc.)
        // This is a last resort that will terminate the session but ensures navigation works
        addLog?.(`⚠️ No navigation link found in DOM. Using direct assignment fallback for mobile overlay.`, "warn")
        const targetUrl = new URL(pathPart || '/', window.location.origin).href
        addLog?.(`Direct navigation to: ${targetUrl}`, "info")
        window.location.assign(targetUrl)
        // Note: This will cause a page reload and terminate the agent session
        return `Navigating to ${finalUrl}...`
    }

    return { redirectToPage, navigationState }
}
