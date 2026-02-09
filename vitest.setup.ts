import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { store = {} }),
        get length() { return Object.keys(store).length },
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
    }
})()

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { store = {} }),
        get length() { return Object.keys(store).length },
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
    }
})()

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock CustomEvent dispatch
window.dispatchEvent = vi.fn()

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn(() => Promise.resolve({
            getTracks: () => [{ stop: vi.fn() }]
        }))
    }
})

// Reset mocks between tests
beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.clear()
    localStorageMock.clear()
})
