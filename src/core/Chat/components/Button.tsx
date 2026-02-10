import * as React from "react"
import { motion } from "framer-motion"

/**
 * Button - Unified button component with icon-only and icon+text support
 * 
 * Supports multiple variants (default, secondary, outline, ghost, destructive)
 * and sizes (sm, md, lg). Includes keyboard-only focus rings and Framer Motion animations.
 * 
 * Usage:
 * - Icon-only: <Button iconPosition="only" icon={<Icon />} aria-label="Action" />
 * - Icon+text: <Button iconPosition="left" icon={<Icon />}>Label</Button>
 */

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive"
export type ButtonSize = "sm" | "md" | "lg"
export type ButtonIconPosition = "left" | "right" | "only"

export interface ButtonProps {
    variant: ButtonVariant
    size?: ButtonSize
    iconPosition?: ButtonIconPosition
    icon?: React.ReactNode
    disabled?: boolean
    "aria-label"?: string
    onClick?: () => void
    children?: React.ReactNode
    withEntryAnimation?: boolean
    focusRingColor?: string
    hoverAnimation?: Record<string, any>
    tapAnimation?: Record<string, any>
    backgroundColor?: string  // Override background color from token
    textColor?: string        // Override text color from token
    style?: React.CSSProperties
}

// Unified animation config for all buttons
// Using Material Design Standard Easing for sleek, professional feel
const buttonTapTransition = { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] as const }
const buttonEntryTransition = { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] as const }

