import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
    buildRedirectUrl,
    createAuthRouteClient,
    redirectWithSessionCookies,
    sanitizeNextPath,
} from '@/lib/supabase/auth-redirect'

/**
 * Confirma links de e-mail (recuperação de senha, magic link, etc.).
 * Supabase pode redirecionar com `token_hash` + `type` ou com `code` (PKCE).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')
    const next = sanitizeNextPath(searchParams.get('next'), '/login/reset-password')

    const { supabase, applyCookies } = createAuthRouteClient(request)

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return redirectWithSessionCookies(request, applyCookies, next)
        }
    }

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) {
            return redirectWithSessionCookies(request, applyCookies, next)
        }
    }

    return NextResponse.redirect(buildRedirectUrl(request, '/auth/auth-code-error'))
}
