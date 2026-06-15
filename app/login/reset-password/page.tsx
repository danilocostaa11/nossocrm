'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils/errorUtils'
import { ArrowRight, KeyRound, Loader2, Lock } from 'lucide-react'
import { BrandMark } from '@/components/branding/BrandMark'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const passwordRequirements = useMemo(
        () => ({
            minLength: password.length >= 6,
            hasLowercase: /[a-z]/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasDigit: /\d/.test(password),
        }),
        [password]
    )
    const isPasswordValid = useMemo(
        () => Object.values(passwordRequirements).every(Boolean),
        [passwordRequirements]
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        if (!isPasswordValid) {
            setError('A senha não atende aos requisitos mínimos.')
            return
        }

        setLoading(true)

        try {
            if (!supabase) {
                throw new Error('Supabase não configurado. Configure as variáveis de ambiente.')
            }

            const { error: updateError } = await supabase.auth.updateUser({ password })
            if (updateError) throw updateError

            router.push('/dashboard')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-md w-full relative z-10 px-4">
                <div className="flex justify-center mb-6">
                    <BrandMark variant="full" size="lg" />
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white font-display tracking-tight mb-2">
                        Nova senha
                    </h1>
                    <p className="text-slate-400">
                        Defina uma nova senha para acessar sua conta.
                    </p>
                </div>

                <div className="bg-dark-card border border-white/10 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-white mb-1.5">
                                Nova senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="new-password"
                                    name="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-white mb-1.5">
                                Confirmar senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <ul className="text-xs text-slate-400 space-y-1">
                            <li className={passwordRequirements.minLength ? 'text-emerald-400' : ''}>
                                Mínimo de 6 caracteres
                            </li>
                            <li className={passwordRequirements.hasLowercase ? 'text-emerald-400' : ''}>
                                Uma letra minúscula
                            </li>
                            <li className={passwordRequirements.hasUppercase ? 'text-emerald-400' : ''}>
                                Uma letra maiúscula
                            </li>
                            <li className={passwordRequirements.hasDigit ? 'text-emerald-400' : ''}>
                                Um número
                            </li>
                        </ul>

                        {error && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Salvar nova senha
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
