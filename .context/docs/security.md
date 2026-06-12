---
type: doc
name: security
description: Security model, authentication, authorization, and data isolation
category: security
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---

# Security

## Modelo de Segurança

A segurança do NossoCRM se apoia em três pilares: **Supabase Auth**, **Row Level Security (RLS)** no Postgres e **isolamento multi-tenant por `organization_id`** em todas as camadas.

## Autenticação

- Páginas: autenticadas via `proxy.ts` + `lib/supabase/middleware.ts` (NÃO usar `middleware.ts` padrão do Next). O proxy exclui `/api/*`.
- Rotas protegidas vivem em `app/(protected)/`; públicas: `/login`, `/join`, `/install`.
- APIs (`app/api/*`) fazem autenticação própria (sessão Supabase, API keys da API pública ou segredos de webhook).
- Clients Supabase em `lib/supabase/`:
  - `client.ts` — browser (anon key, sujeito a RLS)
  - `server.ts` — server-side com cookies de sessão (sujeito a RLS)
  - `staticAdminClient.ts` — service-role (BYPASSA RLS; usar somente server-side e com filtro manual de organização)

## Autorização e Multi-tenancy

- **RLS** em todas as tabelas: usuários só enxergam linhas da sua `organization_id`.
- **Tools de IA** (`lib/ai/tools.ts`): SEMPRE filtrar por `organization_id` — regra inegociável do repositório. RBAC das tools coberto por `test/aiToolsRbac.test.ts` e matriz de permissões em `test/tools.salesTeamMatrix.test.ts`.
- **Isolamento entre tenants** verificado por `test/tools.multiTenant.test.ts`.
- Utilitários de segurança em `lib/security/`; consentimento/LGPD em `lib/consent/` e `lib/supabase/consents.ts`.

## Superfícies de Ataque e Cuidados

| Superfície | Cuidado |
|------------|---------|
| API pública (`app/api/public/`) | Autenticação por chave, paginação por cursor (`test/publicApiCursor.test.ts`), contrato OpenAPI (`test/publicApiOpenapi.test.ts`) |
| Webhooks (`docs/webhooks.md`) | Validar segredos/assinaturas antes de processar payloads |
| MCP server (`app/api/mcp`) | Mesmo modelo de isolamento por organização das tools de IA |
| Installer (`app/install`, `app/api/setup-instance`) | Só deve operar em instância não configurada; nunca expor service-role key ao cliente |
| Service-role client | Nunca importar em código cliente; `server-only` é usado para reforçar |

## Checklist para Code Review de Segurança

1. Nova query/tool filtra por `organization_id`?
2. Tabela nova tem política RLS na migração (`supabase/migrations/`)?
3. Algum uso de `staticAdminClient` poderia ser substituído pelo client com RLS?
4. Input externo validado com Zod (`lib/validations/`)?
5. Segredos só via variáveis de ambiente (nunca hardcoded ou logados)?

## Related Resources

- [Architecture Notes](./architecture.md)
- [Testing Strategy](./testing-strategy.md)
- `docs/public-api.md`, `docs/webhooks.md`, `docs/mcp.md`
