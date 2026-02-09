import { describe, it, expect, beforeEach } from 'vitest'
import { generateMessageId, resetMessageCounter } from '../messageId'

describe('messageId', () => {
    beforeEach(() => {
        resetMessageCounter()
    })

    describe('generateMessageId', () => {
        it('returns a string starting with "msg-"', () => {
            const id = generateMessageId()
            expect(id).toMatch(/^msg-/)
        })

        it('includes timestamp in the ID', () => {
            const before = Date.now()
            const id = generateMessageId()
            const after = Date.now()

            // Extract timestamp from ID (format: msg-{timestamp}-{counter})
            const parts = id.split('-')
            const timestamp = parseInt(parts[1], 10)

            expect(timestamp).toBeGreaterThanOrEqual(before)
            expect(timestamp).toBeLessThanOrEqual(after)
        })

        it('generates unique IDs on consecutive calls', () => {
            const id1 = generateMessageId()
            const id2 = generateMessageId()
            const id3 = generateMessageId()

            expect(id1).not.toBe(id2)
            expect(id2).not.toBe(id3)
            expect(id1).not.toBe(id3)
        })

        it('increments counter for each call', () => {
            const id1 = generateMessageId()
            const id2 = generateMessageId()
            const id3 = generateMessageId()

            // Extract counters from IDs
            const counter1 = parseInt(id1.split('-')[2], 10)
            const counter2 = parseInt(id2.split('-')[2], 10)
            const counter3 = parseInt(id3.split('-')[2], 10)

            expect(counter2).toBe(counter1 + 1)
            expect(counter3).toBe(counter2 + 1)
        })
    })

    describe('resetMessageCounter', () => {
        it('resets counter to 0', () => {
            // Generate some IDs to increment counter
            generateMessageId()
            generateMessageId()
            generateMessageId()

            // Reset
            resetMessageCounter()

            // Next ID should have counter = 1
            const id = generateMessageId()
            const counter = parseInt(id.split('-')[2], 10)
            expect(counter).toBe(1)
        })
    })
})
