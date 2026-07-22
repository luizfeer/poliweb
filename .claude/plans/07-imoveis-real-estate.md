# Plano 07 — Imóveis (real estate) com aprovação admin e paywall futuro

> **Pré-requisito:** Plano 05 (verificação) concluído. Plano 06 (transparência+IA) em andamento ou concluído — não bloqueia este.

## 1. Contexto

Migration `20260429120100_real_estate.sql` já cria as tabelas. Falta o **front + painel**.

Furnas e Canastra movimentam economia forte de **aluguel sazonal** (temporada, fim de semana) e venda de chácaras/casas na beira da represa. O módulo é comercialmente importante: imobiliárias locais já têm operação digital fraca (Instagram, ZAP/VivaReal genéricos) e vão pagar por presença local qualificada.

**Decisões estratégicas desta sprint:**
- **Toda publicação passa por admin.** `status='pending'` no insert → city_admin/moderator aprova → `status='published'`. Sem exceções.
- **Infraestrutura de pagamento desenhada** mas inativa no MVP. Em produção:
  - **Imobiliária:** plano mensal (free 3 fichas / pro 25 fichas + destaque / premium ilimitado + topo de busca)
  - **Particular:** R$ 30 por anúncio de venda, R$ 20 por anúncio de aluguel/temporada — barra fraude e lista quem é sério.
- **Cidadão pode favoritar** sem pagar nada (gera engajamento).
- **Imobiliária edita seus imóveis** via `entity_managers` + `manages_realtor()` (já existem helpers RLS no core).

### Adendo de implementacao: precos administraveis

- Precos de publicacao nao ficam hardcoded nas Server Actions.
- O admin da cidade ajusta a matriz em `/painel/cidade/imoveis/precos`.
- A configuracao fica em `city_modules.config` do modulo `real_estate`, no bloco `pricing.privateListingFeesCents`, usando chave `{listing_type}:{property_type}`.
- `real_estate_payment_active` continua desligado por padrao. Com ele desligado, a camada de pagamento retorna mock/not_required; com ele ligado, a mesma matriz vira fonte para checkout.
- A integracao futura com API de pagamento deve implementar `PaymentGateway` em `lib/payments/` e trocar apenas o factory `getPaymentGateway()`.

## 2. Tabelas e RLS

Tabelas já existem em `20260429120100_real_estate.sql`:
- `realtors` — imobiliárias (CNPJ, CRECI, marca, plano)
- `realtor_agents` — corretores vinculados (com ou sem conta)
- `properties` — imóveis (venda, aluguel, temporada) — particular OU imobiliária
- `property_inquiries` — leads recebidos
- `property_favorites` — cidadão salva imóveis pra rever

**A adicionar nesta sprint (migration `20260501XXXXXX_real_estate_payment_approval.sql`):**

- [ ] `properties.published_by_profile_id uuid` — quem submeteu (vai pra fila de aprovação)
- [ ] `properties.payment_status enum('not_required','pending','paid','waived')` — controla se já pagou (waived = admin liberou cortesia)
- [ ] `properties.payment_amount_cents int` — valor cobrado (snapshot, pra histórico)
- [ ] `properties.payment_provider_ref text` — id do gateway (Pix/Stripe/Pagar.me) quando ativo
- [ ] `properties.review_status enum('pending','approved','rejected','needs_changes')` — separado de `status` pra rastrear ciclo de revisão
- [ ] `properties.rejection_reason text` — feedback admin pro autor
- [ ] `properties.expires_at timestamptz` — anúncio caduca em 90 dias (renovação requer novo pagamento)
- [ ] `realtors.subscription_plan enum('free','pro','premium')` + `subscription_renews_at`
- [ ] Índice `(city_id, review_status, created_at desc)` pra fila de moderação

