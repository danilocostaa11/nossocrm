# Session Handoff — NossoCRM / YumIA CRM

> **Última atualização:** 2026-06-26
> **Branch:** `main` (sincronizada com `origin/main`)
> **HEAD:** `090f8da` — `feat(billing): add instance license control`
> **Deploy produção:** https://nossocrm-delta-ten.vercel.app
> **Supabase prod:** `glhdwcwzsiltsmqcpgsw` → https://glhdwcwzsiltsmqcpgsw.supabase.co
> **Repo:** `danilocostaa11/nossocrm`

Leia este arquivo **no início de um novo chat** antes de implementar qualquer coisa.

**Prompt sugerido para novo chat:**

> Leia `.context/docs/session-handoff.md` e continue de onde paramos.

---

## Objetivo do projeto (contexto de negócio)

- **NossoCRM** vendido como **MVP/demo white-label** para um cliente/amigo (ainda sem acesso próprio).
- Marca na demo: **YumIA** (rebrand visual completo nas superfícies ao usuário).
- Idioma: **português** (produto e comunicação com o usuário).
- Posicionamento: **CRM + IA + integrações + instalador** — não é CRM simples no-code.
- Demo forte; **não enterprise fechado** até RLS/UAT em produção.
- **BYOK:** custos de LLM, Vercel e Supabase são do cliente.

### Precificação de referência (proposta comercial)

| Pacote | Preço | Público |
|--------|-------|---------|
| **Starter** | R$ 4.900 (único) | Self-serve via Wizard |
| **Professional** | R$ 12.900 (único) | Implantação assistida — recomendado para o cliente atual |
| **Partner White-label** | R$ 24.900 + renovação anual | Integradores / software house |

**Add-ons:** Suporte R$ 890–1.790/mês · Hora avulsa R$ 220/h · **Setup Enterprise** R$ 3.500 (RLS, UAT, checklist prod) · Upsell “IA pronta” R$ 497.

**Canvas de precificação (Cursor, fora do repo):** `~/.cursor/projects/.../canvases/nossocrm-pricing.canvas.tsx`

---

## Stack e regras críticas

| Área | Detalhe |
|------|---------|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Backend | Supabase (Auth + Postgres + RLS) |
| State | TanStack Query — facades em `context/`, hooks em `lib/query/` |
| Auth | `proxy.ts` + `lib/supabase/middleware.ts` (não `middleware.ts`); `/api/*` excluído |
| AI | SDK v6, `/api/ai/chat`, tools em `lib/ai/tools.ts` (sempre filtrar por `organization_id`) |
| Qualidade | ~84k LOC TS/TSX, **103 testes**, lint/typecheck/build OK |

### Cache Rules (CRÍTICO — não quebrar)

- **Deals:** fonte única = `DEALS_VIEW_KEY` = `[...queryKeys.deals.lists(), 'view']`
- Mutations/Realtime/optimistic de deals **sempre** escrevem nessa key
- **Nunca** usar `queryKeys.deals.list({ filter })` para optimistic updates
- **Atividades:** listar negócios para associar → `useDealsView()` — **não** `useDeals()`

Comandos: `npm run dev` | `npm run build` | `npm run lint` | `npm run typecheck` | `npm run test:run`

---

## Commits recentes na `main`

| Commit | Descrição |
|--------|-----------|
| `090f8da` | Controle de licença por instância (`organization_licenses`) + webhook administrativo |
| `1f900ef` | Documenta seed demo Diego/Pipedrive |
| `c974410` | Expira contas convidadas em trial |
| `ddc0a6b` | Usa origem pública correta no link de recuperação de senha |
| `965df7b` | Hardening de fronteiras tenant no backend |
| `f825f91` | Recuperação de senha (login + `/login/reset-password`); auto-fix colunas OpenRouter na API |

---

## O que está implementado (estado atual)

### 1. Rebrand YumIA (`745fa61`)

