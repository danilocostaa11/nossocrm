# Session Handoff — NossoCRM / YumIA CRM

> **Última atualização:** 2026-06-14  
> **Branch:** `main` (sincronizada com `origin/main`)  
> **Deploy produção:** https://nossocrm-delta-ten.vercel.app  
> **Repo:** `danilocostaa11/nossocrm`

Leia este arquivo **no início de um novo chat** antes de implementar qualquer coisa. Resume o objetivo do projeto, o que já foi feito nesta sessão e o que ficou pendente.

---

## Objetivo do projeto (contexto de negócio)

- Preparar o **NossoCRM** como **MVP/demo white-label** para vender a um amigo.
- Marca exibida na demo: **YumIA** (rebrand visual aplicado; código interno ainda referencia NossoCRM em alguns prompts/backend).
- Idioma do produto e comunicação com o usuário: **português**.
- Precificação discutida (referência): faixa **R$ 12k–22k** (demo/produção) ou **R$ 8k + R$ 1,2k/mês**; custos de LLM/infra à parte.

---

## Stack e regras críticas

| Área | Detalhe |
|------|---------|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Backend | Supabase (Auth + Postgres + RLS) |
| State | TanStack Query — facades em `context/`, hooks em `lib/query/` |
| Auth | `proxy.ts` + `lib/supabase/middleware.ts` (não `middleware.ts`); `/api/*` excluído do proxy |
| AI | Vercel AI SDK v6, `/api/ai/chat`, tools em `lib/ai/tools.ts` (sempre filtrar por `organization_id`) |

### Cache Rules (CRÍTICO — não quebrar)

- **Deals:** única fonte de verdade = `DEALS_VIEW_KEY` = `[...queryKeys.deals.lists(), 'view']`
- Mutations/Realtime/optimistic de deals **sempre** escrevem nessa key
- **Nunca** usar `queryKeys.deals.list({ filter })` para optimistic updates
- **Atividades:** ao listar negócios para associar, usar `useDealsView()` — **não** `useDeals()` (cache separado = dropdown vazio)

Comandos: `npm run dev` | `npm run build` | `npm run lint` | `npm run typecheck` | `npm run test:run`

---

## Commits recentes na `main` (ordem cronológica)

| Commit | Descrição |
|--------|-----------|
| `438b3c7` | Hardening RBAC, CSRF, UI responsiva (inbox/calendário), error boundary, migrações Supabase no repo |
| `51f2dad` | Login escuro com inputs brancos (layout original restaurado) |
| `e3f5b5c` | Validação de chave de API de IA **no servidor** (evita CORS no browser) |
| `57b71e6` | Fix atividades: `useDealsView` no dropdown + rebrand YumIA |

---

## O que foi implementado nesta conversa

### 1. Rebrand YumIA (commit `57b71e6`)

- Logo: `public/branding/yumia-logo.png`
- Componente: `components/branding/BrandMark.tsx` (ícone recortado + texto dourado "YumIA")
- Sidebar: `components/Layout.tsx`
- Tablet rail: `components/navigation/NavigationRail.tsx`
- Login: `app/login/page.tsx`
- Metadados: `app/layout.tsx` (title **YumIA CRM**), `app/manifest.ts`
- Textos: `InstallBanner`, `ConsentModal`, setup page, `UIChat` → **YumIA Pilot**

**Ainda diz "NossoCRM" (não crítico para demo):** prompts em `lib/ai/crmAgent.ts`, PDF de relatórios, telas de labs/mock, comentários internos.

### 2. Fix aba Atividades — negócios não apareciam no dropdown (commit `57b71e6`)

**Sintoma:** Ao criar atividade, "Negócio Relacionado" só mostrava "Selecione..."; contato não associava.

**Causa:** `useActivitiesController` usava `useDeals()` (cache `queryKeys.deals.lists()`), enquanto o Kanban usa `useDealsView()` (`DEALS_VIEW_KEY`). Negócios criados no board não apareciam na aba Atividades.

**Correção:**
- `features/activities/hooks/useActivitiesController.ts` → `useDealsView()` + filtro de ids `temp-*`
- `features/activities/components/ActivityFormModal.tsx` → label `Título — Contato` quando disponível

**Associação contato:** O formulário **não tem campo de contato direto**. Contato vem do `deal.contactId` ao selecionar um negócio (`handleSubmit` em `useActivitiesController.ts`).

### 3. Fix validação chave de IA (commit `e3f5b5c`)

**Sintoma:** "Erro de conexão" / "Chave Inválida" ao salvar chave Anthropic/OpenAI nas configurações.

**Causa:** Validação no browser via `fetch` direto → bloqueio **CORS**.

**Correção:**
- `lib/ai/validateApiKey.ts` — validação server-side
- `app/api/settings/ai/validate/route.ts` — POST admin-only
- `features/settings/components/AIConfigSection.tsx` — chama `/api/settings/ai/validate`

**Nota UX:** No campo "Outro (Digitar ID)" de modelo, usar ID da lista (ex.: `claude-sonnet-4-5`), não e-mail.

### 4. Login (commit `51f2dad`)

- Tela escura, inputs brancos, banner PWA oculto em `/login` (`InstallBanner.tsx`).

### 5. Hardening MVP (commit `438b3c7`)

- RBAC em tools AI, CSRF, rotas export/import, UI mobile inbox/calendário, etc.
- Migrações Supabase adicionadas ao repo — **não aplicadas em prod** (decisão: adiar pós-demo/venda).

---

## Pendências explícitas (não fazer sem combinar)

1. **Migrações Supabase RLS** — arquivos no repo; aplicar em prod só após venda/acordo.
2. **Rebrand completo** — prompts AI, PDF reports, labs (opcional).
3. **Favicon / ícones PWA** — ainda SVG genérico; pode trocar pelo escudo YumIA.
4. **Testar em prod** — salvamento de chave Anthropic após deploy `e3f5b5c`; dropdown de negócios após `57b71e6`.
5. **Campo contato direto** na atividade — não existe hoje; só via negócio (feature futura se o usuário pedir).

---

## Arquivos-chave por área

| Área | Caminhos |
|------|----------|
| Login | `app/login/page.tsx` |
| Branding | `components/branding/BrandMark.tsx`, `public/branding/yumia-logo.png` |
| Atividades | `features/activities/hooks/useActivitiesController.ts`, `ActivityFormModal.tsx` |
| Deals cache | `lib/query/queryKeys.ts` (`DEALS_VIEW_KEY`), `lib/query/hooks/useDealsQuery.ts` |
| AI settings | `features/settings/components/AIConfigSection.tsx`, `app/api/settings/ai/validate/route.ts` |
| AI tools/RBAC | `lib/ai/tools.ts`, `app/api/ai/chat/route.ts` |
| Contacts export | `app/api/contacts/export/route.ts` |
| Docs agentes | `AGENTS.md`, `.context/docs/README.md` |

---

## Como continuar em um novo chat

1. Dizer: *"Leia `.context/docs/session-handoff.md` e continue de onde paramos."*
2. Ou referenciar `@.context/docs/session-handoff.md` no Cursor.
3. Verificar `git log -5` e deploy Vercel antes de assumir estado.

---

## Decisões do usuário (não reverter sem perguntar)

- **Não commitar** mudanças a menos que peça explicitamente.
- **Não push force** para main.
- Responder em **português**.
- Demo prioritária sobre hardening de banco em prod (migrações adiadas).
