/**
 * Catálogo de provedores e modelos de IA (UI + defaults server-side).
 */

export type AIProvider = 'google' | 'openai' | 'anthropic' | 'openrouter' | 'opencode';

export type AIModelOption = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export type AIProviderDefinition = {
  id: AIProvider;
  name: string;
  models: AIModelOption[];
  apiKeyHint?: string;
};

export const AI_PROVIDER_ENUM = [
  'google',
  'openai',
  'anthropic',
  'openrouter',
  'opencode',
] as const satisfies readonly AIProvider[];

export const AI_PROVIDERS: readonly AIProviderDefinition[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    apiKeyHint: 'AIza...',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Recomendado - Best value', price: '$0.30 / $2.50' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Ultra fast', price: '$0.10 / $0.40' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Thinking model', price: '$1.25–$2.50 / $10–$15' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', description: 'Most intelligent', price: '$2–$4 / $12–$18' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    apiKeyHint: 'sk-ant-...',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Recomendado - Best balance', price: '$3 / $15' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Fastest', price: '$1 / $5' },
      { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', description: 'Premium intelligence', price: '$5 / $25' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Previous generation', price: '$3 / $15' },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: 'Previous Opus', price: '$5 / $25' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiKeyHint: 'sk-...',
    models: [
      { id: 'gpt-5.2', name: 'GPT-5.2 (Preview)', description: 'Preview', price: '$1.75 / $14' },
      { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', description: 'Premium', price: '$21 / $168' },
      { id: 'gpt-5.2-chat-latest', name: 'GPT-5.2 Chat Latest', description: 'Latest chat', price: '$1.75 / $14' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast & efficient', price: '$0.25 / $2' },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Ultra fast', price: '$0.05 / $0.40' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Legacy flagship', price: '$2.50 / $10' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKeyHint: 'sk-or-...',
    models: [
      { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash', description: 'Recomendado - Ultra rápido · coding & agentes', price: '$0.09 / $0.18' },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', description: 'Balanceado via OpenRouter', price: 'Variável' },
      { id: 'anthropic/claude-opus-4.8', name: 'Claude Opus 4.8', description: 'Premium via OpenRouter', price: 'Variável' },
      { id: 'openai/gpt-4.1', name: 'GPT-4.1', description: 'OpenAI flagship', price: 'Variável' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Rápido', price: 'Variável' },
      { id: 'xiaomi/mimo-v2.5', name: 'MiMo V2.5', description: 'Agentes · metade do custo Pro', price: '$0.14 / $0.28' },
      { id: 'minimax/minimax-m3', name: 'MiniMax M3', description: 'Multimodal · agentes longos', price: '$0.30 / $1.20' },
      { id: 'xiaomi/mimo-v2.5-pro', name: 'MiMo V2.5 Pro', description: 'Flagship agentic · SWE-bench', price: '$0.435 / $0.87' },
      { id: 'qwen/qwen3.7-max', name: 'Qwen3.7 Max', description: 'Flagship Qwen · coding & office', price: '$1.25 / $3.75' },
    ],
  },
  {
    id: 'opencode',
    name: 'OpenCode Zen',
    apiKeyHint: 'sk-...',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Recomendado', price: 'Variável' },
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Premium', price: 'Variável' },
      { id: 'gpt-5.4', name: 'GPT 5.4', description: 'OpenAI via Zen', price: 'Variável' },
      { id: 'gpt-5.4-mini', name: 'GPT 5.4 Mini', description: 'Rápido', price: 'Variável' },
    ],
  },
];

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && (AI_PROVIDER_ENUM as readonly string[]).includes(value);
}

export function getProviderDefinition(provider: AIProvider): AIProviderDefinition | undefined {
  return AI_PROVIDERS.find((p) => p.id === provider);
}

export function getProviderLabel(provider: AIProvider): string {
  return getProviderDefinition(provider)?.name ?? provider;
}

export function getDefaultModelForProvider(provider: AIProvider): string {
  const def = getProviderDefinition(provider);
  if (!def?.models.length) return '';
  const recommended = def.models.find((m) => m.description.toLowerCase().includes('recomendado'));
  return recommended?.id ?? def.models[0].id;
}

export function getApiKeyPlaceholder(provider: AIProvider): string {
  const hint = getProviderDefinition(provider)?.apiKeyHint;
  return hint ? `Cole sua chave ${hint}` : 'Cole sua chave sk-...';
}

export function supportsAnthropicCaching(provider: AIProvider): boolean {
  return provider === 'anthropic';
}

export function supportsWebSearch(provider: AIProvider): boolean {
  return provider === 'google' || provider === 'anthropic';
}

export function supportsThinking(provider: AIProvider): boolean {
  return provider === 'google';
}
