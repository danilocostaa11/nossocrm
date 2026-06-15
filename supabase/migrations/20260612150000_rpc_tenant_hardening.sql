-- RPC tenant isolation + role legacy cleanup
-- Depende de current_user_organization_id() em 20260612140000_tenant_rls_hardening.sql

-- Normaliza role legado 'user' → 'vendedor'
UPDATE public.profiles SET role = 'vendedor' WHERE role = 'user';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'vendedor'));

-- Signup público não deve criar administradores por metadata.
-- Admin inicial/convites administrativos continuam usando service_role e upsert explícito em profiles.

-- Novos usuários entram como vendedor por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_org_id uuid;
BEGIN
    v_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;
    IF v_org_id IS NULL THEN
        v_org_id := public.get_singleton_organization_id();
    END IF;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Nenhuma organization encontrada. Rode o setup inicial antes de criar usuários.';
    END IF;

    INSERT INTO public.profiles (id, email, name, avatar, role, organization_id)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'vendedor',
        v_org_id
    );

    INSERT INTO public.user_settings (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dashboard stats scoped to caller org
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    org_id UUID;
BEGIN
    org_id := public.current_user_organization_id();
    IF org_id IS NULL THEN
        RETURN '{}'::json;
    END IF;

    SELECT json_build_object(
        'total_deals', (SELECT COUNT(*) FROM public.deals WHERE organization_id = org_id AND deleted_at IS NULL),
        'pipeline_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE organization_id = org_id AND is_won = FALSE AND is_lost = FALSE AND deleted_at IS NULL),
        'total_contacts', (SELECT COUNT(*) FROM public.contacts WHERE organization_id = org_id AND deleted_at IS NULL),
        'total_companies', (SELECT COUNT(*) FROM public.crm_companies WHERE organization_id = org_id AND deleted_at IS NULL),
        'won_deals', (SELECT COUNT(*) FROM public.deals WHERE organization_id = org_id AND is_won = TRUE AND deleted_at IS NULL),
        'won_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE organization_id = org_id AND is_won = TRUE AND deleted_at IS NULL),
        'lost_deals', (SELECT COUNT(*) FROM public.deals WHERE organization_id = org_id AND is_lost = TRUE AND deleted_at IS NULL),
        'activities_today', (SELECT COUNT(*) FROM public.activities WHERE organization_id = org_id AND DATE(date) = CURRENT_DATE AND deleted_at IS NULL)
    ) INTO result;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_deal_won(deal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.deals
    SET
        is_won = TRUE,
        is_lost = FALSE,
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = deal_id
      AND organization_id = public.current_user_organization_id()
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado ou sem permissão';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_deal_lost(deal_id UUID, reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.deals
    SET
        is_lost = TRUE,
        is_won = FALSE,
        loss_reason = COALESCE(reason, loss_reason),
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = deal_id
      AND organization_id = public.current_user_organization_id()
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado ou sem permissão';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_deal(deal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.deals
    SET
        is_won = FALSE,
        is_lost = FALSE,
        closed_at = NULL,
        updated_at = NOW()
    WHERE id = deal_id
      AND organization_id = public.current_user_organization_id()
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado ou sem permissão';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_stage_counts()
RETURNS TABLE (
  stage TEXT,
  count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    c.stage,
    COUNT(*)::BIGINT AS count
  FROM public.contacts c
  WHERE c.deleted_at IS NULL
    AND c.organization_id = public.current_user_organization_id()
  GROUP BY c.stage;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_severity TEXT DEFAULT 'info'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_log_id UUID;
BEGIN
    v_user_id := auth.uid();
    v_org_id := public.current_user_organization_id();

    INSERT INTO public.audit_logs (
        user_id, organization_id, action, resource_type, resource_id, details, severity
    ) VALUES (
        v_user_id, v_org_id, p_action, p_resource_type, p_resource_id, p_details, p_severity
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- cleanup_rate_limits: operação de manutenção — apenas service_role
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits(INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits(INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_deal_won(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_deal_lost(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reopen_deal(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_contact_stage_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_deal_won(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_deal_lost(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_deal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_stage_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB, TEXT) TO authenticated;
