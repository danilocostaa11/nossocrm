---
type: skill
name: Commit Message
description: Generate commit messages that follow conventional commits and repository scope conventions. Use when Creating git commits after code changes, Writing commit messages for staged changes, or Following conventional commit format for the project
skillSlug: commit-message
phases: [E, C]
generated: 2026-06-12
status: filled
scaffoldVersion: "2.0.0"
---
## Workflow

1. Rodar `git status` e `git diff --staged` para entender o escopo real da mudança.
2. Rodar `git log --oneline -15` para seguir o estilo existente do repositório.
3. Escolher tipo: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
4. Escolher escopo pelo domínio tocado: `deals`, `contacts`, `boards`, `activities`, `inbox`, `ai`, `reports`, `settings`, `public-api`, `mcp`, `installer`, `supabase`, `query`.
5. Escrever mensagem focada no "porquê", em 1-2 frases. Corpo opcional para contexto extra.

## Examples

```
feat(deals): adicionar campo de probabilidade no card do pipeline
fix(query): usar cache canônico de deals em mutação de drag-and-drop
fix(ai): filtrar tools de contatos por organization_id
refactor(contacts): mover validação de telefone para lib/validations
test(public-api): cobrir paginação por cursor com página vazia
docs(webhooks): documentar payload do evento de deal ganho
chore(supabase): migração de índice em deals(organization_id, stage_id)
```

## Quality Bar

- Um commit = uma mudança lógica (não misturar feature com refactor).
- Mensagem explica o porquê, não repete o diff.
- Nunca commitar arquivos com segredos (.env, credenciais).

## Resource Strategy

- Apenas SKILL.md; convenções de escopo derivam dos diretórios `features/` e `lib/`.
