-- Instance/customer license control.
-- This keeps the "one installation per customer" model simple while allowing
-- payment webhooks to activate, extend, block, or cancel an installation.

CREATE TABLE IF NOT EXISTS public.organization_licenses (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial',
  plan_key TEXT,
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_licenses_status_check
    CHECK (status IN ('trial', 'active', 'past_due', 'blocked', 'canceled'))
);

ALTER TABLE public.organization_licenses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_organization_licenses_status
  ON public.organization_licenses (status);

CREATE INDEX IF NOT EXISTS idx_organization_licenses_provider_subscription
  ON public.organization_licenses (provider, provider_subscription_id)
  WHERE provider IS NOT NULL AND provider_subscription_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.organization_license_allows_access(target_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN status = 'active' THEN current_period_ends_at IS NULL OR current_period_ends_at > NOW()
        WHEN status = 'trial' THEN trial_ends_at IS NULL OR trial_ends_at > NOW()
        WHEN status = 'past_due' THEN grace_period_ends_at IS NOT NULL AND grace_period_ends_at > NOW()
        ELSE false
      END
      FROM public.organization_licenses
      WHERE organization_id = target_organization_id
      LIMIT 1
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_active_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        (p.access_expires_at IS NULL OR p.access_expires_at > NOW())
        AND public.organization_license_allows_access(p.organization_id)
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.organization_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND (p.access_expires_at IS NULL OR p.access_expires_at > NOW())
    AND public.organization_license_allows_access(p.organization_id)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.role = 'admin'
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.access_expires_at IS NULL OR p.access_expires_at > NOW())
        AND public.organization_license_allows_access(p.organization_id)
      LIMIT 1
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_organization_license()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_licenses (organization_id, status, trial_ends_at)
  VALUES (NEW.id, 'trial', NOW() + INTERVAL '14 days')
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_org_license_created ON public.organizations;
CREATE TRIGGER on_org_license_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_organization_license();

INSERT INTO public.organization_licenses (organization_id, status, trial_ends_at)
SELECT id, 'active', NULL
FROM public.organizations
WHERE deleted_at IS NULL
ON CONFLICT (organization_id) DO NOTHING;

REVOKE ALL ON FUNCTION public.organization_license_allows_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organization_license_allows_access(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_has_active_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_active_access() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "organization_licenses_select_admin" ON public.organization_licenses;
CREATE POLICY "organization_licenses_select_admin" ON public.organization_licenses
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id() AND public.current_user_is_admin());

CREATE OR REPLACE FUNCTION public.validate_api_key(p_token TEXT)
RETURNS TABLE (
  api_key_id UUID,
  api_key_prefix TEXT,
  organization_id UUID,
  organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  h TEXT;
BEGIN
  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RETURN;
  END IF;

  h := public._api_key_sha256_hex(p_token);

  RETURN QUERY
  WITH k AS (
    SELECT ak.id, ak.key_prefix, ak.organization_id
    FROM public.api_keys ak
    WHERE ak.key_hash = h
      AND ak.revoked_at IS NULL
      AND public.organization_license_allows_access(ak.organization_id)
    LIMIT 1
  )
  SELECT
    k.id,
    k.key_prefix,
    k.organization_id,
    o.name
  FROM k
  JOIN public.organizations o ON o.id = k.organization_id;

  UPDATE public.api_keys
    SET last_used_at = now(),
        updated_at = now()
  WHERE key_hash = h
    AND revoked_at IS NULL
    AND public.organization_license_allows_access(organization_id);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_api_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_api_key(TEXT) TO anon, authenticated;