**RLS atualizada:**
- SELECT público: `status='published' AND review_status='approved' AND (expires_at is null OR expires_at > now())`
- INSERT: cidadão autenticado da cidade → vira `status='draft'` automático
- UPDATE: `manages_realtor(realtor_id)` ou `owner_profile_id = auth.uid()` ou `is_city_admin(city_id)`
- DELETE: só `is_city_admin(city_id)` (autor pede via `requestRemoval()` action)
- Aprovação só `is_city_admin(city_id)` — escreve `review_status='approved'` + `status='published'` + log em `audit_log`

**Feature flag:**
- `city_modules.config -> real_estate_payment_active boolean default false` — quando false, `payment_status='not_required'` no insert. Quando true, fluxo de pagamento obriga.

## 3. Server-side

### 3.1 Server Actions

`apps/web/app/painel/imobiliaria/actions.ts` (merchant/realtor):
- `createPropertyDraftAction(input)` — Zod, cria `draft`. Se módulo de pagamento ativo, retorna URL de checkout.
- `updatePropertyAction(id, input)` — Zod, RLS verifica ownership.
- `submitForReviewAction(id)` — `draft → pending`. Se faltou pagamento (módulo ativo), bloqueia.
- `requestRemovalAction(id, reason)` — pede arquivamento (admin homologa).

`apps/web/app/(public)/imoveis/actions.ts`:
- `createInquiryAction(propertyId, input)` — Zod (nome, telefone/whatsapp, mensagem). Insere em `property_inquiries`. Notifica owner por email (Resend).
- `toggleFavoriteAction(propertyId)` — toggle em `property_favorites` (precisa logado).

`apps/web/app/painel/cidade/imoveis/actions.ts` (city_admin):
- `approvePropertyAction(id)` — `pending → approved + published`. Marca `published_at`.
- `rejectPropertyAction(id, reason)` — `pending → rejected`. Notifica autor por email.
- `requestChangesAction(id, reason)` — `pending → needs_changes`. Autor edita e re-submete.
- `featurePropertyAction(id, durationDays)` — manualmente destaca.
- `waivePaymentAction(id, reason)` — admin libera cortesia (festival, parceria).

Toda action: Zod, RLS, log em `audit_log`.

### 3.2 lib/real-estate/

```
apps/web/lib/real-estate/
├── types.ts              # Property, PropertyInquiry, Realtor, etc.
├── queries.ts            # listProperties, getBySlug, listFavorites, listInquiries
├── search.ts             # filtros (preço, quartos, área, finalidade, bairro)
├── payment.ts            # calculatePropertyFee(input) → cents; gateway abstraction
└── notifications.ts      # email do lead (Resend) + email de aprovação/rejeição
```

`payment.ts` — abstração com 2 implementações:
- `MockPaymentGateway` (default): retorna `{ status: 'paid' }` instantâneo. Usado quando `real_estate_payment_active=false`.
- `StripeAdapter` ou `PagarmeAdapter`: futuro. Cria checkout session, retorna URL, recebe webhook.

Server Actions só conhecem a interface. Trocar gateway é trocar 1 linha.

### 3.3 lib/payments/ (compartilhado entre 07 e 08)

```
apps/web/lib/payments/
├── types.ts              # PaymentProvider, CheckoutSession, WebhookPayload
├── gateway.ts            # interface comum
├── mock.ts               # dev / módulo desligado
├── stripe.ts             # produção (futuro)
└── pagarme.ts            # alternativa BR (futuro)
```

`apps/web/app/api/webhooks/payments/route.ts` — recebe webhook do gateway, valida assinatura, atualiza `payment_status` da property/classified.

### 3.4 Cron / jobs

- Diário: marca como `archived` propriedades com `expires_at < now()`.
- Semanal: email pro autor avisando "seu anúncio expira em 7 dias, renove por R$ X".

## 4. UI público

### Rotas

- `/imoveis` — hub: busca, filtros, finalidade chips (venda/aluguel/temporada), destaques
- `/imoveis/[slug]` — ficha completa: galeria (Storage), descrição, mapa OSM, CTA "Tenho interesse" (form de inquiry), favoritar, compartilhar
- `/imoveis/buscar?q=&finalidade=&min=&max=&quartos=&bairro=` — resultados filtrados
- `/imobiliarias` — lista de imobiliárias da cidade
- `/imobiliarias/[slug]` — perfil da imobiliária + listagem dos imóveis dela

