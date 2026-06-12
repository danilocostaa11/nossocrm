-- Tenant isolation hardening + profile privilege escalation protection
-- Complementa políticas single-tenant (USING true) com escopo por organization_id.

-- Helpers
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

-- Impede vendedor de auto-promover para admin ou trocar de organização
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.organization_id IS DISTINCT FROM NEW.organization_id) THEN
    IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Alteração de role ou organization_id não permitida';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ORGANIZATIONS — apenas a org do usuário
DROP POLICY IF EXISTS "authenticated_access" ON public.organizations;
CREATE POLICY "organizations_tenant_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.current_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "organizations_tenant_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.current_user_organization_id() AND public.current_user_is_admin())
  WITH CHECK (id = public.current_user_organization_id() AND public.current_user_is_admin());

-- PROFILES — visibilidade limitada à mesma org
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select_same_org" ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_organization_id());

-- Remove políticas permissivas antigas e aplica tenant isolation
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'crm_companies', 'contacts', 'boards', 'board_stages', 'deals', 'deal_items',
    'activities', 'products', 'leads', 'tags', 'custom_field_definitions', 'quick_scripts'
  ]
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY "tenant_isolation_select" ON public.%I FOR SELECT TO authenticated USING (organization_id = public.current_user_organization_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_user_organization_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_update" ON public.%I FOR UPDATE TO authenticated USING (organization_id = public.current_user_organization_id()) WITH CHECK (organization_id = public.current_user_organization_id())',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_delete" ON public.%I FOR DELETE TO authenticated USING (organization_id = public.current_user_organization_id())',
      tbl
    );
  END LOOP;
END $$;

-- deal_notes / deal_files — isolamento via deal pai
DROP POLICY IF EXISTS "deal_notes_access" ON public.deal_notes;
CREATE POLICY "deal_notes_tenant" ON public.deal_notes
  FOR ALL TO authenticated
  USING (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE organization_id = public.current_user_organization_id()
    )
  )
  WITH CHECK (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE organization_id = public.current_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "deal_files_access" ON public.deal_files;
CREATE POLICY "deal_files_tenant" ON public.deal_files
  FOR ALL TO authenticated
  USING (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE organization_id = public.current_user_organization_id()
    )
  )
  WITH CHECK (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE organization_id = public.current_user_organization_id()
    )
  );

-- Oculta chaves de IA de membros autenticados (defense in depth; admins usam API server-side)
REVOKE SELECT ON public.organization_settings FROM authenticated;
GRANT SELECT (
  organization_id,
  ai_enabled,
  ai_provider,
  ai_model,
  created_at,
  updated_at
) ON public.organization_settings TO authenticated;

-- Índices de performance por tenant
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON public.deals (organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts (organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON public.activities (organization_id);

-- Storage: deal-files isolado por deal da org do usuário (path: {dealId}/{file})
CREATE OR REPLACE FUNCTION public.storage_deal_file_allowed(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deals d
    WHERE d.id::text = split_part(object_name, '/', 1)
      AND d.organization_id = public.current_user_organization_id()
  );
$$;

REVOKE ALL ON FUNCTION public.storage_deal_file_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storage_deal_file_allowed(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "deal_files_upload" ON storage.objects;
CREATE POLICY "deal_files_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deal-files' AND public.storage_deal_file_allowed(name));

DROP POLICY IF EXISTS "deal_files_read" ON storage.objects;
CREATE POLICY "deal_files_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deal-files' AND public.storage_deal_file_allowed(name));

DROP POLICY IF EXISTS "deal_files_delete" ON storage.objects;
CREATE POLICY "deal_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'deal-files' AND public.storage_deal_file_allowed(name));

-- Storage: audio-notes — usuário só acessa arquivos no próprio prefixo (path: {userId}/...)
CREATE OR REPLACE FUNCTION public.storage_audio_note_allowed(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT split_part(object_name, '/', 1) = auth.uid()::text;
$$;

REVOKE ALL ON FUNCTION public.storage_audio_note_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storage_audio_note_allowed(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "audio_notes_upload" ON storage.objects;
CREATE POLICY "audio_notes_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio-notes' AND public.storage_audio_note_allowed(name));

DROP POLICY IF EXISTS "audio_notes_read" ON storage.objects;
CREATE POLICY "audio_notes_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'audio-notes' AND public.storage_audio_note_allowed(name));

DROP POLICY IF EXISTS "audio_notes_delete" ON storage.objects;
CREATE POLICY "audio_notes_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio-notes' AND public.storage_audio_note_allowed(name));