- Logo: `public/branding/yumia-logo.png`, `components/branding/BrandMark.tsx`
- Sidebar, login, manifest, PWA, consent, setup, chat → **YumIA / YumIA Pilot**
- Prompts: `lib/ai/crmAgent.ts`, `lib/ai/prompts/catalog.ts` → **YumIA Pilot**
- OpenRouter headers: `lib/ai/config.ts` → **YumIA CRM**
- PDF: `features/reports/utils/generateReportPDF.ts` → rodapé **YumIA CRM**
- Cockpit + labs, OpenAPI/Swagger, ícones PWA (`public/icons/`, `app/manifest.ts`)

**Ainda “NossoCRM” (só comentários internos):** `types/types.ts`, `lib/query/index.tsx`, `lib/a11y/index.ts`.

### 2. Fix Atividades — dropdown de negócios (`57b71e6`)

- **Causa:** cache `useDeals()` ≠ cache do Kanban (`useDealsView()`).
- **Fix:** `features/activities/hooks/useActivitiesController.ts` → `useDealsView()`; filtro `temp-*`.
- **Contato:** só via negócio selecionado (`deal.contactId`); sem campo contato direto no form.

### 3. Configurações de IA

**Provedores:** `google` | `openai` | `anthropic` | `openrouter` | `opencode`

**OpenRouter (recomendado):** default `deepseek/deepseek-v4-flash` — catálogo em `lib/ai/providersCatalog.ts`

**Arquivos-chave:**
- `lib/ai/providersCatalog.ts` — catálogo UI + tipos
- `lib/ai/orgAiCredentials.ts` — resolve chave/modelo de `organization_settings`
- `lib/ai/config.ts` — `getModel()` por provider
- `app/api/settings/ai/route.ts` — persiste keys; **auto-aplica colunas** se `SUPABASE_ACCESS_TOKEN` no Vercel
- `lib/supabase/ensureAiGatewayColumns.ts` — helper Management API
- `features/settings/components/AIConfigSection.tsx`

**Colunas OpenRouter/OpenCode em prod:** ✅ **aplicadas manualmente** (2026-06-15) via SQL Editor:

```sql
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS ai_openrouter_key text,
  ADD COLUMN IF NOT EXISTS ai_opencode_key text;
NOTIFY pgrst, 'reload schema';
```

Migração no repo: `supabase/migrations/20260615120000_ai_openrouter_opencode_keys.sql` (para outros ambientes).

**Script local (gitignored):** `npm run db:apply-openrouter` — requer `SUPABASE_ACCESS_TOKEN=sbp_...`

**Limitações:** Thinking, Web Search e Prompt Caching só Google/Anthropic direto — não nos gateways.

### 4. Recuperação de senha (`f825f91`)

- Login: link **Esqueceu a senha?** → envia e-mail via `resetPasswordForEmail`
- Callback: `/auth/callback?next=/login/reset-password`
- Página: `app/login/reset-password/page.tsx` — define nova senha (`updateUser`)
- Middleware: `/login/reset-password` permitido mesmo com sessão ativa (recovery flow)

**Supabase Auth — Redirect URLs obrigatórias em prod:**
- `https://nossocrm-delta-ten.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback` (dev)

### 5. Validação chave IA server-side (`e3f5b5c`)

Browser não chama APIs dos provedores (CORS). UI chama `POST /api/settings/ai/validate`.

### 6. Wizard /install (instalador)

Assistente em `/install` que provisiona fork → Vercel → Supabase. **Diferencial comercial** na precificação.

### 7. Licença de instância (`090f8da`)

- Tabela `organization_licenses` na migração `supabase/migrations/20260619120000_instance_license.sql`.
- Status: `trial`, `active`, `past_due`, `blocked`, `canceled`.
- Bloqueio aplicado no proxy e nas funções RLS; usuários vencidos caem em `/access-expired`.
- Webhook administrativo: `POST /api/billing/license-webhook` com header `x-license-webhook-token`.
- Guia operacional: `docs/customer-installation.md`.

