/**
 * Mitigação de CSRF para endpoints autenticados por cookies.
 *
 * - Com `Origin` presente: deve bater com o host esperado.
 * - Com `Sec-Fetch-Site: cross-site`: sempre bloqueia.
 * - Sem `Origin`: valida `Referer` ou sinais same-origin do browser.
 * - Em produção, requests sem sinal de browser confiável são bloqueados.
 */

export function getExpectedOrigin(req: Request): string | null {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return null;

  const proto =
    req.headers.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');

  return `${proto}://${host}`;
}

function refererMatchesExpected(req: Request, expected: string): boolean {
  const referer = req.headers.get('referer');
  if (!referer) return false;

  try {
    return new URL(referer).origin === expected;
  } catch {
    return false;
  }
}

/**
 * Função pública `isAllowedOrigin` do projeto.
 */
export function isAllowedOrigin(req: Request): boolean {
  const expected = getExpectedOrigin(req);
  const origin = req.headers.get('origin');
  const secFetchSite = req.headers.get('sec-fetch-site');

  if (secFetchSite === 'cross-site') {
    return false;
  }

  if (origin) {
    if (!expected) return false;
    return origin === expected;
  }

  if (expected && refererMatchesExpected(req, expected)) {
    return true;
  }

  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}
