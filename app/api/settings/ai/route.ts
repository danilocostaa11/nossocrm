import { z } from 'zod';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { AI_PROVIDER_ENUM } from '@/lib/ai/providersCatalog';
import type { AIProvider } from '@/lib/ai/providersCatalog';
import { extractProjectRefFromSupabaseUrl } from '@/lib/installer/edgeFunctions';
import {
  ensureOrganizationSettingsAiGatewayColumns,
  isMissingOrgAiGatewayColumn,
  schemaMissingAiGatewayColumnsMessage,
} from '@/lib/supabase/ensureAiGatewayColumns';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

const UpdateOrgAISettingsSchema = z
  .object({
    aiEnabled: z.boolean().optional(),
    aiProvider: z.enum(AI_PROVIDER_ENUM).optional(),
    aiModel: z.string().min(1).max(200).optional(),
    aiGoogleKey: z.string().optional(),
    aiOpenaiKey: z.string().optional(),
    aiAnthropicKey: z.string().optional(),
    aiOpenrouterKey: z.string().optional(),
    aiOpencodeKey: z.string().optional(),
  })
  .strict();

const ORG_AI_SELECT =
  'ai_enabled, ai_provider, ai_model, ai_google_key, ai_openai_key, ai_anthropic_key, ai_openrouter_key, ai_opencode_key';

const ORG_AI_SELECT_LEGACY =
  'ai_enabled, ai_provider, ai_model, ai_google_key, ai_openai_key, ai_anthropic_key';

function projectRefForError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? extractProjectRefFromSupabaseUrl(url) : null;
}

async function loadOrgAiSettings(organizationId: string) {
  const admin = createStaticAdminClient();

  const full = await admin
    .from('organization_settings')
    .select(ORG_AI_SELECT)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!full.error) return full;

  if (isMissingOrgAiGatewayColumn(full.error)) {
    const migrated = await ensureOrganizationSettingsAiGatewayColumns();
    if (migrated) {
      return admin
        .from('organization_settings')
        .select(ORG_AI_SELECT)
        .eq('organization_id', organizationId)
        .maybeSingle();
    }

    return admin
      .from('organization_settings')
      .select(ORG_AI_SELECT_LEGACY)
      .eq('organization_id', organizationId)
      .maybeSingle();
  }

  return full;
}

function buildAiSettingsResponse(
  orgSettings: {
    ai_enabled?: boolean | null;
    ai_provider?: string | null;
    ai_model?: string | null;
    ai_google_key?: string | null;
    ai_openai_key?: string | null;
    ai_anthropic_key?: string | null;
    ai_openrouter_key?: string | null;
    ai_opencode_key?: string | null;
  } | null,
  includeKeys: boolean
) {
  const aiEnabled = typeof orgSettings?.ai_enabled === 'boolean' ? orgSettings.ai_enabled : true;
  const aiProvider = (orgSettings?.ai_provider || 'google') as AIProvider;

  return {
    aiEnabled,
    aiProvider,
    aiModel: orgSettings?.ai_model || 'gemini-2.5-flash',
    aiGoogleKey: includeKeys ? orgSettings?.ai_google_key || '' : '',
    aiOpenaiKey: includeKeys ? orgSettings?.ai_openai_key || '' : '',
    aiAnthropicKey: includeKeys ? orgSettings?.ai_anthropic_key || '' : '',
    aiOpenrouterKey: includeKeys ? orgSettings?.ai_openrouter_key || '' : '',
    aiOpencodeKey: includeKeys ? orgSettings?.ai_opencode_key || '' : '',
    aiHasGoogleKey: Boolean(orgSettings?.ai_google_key),
    aiHasOpenaiKey: Boolean(orgSettings?.ai_openai_key),
    aiHasAnthropicKey: Boolean(orgSettings?.ai_anthropic_key),
    aiHasOpenrouterKey: Boolean(orgSettings?.ai_openrouter_key),
    aiHasOpencodeKey: Boolean(orgSettings?.ai_opencode_key),
  };
}

/**
 * Handler HTTP `GET` deste endpoint (Next.js Route Handler).
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return json({ error: 'Profile not found' }, 404);
  }

  const { data: orgSettings, error: orgError } = await loadOrgAiSettings(profile.organization_id);

  if (orgError) {
    if (isMissingOrgAiGatewayColumn(orgError)) {
      return json({ error: schemaMissingAiGatewayColumnsMessage(projectRefForError()) }, 503);
    }
    return json({ error: orgError.message }, 500);
  }

  return json(buildAiSettingsResponse(orgSettings, profile.role === 'admin'));
}

/**
 * Handler HTTP `POST` deste endpoint (Next.js Route Handler).
 */
export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return json({ error: 'Profile not found' }, 404);
  }

  if (profile.role !== 'admin') {
    return json({ error: 'Forbidden' }, 403);
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = UpdateOrgAISettingsSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
  }

  const updates = parsed.data;

  const normalizeKey = (value: string | undefined) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  const dbUpdates: Record<string, unknown> = {
    organization_id: profile.organization_id,
    updated_at: new Date().toISOString(),
  };

  if (updates.aiEnabled !== undefined) dbUpdates.ai_enabled = updates.aiEnabled;
  if (updates.aiProvider !== undefined) dbUpdates.ai_provider = updates.aiProvider;
  if (updates.aiModel !== undefined) dbUpdates.ai_model = updates.aiModel;

  const googleKey = normalizeKey(updates.aiGoogleKey);
  if (googleKey !== undefined) dbUpdates.ai_google_key = googleKey;

  const openaiKey = normalizeKey(updates.aiOpenaiKey);
  if (openaiKey !== undefined) dbUpdates.ai_openai_key = openaiKey;

  const anthropicKey = normalizeKey(updates.aiAnthropicKey);
  if (anthropicKey !== undefined) dbUpdates.ai_anthropic_key = anthropicKey;

  const openrouterKey = normalizeKey(updates.aiOpenrouterKey);
  if (openrouterKey !== undefined) dbUpdates.ai_openrouter_key = openrouterKey;

  const opencodeKey = normalizeKey(updates.aiOpencodeKey);
  if (opencodeKey !== undefined) dbUpdates.ai_opencode_key = opencodeKey;

  const { error: upsertError } = await createStaticAdminClient()
    .from('organization_settings')
    .upsert(dbUpdates, { onConflict: 'organization_id' });

  if (upsertError && isMissingOrgAiGatewayColumn(upsertError)) {
    const migrated = await ensureOrganizationSettingsAiGatewayColumns();
    if (migrated) {
      const retry = await createStaticAdminClient()
        .from('organization_settings')
        .upsert(dbUpdates, { onConflict: 'organization_id' });
      if (!retry.error) {
        return json({ ok: true });
      }
      if (isMissingOrgAiGatewayColumn(retry.error)) {
        return json({ error: schemaMissingAiGatewayColumnsMessage(projectRefForError()) }, 503);
      }
      return json({ error: retry.error.message }, 500);
    }
    return json({ error: schemaMissingAiGatewayColumnsMessage(projectRefForError()) }, 503);
  }

  if (upsertError) {
    return json({ error: upsertError.message }, 500);
  }

  return json({ ok: true });
}
