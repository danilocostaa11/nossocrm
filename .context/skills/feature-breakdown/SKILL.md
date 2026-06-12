---
type: skill
name: Feature Breakdown
description: Break down features into implementable tasks. Use when Planning new feature implementation, Breaking large tasks into smaller pieces, or Creating implementation roadmap
skillSlug: feature-breakdown
phases: [P]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Clarificar o requisito: qual entidade/domínio? Precisa de dados novos? Precisa de IA? É exposto externamente?
2. Quebrar seguindo a ordem de camadas do NossoCRM (cada item é uma task independente e testável):
   1. **Schema**: migração em `supabase/migrations/` com RLS
   2. **Data access**: `lib/supabase/<entidade>.ts`
   3. **Cache/Query**: chaves em `lib/query/queryKeys.ts` + hooks
   4. **Facade**: context em `context/<entidade>/`
   5. **UI**: `features/<domínio>/` + rota em `app/(protected)/`
   6. **Validação**: Zod em `lib/validations/` + react-hook-form
   7. **Extras**: tool de IA (`lib/ai/tools.ts`), endpoint público (`app/api/public/`), webhook
   8. **Testes**: co-localizados + suites de `test/` se contrato mudou
   9. **Docs**: `docs/` ou README se afetar usuário/integrador
3. Marcar dependências entre tasks (schema antes de data access, etc.) e o que pode ser paralelo.
4. Definir critério de aceite por task (incluindo `npm run precheck:fast` verde).

## Examples

**Feature "tags em contatos":**
```
1. Migração: tabela contact_tags com RLS por organization_id
2. lib/supabase/contactTags.ts (CRUD)
3. queryKeys.contactTags + hooks de query
4. Facade em context/contacts/ (estender)
5. UI: chips de tag em features/contacts/ + filtro na lista
6. Zod schema para criação/edição de tag
7. Tool de IA "listContactsByTag" (filtrar organization_id!)
8. Testes: CRUD unit + UI RTL + caso multi-tenant
```

## Quality Bar

- Cada task entrega valor verificável isoladamente.
- Riscos e regras críticas (cache canônico, RLS) anotados na task relevante.
- Para trabalho não trivial, iniciar workflow PREVC via `workflow-init` do dotcontext.

## Resource Strategy

- Apenas SKILL.md; a receita de camadas espelha `.context/agents/feature-developer.md`.
