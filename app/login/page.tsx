'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils/errorUtils'
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Lock, Mail } from 'lucide-react'
import { BrandMark } from '@/components/branding/BrandMark'

type LoginMode = 'sign-in' | 'forgot-password'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState<LoginMode>('sign-in')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const resetFeedback = () => {
        setError(null)
        setInfo(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        resetFeedback()

        try {
            if (!supabase) {
                throw new Error('Supabase não configurado. Configure as variáveis de ambiente.')
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError
            router.push('/dashboard')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        resetFeedback()

        try {
            if (!supabase) {
                throw new Error('Supabase não configurado. Configure as variáveis de ambiente.')
            }

            const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/login/reset-password')}`
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo,
            })

            if (resetError) throw resetError

            setInfo(
                'Enviamos um link de recuperação para seu e-mail. Abra o link para definir uma nova senha.'
            )
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const isForgotMode = mode === 'forgot-password'

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
                        {isForgotMode ? 'Recuperar senha' : 'Bem-vindo de volta'}
                    </h1>
                    <p className="text-slate-400">
                        {isForgotMode
                            ? 'Informe seu e-mail para receber o link de redefinição.'
                            : 'Entre na sua conta para continuar.'}
                    </p>
                </div>

                <div className="bg-dark-card border border-white/10 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
                    <form
                        className="login-form space-y-6"
                        onSubmit={isForgotMode ? handleForgotPassword : handleSubmit}
                    >
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-white mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    aria-required="true"
                                    aria-describedby={error ? 'login-error' : info ? 'login-info' : undefined}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isForgotMode && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-sm font-medium text-white">
                                        Senha
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetFeedback()
                                            setMode('forgot-password')
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-300 hover:text-primary-200 transition-colors"
                                    >
                                        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                                        Esqueceu a senha?
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        aria-required="true"
                                        aria-describedby={error ? 'login-error' : undefined}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all sm:text-sm"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div
                                id="login-error"
                                role="alert"
                                aria-live="polite"
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center"
                            >
                                {error}
                            </div>
                        )}

                        {info && (
                            <div
                                id="login-info"
                                role="status"
                                aria-live="polite"
                                className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm text-center"
                            >
                                {info}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : isForgotMode ? (
                                <>
                                    Enviar link de recuperação
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>

                        {isForgotMode && (
                            <button
                                type="button"
                                onClick={() => {
                                    resetFeedback()
                                    setMode('sign-in')
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para o login
                            </button>
                        )}
                    </form>
                </div>

                <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    &copy; {new Date().getFullYear()} YumIA. Todos os direitos reservados.
                </p>
            </div>
        </div>
    )
}
