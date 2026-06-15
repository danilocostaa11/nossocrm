import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieMutation = {
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
}

/**
 * Cliente Supabase para Route Handlers de auth, com cookies aplicados na resposta de redirect.
 */
export function createAuthRouteClient(request: NextRequest) {
    const cookieMutations: CookieMutation[] = []

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        cookieMutations.push({ name, value, options })
                    })
                },
            },
        }
    )

    function applyCookies(response: NextResponse) {
        cookieMutations.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
        })
        return response
    }

    return { supabase, applyCookies }
}

export function sanitizeNextPath(next: string | null, fallback = '/dashboard'): string {
    if (!next || !next.startsWith('/') || next.startsWith('//')) {
        return fallback
    }
    return next
}

export function buildRedirectUrl(request: NextRequest, nextPath: string): string {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
        return `${request.nextUrl.origin}${nextPath}`
    }
    if (forwardedHost) {
        return `${forwardedProto}://${forwardedHost}${nextPath}`
    }
    return `${request.nextUrl.origin}${nextPath}`
}

export function redirectWithSessionCookies(
    request: NextRequest,
    applyCookies: (response: NextResponse) => NextResponse,
    nextPath: string
) {
    return applyCookies(NextResponse.redirect(buildRedirectUrl(request, nextPath)))
}
