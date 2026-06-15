/**
 * Origem pública do app (sem barra final).
 * Usada em links de e-mail (reset de senha, convites, etc.).
 */
export function normalizeAppOrigin(origin: string): string {
    return origin.replace(/\/+$/, '')
}

/**
 * Origem no client — prefere NEXT_PUBLIC_APP_URL para não depender de localhost acidental.
 */
export function getClientAppOrigin(): string {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
    if (configured) {
        return normalizeAppOrigin(configured)
    }
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return ''
}

/**
 * Origem no server — usa env explícita, depois Vercel, depois headers da requisição.
 */
export function getServerAppOrigin(request?: Pick<Request, 'headers'>): string {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
    if (configured) {
        return normalizeAppOrigin(configured)
    }

    const vercelUrl = process.env.VERCEL_URL?.trim()
    if (vercelUrl) {
        const proto = process.env.VERCEL_ENV === 'development' ? 'http' : 'https'
        return `${proto}://${vercelUrl}`
    }

    if (request) {
        const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
        const proto = request.headers.get('x-forwarded-proto') ?? 'http'
        if (host) {
            return normalizeAppOrigin(`${proto}://${host}`)
        }
    }

    return 'http://localhost:3000'
}

export function buildPasswordRecoveryRedirect(origin: string): string {
    return `${normalizeAppOrigin(origin)}/auth/confirm?next=${encodeURIComponent('/login/reset-password')}`
}
