/**
 * Shared message ID generation utility
 * 
 * Provides a single counter for generating unique message IDs,
 * avoiding duplicate counters across hooks and components.
 */

let messageIdCounter = 0

/**
 * Generate a unique message ID
 * @returns A unique string ID in format "msg-{timestamp}-{counter}"
 */
export function generateMessageId(): string {
    return `msg-${Date.now()}-${++messageIdCounter}`
}

/**
 * Reset the message counter (useful for testing)
 */
export function resetMessageCounter(): void {
    messageIdCounter = 0
}