export const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>((
    {
        variant,
        size = "md",
        iconPosition = "only",
        icon,
        disabled = false,
        "aria-label": ariaLabel,
        onClick,
        children,
        withEntryAnimation = false,
        focusRingColor = "rgba(255,255,255,0.4)",
        hoverAnimation,
        tapAnimation,
        backgroundColor,
        textColor,
        style,
    },
    ref
) => {
    const [isKeyboardFocus, setIsKeyboardFocus] = React.useState(false)

    // Validate: icon-only buttons must have aria-label
    if (iconPosition === "only" && !ariaLabel) {
        console.warn("Button with iconPosition='only' requires aria-label for accessibility")
    }

    // Size configuration
    const isIconOnly = iconPosition === "only"
    const sizeConfig = isIconOnly
        ? (size === "sm"
            ? { size: 28, radius: "6px" }
            : size === "lg"
                ? { size: 48, radius: "16px", padding: 4 } // 48px inner size, 16px radius accounts for padding
                : { size: 32, radius: "50%" })
        : (size === "sm"
            ? { height: 32, paddingX: 12, fontSize: 13, radius: "12px" }
            : size === "lg"
                ? { height: 48, paddingX: 20, fontSize: 16, radius: "16px" }
                : { height: 40, paddingX: 16, fontSize: 14, radius: "16px" })

    /**
     * ShadCN-style Color Token System
     * Centralized color tokens following shadcn/ui design patterns
     * Based on Zinc dark palette with semantic naming
     * 
     * Benefits:
     * - Single source of truth for all variant colors
     * - Easy to maintain and extend
     * - Follows established design system patterns
     * - Prepared for future CSS-in-JS or Tailwind migration
     */
    const colorTokens = {
        variants: {
            default: {
                bg: "#000000",           // Pure black for heatmap button
                fg: "#FFFFFF",           // White text for maximum contrast
                shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            },
            secondary: {
                bg: "#27272A",           // zinc-800
                fg: "#FAFAFA",           // zinc-50  
                shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            },
            outline: {
                bg: "transparent",
                fg: "#FAFAFA",           // zinc-50
                border: "#27272A",       // zinc-800
            },
            ghost: {
                bg: "transparent",
                fg: "#A1A1AA",           // zinc-400 (muted foreground)
            },
            destructive: {
                bg: "#DC2626",           // red-600
                fg: "#FAFAFA",           // zinc-50
                shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            },
        },
        focus: {
            ring: "#D4D4D8",             // zinc-300 (visible focus ring)
        },
    }

    /**
     * Generate variant styles from color tokens
     * Supports backgroundColor and textColor prop overrides for flexibility
     */
    const getVariantStyles = (variant: ButtonVariant): React.CSSProperties => {
        const tokens = colorTokens.variants[variant]
        const styles: React.CSSProperties = {
            backgroundColor: backgroundColor || tokens.bg,
            color: textColor || tokens.fg,
        }

        // Add border for outline variant (type guard using 'in' operator)
        if ("border" in tokens && tokens.border) {
            styles.border = `1px solid ${tokens.border}`
        }

        // Add shadow for variants that have it (type guard using 'in' operator)
        if ("shadow" in tokens && tokens.shadow) {
            styles.boxShadow = tokens.shadow
        }

        return styles
    }

    // Hover state - simple opacity reduction
    const hoverStyle = { opacity: 0.9 }
    const hoverEffect = hoverAnimation || hoverStyle
    const tapEffect: Record<string, any> = tapAnimation ? { ...tapAnimation } : { scale: 0.95 }
    if (tapEffect.transition === undefined) {
        tapEffect.transition = buttonTapTransition
    }

    // Icon-only button styles
    const iconOnlyStyles: React.CSSProperties = {
        width: (sizeConfig as any).size,
        height: (sizeConfig as any).size,
        minWidth: (sizeConfig as any).size,
        minHeight: (sizeConfig as any).size,
        maxWidth: (sizeConfig as any).size,
        maxHeight: (sizeConfig as any).size,
        borderRadius: (sizeConfig as any).radius,
        padding: (sizeConfig as any).padding || 0,
    }

    // Icon+text button styles
    const iconTextStyles: React.CSSProperties = {
        height: (sizeConfig as any).height,
        paddingLeft: (sizeConfig as any).paddingX,
        paddingRight: (sizeConfig as any).paddingX,
        borderRadius: (sizeConfig as any).radius,
        fontSize: (sizeConfig as any).fontSize,
        gap: 8, // Space between icon and text
    }

    return (
        <motion.button
            ref={ref}
            initial={withEntryAnimation ? { opacity: 0, scale: 0.8 } : undefined}
            animate={withEntryAnimation ? { opacity: 1, scale: 1 } : undefined}
            exit={withEntryAnimation ? { opacity: 0 } : undefined}
            transition={withEntryAnimation ? buttonEntryTransition : undefined}
            whileHover={disabled ? undefined : hoverEffect}
            whileTap={disabled ? undefined : tapEffect}
            onClick={disabled ? undefined : onClick}
            onMouseDown={() => setIsKeyboardFocus(false)} // Mouse click = no focus ring
            disabled={disabled}
            type="button" // CRITICAL: Prevents form submission on mobile (buttons default to submit inside forms)
            aria-label={ariaLabel}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                flexShrink: 0,
                outline: "none", // Remove default browser outline
                border: "none", // Override global CSS hover border
                WebkitAppearance: "none", // Reset browser button defaults
                appearance: "none", // Reset button appearance
                ...getVariantStyles(variant),
                ...(isIconOnly ? iconOnlyStyles : iconTextStyles),
                ...style, // Allow overrides
            }}
            // ...
            onFocus={(e) => {
                // Only show focus ring if not triggered by mouse
                if (isKeyboardFocus === false && e.currentTarget === document.activeElement) {
                    // This is likely keyboard focus (Tab key)
                    setIsKeyboardFocus(true)
                    e.currentTarget.style.outline = `3px solid ${focusRingColor}`
                    e.currentTarget.style.outlineOffset = "2px"
                }
            }}
            onKeyDown={(e) => {
                // Tab key detected - enable keyboard focus mode
                if (e.key === "Tab") {
                    setIsKeyboardFocus(true)
                }
            }}
            onBlur={(e) => {
                e.currentTarget.style.outline = "none"
                e.currentTarget.style.outlineOffset = "0"
            }}
        >
            {/* Icon position: left or only */}
            {icon && (iconPosition === "left" || iconPosition === "only") && icon}

            {/* Text label (only for icon+text variants) */}
            {children && iconPosition !== "only" && (
                <span style={{ whiteSpace: "nowrap" }}>{children}</span>
            )}

            {/* Icon position: right */}
            {icon && iconPosition === "right" && icon}
        </motion.button>
    )
}))

Button.displayName = "Button"
