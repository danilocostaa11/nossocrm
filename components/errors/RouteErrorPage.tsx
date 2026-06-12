'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export interface RouteErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

/**
 * UI padrão para error boundaries de rotas (App Router).
 */
export function RouteErrorPage({
  error,
  reset,
  title = 'Algo deu errado',
  description = 'Não foi possível carregar esta página. Tente novamente ou volte para a área principal.',
}: RouteErrorPageProps) {
  useEffect(() => {
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 dark:text-red-400">
        <AlertTriangle size={28} aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>

      {process.env.NODE_ENV !== 'production' && error.message ? (
        <p className="mt-4 max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-left text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error.message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus-visible-ring"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible-ring dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
        >
          <Home size={16} aria-hidden="true" />
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
