import { z } from 'zod';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { isLicenseStatus } from '@/lib/billing/license';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

const LicenseWebhookSchema = z
  .object({
    organizationId: z.string().uuid().optional(),
    organizationName: z.string().min(1).max(200).optional(),
    status: z.enum(['trial', 'active', 'past_due', 'blocked', 'canceled']),
    planKey: z.string().min(1).max(100).optional().nullable(),
    provider: z.enum(['stripe', 'asaas', 'mercado_pago', 'manual']).optional().nullable(),
    providerCustomerId: z.string().min(1).max(300).optional().nullable(),
    providerSubscriptionId: z.string().min(1).max(300).optional().nullable(),
    trialEndsAt: z.string().datetime().optional().nullable(),
    currentPeriodEndsAt: z.string().datetime().optional().nullable(),
    gracePeriodEndsAt: z.string().datetime().optional().nullable(),
    lastPaymentAt: z.string().datetime().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((data) => data.organizationId || data.organizationName, {
    message: 'organizationId or organizationName is required',
    path: ['organizationId'],
  });

async function resolveOrganizationId(admin: ReturnType<typeof createStaticAdminClient>, input: z.infer<typeof LicenseWebhookSchema>) {
  if (input.organizationId) return input.organizationId;

  const { data, error } = await admin
    .from('organizations')
    .select('id')
    .eq('name', input.organizationName)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

export async function POST(req: Request) {
  const expectedToken = process.env.LICENSE_WEBHOOK_TOKEN;
  if (!expectedToken) return json({ error: 'License webhook not configured' }, 503);

  const token = req.headers.get('x-license-webhook-token');
  if (!token || token !== expectedToken) return json({ error: 'Forbidden' }, 403);

  const raw = await req.json().catch(() => null);
  const parsed = LicenseWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
  }

  if (!isLicenseStatus(parsed.data.status)) {
    return json({ error: 'Invalid license status' }, 400);
  }

  const admin = createStaticAdminClient();
  const organizationId = await resolveOrganizationId(admin, parsed.data);
  if (!organizationId) return json({ error: 'Organization not found' }, 404);

  const nowIso = new Date().toISOString();
  const blockedAt = ['blocked', 'canceled'].includes(parsed.data.status) ? nowIso : null;

  const { data, error } = await admin
    .from('organization_licenses')
    .upsert(
      {
        organization_id: organizationId,
        status: parsed.data.status,
        plan_key: parsed.data.planKey ?? null,
        provider: parsed.data.provider ?? null,
        provider_customer_id: parsed.data.providerCustomerId ?? null,
        provider_subscription_id: parsed.data.providerSubscriptionId ?? null,
        trial_ends_at: parsed.data.trialEndsAt ?? null,
        current_period_ends_at: parsed.data.currentPeriodEndsAt ?? null,
        grace_period_ends_at: parsed.data.gracePeriodEndsAt ?? null,
        last_payment_at: parsed.data.lastPaymentAt ?? null,
        blocked_at: blockedAt,
        metadata: parsed.data.metadata ?? {},
        updated_at: nowIso,
      },
      { onConflict: 'organization_id' }
    )
    .select('organization_id, status, plan_key, provider, current_period_ends_at, trial_ends_at, grace_period_ends_at')
    .single();

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, license: data });
}
