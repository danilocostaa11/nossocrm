import type { AIProvider } from '@/lib/ai/providersCatalog';
import { getDefaultModelForProvider, getProviderLabel, isAIProvider } from '@/lib/ai/providersCatalog';

export const ORG_AI_SETTINGS_COLUMNS =
  'ai_enabled, ai_provider, ai_model, ai_google_key, ai_openai_key, ai_anthropic_key, ai_openrouter_key, ai_opencode_key';

export type OrgAISettingsRow = {
  ai_enabled?: boolean | null;
  ai_provider?: string | null;
  ai_model?: string | null;
  ai_google_key?: string | null;
  ai_openai_key?: string | null;
  ai_anthropic_key?: string | null;
  ai_openrouter_key?: string | null;
  ai_opencode_key?: string | null;
};

export function normalizeOrgAiProvider(value: unknown, fallback: AIProvider = 'google'): AIProvider {
  return isAIProvider(value) ? value : fallback;
}

export function resolveOrgAiApiKey(provider: AIProvider, row: OrgAISettingsRow): string | null {
  switch (provider) {
    case 'google':
      return row.ai_google_key ?? null;
    case 'openai':
      return row.ai_openai_key ?? null;
    case 'anthropic':
      return row.ai_anthropic_key ?? null;
    case 'openrouter':
      return row.ai_openrouter_key ?? null;
    case 'opencode':
      return row.ai_opencode_key ?? null;
    default:
      return null;
  }
}

export function resolveOrgAiModelId(provider: AIProvider, modelId: string | null | undefined): string {
  const trimmed = modelId?.trim();
  if (trimmed) return trimmed;
  return getDefaultModelForProvider(provider);
}

export { getProviderLabel };
