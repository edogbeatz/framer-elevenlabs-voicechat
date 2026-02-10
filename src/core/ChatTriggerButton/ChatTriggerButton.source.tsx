/**
 * ChatTriggerButton.source.tsx - Framer trigger button source.
 *
 * Edit here and bundle via scripts/component/bundle_chat.py.
 */

import * as React from "react"
import { useState, useCallback } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { TriggerButtonBase, TriggerHeatmapIcon } from "../Chat/components/TriggerButton"

// --- Types ---

type ButtonState = "idle" | "loading" | "open"

export interface ChatTriggerButtonProps {
    // Connection Group
    connectedChat?: React.ReactNode | any
    connection?: {
        eventName?: string
        overlayPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center"
        offsetX?: number
        offsetY?: number
    }
    // Heatmap Group
    heatmap?: {
        image?: string
        colors?: string[]
        background?: string
        size?: number
        scale?: number
    }

    // Shader Settings Group
    shaderSettings?: {
        speed?: number
        angle?: number
        contour?: number
        innerGlow?: number
        outerGlow?: number
        noise?: number
    }

    // Labels Group
    labels?: {
        idle?: string
        loading?: string
        open?: string
        color?: string
        font?: React.CSSProperties  // Font styles from ControlType.Font
    }

    // Button States Group
    buttonStates?: {
        idle?: string
        loading?: string
        open?: string
    }

    // Styling Group
    styling?: {
        borderRadius?: number
        focusRing?: string
        padding?: string
        border?: {
            borderWidth?: number
            borderStyle?: string
            borderColor?: string
        }
    }

    // Advanced
    style?: React.CSSProperties
}


// --- Main Component ---