### 8. Guia de onboarding Diego/YumIA (mudança local)

- PDF para cliente: `docs/guia-inicio-rapido-yumia.pdf`.
- Script: `scripts/generate-yumia-guide-pdf.mjs`.
- Comando: `npm run docs:guide-pdf`.
- Documentado em `docs/demo-seeds.md`.

### 9. Escopo funcional (para venda)

Kanban, contatos/empresas, atividades, dashboard, PDF, inbox briefing IA, chat com tools, fila decisões, cockpit deal, API REST + OpenAPI, webhooks, MCP, multi-tenant, RBAC, import/export, audit log.

---

## Pendências (não fazer sem combinar)

1. **Aplicar migrações RLS em prod** — `20260612140000_tenant_rls_hardening.sql`, `20260612150000_rpc_tenant_hardening.sql` (adiado pós-venda).
2. **Testar em prod após deploy `f825f91`:**
   - Fluxo **Esqueceu a senha?** (e-mail + nova senha)
   - Salvar/validar chave **OpenRouter** e chat com DeepSeek V4 Flash
   - Dropdown negócios em Atividades
3. **Licença:** configurar `LICENSE_WEBHOOK_TOKEN` e validar um ciclo manual `trial` → `active` → `blocked`.
4. **Supabase Auth:** confirmar Redirect URLs (ver seção 4).
5. **Setup Enterprise** — UAT, monitoramento, backup (upsell R$ 3.500).
6. **Campo contato direto** em atividade — feature futura; hoje só via negócio.

---

## Arquivos-chave por área

| Área | Caminhos |
|------|----------|
| Handoff | `.context/docs/session-handoff.md` (este arquivo) |
| Branding | `components/branding/BrandMark.tsx`, `public/branding/yumia-logo.png` |
| Login / auth | `app/login/page.tsx`, `app/login/reset-password/page.tsx`, `app/auth/callback/route.ts` |
| Middleware auth | `lib/supabase/middleware.ts`, `proxy.ts` |
| Atividades | `features/activities/hooks/useActivitiesController.ts` |
| Deals cache | `lib/query/queryKeys.ts`, `lib/query/hooks/useDealsQuery.ts` |
| AI catálogo | `lib/ai/providersCatalog.ts`, `lib/ai/orgAiCredentials.ts` |
| AI settings API | `app/api/settings/ai/route.ts`, `lib/supabase/ensureAiGatewayColumns.ts` |
| AI settings UI | `features/settings/components/AIConfigSection.tsx` |
| AI runtime | `lib/ai/config.ts`, `lib/ai/crmAgent.ts`, `app/api/ai/chat/route.ts` |
| Installer | `app/install/`, `app/api/installer/run/route.ts`, `lib/installer/` |
| Licença | `lib/billing/license.ts`, `app/api/billing/license-webhook/route.ts`, `docs/customer-installation.md` |
| Guia Diego/YumIA | `scripts/generate-yumia-guide-pdf.mjs`, `docs/guia-inicio-rapido-yumia.pdf`, `docs/demo-seeds.md` |
| Migrações | `supabase/migrations/` |

---

## Decisões do usuário (não reverter sem perguntar)

- **Não commitar** a menos que peça explicitamente.
- **Não push force** para `main`.
- Responder em **português**.
- Demo prioritária; hardening RLS em prod **adiado** até pós-venda/acordo.
- Cliente ainda **não tem acesso** — demo preparada para apresentação antes de entrega.
- Migração OpenRouter aplicada **manualmente** no SQL Editor (não via `supabase db push`).

---

## Como validar estado antes de codar

```bash
git log -5 --oneline
git status
npm run typecheck && npm run lint && npm run test:run
```

Confirmar deploy Vercel após pushes em `main`.
