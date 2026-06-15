'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, LogOut } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

export default function AccessExpiredPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const handleSignOut = async () => {
        setLoading(true)
        await supabase?.auth.signOut()
        router.replace('/login')
        router.refresh()
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
            <section className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-card p-8 text-center shadow-xl">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                    <AlertTriangle className="h-7 w-7" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-white">Acesso expirado</h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                    O período gratuito desta conta terminou. Fale com o responsável pelo CRM para renovar o acesso.
                </p>
                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={loading}
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-colors hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {loading ? 'Saindo...' : 'Sair'}
                </button>
            </section>
        </main>
    )
}
