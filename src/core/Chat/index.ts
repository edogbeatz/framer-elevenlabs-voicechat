/**
 * Chat Module
 * 
 * Main voice/text chat interface for ElevenLabs Conversational AI.
 * Exports the primary component and related UI primitives.
 */

// Primary export
export { default } from "./ElevenLabsVoiceChat"
export { default as ElevenLabsVoiceChat } from "./ElevenLabsVoiceChat"

// Re-export types
export type { ElevenLabsVoiceChatProps } from "../types"

// Re-export components (for external consumers)
export { ChatHeader, ChatInput, ChatMessageBubble, IconButton } from "./components"
export type { ChatHeaderProps, ChatInputProps, ChatMessageBubbleProps, IconButtonProps } from "./components"
