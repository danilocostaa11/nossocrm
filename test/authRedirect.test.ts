import { describe, expect, it } from 'vitest'
import { sanitizeNextPath } from '../lib/supabase/auth-redirect'

describe('sanitizeNextPath', () => {
    it('returns fallback for null, empty, or external paths', () => {
        expect(sanitizeNextPath(null)).toBe('/dashboard')
        expect(sanitizeNextPath('')).toBe('/dashboard')
        expect(sanitizeNextPath('https://evil.com')).toBe('/dashboard')
        expect(sanitizeNextPath('//evil.com')).toBe('/dashboard')
    })

    it('allows internal paths', () => {
        expect(sanitizeNextPath('/login/reset-password', '/dashboard')).toBe('/login/reset-password')
        expect(sanitizeNextPath('/dashboard?tab=1')).toBe('/dashboard?tab=1')
    })
})
