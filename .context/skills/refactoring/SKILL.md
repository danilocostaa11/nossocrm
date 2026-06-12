---
type: skill
name: Refactoring
description: Refactor code safely with a step-by-step approach. Use when Improving code structure without changing behavior, Reducing code duplication, or Simplifying complex logic
skillSlug: refactoring
phases: [E]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Garantir rede de segurança: testes existentes cobrem o comportamento? Se não, escrever testes ANTES.
2. Refatorar em passos pequenos, rodando `npx vitest <arquivos afetados>` a cada passo.
3. Alvos de melhoria neste repo (em ordem de valor):
   - Acesso a dados fora de `lib/supabase/` → mover para o módulo da entidade
   - Mutações com chave de cache errada → migrar para o cache canônico
   - Componentes duplicando primitivas de `components/` → reusar
   - Validações inline → schemas Zod em `lib/validations/`
   - Tipos duplicados → consolidar em `types/`
4. Manter convenções: imports `@/`, camelCase/PascalCase, domínio em `features/`.
5. Finalizar com `npm run precheck:fast`.

## Examples

**Consolidar acesso a dados:**
```ts
// Antes: componente chama Supabase direto
const supabase = createClient();
const { data } = await supabase.from('activities').select('*')...

// Depois: usar o módulo da entidade + facade
import { listActivities } from '@/lib/supabase/activities';
// UI consome via context/activities (TanStack Query)
```

## Quality Bar

- Comportamento idêntico: testes passam sem mudar expectativas.
- Diff focado: sem features novas ou fixes não relacionados misturados.
- Cada passo deixa o repositório em estado verde.

## Resource Strategy

- Apenas SKILL.md.
