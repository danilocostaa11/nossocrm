# Demo seeds

## Diego Doretto / Pipedrive

O seed `scripts/seed-diego-pipedrive-demo.mjs` reproduz no Supabase os dados configurados para o teste do Diego:

- board `Diego Doretto`
- etapas do funil iguais ao print do Pipedrive
- negócio `TERRAÇO ITALIA` em `PRIMEIRO CONTATO`
- empresas, contatos e telefones visíveis nos prints enviados em 2026-06-16
- atividades tipo `Chamada` para as linhas visíveis
- `active_board_id` do usuário `dorettodi@gmail.com` apontando para esse board

Para rodar:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-diego-pipedrive-demo.mjs
```

Em ambiente local de manutenção, o script também lê `.env.vercel.tmp` se as variáveis não estiverem carregadas no processo. Esse arquivo não deve ser commitado.
