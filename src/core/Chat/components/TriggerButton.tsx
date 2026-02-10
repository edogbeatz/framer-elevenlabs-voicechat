import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import AudioHeatmap from "../../Visualizers/AudioHeatmap"
import { Button } from "./Button"
import type { ButtonSize, ButtonVariant } from "./Button"
import { resolveFontStyles } from "../../utils/resolveFont"
import type { FontFallback, FontInput } from "../../utils/resolveFont"

export interface TriggerHeatmapIconProps {
    size: number
    /** Width as percentage of size (0-100), default 100 */
    width?: number
    /** Height as percentage of size (0-100), default 100 */
    height?: number
    /** Border radius as percentage (0-50, where 50 = circle), default 0 */
    borderRadius?: number | string
    /** Enable shader effect, when false shows static image only */
    enabled?: boolean
    background?: string
    image?: any
    colors?: string[]
    colorBack?: string
    contour?: number
    innerGlow?: number
    outerGlow?: number
    noise?: number
    angle?: number
    speed?: number
    scale?: number
    fit?: "contain" | "cover" | "fill"
    audioReactivity?: number
    bassToInnerGlow?: number
    midToOuterGlow?: number
    trebleToContour?: number
    volumeToAngle?: number
    isDesignMode?: boolean
    style?: React.CSSProperties
}

export const TriggerHeatmapIcon = React.memo<TriggerHeatmapIconProps>(({
    size,
    width = 100,
    height = 100,
    borderRadius = 0,
    enabled = true,
    background,
    image,
    colors,
    colorBack,
    contour,
    innerGlow,
    outerGlow,
    noise,
    angle,
    speed,
    scale,
    fit = "cover",
    audioReactivity,
    bassToInnerGlow,
    midToOuterGlow,
    trebleToContour,
    volumeToAngle,
    isDesignMode,
    style,
}) => {
    // Use the background color for the vignette fade, default to black
    const fadeColor = background || "#000000"

    // Calculate actual dimensions from percentage
    const actualWidth = (width / 100) * size
    const actualHeight = (height / 100) * size

    // Normalize borderRadius to percentage string for CSS
    const resolvedBorderRadius = typeof borderRadius === "number"
        ? `${borderRadius}%`
        : borderRadius

    // Get image source for static mode
    const imageSrc = image?.src || (typeof image === "string" ? image : undefined)

    return (
        <div
            style={{
                width: actualWidth,
                height: actualHeight,
                flexShrink: 0,
                position: "relative",
                background,
                borderRadius: resolvedBorderRadius,
                overflow: "hidden", // Clips content to border radius
                ...style,
            }}
        >
            {enabled ? (
                <>
                    <AudioHeatmap
                        image={image}
                        colors={colors}
                        colorBack={colorBack}
                        scale={scale}
                        speed={speed}
                        angle={angle}
                        noise={noise}
                        innerGlow={innerGlow}
                        outerGlow={outerGlow}
                        contour={contour}
                        fit={fit}
                        audioReactivity={audioReactivity}
                        volumeToAngle={volumeToAngle}
                        bassToInnerGlow={bassToInnerGlow}
                        midToOuterGlow={midToOuterGlow}
                        trebleToContour={trebleToContour}
                        isDesignMode={isDesignMode}
                        style={{ width: "100%", height: "100%" }}
                    />
                    {/* Vignette overlay - radial gradient fades edges smoothly */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background: `radial-gradient(circle at center, transparent 30%, ${fadeColor} 85%)`,
                        }}
                    />
                </>
            ) : (
                // Static image mode - no shader, no animation
                imageSrc && (
                    <img
                        src={imageSrc}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fit,
                            display: "block",
                        }}
                    />
                )
            )}
        </div>
    )
})

TriggerHeatmapIcon.displayName = "TriggerHeatmapIcon"

export interface TriggerButtonBaseProps {
    label: string
    ariaLabel?: string
    icon: React.ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    onClick?: () => void
    disabled?: boolean
    backgroundColor?: string
    textColor?: string
    focusRingColor?: string
    padding?: string | number
    borderRadius?: number
    gap?: number
    align?: "flex-start" | "center" | "flex-end"
    labelFont?: FontInput
    labelFontFallback?: FontFallback
    animateLabel?: boolean
    isDesignMode?: boolean
    hoverAnimation?: Record<string, any>
    tapAnimation?: Record<string, any>
    style?: React.CSSProperties
}

export const TriggerButtonBase = React.memo<TriggerButtonBaseProps>(({
    label,
    ariaLabel,
    icon,
    variant = "default",
    size = "lg",
    onClick,
    disabled = false,
    backgroundColor,
    textColor,
    focusRingColor,
    padding,
    borderRadius,
    gap,
    align = "center",
    labelFont,
    labelFontFallback,
    animateLabel = true, // Default to true for animations
    isDesignMode = false,
    hoverAnimation,
    tapAnimation,
    style,
}) => {
    const { family, size: fallbackSize, weight } = labelFontFallback || {}

    const resolvedLabelFont = React.useMemo(
        () => resolveFontStyles(labelFont, { family, size: fallbackSize, weight }),
        [labelFont, family, fallbackSize, weight]
    )

    const labelStyle: React.CSSProperties = {
        display: "inline-block",
        whiteSpace: "nowrap",
        ...resolvedLabelFont,
    }

    const resolvedPadding = typeof padding === "number" ? `${padding}px` : padding
    const resolvedBorderRadius = borderRadius !== undefined ? `${borderRadius}px` : undefined

    const buttonStyle: React.CSSProperties = {
        justifyContent: align,
        ...style,
    }

    if (gap !== undefined) {
        buttonStyle.gap = gap
    }
    if (resolvedPadding) {
        buttonStyle.padding = resolvedPadding
        buttonStyle.height = "auto"
    }
    if (resolvedBorderRadius) {
        buttonStyle.borderRadius = resolvedBorderRadius
    }

    // Spring-based transition for smooth, natural motion
    const springTransition = {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
    }

    // Label crossfade animation (slide down on exit, slide up on enter)
    const labelNode = animateLabel && !isDesignMode ? (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
                style={labelStyle}
            >
                {label}
            </motion.span>
        </AnimatePresence>
    ) : (
        <span style={labelStyle}>{label}</span>
    )

    // Icon with scale animation
    const animatedIcon = animateLabel && !isDesignMode ? (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key="trigger-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
                {icon}
            </motion.div>
        </AnimatePresence>
    ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
        </div>
    )

    // Right-aligned wrapper to keep right edge fixed during width changes
    return (
        <div data-trigger-button style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <motion.div
                layout
                transition={springTransition}
                style={{ display: "inline-flex" }}
            >
                <Button
                    variant={variant}
                    size={size}
                    iconPosition="left"
                    icon={animatedIcon}
                    disabled={disabled}
                    onClick={onClick}
                    aria-label={ariaLabel || label}
                    backgroundColor={backgroundColor}
                    textColor={textColor}
                    focusRingColor={focusRingColor}
                    hoverAnimation={hoverAnimation}
                    tapAnimation={tapAnimation}
                    style={buttonStyle}
                >
                    {labelNode}
                </Button>
            </motion.div>
        </div>
    )
})

TriggerButtonBase.displayName = "TriggerButtonBase"
