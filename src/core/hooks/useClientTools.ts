/**
 * useClientTools - Client tools registry for ElevenLabs agents
 * 
 * Extracts tool registration logic from useElevenLabsSession for better separation of concerns.
 */

import { useCallback, useMemo } from "react"
import type { AgentState } from "../types"
import { getPageContent } from "../utils/pageReader"

export interface UseClientToolsOptions {
    debug: boolean
    autoScrapeContext: boolean
    addLog: (msg: string, type?: "info" | "error" | "warn" | "success") => void
    setStateSafe: (state: AgentState) => void
    disconnect: () => void
    disconnectAfterSpeakingRef: React.MutableRefObject<boolean>
    stateRef: React.MutableRefObject<AgentState>
    redirectToPage: (params: { url: string; openInNewTab?: boolean } | string) => Promise<string>
    additionalClientTools?: Record<string, (params: any) => Promise<string>>
}

export type ClientToolsRegistry = Record<string, (params: any) => Promise<string>>

export function useClientTools(options: UseClientToolsOptions): ClientToolsRegistry {
    const {
        debug,
        autoScrapeContext,
        addLog,
        setStateSafe,
        disconnect,
        disconnectAfterSpeakingRef,
        stateRef,
        redirectToPage,
        additionalClientTools = {},
    } = options

    const skipTurn = useCallback(async () => {
        addLog("Tool call: Skip Turn", "info")
        if (stateRef.current !== "disconnected") setStateSafe("listening")
        return "Waiting for user input"
    }, [addLog, setStateSafe, stateRef])

    const endCall = useCallback(async () => {
        addLog("Tool call: End Call", "info")
        if (stateRef.current === "speaking") {
            addLog("Agent is speaking, staggering disconnect...", "info")
            disconnectAfterSpeakingRef.current = true
            // BROWSER FIX: Reduced from 10s to 5s for faster disconnect when
            // mode change events don't fire properly (common on some browsers)
            setTimeout(() => {
                if (disconnectAfterSpeakingRef.current) {
                    addLog("Force disconnecting after timeout", "warn")
                    disconnect()
                }
            }, 5000)
            return "Call will end after speech"
        }
        disconnect()
        return "Call ended"
    }, [addLog, disconnect, disconnectAfterSpeakingRef, stateRef])

    // NOTE: redirectToPage is now passed in from useAgentNavigation (validates against linkRegistry)

    const syncUserData = useCallback(async (params: { topic?: string; page?: string; question?: string; name?: string; email?: string }) => {
        addLog(`Tool call: Syncing user data`, "info")
        if (typeof window !== "undefined") {
            if (params.name) sessionStorage.setItem("ael_user", params.name)
            if (params.email) sessionStorage.setItem("ael_user_email", params.email)
            if (params.topic) {
                const existing = sessionStorage.getItem("ael_user_interests") || ""
                sessionStorage.setItem("ael_user_interests", existing ? `${existing}, ${params.topic}` : params.topic)
            }
            if (params.question) {
                const existing = sessionStorage.getItem("ael_user_questions") || ""
                sessionStorage.setItem("ael_user_questions", existing ? `${existing} | ${params.question}` : params.question)
            }
        }
        return "User data synced"
    }, [addLog])

    const getCurrentTime = useCallback(async () => {
        addLog("Tool call: Get Current Time", "info")
        const now = new Date()
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short"
        }
        const formatted = now.toLocaleDateString("en-US", options)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        return `Current date and time: ${formatted}. Timezone: ${timezone}.`
    }, [addLog])

    const getPageContextTool = useCallback(async (params: { selector?: string; reading_mode?: "verbatim" | "rephrased" }) => {
        const mode = params.reading_mode || "verbatim"
        addLog(`Tool call: Get Page Context (${mode})`, "info")

        if (!autoScrapeContext) {
            addLog("Page reading ignored (Auto Read disabled)", "warn")
            return "I cannot read this page because the 'Auto Read' feature is disabled."
        }

        // Note: "thinking" state is now handled by wrapWithThinkingState wrapper

        return await getPageContent({
            selector: params.selector,
            readingMode: mode,
            maxContextLength: 5000,
            debug,
            addLog
        })
    }, [addLog, autoScrapeContext, debug])

    /**
     * Wraps a tool function to trigger "thinking" state before execution.
     * This ensures the thinking sound plays when any tool is called.
     * Includes a fallback timeout to prevent stuck "thinking" state if SDK events don't fire.
     */
    const wrapWithThinkingState = useCallback(
        <T extends (params: any) => Promise<string>>(toolFn: T, toolName: string): T => {
            return (async (params: any) => {
                addLog(`[Tool Call] ${toolName} - triggering thinking state`, "info")
                setStateSafe("thinking")

                try {
                    const result = await toolFn(params)
                    return result
                } finally {
                    // FALLBACK: 3s after tool completion, check if we're stuck in "thinking"
                    // If SDK hasn't transitioned us to speaking/listening, force to listening
                    // This prevents the agent from getting permanently stuck
                    setTimeout(() => {
                        if (stateRef.current === "thinking") {
                            addLog(`[Tool Fallback] ${toolName} - stuck in thinking, forcing to listening`, "warn")
                            setStateSafe("listening")
                        }
                    }, 3000)
                }
            }) as T
        },
        [addLog, setStateSafe, stateRef]
    )

    // Build registry with aliases
    const clientTools = useMemo(() => {
        // Control tools that should NOT trigger thinking state
        const controlTools: ClientToolsRegistry = {
            skip_turn: skipTurn,
            end_call: endCall,
        }

        // Processing tools that SHOULD trigger thinking state
        const processingTools: ClientToolsRegistry = {
            redirectToPage: wrapWithThinkingState(redirectToPage, "redirectToPage"),
            syncUserData: wrapWithThinkingState(syncUserData, "syncUserData"),
            getPageContext: wrapWithThinkingState(getPageContextTool, "getPageContext"),
            getCurrentTime: wrapWithThinkingState(getCurrentTime, "getCurrentTime"),
        }

        // Wrap additional client tools with thinking state
        const wrappedAdditionalTools: ClientToolsRegistry = {}
        for (const [name, fn] of Object.entries(additionalClientTools)) {
            wrappedAdditionalTools[name] = wrapWithThinkingState(fn, name)
        }

        const tools: ClientToolsRegistry = {
            ...controlTools,
            ...processingTools,
            ...wrappedAdditionalTools,
        }

        // Snake_case aliases for case-insensitive resilience (also wrapped)
        return {
            ...tools,
            sync_user_data: processingTools.syncUserData,
            redirect_to_page: processingTools.redirectToPage,
            get_page_context: processingTools.getPageContext,
            get_current_time: processingTools.getCurrentTime,
        }
    }, [skipTurn, endCall, redirectToPage, syncUserData, getPageContextTool, getCurrentTime, additionalClientTools, wrapWithThinkingState])

    return clientTools
}

export default useClientTools