### Componentes (`components/carmo/real-estate/`)

- `PropertyCard` — card horizontal com foto cover, preço destacado (`R$ X.XXX/mês` ou `R$ X.XXX` venda), área, quartos, badges (NOVO, DESTAQUE), ícone de favoritar.
- `PropertyGrid` — grid responsivo (1 col mobile, 2 tablet, 3 desktop)
- `PropertyHeader` — galeria + título + preço + tipo/área/quartos + ações
- `PropertyDetails` — descrição rica + features (suíte, garagem, área lazer)
- `PropertyMap` — Maplibre com pin
- `InquiryForm` — formulário de contato (Server Action)
- `RealtorCard` — apresenta imobiliária com logo, CRECI, plano (badge "Verificada")
- `PropertyFilters` — finalidade, faixa de preço, quartos, área, bairro

### Filtros importantes

- Finalidade: venda / aluguel mensal / temporada
- Tipo: casa / apartamento / chácara / lote / comercial / pousada-temporada
- Faixa preço (slider)
- Quartos (1, 2, 3, 4+)
- Banheiros
- Área m² (min)
- Bairro
- Aceita pet (boolean)
- Mobiliado (boolean)

## 5. UI painel

### `/painel/imobiliaria/` (merchant + realtor manager)

- `page.tsx` — dashboard: meus imóveis ativos, leads novos, métricas (views, contatos), uso do plano
- `imoveis/page.tsx` — lista paginada + status (draft/pending/published/needs_changes/rejected)
- `imoveis/novo/page.tsx` — wizard: tipo → finalidade → endereço (autocomplete CEP) → fotos (Storage upload) → descrição → preview → submit. Se módulo de pagamento ativo, redireciona pro checkout.
- `imoveis/[id]/editar/page.tsx` — edição.
- `imoveis/[id]/leads/page.tsx` — lista de inquiries recebidos.
- `corretores/page.tsx` — gerenciar agentes vinculados.
- `plano/page.tsx` — assinatura atual + upgrade.

### `/painel/cidade/imoveis/` (city_admin)

- `page.tsx` — fila de aprovação (count em badge no nav)
- `aprovacao/page.tsx` — fila com filtros (todos/pending/needs_changes). Cada linha: thumbnail, dados-chave, botões `Aprovar` / `Pedir mudanças` / `Rejeitar` (com modal de motivo).
- `imobiliarias/page.tsx` — lista todas; aprovar claim, ajustar plano cortesia, suspender.
- `imoveis/page.tsx` — busca todos, ações: featurar, despublicar, deletar.
- `pagamentos/page.tsx` — quando ativo, dashboard de receita por mês.

### Componentes painel (`components/admin/real-estate/`)

- `ApprovalQueue` — lista paginada de pending
- `ApprovalDecisionDialog` — modal com 3 opções
- `PropertyEditWizard` — multi-step form
- `PhotoUploader` — Storage upload com compressão client-side
- `RejectionEmailPreview` — preview do email que vai pro autor

## 6. Fluxo de pagamento (preparado, inativo no MVP)

### Estado MVP (`real_estate_payment_active=false`)
1. Cidadão/imobiliária cria `draft`
2. Submete pra revisão → `pending`
3. Admin aprova → `published`
4. Anúncio fica 90 dias sem cobrança

### Estado pós-tração (`real_estate_payment_active=true`)
1. Particular cria `draft` → cobrança calculada (R$ 30 venda / R$ 20 aluguel)
2. Clica "Submeter pra revisão" → redireciona pro checkout (Stripe/Pagar.me)
3. Webhook recebe `payment.succeeded` → marca `payment_status='paid'`
4. Sistema move automaticamente pra `pending` (fila de admin)
5. Admin aprova → `published`
6. Em 90 dias caduca; autor recebe email de renovação (cobra de novo)

