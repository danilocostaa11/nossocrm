import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    buildPasswordRecoveryRedirect,
    getClientAppOrigin,
    getServerAppOrigin,
    normalizeAppOrigin,
} from '../lib/utils/appOrigin'

describe('appOrigin', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('normalizes trailing slashes', () => {
        expect(normalizeAppOrigin('https://app.example.com/')).toBe('https://app.example.com')
    })

    it('prefers NEXT_PUBLIC_APP_URL on server', () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://nossocrm-delta-ten.vercel.app/')
        expect(getServerAppOrigin()).toBe('https://nossocrm-delta-ten.vercel.app')
    })

    it('uses VERCEL_URL when APP_URL is unset', () => {
        vi.stubEnv('VERCEL_URL', 'nossocrm-delta-ten.vercel.app')
        vi.stubEnv('VERCEL_ENV', 'production')
        expect(getServerAppOrigin()).toBe('https://nossocrm-delta-ten.vercel.app')
    })

    it('builds password recovery redirect', () => {
        expect(buildPasswordRecoveryRedirect('https://app.example.com')).toBe(
            'https://app.example.com/auth/confirm?next=%2Flogin%2Freset-password'
        )
    })

    it('prefers NEXT_PUBLIC_APP_URL on client', () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://nossocrm-delta-ten.vercel.app')
        expect(getClientAppOrigin()).toBe('https://nossocrm-delta-ten.vercel.app')
    })
})
