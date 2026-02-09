// ElevenLabs SDK Loader
// Uses dynamic import for Framer compatibility

let conversationModule: any = null
let isPreloading = false

export async function getConversation() {
    if (typeof window === "undefined") return null

    if (conversationModule) return conversationModule

    try {
        // Use locally installed npm package (bundled by Vite)
        // Eliminates CDN cold-start latency
        const mod = await import("@elevenlabs/client")
        conversationModule = mod.Conversation
        return conversationModule
    } catch (e) {
        console.error("Failed to load ElevenLabs SDK:", e)
        return null
    }
}

/**
 * Pre-load the ElevenLabs SDK in background on component mount.
 * This eliminates CDN cold-start latency by ensuring the SDK is cached
 * before the user taps "Connect" - especially important on mobile networks.
 * 
 * Safe to call multiple times - will only preload once.
 */
export function preloadConversation(): void {
    if (typeof window === "undefined") return
    if (conversationModule || isPreloading) return

    isPreloading = true
    // Fire-and-forget: preload in background without blocking
    getConversation().catch(() => { }).finally(() => {
        isPreloading = false
    })
}
