import type { AIProvider } from '@/lib/ai/config';

export type ApiKeyValidationResult = { valid: true } | { valid: false; error: string };

/**
 * Valida uma chave de API no servidor (evita CORS das APIs dos provedores no browser).
 */
export async function validateProviderApiKey(
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<ApiKeyValidationResult> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey || trimmedKey.length < 10) {
    return { valid: false, error: 'Chave muito curta' };
  }

  const trimmedModel = model.trim();
  if (!trimmedModel) {
    return { valid: false, error: 'Selecione ou informe um modelo válido' };
  }

  try {
    if (provider === 'google') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(trimmedModel)}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hi' }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        }
      );

      if (response.ok || response.status === 429) {
        return { valid: true };
      }

      const error = await response.json().catch(() => null);
      const message = error?.error?.message as string | undefined;

      if (response.status === 400 && message?.toLowerCase().includes('api key')) {
        return { valid: false, error: 'Chave de API inválida' };
      }
      if (response.status === 403) {
        return { valid: false, error: 'Chave sem permissão para este modelo' };
      }
      return { valid: false, error: message || 'Erro ao validar chave Google' };
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${trimmedKey}` },
      });

      if (response.ok || response.status === 429) {
        return { valid: true };
      }
      if (response.status === 401) {
        return { valid: false, error: 'Chave de API inválida' };
      }
      return { valid: false, error: 'Erro ao validar chave OpenAI' };
    }

    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: trimmedModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok || response.status === 429) {
        return { valid: true };
      }

      const error = await response.json().catch(() => null);
      const message = error?.error?.message as string | undefined;

      if (response.status === 401) {
        return { valid: false, error: 'Chave de API inválida' };
      }
      if (response.status === 404) {
        return { valid: false, error: 'Modelo não encontrado. Escolha um modelo da lista ou informe o ID correto.' };
      }
      if (response.status === 400 && message) {
        return { valid: false, error: message };
      }
      return { valid: false, error: message || 'Erro ao validar chave Anthropic' };
    }

    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${trimmedKey}` },
      });

      if (response.ok || response.status === 429) {
        return { valid: true };
      }
      if (response.status === 401) {
        return { valid: false, error: 'Chave de API inválida' };
      }
      return { valid: false, error: 'Erro ao validar chave OpenRouter' };
    }

    if (provider === 'opencode') {
      const response = await fetch('https://opencode.ai/zen/v1/models', {
        headers: { Authorization: `Bearer ${trimmedKey}` },
      });

      if (response.ok || response.status === 429) {
        return { valid: true };
      }
      if (response.status === 401) {
        return { valid: false, error: 'Chave de API inválida' };
      }
      return { valid: false, error: 'Erro ao validar chave OpenCode Zen' };
    }

    return { valid: false, error: 'Provedor não suportado' };
  } catch (error) {
    console.error('API Key validation error:', error);
    return { valid: false, error: 'Erro de conexão com o provedor. Tente novamente.' };
  }
}
