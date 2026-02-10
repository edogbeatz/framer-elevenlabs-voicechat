export type AgentState = "connecting" | "initializing" | "listening" | "speaking" | "thinking" | "disconnected" | "connected"

export interface SDKError {
    message: string
    code?: string
    name?: string
}

export interface DisconnectDetails {
    reason?: string
}

export interface SDKModeChange {
    mode: AgentState
}

export interface SDKMessage {
    source: "user" | "ai" | "assistant"
    message: string
    text?: string
    type?: string
}

export interface VisitorState {
    isReturning: boolean
    visitCount: number
    daysSinceLastVisit: number
}

export interface VisitorHistory {
    visitCount?: number
    lastVisit?: number
    firstSeen?: number
}

export interface ElevenLabsSession {
    getOutputByteFrequencyData?: () => Uint8Array
    getOutputVolume?: () => number
    getInputVolume?: () => number
    setVolume?: (config: { volume: number }) => Promise<void>
    setMicMuted?: (muted: boolean) => Promise<void>
    sendText?: (text: string) => Promise<void>
    sendUserMessage?: (text: string) => Promise<void>
    sendContextualUpdate?: (update: string) => void | Promise<void>
    sendUserActivity?: () => void | Promise<void>  // Prevents agent interruption (ElevenLabs best practice)
    endSession: () => Promise<void>
    startSession?: (options: any) => Promise<any>
    // SDK internal - varies by version
    connection?: {
        sendText?: (text: string) => Promise<void>
        sendUserMessage?: (text: string) => Promise<void>
    }
}

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    /** Optional session ID for tracking conversation boundaries */
    sessionId?: string
    /** Timestamp for message ordering (voice mode ASR lag compensation) */
    timestamp?: number
}

export interface LinkRegistryItem {
    name: string
    path: string
}

export interface ElevenLabsVoiceChatProps {
    agentId?: string
    debug?: boolean
    startWithText?: boolean
    autoConnect?: boolean
    shareContext?: boolean
    autoScrapeContext?: boolean
    contextAllowlist?: string[]
    linkRegistry?: LinkRegistryItem[]
    style?: React.CSSProperties
    image?: any
    triggerButtonVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
    /** 
     * Display mode for the chat component:
     * - "default": Chat opens above the trigger button
     * - "mobileOverlay": Chat opens as a fullscreen overlay on top of the button (for mobile)
     */
    displayMode?: "default" | "mobileOverlay"
    // Style Groups (includes layout + colors)
    theme?: {
        /** Maximum width of the chat window (default: 400px) */
        maxWidth?: number
        /** Maximum height of the chat window (default: 500px) */
        maxHeight?: number
        /** Corner radius of the chat window (default: 24px) */
        cornerRadius?: number
        /** Border styling (Framer Border control type) */
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        }
        bg?: string
        fg?: string
        muted?: string
        focusRing?: string
    }
    status?: { connected: string, connecting: string, thinking?: string, disconnected?: string, error?: string, font?: any }
    // Button Tokens (By Function) - includes colors, sizing, borders, and optional icons/font
    triggerButton?: {
        bg: string,
        text: string,
        focus?: string,
        borderRadius?: number,
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        },
        borderWidth?: number,
        borderStyle?: string,
        borderColor?: string,
        padding?: string,
        gap?: number,
        labelOpen?: string,
        labelClosed?: string,
        font?: any,
        /** Beta warning text displayed below the button */
        betaText?: string,
        /** Color for the beta warning text */
        betaTextColor?: string
    }
    btnSend?: { bg: string, text: string, icon?: any }
    btnMic?: { bg: string, text: string, icon?: any, iconOff?: any }
    btnEnd?: { bg: string, text: string, icon?: any }
    btnCall?: { bg: string, text: string, icon?: any }
    // UI Groups with nested properties
    // UI Groups with nested properties
    bubbles?: { userBg: string, userText: string, agentBg: string, agentText: string, iconCopy?: any, iconCheck?: any, font?: any }
    input?: {
        bg: string,
        font?: any,
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        }
    }
    // Legacy icon properties (can be overridden by button-specific icons above)
    iconSend?: any
    iconMic?: any
    iconMicOff?: any  // Mic with line (muted state)
    iconEnd?: any     // End session button
    iconDisconnect?: any
    iconCall?: any
    iconKeyboard?: any
    iconCopy?: any
    iconCheck?: any
    // Heatmap Visualizer (Audio-Reactive Effects)
    heatmap?: {
        /** Enable shader effect, when false shows static image only */
        enabled?: boolean
        image?: any
        /** Width as percentage of size (10-100), default 100 */
        width?: number
        /** Height as percentage of size (10-100), default 100 */
        height?: number
        /** Border radius as percentage (0-50, where 50 = circle), default 50 */
        borderRadius?: number
        colors?: string[]
        background?: string
        scale?: number
        speed?: number
        angle?: number
        noise?: number
        innerGlow?: number
        outerGlow?: number
        contour?: number
        fit?: "contain" | "cover" | "fill"
        audioReactivity?: number
        bassToInnerGlow?: number
        midToOuterGlow?: number
        trebleToContour?: number
        volumeToAngle?: number
    }
    /** @deprecated Use heatmap.scale instead */
    visualizerScale?: number
    // Sound Effects (CDN URLs from Framer File controls)
    soundInitializing?: string
    soundConnecting?: string
    soundThinking?: string
    soundListening?: string
    soundError?: string
    soundDisconnected?: string
    // Turn-Taking Configuration
    allowInterruptions?: boolean
    /** 
     * Control agent responsiveness: 
     * - "normal" (default): Balanced turn-taking 
     * - "eager": Quick responses, minimal pause tolerance
     * - "patient": Allows longer user pauses before responding
     */
    turnEagerness?: "normal" | "eager" | "patient"
    /**
     * Seconds of silence before agent considers turn complete
     * Default: 1.2 (optimized for office environments with brief pauses)
     * Range: 0.5-2.0
     */
    turnTimeout?: number
    /**
     * VAD sensitivity threshold
     * Default: 0.5 (balanced - prevents "deaf agent" bug)
     * Range: 0.3 (very sensitive) to 0.7 (aggressive noise rejection)
     * Warning: Values above 0.6 may miss normal speech in some environments
     */
    vadThreshold?: number
    /**
     * Enable background voice detection in VAD
     * Default: true (detect background voices/noise)
     * Set to false to reduce false positives on mobile Safari or in noisy environments
     * When disabled, VAD only responds to primary speaker (microphone focus)
     */
    backgroundVoiceDetection?: boolean
    // Helper
    showDesign?: boolean

    // Unified Layout Mode (Merged Component)
    layoutMode?: "fixed" | "embedded"
    fixedPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
    triggerSettings?: {
        label?: string
        color?: string
        bg?: string
    }
}
