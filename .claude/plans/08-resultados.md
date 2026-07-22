# Resultados 08 - Classificados pesados

Data: 2026-05-01

## Implementado

- Migration `20260501123000_classifieds_payment_approval.sql` com campos de pagamento, revisao, slug, tabelas especializadas e `classified_reports`.
- Trigger de auto-unpublish com 3 denuncias em 24h.
- Cron helper `archive_expired_classifieds()`.
- Config inicial em `city_modules.config` para `classifieds_payment_active` e `pricing_cents`.
- `apps/web/lib/classifieds/` com tipos, pricing e queries.
- Rotas publicas:
  - `/classificados`
  - `/classificados/veiculos`
  - `/classificados/veiculos/[slug]`
  - `/classificados/vagas`
  - `/classificados/vagas/[slug]`
  - `/classificados/servicos`
  - `/classificados/servicos/[slug]`
  - `/classificados/itens`
  - `/classificados/itens/[slug]`
  - `/classificados/buscar`
- Painel cidadao:
  - `/painel/cidadao/classificados`
  - `/painel/cidadao/classificados/novo`
- Painel cidade:
  - `/painel/cidade/classificados`
  - `/painel/cidade/classificados/aprovacao`
  - `/painel/cidade/classificados/reports`
  - `/painel/cidade/classificados/pagamentos`
- Webhook de pagamentos agora processa `entityType = classified`.
- Davia:
  - `classifieds-front.html`
  - `classifieds-pricing.html`
  - `mermaids/classifieds-approval.mmd`

## Verificacao

- `pnpm lint`: passou.
- `pnpm build`: passou.

## Pendencias conhecidas

- Emails Resend de aprovacao/rejeicao ainda nao foram conectados.
- Fila de IA usa a base existente de comunidade; moderacao especializada antifraude ainda e futura.
- Edicao detalhada em `/painel/cidadao/classificados/[id]/editar` ainda nao foi aberta.
- Bulk actions e banimento efetivo ainda sao stubs operacionais para proxima iteracao.
