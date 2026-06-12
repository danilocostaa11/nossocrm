'use client';

import { RouteErrorPage } from '@/components/errors/RouteErrorPage';

/**
 * Error boundary das rotas autenticadas.
 * Captura falhas de renderização sem derrubar o shell inteiro.
 */
export default function ProtectedRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorPage
      error={error}
      reset={reset}
      title="Erro ao carregar a página"
      description="Ocorreu um problema inesperado nesta tela. Você pode tentar de novo ou voltar para a visão geral."
    />
  );
}
