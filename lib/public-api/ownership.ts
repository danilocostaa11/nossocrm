import { createStaticAdminClient } from '@/lib/supabase/server';
import { sanitizeUUID } from '@/lib/supabase/utils';

type OwnershipCheck = {
  table: string;
  id: string | null | undefined;
  organizationId: string;
  deletedColumn?: string;
};

export async function belongsToOrganization({
  table,
  id,
  organizationId,
  deletedColumn = 'deleted_at',
}: OwnershipCheck) {
  const cleanId = sanitizeUUID(id);
  if (!cleanId) return false;

  let query = createStaticAdminClient()
    .from(table)
    .select('id')
    .eq('id', cleanId)
    .eq('organization_id', organizationId)
    .limit(1);

  if (deletedColumn) {
    query = query.is(deletedColumn, null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function validateOrganizationRefs(
  checks: Array<OwnershipCheck & { label: string }>
) {
  for (const check of checks) {
    if (!check.id) continue;
    const ok = await belongsToOrganization(check);
    if (!ok) {
      return {
        ok: false as const,
        label: check.label,
      };
    }
  }

  return { ok: true as const };
}
