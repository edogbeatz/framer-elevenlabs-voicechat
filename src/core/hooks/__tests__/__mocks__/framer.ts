/**
 * Mock for Framer module - used in tests
 */
import { vi } from 'vitest'

export const useRouter = vi.fn(() => ({
    routes: {},
    navigate: vi.fn(),
}))

export default {
    useRouter
}
