import { z } from 'zod';
import { validateProviderApiKey } from '@/lib/ai/validateApiKey';
import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

const ValidateApiKeySchema = z
  .object({
    provider: z.enum(['google', 'openai', 'anthropic']),
    apiKey: z.string().min(10).max(500),
    model: z.string().min(1).max(200),
  })
  .strict();

/**
 * Valida chave de API de IA no servidor (admin only).
 */
export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return json({ valid: false, error: 'Forbidden' }, 403);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ valid: false, error: 'Unauthorized' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return json({ valid: false, error: 'Profile not found' }, 404);
  }

  if (profile.role !== 'admin') {
    return json({ valid: false, error: 'Forbidden' }, 403);
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = ValidateApiKeySchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({ valid: false, error: 'Payload inválido' }, 400);
  }

  const result = await validateProviderApiKey(
    parsed.data.provider,
    parsed.data.apiKey,
    parsed.data.model
  );

  return json(result, result.valid ? 200 : 422);
}
