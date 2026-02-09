import * as React from "react"
import { motion } from "framer-motion"

/**
 * IconButton - Unified button component with Shadcn/UI colors
 * 
 * Supports multiple variants (default, secondary, outline, ghost, destructive)
 * and sizes (sm, md). Includes keyboard-only focus rings and Framer Motion animations.
 */

export type IconButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive"
export type IconButtonSize = "sm" | "md" | "lg"

export interface IconButtonProps {
    variant: IconButtonVariant
    size?: IconButtonSize
    disabled?: boolean
    "aria-label": string
    onClick?: () => void
    children: React.ReactNode
    withEntryAnimation?: boolean
    focusRingColor?: string
    /** Custom background color - overrides variant style */
    backgroundColor?: string
    /** Custom text/icon color - overrides variant style */
    textColor?: string
}

// Unified animation config for all buttons
const buttonTapTransition = { duration: 0.1, ease: "easeOut" as const }
const buttonEntryTransition = { duration: 0.3, ease: "easeOut" as const }

export const IconButton = React.memo(React.forwardRef<HTMLButtonElement, IconButtonProps>((
    {
        variant,
        size = "md",
        disabled = false,
        "aria-label": ariaLabel,
        onClick,
        children,
        withEntryAnimation = false,
        focusRingColor = "rgba(255,255,255,0.4)",
        backgroundColor,
        textColor,
    },
    ref
) => {
    const [isKeyboardFocus, setIsKeyboardFocus] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    // Track if touch already handled the click (prevents double-fire on mobile)
    const touchHandledRef = React.useRef(false)

    // Blur button and clear focus ring when it becomes disabled
    React.useEffect(() => {
        if (disabled && buttonRef.current) {
            // Always clear outline styles when disabled
            buttonRef.current.style.outline = "none"
            buttonRef.current.style.outlineOffset = "0"
            // Blur if currently focused
            if (document.activeElement === buttonRef.current) {
                buttonRef.current.blur()
            }
            // Reset keyboard focus state
            setIsKeyboardFocus(false)
        }
    }, [disabled])

    const sizeConfig = size === "sm"
        ? { size: 28, radius: "6px" }
        : size === "lg"
            ? { size: 48, radius: "24px" }
            : { size: 32, radius: "50%" }

    /**
     * Shadcn/UI Dark Theme Color Tokens
     * Based on the Zinc dark palette from shadcn/ui theming docs
     * 
     * Semantic tokens:
     * - primary/primary-foreground: Main action buttons
     * - secondary/secondary-foreground: Secondary actions  
     * - muted/muted-foreground: Disabled/ghost states
     * - accent/accent-foreground: Hover states
     * - destructive/destructive-foreground: Dangerous actions
     * - ring: Focus ring color
     */
    const shadcnDarkTokens = {
        // Primary: White on near-black (high contrast for main actions)
        primary: "#FAFAFA",           // zinc-50
        primaryForeground: "#18181B", // zinc-900

        // Secondary: Subtle background with muted text
        secondary: "#27272A",         // zinc-800
        secondaryForeground: "#FAFAFA", // zinc-50

        // Muted: For ghost/disabled states
        muted: "#27272A",             // zinc-800  
        mutedForeground: "#A1A1AA",   // zinc-400

        // Accent: For hover states
        accent: "#27272A",            // zinc-800
        accentForeground: "#FAFAFA",  // zinc-50

        // Destructive: Red for dangerous actions
        destructive: "#DC2626",       // red-600
        destructiveForeground: "#FAFAFA", // zinc-50

        // Border and ring
        border: "#27272A",            // zinc-800
        ring: "#D4D4D8",              // zinc-300 (visible focus ring)
    }

    // Button variant styles following Shadcn/UI patterns
    const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
        default: {
            backgroundColor: shadcnDarkTokens.primary,
            color: shadcnDarkTokens.primaryForeground,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
        secondary: {
            backgroundColor: shadcnDarkTokens.secondary,
            color: shadcnDarkTokens.secondaryForeground,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
        outline: {
            backgroundColor: "transparent",
            color: shadcnDarkTokens.secondaryForeground,
            border: `1px solid ${shadcnDarkTokens.border}`,
        },
        ghost: {
            backgroundColor: "transparent",
            color: shadcnDarkTokens.mutedForeground,
        },
        destructive: {
            backgroundColor: shadcnDarkTokens.destructive,
            color: shadcnDarkTokens.destructiveForeground,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
    }

    // Hover state - simple opacity reduction
    const hoverStyle = { opacity: 0.9 }

    return (
        <motion.button
            ref={(node) => {
                buttonRef.current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
            }}
            initial={withEntryAnimation ? { opacity: 0, scale: 0.8 } : undefined}
            animate={withEntryAnimation ? { opacity: disabled ? 0.3 : 1, scale: 1 } : undefined}
            exit={withEntryAnimation ? { opacity: 0 } : undefined}
            transition={withEntryAnimation ? buttonEntryTransition : undefined}
            whileHover={disabled ? undefined : hoverStyle}
            whileTap={disabled ? undefined : { scale: 0.95, transition: buttonTapTransition }}
            onClick={(e) => {
                // Prevent double-fire: if touch handled this, skip onClick
                if (disabled || touchHandledRef.current) return
                onClick?.()
            }}
            onTouchStart={(e) => {
                // Stop touch propagation immediately to prevent event from reaching
                // elements that appear/animate into the touch area
                e.stopPropagation()
                // Mark that touch is handling this interaction
                touchHandledRef.current = true
            }}
            onTouchEnd={(e) => {
                // Mobile: ensure touch triggers click even during animations
                // preventDefault stops the synthetic click that would fire ~300ms later
                // stopPropagation prevents touch from bubbling to other elements
                // (fixes session restart when end button animates away and mic button appears)
                e.preventDefault()
                e.stopPropagation()
                if (!disabled && onClick) {
                    onClick()
                }
                // Reset touch tracking after a short delay (allow for any queued events)
                setTimeout(() => { touchHandledRef.current = false }, 50)
            }}
            onMouseDown={() => setIsKeyboardFocus(false)} // Mouse click = no focus ring
            disabled={disabled}
            type="button" // CRITICAL: Prevents form submission on mobile (buttons default to submit inside forms)
            aria-label={ariaLabel}
            style={{
                width: sizeConfig.size,
                height: sizeConfig.size,
                minWidth: sizeConfig.size,
                minHeight: sizeConfig.size,
                maxWidth: sizeConfig.size,
                maxHeight: sizeConfig.size,
                borderRadius: sizeConfig.radius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.3 : 1,
                padding: 0,
                flexShrink: 0,
                outline: "none", // Remove default browser outline
                border: "none", // Override global CSS hover border
                touchAction: "manipulation", // Remove 300ms tap delay on mobile
                ...variantStyles[variant],
                // Allow custom colors from Framer property controls to override variant styles
                ...(backgroundColor && { backgroundColor }),
                ...(textColor && { color: textColor }),
                // Use box-shadow for focus ring (follows border-radius) - must come after spread
                boxShadow: isKeyboardFocus ? `0 0 0 3px ${focusRingColor}` : (variantStyles[variant].boxShadow || "none"),
            }}
            onFocus={(e) => {
                // Show focus ring only for keyboard navigation (not mouse clicks)
                // We check if mouse was NOT used to reach this element
                if (!e.currentTarget.matches(":focus-visible")) return
                setIsKeyboardFocus(true)
            }}
            onKeyDown={(e) => {
                // Tab key detected - this triggers focus-visible
                if (e.key === "Tab") {
                    setIsKeyboardFocus(true)
                }
            }}
            onBlur={() => {
                setIsKeyboardFocus(false)
            }}
        >
            {children}
        </motion.button>
    )
}))

IconButton.displayName = "IconButton"
