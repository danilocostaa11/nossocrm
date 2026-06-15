-- Chaves de API para OpenRouter e OpenCode Zen (organization_settings)
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS ai_openrouter_key text,
  ADD COLUMN IF NOT EXISTS ai_opencode_key text;

COMMENT ON COLUMN public.organization_settings.ai_openrouter_key IS 'OpenRouter API key (OpenAI-compatible gateway)';
COMMENT ON COLUMN public.organization_settings.ai_opencode_key IS 'OpenCode Zen API key (OpenAI-compatible gateway)';
