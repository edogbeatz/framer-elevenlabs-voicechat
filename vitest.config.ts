/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            'framer': new URL('./src/core/hooks/__tests__/__mocks__/framer.ts', import.meta.url).pathname
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/core/**/*.{ts,tsx}'],
            exclude: ['**/__tests__/**', '**/node_modules/**']
        }
    }
})
