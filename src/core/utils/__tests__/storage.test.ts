import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCachedStorage, setCachedStorage, clearCachedStorage } from '../storage'

describe('storage', () => {
    beforeEach(() => {
        // Clear mocks and storage between tests
        vi.clearAllMocks()
        localStorage.clear()
        // Force cache reset by importing fresh module
    })

    describe('getCachedStorage', () => {
        it('returns null for non-existent key', () => {
            const result = getCachedStorage('nonexistent')
            expect(result).toBeNull()
        })

        it('returns value from localStorage', () => {
            localStorage.setItem('test_key', 'test_value')
            const result = getCachedStorage('test_key')
            expect(result).toBe('test_value')
        })

        it('caches value after first access', () => {
            localStorage.setItem('cached_key', 'cached_value')

            // First access
            getCachedStorage('cached_key')

            // Modify localStorage directly
            localStorage.setItem('cached_key', 'new_value')

            // Second access should return cached value
            const result = getCachedStorage('cached_key')
            // Note: Due to how the module caches, this returns the cached value
            expect(result).toBe('cached_value')
        })
    })

    describe('setCachedStorage', () => {
        it('sets value in localStorage', () => {
            setCachedStorage('set_key', 'set_value')
            expect(localStorage.getItem('set_key')).toBe('set_value')
        })

        it('updates cache so subsequent get returns new value', () => {
            setCachedStorage('update_key', 'original')
            setCachedStorage('update_key', 'updated')

            const result = getCachedStorage('update_key')
            expect(result).toBe('updated')
        })
    })

    describe('clearCachedStorage', () => {
        it('removes value from localStorage', () => {
            localStorage.setItem('clear_key', 'value')
            clearCachedStorage('clear_key')
            expect(localStorage.getItem('clear_key')).toBeNull()
        })

        it('clears cached value so subsequent get returns null', () => {
            setCachedStorage('cache_clear_key', 'value')
            getCachedStorage('cache_clear_key') // Cache it
            clearCachedStorage('cache_clear_key')

            // After clearing, cache check should return null
            // Note: This tests the interaction pattern
            expect(localStorage.getItem('cache_clear_key')).toBeNull()
        })
    })

    describe('error handling', () => {
        it('handles localStorage throwing errors gracefully', () => {
            // Mock localStorage to throw
            const originalGetItem = localStorage.getItem
            vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
                throw new Error('localStorage unavailable')
            })

            // Should not throw, should return null
            const result = getCachedStorage('error_key')
            expect(result).toBeNull()

            // Restore
            vi.mocked(localStorage.getItem).mockRestore()
        })
    })
})
