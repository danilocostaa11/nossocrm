import { createClient } from '@/lib/supabase/server'
import { buildPasswordRecoveryRedirect, getServerAppOrigin } from '@/lib/utils/appOrigin'
import { NextResponse } from 'next/server'

type ForgotPasswordBody = {
    email?: string
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
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
}