export default function ChatTriggerButton({
    // Grouped props with nested defaults
    heatmap = {},
    shaderSettings = {},
    labels = {},
    buttonStates = {},
    styling = {},
    // Connection
    connectedChat,
    connection = {},
    // Advanced
    style,
}: ChatTriggerButtonProps) {
    // Extract values with defaults
    const {
        image: heatmapImage = "https://framerusercontent.com/images/33s7K51323Jz9622k6dKk3yV2s.png",
        colors: heatmapColors = ["#11206A", "#1F3BA2", "#2F63E7", "#6BD7FF", "#FFE679", "#FF991E", "#FF4C00"],
        background: heatmapBackground = "#000000",
        size: heatmapSize = 48,
        scale: heatmapScale = 0.6,
    } = heatmap

    const {
        speed = 0.4,
        angle = 30,
        contour = 0.6,
        innerGlow = 0.3,
        outerGlow = 0.5,
        noise = 0,
    } = shaderSettings

    const {
        idle: labelIdle = "Chat with AI",
        loading: labelLoading = "Connecting",
        open: labelOpen = "Close",
        color: labelColor = "#FFFFFF",
        font: labelFont = {},  // Font styles from ControlType.Font
    } = labels

    const {
        idle: bgIdle = "#000000",
        loading: bgLoading = "#1C1C1C",
        open: bgOpen = "#2C2C2C",
    } = buttonStates

    const {
        borderRadius = 16,
        focusRing: focusRingColor = "rgba(255,255,255,0.4)",
        padding: buttonPadding = "12px 20px",
        border: borderObj,
    } = styling

    // Extract border properties with defaults
    const borderWidth = borderObj?.borderWidth ?? 0
    const borderColor = borderObj?.borderColor ?? "rgba(255,255,255,0.2)"
    const borderStyle = borderObj?.borderStyle ?? "solid"

    const {
        eventName = "chat-trigger-state",
    } = connection

    const [buttonState, setButtonState] = useState<ButtonState>("idle")
    const isDesignMode = RenderTarget.current() === RenderTarget.canvas

    const handleClick = useCallback(() => {
        if (buttonState === "idle") {
            setButtonState("loading")
            // Dispatch event that main chat component listens for
            window.dispatchEvent(new CustomEvent(eventName, {
                detail: { action: "open" }
            }))

            // Simulate connection process
            setTimeout(() => {
                setButtonState("open")
            }, 1500)
        } else if (buttonState === "open") {
            setButtonState("idle")
            // Dispatch close event
            window.dispatchEvent(new CustomEvent(eventName, {
                detail: { action: "close" }
            }))
        }
    }, [buttonState, eventName])

    const isLoading = buttonState === "loading"
    const isOpen = buttonState === "open"
    const currentBgColor = isLoading ? bgLoading : isOpen ? bgOpen : bgIdle
    const currentLabel = isLoading ? labelLoading : isOpen ? labelOpen : labelIdle

    const buttonContent = (
        <TriggerButtonBase
            label={currentLabel}
            ariaLabel={currentLabel}
            icon={
                <TriggerHeatmapIcon
                    size={heatmapSize}
                    borderRadius={8}
                    image={heatmapImage}
                    colors={heatmapColors}
                    colorBack={heatmapBackground}
                    scale={heatmapScale}
                    speed={speed}
                    angle={angle}
                    noise={noise}
                    innerGlow={innerGlow}
                    outerGlow={outerGlow}
                    contour={contour}
                    fit="cover"
                    audioReactivity={1.2}
                    volumeToAngle={30}
                    bassToInnerGlow={0.5}
                    midToOuterGlow={0.8}
                    trebleToContour={0.3}
                    isDesignMode={isDesignMode}
                />
            }
            onClick={handleClick}
            disabled={isLoading}
            backgroundColor={currentBgColor}
            textColor={labelColor}
            focusRingColor={focusRingColor}
            labelFont={labelFont}
            labelFontFallback={{ size: 16, weight: 600 }}
            animateLabel={!isDesignMode}
            isDesignMode={isDesignMode}
            align="flex-start"
            gap={12}
            padding={buttonPadding}
            borderRadius={borderRadius}
            hoverAnimation={{ scale: 1.02 }}
            tapAnimation={{ scale: 0.98 }}
            style={{
                cursor: isLoading ? "wait" : "pointer",
                opacity: isLoading ? 1 : undefined,
                border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
            }}
        />
    )

    // Render the connected chat outside the button to avoid click interference.
    const {
        overlayPosition = "bottom-right",
        offsetX = 20,
        offsetY = 20,
    } = connection

    const getOverlayStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: "fixed",
            zIndex: 9999,
        }

        // Apply position logic
        switch (overlayPosition) {
            case "bottom-right": return { ...base, bottom: offsetY, right: offsetX }
            case "bottom-left": return { ...base, bottom: offsetY, left: offsetX }
            case "top-right": return { ...base, top: offsetY, right: offsetX }
            case "top-left": return { ...base, top: offsetY, left: offsetX }
            case "center": return {
                ...base,
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`
            }
            default: return { ...base, bottom: offsetY, right: offsetX }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: Connected Chat (Persistent)
    // PURPOSE: Renders the connected chat component but uses CSS to hide/show it.
    // WHY? Unmounting destroys the session. We want the session to persist
    // so we keep it mounted and just toggle display/pointer-events.
    // ═══════════════════════════════════════════════════════════════════════════
    const isChatVisible = isOpen
    const overlayStyle = getOverlayStyle()

    return (
        <div style={{ position: "relative", width: "fit-content", height: "fit-content", ...style }}>
            {buttonContent}

            {/* Render the connected component instance directly (Legacy/Direct Mode) */}
            {/* NOTE: If placed in a Stack with overflow:hidden, this may be clipped. */}
            {/* For robust overlays in Stacks, use the "Event Connection" pattern with a separate Chat component. */}
            {connectedChat && (
                <div style={{
                    ...overlayStyle,
                    display: isChatVisible ? "block" : "none",
                    pointerEvents: isChatVisible ? "auto" : "none",
                }}>
                    {connectedChat}
                </div>
            )}
        </div>
    )
}

// --- Framer Property Controls ---

addPropertyControls(ChatTriggerButton, {
    // ══════════════════════════════════════════════════════════════════════════
    // HEATMAP GROUP - Audio-reactive visualizer settings
    // ══════════════════════════════════════════════════════════════════════════
    heatmap: {
        type: ControlType.Object,
        title: "Heatmap",
        buttonTitle: "Heatmap",
        icon: "effect",
        controls: {
            image: {
                type: ControlType.Image,
                title: "Image",
                description: "Logo or brand image displayed in the visualizer",
            },
            colors: {
                type: ControlType.Array,
                title: "Colors",
                control: { type: ControlType.Color },
                defaultValue: ["#11206A", "#1F3BA2", "#2F63E7", "#6BD7FF", "#FFE679", "#FF991E", "#FF4C00"],
                description: "Gradient colors for the audio-reactive heatmap",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 48,
                min: 24,
                max: 128,
                step: 4,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0.6,
                min: 0.1,
                max: 2,
                step: 0.1,
            },
        },
    },

    // Shader Settings - Separate collapsible for advanced users
    shaderSettings: {
        type: ControlType.Object,
        title: "Shader Settings",
        buttonTitle: "Shader",
        icon: "color",
        optional: true,
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.4,
                min: 0.1,
                max: 2,
                step: 0.1,
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 30,
                min: 0,
                max: 360,
                step: 5,
                unit: "°",
            },
            contour: {
                type: ControlType.Number,
                title: "Contour",
                defaultValue: 0.6,
                min: 0,
                max: 1,
                step: 0.1,
            },
            innerGlow: {
                type: ControlType.Number,
                title: "Glow In",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.1,
            },
            outerGlow: {
                type: ControlType.Number,
                title: "Glow Out",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.1,
            },
            noise: {
                type: ControlType.Number,
                title: "Noise",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.1,
            },
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // LABELS GROUP - Button text content
    // ══════════════════════════════════════════════════════════════════════════
    labels: {
        type: ControlType.Object,
        title: "Labels",
        buttonTitle: "Labels",
        icon: "text",
        controls: {
            idle: {
                type: ControlType.String,
                title: "Idle",
                defaultValue: "Chat with AI",
                displayTextArea: false,
            },
            loading: {
                type: ControlType.String,
                title: "Loading",
                defaultValue: "Connecting",
                displayTextArea: false,
            },
            open: {
                type: ControlType.String,
                title: "Open",
                defaultValue: "Close",
                displayTextArea: false,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    family: "Inter",
                    size: 16,
                    weight: 600,
                    lineHeight: 1.2,
                    letterSpacing: 0,
                },
            },
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // BUTTON STATES GROUP - Background colors by state
    // ══════════════════════════════════════════════════════════════════════════
    buttonStates: {
        type: ControlType.Object,
        title: "Button States",
        buttonTitle: "States",
        icon: "boolean",
        controls: {
            idle: {
                type: ControlType.Color,
                title: "Idle",
                defaultValue: "#000000",
            },
            loading: {
                type: ControlType.Color,
                title: "Loading",
                defaultValue: "#1C1C1C",
            },
            open: {
                type: ControlType.Color,
                title: "Open",
                defaultValue: "#2C2C2C",
            },
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // STYLING GROUP - Visual appearance
    // ══════════════════════════════════════════════════════════════════════════
    styling: {
        type: ControlType.Object,
        title: "Styling",
        buttonTitle: "Style",
        icon: "object",
        controls: {
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 16,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            focusRing: {
                type: ControlType.Color,
                title: "Focus Ring",
                defaultValue: "rgba(255,255,255,0.4)",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "12px 20px",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "rgba(255,255,255,0.2)",
                },
            },
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // CONNECTION GROUP - Event communication
    // ══════════════════════════════════════════════════════════════════════════
    connection: {
        type: ControlType.Object,
        title: "Connection",
        buttonTitle: "Events",
        icon: "interact",
        optional: true,
        controls: {
            eventName: {
                type: ControlType.String,
                title: "Event Name",
                defaultValue: "chat-trigger-state",
                description: "CustomEvent name for connecting to main chat component",
                displayTextArea: false,
            },
            overlayPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom-right", "bottom-left", "top-right", "top-left", "center"],
                optionTitles: ["Bottom Right", "Bottom Left", "Top Right", "Top Left", "Center"],
                defaultValue: "bottom-right",
                hidden: (props: any) => !props.connectedChat,
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 20,
                unit: "px",
                hidden: (props: any) => !props.connectedChat,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 20,
                unit: "px",
                hidden: (props: any) => !props.connectedChat,
            },
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // NODE CONNECTION GROUP - Drag and drop functionality
    // ══════════════════════════════════════════════════════════════════════════
    connectedChat: {
        type: ControlType.ComponentInstance,
        title: "Connect Chat",
        description: "Connect to the ElevenLabs Voice Chat component",
    },
})
