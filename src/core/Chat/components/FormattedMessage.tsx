import * as React from "react"

/**
 * FormattedMessage - Renders markdown content with themed styling
 * 
 * Supports: bold, italic, links, lists, code blocks, headings
 * Links open in new tab with security attributes
 * 
 * NOTE: Uses inline regex-based parsing instead of react-markdown
 * to avoid external CDN dependencies that may fail on published Framer sites.
 * 
 * IMPORTANT: Do NOT use lookbehind assertions ((?<!...)) as they are not
 * supported in Safari &lt; 16.4 and cause silent parsing failures.
 */

export interface FormattedMessageProps {
    content: string
    textColor: string
    linkColor?: string
}

/**
 * Auto-format key terms with markdown bold
 * 
 * Solves the Gemini LLM markdown stripping issue by automatically wrapping
 * service names, pricing, URLs, and emails in **bold** on the client side.
 * 
 * This ensures formatting consistency regardless of LLM behavior.
 */
const autoFormatKeyTerms = (text: string): string => {
    let formatted = text

    // Define terms to auto-bold (case-insensitive matching, but preserve original case)
    const terms = [
        // Service names (longer phrases first to avoid partial matches)
        'AI agent integration',
        'frontend development',
        'brand identity',
        'AI integration',
        'TypeScript',
        'Next.js',
        'ShadCN',
        'Framer',
        'React',
        'AI agents',
    ]

    // Pricing patterns (regex)
    const pricingPattern = /\$\d+k(?:-\$?\d+k)?\+?/gi

    // Email pattern - captures ANY asterisks before/after email (handles malformed markdown)
    const emailPattern = /(\**)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\**)/g

    // Helper: check if already wrapped in bold
    const isWrappedInBold = (before: string, after: string): boolean => {
        return before === '**' && after === '**'
    }

    // Auto-bold pricing first (using offset check for Safari compatibility)
    formatted = formatted.replace(pricingPattern, (match, offset) => {
        const before = formatted.substring(Math.max(0, offset - 2), offset)
        const after = formatted.substring(offset + match.length, offset + match.length + 2)
        if (isWrappedInBold(before, after)) return match
        return `**${match}**`
    })

    // Auto-bold emails (handles plain, correct, and malformed asterisks)
    formatted = formatted.replace(emailPattern, (_, beforeStars, email, afterStars) => {
        // Always normalize to exactly ** on each side
        // This handles: plain, already-correct, and malformed (*, ***, ****, etc.)
        return `**${email}**`
    })

    // Auto-bold skai.dev/work (using offset check for Safari compatibility)
    // Skip if preceded by @ (part of email)
    formatted = formatted.replace(/\bskai\.dev\/work\b/gi, (match, offset) => {
        const before = formatted.substring(Math.max(0, offset - 2), offset)
        const after = formatted.substring(offset + match.length, offset + match.length + 2)
        const charBefore = offset > 0 ? formatted[offset - 1] : ''
        // Skip if part of email (preceded by @)
        if (charBefore === '@') return match
        if (isWrappedInBold(before, after)) return match
        return `**${match}**`
    })

    // Auto-bold skai.dev (but not if in URL path or email)
    // Skip if preceded by @ (part of email) or followed by / or @
    formatted = formatted.replace(/\bskai\.dev\b(?!\/|@)/gi, (match, offset) => {
        const before = formatted.substring(Math.max(0, offset - 2), offset)
        const after = formatted.substring(offset + match.length, offset + match.length + 2)
        const charBefore = offset > 0 ? formatted[offset - 1] : ''
        // Skip if part of email (preceded by @)
        if (charBefore === '@') return match
        if (isWrappedInBold(before, after)) return match
        return `**${match}**`
    })

    // Auto-bold service/tech terms (using offset check for Safari compatibility)
    for (const term of terms.filter(t => !t.includes('@') && !t.includes('skai'))) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi')

        formatted = formatted.replace(regex, (match, _, offset) => {
            const before = formatted.substring(Math.max(0, offset - 2), offset)
            const after = formatted.substring(offset + match.length, offset + match.length + 2)
            if (isWrappedInBold(before, after)) return match
            return `**${match}**`
        })
    }

    return formatted
}

/**
 * Inline markdown parser - converts markdown text to React elements
 * Supports: **bold**, *italic*, [links](url), `code`
 * 
 * Uses a sequential replacement approach instead of lookbehind assertions
 * for cross-browser compatibility (including Safari).
 */
