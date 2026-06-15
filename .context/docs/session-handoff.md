# Session Handoff — NossoCRM / YumIA CRM

> **Última atualização:** 2026-06-15  
> **Branch:** `main` (sincronizada com `origin/main`)  
> **HEAD:** `67fb81e` — `feat(ai): Add OpenRouter/OpenCode providers and Anthropic 4.6 models`  
> **Deploy produção:** https://nossocrm-delta-ten.vercel.app  
> **Repo:** `danilocostaa11/nossocrm`

Leia este arquivo **no início de um novo chat** antes de implementar qualquer coisa.

**Prompt sugerido para novo chat:**

> Leia `.context/docs/session-handoff.md` e continue de onde paramos.

---

## Objetivo do projeto (contexto de negócio)

- **NossoCRM** vendido como **MVP/demo white-label** para um cliente/amigo (ainda sem acesso próprio).
- Marca na demo: **YumIA** (rebrand visual); código interno ainda cita NossoCRM em prompts/PDF/labs.
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
| Qualidade | ~84k LOC TS/TSX, **102 testes**, lint/typecheck/build OK |

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
| `67fb81e` | OpenRouter + OpenCode Zen + Anthropic 4.6/4.8; catálogo central; migração keys |
| `57b71e6` | Fix atividades (`useDealsView`) + rebrand YumIA |
| `e3f5b5c` | Validação de chave IA no servidor (CORS) |
| `51f2dad` | Login escuro, inputs brancos |
| `438b3c7` | Hardening RBAC, CSRF, UI mobile, migrações RLS no repo |

---

## O que está implementado (estado atual)

### 1. Rebrand YumIA (`57b71e6`)

- Logo: `public/branding/yumia-logo.png`
- `components/branding/BrandMark.tsx`
- Sidebar, login, manifest, PWA banner, consent, setup, chat → **YumIA / YumIA Pilot**

**Ainda “NossoCRM” (só comentários internos):** `types/types.ts`, `lib/query/index.tsx`, `lib/a11y/index.ts`.

### 2. Fix Atividades — dropdown de negócios (`57b71e6`)

- **Causa:** cache `useDeals()` ≠ cache do Kanban (`useDealsView()`).
- **Fix:** `features/activities/hooks/useActivitiesController.ts` → `useDealsView()`; filtro `temp-*`.
- **Contato:** só via negócio selecionado (`deal.contactId`); sem campo contato direto no form.

### 3. Configurações de IA (`67fb81e`)

**Provedores:** `google` | `openai` | `anthropic` | `openrouter` | `opencode`

**Anthropic (direto):** `claude-sonnet-4-6` (recomendado), `claude-opus-4-8`, `claude-haiku-4-5`, legado 4.5

**OpenRouter:** gateway OpenAI-compatible (`https://openrouter.ai/api/v1`)

**OpenCode Zen:** gateway (`https://opencode.ai/zen/v1`)

**Arquivos-chave:**
- `lib/ai/providersCatalog.ts` — catálogo UI + tipos
- `lib/ai/orgAiCredentials.ts` — resolve chave/modelo de `organization_settings`
- `lib/ai/config.ts` — `getModel()` por provider
- `lib/ai/validateApiKey.ts` + `app/api/settings/ai/validate/route.ts`
- `app/api/settings/ai/route.ts` — persiste `aiOpenrouterKey`, `aiOpencodeKey`
- `features/settings/components/AIConfigSection.tsx`

**Migração obrigatória para OpenRouter/OpenCode em prod:**

`supabase/migrations/20260615120000_ai_openrouter_opencode_keys.sql`  
(colunas `ai_openrouter_key`, `ai_opencode_key` em `organization_settings`)

**Limitações:** Thinking, Web Search e Prompt Caching só Google/Anthropic direto — não nos gateways.

### 4. Validação chave IA server-side (`e3f5b5c`)

Browser não chama APIs dos provedores (CORS). UI chama `POST /api/settings/ai/validate`.

### 5. Wizard /install (instalador)

Assistente em `/install` que provisiona fork → Vercel → Supabase:

1. `/install/start` — credenciais
2. `/install/wizard` — progresso
3. Backend `/api/installer/run` — health, keys, migrations, edge functions, bootstrap admin, redeploy

Se já instalado, `/install` redireciona ao dashboard. **Diferencial comercial** na precificação.

### 7. Rebrand YumIA — superfícies restantes (sessão atual)

- Prompts IA: `lib/ai/crmAgent.ts`, `lib/ai/prompts/catalog.ts` → **YumIA Pilot**
- OpenRouter headers: `lib/ai/config.ts`, `crmAgent.ts` → **YumIA CRM**
- PDF relatórios: `features/reports/utils/generateReportPDF.ts` → rodapé **YumIA CRM**
- Cockpit + labs: **YumIA Pilot** / **YumIA Copilot**
- API pública OpenAPI + Swagger docs → **YumIA CRM Public API**
- PWA: `public/icons/icon.svg`, `maskable.svg` + `app/manifest.ts` (dourado `#d4af37`, fundo `#0a0a0b`)

### 6. Escopo funcional (para venda)

Kanban, contatos/empresas, atividades, dashboard, PDF, inbox briefing IA, chat com tools, fila decisões, cockpit deal, API REST + OpenAPI, webhooks (Hotmart/n8n/Make), MCP, multi-tenant, RBAC, import/export, audit log.

---

## Pendências (não fazer sem combinar)

1. **Aplicar migrações Supabase em prod** — incl. RLS hardening (`438b3c7`) e keys OpenRouter/OpenCode (`20260615120000_*`).
2. **Testar em prod** — dropdown negócios em Atividades; salvar/validar chaves IA (todos os 5 providers).
3. ~~**Rebrand completo**~~ — **feito** (prompts, PDF, PWA icons, OpenAPI, cockpit/labs). Restam só comentários internos opcionais.
4. **Setup Enterprise** — UAT, monitoramento, backup (upsell R$ 3.500).
5. **Campo contato direto** em atividade — feature futura; hoje só via negócio.

---

## Arquivos-chave por área

| Área | Caminhos |
|------|----------|
| Handoff | `.context/docs/session-handoff.md` (este arquivo) |
| Branding | `components/branding/BrandMark.tsx`, `public/branding/yumia-logo.png` |
| Atividades | `features/activities/hooks/useActivitiesController.ts`, `ActivityFormModal.tsx` |
| Deals cache | `lib/query/queryKeys.ts`, `lib/query/hooks/useDealsQuery.ts` |
| AI catálogo | `lib/ai/providersCatalog.ts`, `lib/ai/orgAiCredentials.ts` |
| AI settings UI | `features/settings/components/AIConfigSection.tsx` |
| AI validate API | `app/api/settings/ai/validate/route.ts` |
| AI runtime | `lib/ai/config.ts`, `lib/ai/crmAgent.ts`, `app/api/ai/chat/route.ts` |
| Installer | `app/install/`, `app/api/installer/run/route.ts`, `lib/installer/` |
| Contacts export | `app/api/contacts/export/route.ts` |
| Migrações | `supabase/migrations/` |

---

## Decisões do usuário (não reverter sem perguntar)

- **Não commitar** a menos que peça explicitamente.
- **Não push force** para `main`.
- Responder em **português**.
- Demo prioritária; hardening RLS em prod **adiado** até pós-venda/acordo.
- Cliente ainda **não tem acesso** — demo preparada para apresentação antes de entrega.

---

## Como validar estado antes de codar

```bash
git log -5 --oneline
git status
npm run typecheck && npm run lint && npm run test:run
```

Confirmar deploy Vercel após pushes em `main`.
