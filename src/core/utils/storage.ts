/**
 * Shared localStorage cache utilities
 * 
 * Provides a single Map-based cache for localStorage access,
 * avoiding duplicate cache instances across hooks and components.
 */

const storageCache = new Map<string, string | null>()

/**
 * Get a value from localStorage with caching
 * @param key - The localStorage key
 * @returns The cached/stored value or null
 */
export function getCachedStorage(key: string): string | null {
    if (!storageCache.has(key)) {
        try {
            storageCache.set(key, localStorage.getItem(key))
        } catch {
            storageCache.set(key, null)
        }
    }
    return storageCache.get(key) ?? null
}

/**
 * Set a value in localStorage and update the cache
 * @param key - The localStorage key
 * @param value - The value to store
 */
export function setCachedStorage(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
        storageCache.set(key, value)
    } catch {
        // localStorage may be unavailable in incognito mode
    }
}

/**
 * Clear a specific key from cache and localStorage
 * @param key - The localStorage key to clear
 */
export function clearCachedStorage(key: string): void {
    try {
        localStorage.removeItem(key)
        storageCache.delete(key)
    } catch {
        // Ignore errors
    }
}