const parseInlineMarkdown = (
    text: string,
    linkColor: string
): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let key = 0

    // Use placeholder tokens to prevent double-processing
    const BOLD_TOKEN = '\u0000BOLD\u0000'
    const ITALIC_TOKEN = '\u0000ITALIC\u0000'
    const CODE_TOKEN = '\u0000CODE\u0000'
    const LINK_TOKEN = '\u0000LINK\u0000'

    // Store extracted elements with their tokens
    const extracted: { token: string; element: React.ReactNode }[] = []

    let processed = text

    // 1. Extract code first (to protect ** and * inside code)
    processed = processed.replace(/`([^`]+)`/g, (_, code) => {
        const token = `${CODE_TOKEN}${extracted.length}${CODE_TOKEN}`
        extracted.push({
            token,
            element: (
                <code
                    key={`code-${key++}`}
                    style={{
                        backgroundColor: "rgba(0,0,0,0.08)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                    }}
                >
                    {code}
                </code>
            ),
        })
        return token
    })

    // 2. Extract links (to protect ** and * inside link text)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
        const token = `${LINK_TOKEN}${extracted.length}${LINK_TOKEN}`
        extracted.push({
            token,
            element: (
                <a
                    key={`link-${key++}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: linkColor,
                        textDecoration: "underline",
                    }}
                >
                    {linkText}
                </a>
            ),
        })
        return token
    })

    // 3. Extract bold (**text** or __text__) - must come before italic
    processed = processed.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, bold1, bold2) => {
        const content = bold1 || bold2
        const token = `${BOLD_TOKEN}${extracted.length}${BOLD_TOKEN}`
        extracted.push({
            token,
            element: (
                <strong key={`bold-${key++}`} style={{ fontWeight: 700 }}>
                    {content}
                </strong>
            ),
        })
        return token
    })

    // 4. Extract italic (*text* or _text_)
    // Only match single * or _ that aren't part of ** or __
    processed = processed.replace(/(?:^|[^*])\*([^*]+)\*(?:[^*]|$)|(?:^|[^_])_([^_]+)_(?:[^_]|$)/g, (match, italic1, italic2) => {
        const content = italic1 || italic2
        if (!content) return match // No match, return original

        const token = `${ITALIC_TOKEN}${extracted.length}${ITALIC_TOKEN}`
        extracted.push({
            token,
            element: (
                <em key={`italic-${key++}`} style={{ fontStyle: "italic" }}>
                    {content}
                </em>
            ),
        })

        // Preserve characters before/after the italic markers
        const prefix = match.startsWith('*') || match.startsWith('_') ? '' : match[0]
        const suffix = match.endsWith('*') || match.endsWith('_') ? '' : match[match.length - 1]
        return prefix + token + suffix
    })

    // Now split by all tokens and reconstruct
    const allTokenPattern = new RegExp(
        `(${BOLD_TOKEN}\\d+${BOLD_TOKEN}|${ITALIC_TOKEN}\\d+${ITALIC_TOKEN}|${CODE_TOKEN}\\d+${CODE_TOKEN}|${LINK_TOKEN}\\d+${LINK_TOKEN})`,
        'g'
    )

    const parts = processed.split(allTokenPattern)

    for (const part of parts) {
        if (!part) continue

        // Check if this part is a token
        const extractedItem = extracted.find((e) => e.token === part)
        if (extractedItem) {
            elements.push(extractedItem.element)
        } else {
            // Plain text
            elements.push(part)
        }
    }

    return elements
}

/**
 * Parse block-level markdown (paragraphs, lists, headings, code blocks)
 */
