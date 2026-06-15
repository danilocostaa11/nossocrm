/**
 * Origem pública do app (sem barra final).
 * Usada em links de e-mail (reset de senha, convites, etc.).
 */
const DEFAULT_PUBLIC_APP_ORIGIN = 'https://nossocrm-delta-ten.vercel.app'

export function normalizeAppOrigin(origin: string): string {
    return origin.replace(/\/+$/, '')
}

function getConfiguredAppOrigin(): string {
    return (
        process.env.APP_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        ''
    )
}

/**
 * Origem no client — prefere NEXT_PUBLIC_APP_URL para não depender de localhost acidental.
 */
export function getClientAppOrigin(): string {
    const configured = getConfiguredAppOrigin()
    if (configured) {
        return normalizeAppOrigin(configured)
    }
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return ''
}

/**
 * Origem no server — usa env explícita, depois Vercel, depois fallback público.
 * Não usa localhost como fallback de e-mail para evitar links quebrados em recuperação de senha.
 */
export function getServerAppOrigin(request?: Pick<Request, 'headers'>): string {
    const configured = getConfiguredAppOrigin()
    if (configured) {
        return normalizeAppOrigin(configured)
    }

    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    if (productionUrl) {
        return `https://${productionUrl.replace(/^https?:\/\//, '')}`
    }

    const vercelUrl = process.env.VERCEL_URL?.trim()
    if (vercelUrl) {
        const proto = process.env.VERCEL_ENV === 'development' ? 'http' : 'https'
        return `${proto}://${vercelUrl}`
    }

    if (request && process.env.NODE_ENV === 'development') {
        const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
        const proto = request.headers.get('x-forwarded-proto') ?? 'http'
        if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
            return normalizeAppOrigin(`${proto}://${host}`)
        }
    }

    return DEFAULT_PUBLIC_APP_ORIGIN
}

export function buildPasswordRecoveryRedirect(origin: string): string {
    return `${normalizeAppOrigin(origin)}/auth/confirm?next=${encodeURIComponent('/login/reset-password')}`
}
