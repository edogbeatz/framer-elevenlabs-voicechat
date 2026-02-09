import type { CSSProperties } from "react"

export type FontInput =
    | string
    | CSSProperties
    | {
          family?: string
          size?: number
          weight?: number
          lineHeight?: number | string
          letterSpacing?: number | string
          fontFamily?: string
          fontSize?: number | string
          fontWeight?: number | string
      }

export interface FontFallback {
    family?: string
    size?: number
    weight?: number
}

export function resolveFontStyles(font: FontInput | undefined, fallback: FontFallback = {}): CSSProperties {
    const fallbackStyles: CSSProperties = {}
    if (fallback.family) fallbackStyles.fontFamily = fallback.family
    if (fallback.size !== undefined) fallbackStyles.fontSize = fallback.size
    if (fallback.weight !== undefined) fallbackStyles.fontWeight = fallback.weight

    if (!font) {
        return fallbackStyles
    }

    if (typeof font === "string") {
        return {
            fontFamily: font,
            ...fallbackStyles,
        }
    }

    const style: CSSProperties = { ...(font as CSSProperties) }
    const fontObject = font as {
        family?: string
        size?: number
        weight?: number
        fontFamily?: string
        fontSize?: number | string
        fontWeight?: number | string
    }

    if (fontObject.family && !style.fontFamily) {
        style.fontFamily = fontObject.family
    }
    if (fontObject.size !== undefined && style.fontSize === undefined) {
        style.fontSize = fontObject.size
    }
    if (fontObject.weight !== undefined && style.fontWeight === undefined) {
        style.fontWeight = fontObject.weight
    }

    if (style.fontFamily === undefined && fallbackStyles.fontFamily) {
        style.fontFamily = fallbackStyles.fontFamily
    }
    if (style.fontSize === undefined && fallbackStyles.fontSize !== undefined) {
        style.fontSize = fallbackStyles.fontSize
    }
    if (style.fontWeight === undefined && fallbackStyles.fontWeight !== undefined) {
        style.fontWeight = fallbackStyles.fontWeight
    }

    return style
}
