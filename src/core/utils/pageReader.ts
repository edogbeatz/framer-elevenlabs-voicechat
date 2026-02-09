
export interface PageContentParams {
    selector?: string
    maxContextLength?: number
    debug?: boolean
    addLog: (msg: string, type: "info" | "error" | "warn" | "success") => void
}

export async function getPageContent({
    selector,
    readingMode = "verbatim",
    maxContextLength = 5000,
    debug = false,
    addLog
}: PageContentParams & { readingMode?: "verbatim" | "rephrased" }): Promise<string> {
    const targetSelector = selector || "main, article, [role='main'], body"
    if (debug) console.log(`[ElevenLabs] Tool call: getPageContent. Mode: ${readingMode}. Target selector: "${targetSelector}"`)
    addLog(`Tool call: Get Page Context (${readingMode})`, "info")

    try {
        if (typeof document === "undefined") return "Error: DOM not available"

        addLog("Loading reader engine...", "info")

        // Dynamic import to bypass bundler stripping and easy Framer compat
        // @ts-ignore
        const { Readability } = await import("https://esm.sh/@mozilla/readability@0.5.0")
        // @ts-ignore
        const TurndownService = (await import("https://esm.sh/turndown@7.1.1")).default

        // 1. Clone document to avoid mutating live page
        const documentClone = document.cloneNode(true) as unknown as Document

        // 1.5. Aggressive cleanup of Nav/Header elements (Framer specific and general)
        const navQueries = [
            'nav', 'header', 'footer',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '.framer-nav', '.navigation', '.header', '.footer', '.menu',
            // Generic risky classes often used for navs in frameworks
            '[class*="nav"]', '[class*="menu"]', '[class*="header"]', '[class*="footer"]', '[class*="sidebar"]', '[class*="cookie"]', '[class*="banner"]',
            // Aggressive ID matching
            '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]', '[id*="sidebar"]',
            // Exclude Debug tools and UI overlays
            '[class*="debug"]', '[class*="terminal"]', '[class*="console"]', '[class*="overlay"]', '[class*="agent-ui"]', '[class*="ai-widget"]', '[class*="no-scrape"]',
            // Aggressive ARIA-Label matching (for "Accessibility Label" usage in Framer)
            '[aria-label*="agent-ui"]', '[aria-label*="ai-widget"]', '[aria-label*="no-scrape"]',
            // Exclude secondary content and interactive elements
            'aside', 'form', 'button', 'input', 'select', 'textarea', '.sidebar', '.related', '.comments', '.cookie-banner'
        ]

        // Iterate and remove all matches
        const noisyElements = documentClone.querySelectorAll(navQueries.join(','))
        if (noisyElements.length > 0) {
            if (debug) console.log(`[ElevenLabs] Removed ${noisyElements.length} navigation/header/debug elements before parsing.`)
            noisyElements.forEach(el => el.remove())
        }

        // 1.5.1 Remove specific UI artifacts by text content (brute force)
        // This catches the "Debug Terminal" if it doesn't have a class we guessed
        const allDivs = documentClone.querySelectorAll('div, span, p')
        allDivs.forEach(el => {
            const text = el.textContent?.trim() || ""
            if (text === "Debug Terminal" || text === "Listening" || text.startsWith("Debug Terminal[")) {
                el.remove()
            }
        })

        // 1.6. Extra Framer cleanup: disparate links at top of body often get merged
        // Remove any "a" tags that are direct children of body or near the top
        const topLevelLinks = documentClone.querySelectorAll('body > a, body > div > a')
        topLevelLinks.forEach(el => el.remove())

        // 1.7. Restore strict "Invisible/Technical" cleanup
        // Readability handles script/style, but ignores SVGs (which have text), noscripts, and aria-hidden
        const technicalGarbage = documentClone.querySelectorAll('svg, noscript, iframe, [aria-hidden="true"], [hidden]')
        technicalGarbage.forEach(el => el.remove())

        // 2. Parse with Readability
        const reader = new Readability(documentClone)
        const article = reader.parse()

        if (!article || !article.content) {
            throw new Error("Readability could not extract content from this page.")
        }

        // Log the RAW output from Readability for debugging
        if (debug) {
            console.log("=== READABILITY RAW OUTPUT ===")
            console.log("Title:", article.title)
            console.log("Text Length:", article.textContent.length) // Keep for reference
            console.log("==============================")
        }

        // 3. Convert HTML to Markdown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*'
        })

        // Remove images and links to keep it read-only friendly
        turndownService.addRule('no-images', {
            filter: ['img', 'svg'],
            replacement: () => ''
        })

        turndownService.addRule('simplify-links', {
            filter: 'a',
            replacement: (content: string) => content
        })

        let markdown = turndownService.turndown(article.content)

        if (debug) console.log(`[ElevenLabs] Readability success. Title: "${article.title}"`)
        addLog(`Readability found article: "${article.title}"`, "info")

        // Crtical: Account for prefix in truncation
        const extractedTitle = document.title || "Unknown Page"
        if (debug) console.log(`[ElevenLabs] Extracted title: "${extractedTitle}"`)

        // Use prop value or default 1000
        const maxTotalLen = Math.min(maxContextLength || 1000, 4000) // Increased limit for MD
        const maxContentLen = Math.max(0, maxTotalLen)

        if (markdown.length > maxContentLen) {
            markdown = markdown.slice(0, maxContentLen) + "...\n\n[Content truncated for length]"
            addLog(`Content truncated to ${maxContentLen} chars`, "info")
            if (debug) console.log(`[ElevenLabs] Content truncated to ${maxContentLen} chars`)
        }

        // Return MARKDOWN for direct reading.
        let speechText = markdown

        if (markdown.length < 50) {
            addLog("Content too short or empty.", "warn")
            speechText = "I found the page '" + extractedTitle + "', but I couldn't extract enough readable text content from it. It might be an image-heavy page or an application."
        }

        if (debug) console.log(`[ElevenLabs] Final speechText length: ${speechText.length} chars`)

        addLog(`Returning speech text directly (${speechText.length} chars)`, "success")

        // Return the content directly to the agent
        return JSON.stringify({
            success: true,
            content: speechText,
            instruction: readingMode === "rephrased"
                ? "REPHRASE AND READ ALOUD: Maintain technical depth, make it conversational. Do not simplify unless asked."
                : "READ VERBATIM: Read the content word-for-word. Do not summarize or rephrase."
        })
    } catch (e: any) {
        const errorMsg = `Error reading page: ${e.message || "Unknown error"}`
        if (debug) console.error("[ElevenLabs] getPageContext top-level error:", e)
        addLog(errorMsg, "error")
        return errorMsg
    }
}
