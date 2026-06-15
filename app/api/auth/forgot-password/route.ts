import { createClient } from '@/lib/supabase/server'
import { buildPasswordRecoveryRedirect, getServerAppOrigin } from '@/lib/utils/appOrigin'
import { getErrorMessage } from '@/lib/utils/errorUtils'
import { NextResponse } from 'next/server'

type ForgotPasswordBody = {
    email?: string
}

function mapForgotPasswordError(error: { message?: string; code?: string; status?: number }) {
    const code = error.code ?? ''
    const message = error.message ?? ''

    if (
        code === 'over_email_send_rate_limit' ||
        message.toLowerCase().includes('email rate limit')
    ) {
        return {
            status: 429,
            error: getErrorMessage('email rate limit exceeded'),
        }
    }

    return {
        status: error.status && error.status >= 400 ? error.status : 400,
        error: getErrorMessage(message || 'Erro ao enviar e-mail de recuperação.'),
    }
}

/**
 * Envia e-mail de recuperação com redirectTo baseado no ambiente de deploy,
 * não no origin do browser (evita links para localhost em produção).
 */
export async function POST(request: Request) {
    let body: ForgotPasswordBody

    try {
        body = (await request.json()) as ForgotPasswordBody
    } catch {
        return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
    }

    const email = body.email?.trim()
    if (!email) {
        return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }

    const supabase = await createClient()
    const redirectTo = buildPasswordRecoveryRedirect(getServerAppOrigin(request))
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
        const mapped = mapForgotPasswordError(error)
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    }

    return NextResponse.json({ ok: true })
}