**Imobiliárias** assinam plano mensal:
- Free: 3 fichas ativas, sem destaque, R$ 0
- Pro: 25 fichas + 3 destaques/mês, R$ 99/mês
- Premium: ilimitado + topo de busca, R$ 299/mês

### Por que paywall funciona como anti-fraude
- R$ 20 elimina 99% dos golpistas (custo > retorno esperado)
- Imobiliária real não reclama de R$ 99/mês (paga muito mais em ZAP)
- Cidadão honesto pagando R$ 20 sinaliza seriedade (+ admin tem menos lixo pra revisar)
- Admin pode `waivePaymentAction` em casos especiais (pousada de amigo, parceria)

## 7. Definition of Done

### Banco
- [ ] Migration `20260501XXXXXX_real_estate_payment_approval.sql` aplicada
- [ ] Coluna `published_by_profile_id`, `payment_status`, `review_status`, `rejection_reason`, `expires_at` em `properties`
- [ ] `realtors.subscription_plan` populada
- [ ] RLS testada com 4 papéis (visitante, citizen, merchant/realtor, city_admin)
- [ ] Feature flag `real_estate_payment_active` em `city_modules`

### Server-side
- [ ] Todas as 9 Server Actions com Zod e log de audit
- [ ] `lib/real-estate/queries.ts` filtra por `city_id` em 100% das queries
- [ ] `lib/payments/` com `MockPaymentGateway` funcionando
- [ ] Webhook `/api/webhooks/payments` valida assinatura (mesmo no mock)
- [ ] Cron de expiração rodando

### UI público
- [ ] `/imoveis` hub com filtros + destaques
- [ ] `/imoveis/[slug]` ficha completa com galeria, mapa, inquiry form
- [ ] `/imoveis/buscar` com 8 filtros funcionando
- [ ] `/imobiliarias` lista + perfil
- [ ] Favoritos persistem por usuário
- [ ] Mobile responsivo, Lighthouse > 85

### UI painel
- [ ] Dashboard imobiliária com métricas reais
- [ ] Wizard de novo imóvel (5 steps)
- [ ] Upload de fotos via Storage com compressão
- [ ] Fila de aprovação pra city_admin com 3 ações (aprovar/pedir mudanças/rejeitar)
- [ ] Email pro autor em cada decisão (Resend)

### Observabilidade
- [ ] Métrica de taxa de aprovação (% aprovados / submetidos)
- [ ] Métrica de tempo médio de revisão (hora pending → decisão)
- [ ] Alerta se fila > 50 pending (avisa city_admin por email)

### Davia
- [ ] `real-estate.html` atualizada com fluxo de aprovação
- [ ] `payment-flow.html` (novo) — explicando a abstração de gateway e quando ligar
- [ ] Mermaid `real-estate-approval.mmd`

### Build & qualidade
- [ ] `pnpm build` limpo
- [ ] `pnpm lint` zero
- [ ] Smoke test ponta-a-ponta gravado em `.claude/plans/07-resultados.md`

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Admin atola na fila | Notificações + IA pré-classifica suspeitas (Plano 06 cobre essa parte) |
| Particular reclama do paywall | Comunicação clara: "R$ 20 é pra evitar fraude, fica 90 dias" |
| Imobiliária quer self-publish | Plano premium libera publicação direta sem fila (decisão futura) |
| Webhook do gateway falha | Idempotência por `payment_provider_ref`; retry manual no painel |
| LGPD em fotos com pessoas | Termo de uso obriga só fotos do imóvel sem terceiros identificáveis |
| Anúncio fica desatualizado (vendido) | Email automático em 30 dias: "ainda disponível?"; botão "marcar como vendido" |

## 9. Próximo passo

Plano 08 — **Classificados pesados** — usa a mesma infra de aprovação + pagamento, mas com 4 verticais (veículos, vagas, serviços, itens) e tabela de pricing diferente.
