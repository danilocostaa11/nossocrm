'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/branding/BrandMark'

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden px-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-md w-full relative z-10 text-center">
                <div className="flex justify-center mb-6">
                    <BrandMark variant="full" size="lg" />
                </div>

                <div className="bg-dark-card border border-white/10 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                        <AlertCircle className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Link inválido ou expirado</h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Não foi possível validar o link de autenticação. Solicite um novo e-mail de
                        recuperação e abra o link mais recente.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    )
}
