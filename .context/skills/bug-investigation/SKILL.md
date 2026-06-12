---
type: skill
name: Bug Investigation
description: Investigate bugs systematically and perform root cause analysis. Use when Investigating reported bugs, Diagnosing unexpected behavior, or Finding the root cause of issues
skillSlug: bug-investigation
phases: [E, V]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Reproduzir o bug: `npm run dev` ou teste focado `npx vitest path/to/file.test.ts`.
2. Classificar o sintoma e ir direto à camada provável:
   - UI desatualizada/flicker → chaves de cache em `lib/query/queryKeys.ts` e mutações nas facades de `context/`
   - Dados de outro tenant ou ausentes → filtro `organization_id` em `lib/supabase/*.ts`, `lib/ai/tools.ts`, RLS na migração
   - Redirect/login inesperado → `proxy.ts` + `lib/supabase/middleware.ts` (lembrar: `/api/*` excluído)
   - Resposta errada da IA → `lib/ai/crmAgent.ts`, `lib/ai/tools.ts`, prompts em `lib/ai/prompts/`
   - Realtime fora de sincronia → `lib/realtime/` escrevendo em cache não canônico
3. Formar hipótese e confirmar com evidência (log, teste, query) antes de editar código.
4. Corrigir com mudança mínima + teste de regressão co-localizado.
5. Validar: `npm run precheck:fast`; se tocar tools de IA, rodar `test/aiToolsRbac.test.ts` e `test/tools.multiTenant.test.ts`.

## Examples

**Bug clássico de cache neste repo:**
```ts
// Errado: mutação atualiza cache filtrado (cache separado!)
queryClient.setQueryData(queryKeys.deals.list({ stage: 'won' }), ...)

// Correto: sempre o cache canônico de deals
queryClient.setQueryData([...queryKeys.deals.lists(), 'view'], ...)
```

**Bug de tenant:**
```ts
// Errado: tool de IA sem filtro de organização
const { data } = await supabase.from('deals').select('*');

// Correto
const { data } = await supabase.from('deals').select('*')
  .eq('organization_id', organizationId);
```

## Quality Bar

- Root cause identificada com evidência, não suposição.
- Teste de regressão acompanha a correção.
- Sem mudanças colaterais em outras entidades/caches.

## Resource Strategy

- Manter apenas este SKILL.md; padrões e caminhos do repo já estão em `.context/docs/architecture.md` e `AGENTS.md`.
