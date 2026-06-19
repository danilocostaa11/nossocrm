# Instalação por cliente

Modelo recomendado para vender o CRM como sistema próprio:

1. Criar um projeto Supabase para o cliente.
2. Criar um deploy Vercel para o cliente.
3. Configurar as envs do Supabase, URL pública e installer.
4. Rodar as migrations.
5. Criar o admin inicial pelo installer.
6. Configurar domínio/subdomínio do cliente.
7. Definir licença/trial em `organization_licenses`.
8. Importar funis, contatos e dados iniciais do cliente.

## Licença

Cada instalação tem uma licença em `organization_licenses`, ligada à organização principal.

Status aceitos:

- `trial`: libera acesso até `trial_ends_at`.
- `active`: libera acesso até `current_period_ends_at`; se esse campo for nulo, libera sem vencimento.
- `past_due`: libera apenas durante `grace_period_ends_at`.
- `blocked`: bloqueia.
- `canceled`: bloqueia.

O bloqueio é aplicado no proxy do Next.js e também nas funções RLS do Supabase, então o usuário não acessa páginas protegidas nem dados depois do vencimento.

## Webhook interno

Enquanto Stripe/Asaas não estiverem conectados diretamente, a rota abaixo permite atualizar a licença a partir de automações ou chamadas administrativas:

`POST /api/billing/license-webhook`

Header obrigatório:

```text
x-license-webhook-token: <LICENSE_WEBHOOK_TOKEN>
```

Exemplo para liberar mensalidade paga:

```json
{
  "organizationName": "Cliente Exemplo",
  "status": "active",
  "planKey": "crm-mensal",
  "provider": "manual",
  "currentPeriodEndsAt": "2026-07-19T23:59:59.000Z",
  "lastPaymentAt": "2026-06-19T12:00:00.000Z"
}
```

Exemplo para bloquear:

```json
{
  "organizationName": "Cliente Exemplo",
  "status": "blocked",
  "provider": "manual"
}
```
