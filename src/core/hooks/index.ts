/**
 * Custom Hooks
 * 
 * React hooks for ElevenLabs session management, chat state, and UI controls.
 * 
 * Primary Hooks:
 * - useElevenLabsSession: Main session orchestrator (WebSocket, state, messages)
 * - useChatMessages: Message list management and auto-scroll
 * 
 * Specialized Hooks:
 * - useAgentNavigation: Page navigation and context sharing
 * - useAudioControls: Audio volume and mic control
 * - useClientTools: ElevenLabs client tool implementations
 * - useScribe: Context scraping and sharing
 * - useSessionConnection: WebSocket connection management
 * - useSessionTimeout: Idle session timeout and keep-alive
 */

// Session Management
export * from "./useElevenLabsSession"
export * from "./useSessionConnection"
export * from "./useSessionTimeout"

// Chat State
export * from "./useChatMessages"

// Audio & Controls
export * from "./useAudioControls"

// Navigation & Context
export * from "./useAgentNavigation"
export * from "./useScribe"

// Client Tools
export * from "./useClientTools"
