import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
    buildRedirectUrl,
    createAuthRouteClient,
    redirectWithSessionCookies,
    sanitizeNextPath,
} from '@/lib/supabase/auth-redirect'

/**
 * Callback OAuth / PKCE — troca `code` por sessão e redireciona.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const code = searchParams.get('code')
    const next = sanitizeNextPath(searchParams.get('next'), '/dashboard')

    if (code) {
        const { supabase, applyCookies } = createAuthRouteClient(request)
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return redirectWithSessionCookies(request, applyCookies, next)
        }
    }

    return NextResponse.redirect(buildRedirectUrl(request, '/auth/auth-code-error'))
}
