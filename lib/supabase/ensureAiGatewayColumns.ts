import {
  extractProjectRefFromSupabaseUrl,
  runSupabaseDatabaseQuery,
} from '@/lib/installer/edgeFunctions';

const ALTER_OPENROUTER_COLUMNS_SQL = `
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS ai_openrouter_key text,
  ADD COLUMN IF NOT EXISTS ai_opencode_key text;
`.trim();

export function isMissingOrgAiGatewayColumn(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? '');
  if (!message.includes('schema cache')) return false;
  if (!message.includes('organization_settings')) return false;
  return message.includes('ai_openrouter_key') || message.includes('ai_opencode_key');
}

export function schemaMissingAiGatewayColumnsMessage(projectRef?: string | null): string {
  const ref = projectRef || 'SEU_PROJECT_REF';
  return (
    'O banco de produção ainda não tem as colunas OpenRouter/OpenCode. ' +
    `Abra o SQL Editor (https://supabase.com/dashboard/project/${ref}/sql/new) e execute a migração, ` +
    'ou configure SUPABASE_ACCESS_TOKEN no Vercel para auto-aplicar.'
  );
}

/**
 * Aplica colunas ai_openrouter_key / ai_opencode_key via Management API (server-side).
 * Requer SUPABASE_ACCESS_TOKEN + NEXT_PUBLIC_SUPABASE_URL no ambiente.
 */
export async function ensureOrganizationSettingsAiGatewayColumns(): Promise<boolean> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!accessToken || !supabaseUrl) return false;

  const projectRef = extractProjectRefFromSupabaseUrl(supabaseUrl);
  if (!projectRef) return false;

  const alter = await runSupabaseDatabaseQuery({
    projectRef,
    accessToken,
    query: ALTER_OPENROUTER_COLUMNS_SQL,
  });
  if (!alter.ok) {
    console.error('[ensureAiGatewayColumns]', alter.error);
    return false;
  }

  await runSupabaseDatabaseQuery({
    projectRef,
    accessToken,
    query: "NOTIFY pgrst, 'reload schema';",
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return true;
}