const parseBlockMarkdown = (
    content: string,
    textColor: string,
    linkColor: string
): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let key = 0

    // Split by double newlines for paragraphs, or single for list items
    const lines = content.split('\n')
    let currentBlock: string[] = []
    let inList = false
    let listType: 'ul' | 'ol' | null = null
    let listItems: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []

    const flushParagraph = () => {
        if (currentBlock.length > 0) {
            const text = currentBlock.join('\n').trim()
            if (text) {
                elements.push(
                    <p key={key++} style={{ margin: "0 0 8px 0" }}>
                        {parseInlineMarkdown(text, linkColor)}
                    </p>
                )
            }
            currentBlock = []
        }
    }

    const flushList = () => {
        if (listItems.length > 0) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul'
            elements.push(
                <ListTag
                    key={key++}
                    style={{
                        margin: "8px 0",
                        paddingLeft: "20px",
                        listStyleType: listType === 'ol' ? "decimal" : "disc",
                    }}
                >
                    {listItems}
                </ListTag>
            )
            listItems = []
            inList = false
            listType = null
        }
    }

    const flushCodeBlock = () => {
        if (codeBlockContent.length > 0) {
            elements.push(
                <pre key={key++} style={{ margin: "8px 0", overflow: "hidden" }}>
                    <code
                        style={{
                            display: "block",
                            backgroundColor: "rgba(0,0,0,0.1)",
                            padding: "12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            overflowX: "auto",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {codeBlockContent.join('\n')}
                    </code>
                </pre>
            )
            codeBlockContent = []
            inCodeBlock = false
        }
    }

    for (const line of lines) {
        // Code block detection
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                flushCodeBlock()
            } else {
                flushParagraph()
                flushList()
                inCodeBlock = true
            }
            continue
        }

        if (inCodeBlock) {
            codeBlockContent.push(line)
            continue
        }

        // Heading detection (# ## ###)
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
        if (headingMatch) {
            flushParagraph()
            flushList()
            const level = headingMatch[1].length
            const headingText = headingMatch[2]
            const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3'
            const styles: Record<string, React.CSSProperties> = {
                h1: { fontSize: "1.25em", fontWeight: 700, margin: "12px 0 8px 0" },
                h2: { fontSize: "1.15em", fontWeight: 600, margin: "10px 0 6px 0" },
                h3: { fontSize: "1.05em", fontWeight: 600, margin: "8px 0 4px 0" },
            }
            elements.push(
                React.createElement(HeadingTag, { key: key++, style: styles[HeadingTag] },
                    parseInlineMarkdown(headingText, linkColor)
                )
            )
            continue
        }

        // Unordered list item (- or *)
        const ulMatch = line.match(/^[\-\*]\s+(.+)$/)
        if (ulMatch) {
            flushParagraph()
            if (listType !== 'ul') {
                flushList()
            }
            inList = true
            listType = 'ul'
            listItems.push(
                <li key={key++} style={{ marginBottom: "4px" }}>
                    {parseInlineMarkdown(ulMatch[1], linkColor)}
                </li>
            )
            continue
        }

        // Ordered list item (1. 2. etc)
        const olMatch = line.match(/^\d+\.\s+(.+)$/)
        if (olMatch) {
            flushParagraph()
            if (listType !== 'ol') {
                flushList()
            }
            inList = true
            listType = 'ol'
            listItems.push(
                <li key={key++} style={{ marginBottom: "4px" }}>
                    {parseInlineMarkdown(olMatch[1], linkColor)}
                </li>
            )
            continue
        }

        // Blockquote
        const blockquoteMatch = line.match(/^>\s*(.*)$/)
        if (blockquoteMatch) {
            flushParagraph()
            flushList()
            elements.push(
                <blockquote
                    key={key++}
                    style={{
                        borderLeft: `3px solid ${linkColor}`,
                        paddingLeft: "12px",
                        margin: "8px 0",
                        opacity: 0.9,
                    }}
                >
                    {parseInlineMarkdown(blockquoteMatch[1], linkColor)}
                </blockquote>
            )
            continue
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(line.trim())) {
            flushParagraph()
            flushList()
            elements.push(
                <hr
                    key={key++}
                    style={{
                        border: "none",
                        borderTop: "1px solid rgba(0,0,0,0.15)",
                        margin: "12px 0",
                    }}
                />
            )
            continue
        }

        // Empty line - flush paragraph
        if (line.trim() === '') {
            flushParagraph()
            flushList()
            continue
        }

        // If we were in a list but this line isn't a list item, flush the list
        if (inList) {
            flushList()
        }

        // Regular text - add to current paragraph
        currentBlock.push(line)
    }

    // Flush remaining content
    flushCodeBlock()
    flushList()
    flushParagraph()

    return elements
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
    content,
    textColor,
    linkColor = "#3b82f6", // Default blue for links
}) => {
    // Auto-format key terms first, then parse markdown
    const parsedContent = React.useMemo(() => {
        const formatted = autoFormatKeyTerms(content)
        return parseBlockMarkdown(formatted, textColor, linkColor)
    }, [content, textColor, linkColor])

    return (
        <div
            style={{
                wordBreak: "break-word",
                color: textColor,
            }}
        >
            {parsedContent}
        </div>
    )
}

FormattedMessage.displayName = "FormattedMessage"
