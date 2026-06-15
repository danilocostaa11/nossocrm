-- Trial/access expiration for invited users.
-- access_days lives on the invite so the account expiration is counted from
-- acceptance time, not from link creation time.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS access_days INTEGER;

ALTER TABLE public.organization_invites
  DROP CONSTRAINT IF EXISTS organization_invites_access_days_check;

ALTER TABLE public.organization_invites
  ADD CONSTRAINT organization_invites_access_days_check
  CHECK (access_days IS NULL OR (access_days > 0 AND access_days <= 365));

CREATE INDEX IF NOT EXISTS idx_profiles_access_expires_at
  ON public.profiles (access_expires_at)
  WHERE access_expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_user_has_active_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.access_expires_at IS NULL OR p.access_expires_at > NOW()
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
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND (access_expires_at IS NULL OR access_expires_at > NOW())
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
      SELECT role = 'admin'
      FROM public.profiles
      WHERE id = auth.uid()
        AND (access_expires_at IS NULL OR access_expires_at > NOW())
      LIMIT 1
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_has_active_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_active_access() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;
