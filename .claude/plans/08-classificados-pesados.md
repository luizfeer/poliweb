# Plano 08 — Classificados pesados (veículos, vagas, serviços, itens) com aprovação admin e paywall futuro

> **Pré-requisito:** Plano 07 implementado — reusa `lib/payments/`, abstração de gateway, infra de aprovação com `review_status`.

## 1. Contexto

Migration `20260429120400_community.sql` cria `classifieds` como tabela única com `type enum('imovel','veiculo','emprego','servico','item')` (imóveis migrados pra `properties` no plano 07). Comunidade tem páginas básicas em `/classificados` mas sem verticais especializadas.

**Decisões estratégicas desta sprint:**

- **Toda publicação passa por admin** (mesmo padrão do plano 07).
- **Paywall escalonado** (preparado, inativo no MVP):
  - **Itens (móveis, eletro, etc.):** R$ 50 por anúncio (vale 60 dias) — anti-fraude forte
  - **Veículos:** R$ 50 por anúncio (vale 60 dias) — carros são alvo grande de golpistas, taxa filtra bem
  - **Serviços (diaristas, freelas, prestadores):** R$ 10 por anúncio (vale 30 dias) — alta frequência, taxa baixa
  - **Vagas de emprego:** **GRATUITO** sempre (atrai tráfego social, valor estratégico) — empresas pagam só por destaque
- **Vagas grátis é decisão de produto:** quem oferece emprego não paga; quem busca emprego nunca paga; portal vira destino diário pra quem está procurando.
- **Cidadão pode reportar** anúncio suspeito (3 reports → vai pra fila revisão automaticamente).

## 2. Tabelas e RLS

Tabela `classifieds` já existe. **A adicionar (migration `20260501XXXXXX_classifieds_payment_approval.sql`):**

- [ ] Quebrar `classifieds.type` em campos especializados via tabelas filhas:
  - `classified_vehicles (classified_id pk, marca, modelo, ano_modelo, ano_fabricacao, km, combustivel, cambio, cor, placa_final)` — sem placa completa por LGPD
  - `classified_jobs (classified_id pk, tipo: clt|pj|temporario, faixa_salarial, presencial|remoto|hibrido, beneficios jsonb, requisitos)`
  - `classified_services (classified_id pk, area_atuacao, atende_em_casa, raio_atendimento_km, faixa_preco)`
  - `classified_items (classified_id pk, condicao: novo|usado|seminovo, marca, aceita_troca, motivo_venda)`
- [ ] `classifieds.payment_status enum('not_required','pending','paid','waived')`
- [ ] `classifieds.payment_amount_cents int`
- [ ] `classifieds.payment_provider_ref text`
- [ ] `classifieds.review_status enum('pending','approved','rejected','needs_changes')`
- [ ] `classifieds.rejection_reason text`
- [ ] `classifieds.expires_at timestamptz` — 30/60 dias conforme tipo
- [ ] `classified_reports (id, classified_id, reporter_profile_id, reason, created_at)` — denúncias de cidadãos
- [ ] Trigger: 3 reports em 24h → seta `review_status='pending'` automaticamente, despublica
- [ ] Índices: `(city_id, type, review_status, created_at desc)`

**RLS atualizada:**
- SELECT público: `status='published' AND review_status='approved' AND (expires_at is null OR expires_at > now())`
- INSERT: cidadão autenticado → `draft`
- UPDATE/DELETE: `owner_profile_id = auth.uid()` (próprio anúncio) ou `is_city_admin(city_id)`
- Aprovação só `is_city_admin(city_id)` ou `moderator`
- Reports: cidadão logado pode inserir (1 report por classified_id por usuário)

**Feature flag por tipo:**
- `city_modules.config` jsonb:
```json
{
  "classifieds_payment_active": false,
  "pricing_cents": {
    "item": 5000,
    "veiculo": 5000,
    "servico": 1000,
    "emprego": 0
  }
}
```

## 3. Server-side

### 3.1 Server Actions

`apps/web/app/painel/cidadao/classificados/actions.ts`:
- `createClassifiedDraftAction(input)` — Zod por tipo (discriminated union); cria `draft` + linha em tabela filha conforme `type`. Calcula fee.
- `updateClassifiedAction(id, input)` — RLS por `owner_profile_id`.
- `submitForReviewAction(id)` — `draft → pending`. Se módulo de pagamento ativo, redireciona pro checkout.
- `markAsSoldAction(id)` — autor marca `status='archived'` (vendido). Não cobra novamente se republicar dentro de 30 dias.
- `requestRenewalAction(id)` — paga de novo pra estender por mais 60/30 dias.

`apps/web/app/(public)/classificados/actions.ts`:
- `reportClassifiedAction(id, reason)` — Zod (motivo: spam|golpe|inadequado|incorreto). Insere em `classified_reports`.
- `contactSellerAction(id, message)` — opcional: envia mensagem via plataforma (preserva privacidade) → email pro vendedor.

`apps/web/app/painel/cidade/classificados/actions.ts`:
- `approveClassifiedAction(id)` — `pending → approved + published`
- `rejectClassifiedAction(id, reason)` — feedback ao autor
- `requestChangesAction(id, reason)` — autor edita
- `unpublishClassifiedAction(id, reason)` — admin tira do ar (reports validados, golpe confirmado)
- `banAuthorAction(profileId, reason)` — em casos extremos, banimento

### 3.2 lib/classifieds/

```
apps/web/lib/classifieds/
├── types.ts              # Classified base + ClassifiedVehicle, Job, Service, Item
├── queries.ts            # listByType, search, getBySlug, listForReview
├── pricing.ts            # calculateFee(type, cityConfig) → cents
├── reports.ts            # logReport, checkAutoUnpublish (3 reports em 24h)
└── notifications.ts      # email aprovação/rejeição/expiração
```

`pricing.ts`:
```ts
export function calculateFee(type: ClassifiedType, cityConfig: CityModuleConfig): number {
  if (!cityConfig.classifieds_payment_active) return 0;
  return cityConfig.pricing_cents?.[type] ?? 0;
}
```

### 3.3 Reuso de `lib/payments/` (do plano 07)

Mesma abstração. Webhook em `/api/webhooks/payments` já distingue por `payment_provider_ref` qual entidade está pagando (property ou classified).

### 3.4 Cron / jobs

- Diário: arquiva classifieds com `expires_at < now()`. Email pro autor 3 dias antes da expiração.
- Hora: processa fila de auto-unpublish quando 3 reports em 24h batem.

## 4. UI público

### Rotas

- `/classificados` — hub: 4 cards de macro tipos com contagem
- `/classificados/veiculos` — lista de veículos com filtros próprios (marca, ano, km)
- `/classificados/veiculos/[slug]` — ficha
- `/classificados/vagas` — vagas de emprego (gratuito, alta visibilidade)
- `/classificados/vagas/[slug]` — ficha
- `/classificados/servicos` — prestadores (diaristas, faxina, frete, jardineiro autônomo)
- `/classificados/servicos/[slug]` — ficha
- `/classificados/itens` — móveis usados, eletrônicos, infantil, etc.
- `/classificados/itens/[slug]` — ficha
- `/classificados/buscar?q=&type=&min=&max=` — busca cross-type

### Componentes (`components/carmo/classifieds/`)

- `ClassifiedCard` — variante por tipo:
  - `VehicleCard` — foto, marca/modelo, ano, km, preço, distância
  - `JobCard` — empresa, cargo, salário (faixa), regime, badge "Vaga aberta"
  - `ServiceCard` — prestador, área, faixa de preço, raio, rating se houver
  - `ItemCard` — foto, título, condição, preço, distância
- `ClassifiedHeader` — galeria + título + preço + ações
- `ClassifiedDetails` — campos especializados por tipo
- `ContactSellerButton` — abre form ou redireciona pra WhatsApp
- `ReportButton` — modal pra cidadão reportar
- `FreeBadge` — chip "GRÁTIS" pras vagas
- `PaywallNotice` — mostra quando o módulo está ativo: "Anunciar custa R$ X — vale 60 dias"

### Filtros importantes por tipo

**Veículos:**
- Marca / Modelo
- Ano min/max
- Km max
- Faixa de preço
- Combustível (flex/gasolina/diesel/elétrico)
- Câmbio (manual/automático)
- Cor

**Vagas:**
- Tipo contrato (CLT/PJ/temporário)
- Modalidade (presencial/remoto/híbrido)
- Faixa salarial
- Área (administrativo/comercial/operacional/saúde/etc.)

**Serviços:**
- Área de atuação
- Atende em casa? sim/não
- Raio de atendimento

**Itens:**
- Categoria (móveis/eletro/infantil/esporte/etc.)
- Condição (novo/seminovo/usado)
- Aceita troca?

## 5. UI painel

### `/painel/cidadao/classificados/`

- `page.tsx` — meus classificados (todos os tipos, com status)
- `novo/page.tsx` — wizard com seleção de tipo (radio: Item / Veículo / Serviço / Vaga). Fluxo continua específico por tipo. Se módulo pago, mostra preço antes de submeter.
- `[id]/editar/page.tsx`
- `[id]/leads/page.tsx` — mensagens recebidas (quando contact via plataforma)

### `/painel/cidade/classificados/` (city_admin/moderator)

- `page.tsx` — dashboard: pending count por tipo, reports abertos, métricas
- `aprovacao/page.tsx` — fila com filtros por tipo. Cada linha mostra dados-chave + botões 3 ações
- `reports/page.tsx` — denúncias abertas (anúncio + razão + reporter)
- `pagamentos/page.tsx` — quando ativo, dashboard de receita por tipo
- `usuarios-banidos/page.tsx`

### Componentes painel (`components/admin/classifieds/`)

- `ApprovalQueueByType` — abas por tipo
- `ReportInbox` — lista de reports com link pro classified
- `BulkActions` — selecionar múltiplos e aprovar/rejeitar em massa (útil pra fila grande)
- `FraudDetectionHints` — mostra sinais (autor sem histórico, foto duplicada, preço anômalo)

## 6. Pricing — racional comercial

| Tipo | Preço | Validade | Por quê |
|---|---|---|---|
| Vagas | **R$ 0** | 30 dias | Atrai tráfego social, alto volume de busca, RH paga por destaque (futuro) |
| Serviços | **R$ 10** | 30 dias | Volume alto, valor baixo do anunciante (diarista), R$ 10 não é barreira |
| Veículos | **R$ 50** | 60 dias | Carro vale R$ 5–80k, R$ 50 é nada; filtra 99% dos golpistas |
| Itens | **R$ 50** | 60 dias | Móvel usado vale R$ 100–2k, paywall sinaliza seriedade; ou usar OLX se for irrisório |

**Por que vagas é grátis:**
- Empregador raramente paga em portal hiperlocal pequeno (já paga Catho/Indeed)
- Mas trabalhador procura vaga **toda semana** → tráfego recorrente
- Vagas grátis vira gancho de retenção forte
- Monetiza com "destaque pago" (R$ 30 sobe topo da lista por 7 dias)

**Tier de destaque (todos os tipos):**
- Padrão: aparece na ordem cronológica
- Destacado (+R$ 20): topo da listagem por 7 dias + badge laranja
- Premium (+R$ 50): topo + aparece nas categorias relacionadas + badge "Verificado"

## 7. Anti-fraude (decisão de design importante)

### Mecanismos automáticos (sem IA)
- **Paywall** = filtro #1
- **Detecção de duplicata por imagem hash** (futuro): se foto já apareceu em outro anúncio recente, sinaliza
- **Velocity check**: se um perfil submete > 3 classifieds em 1 hora, aplica cooldown
- **Telefone validado por SMS** (futuro): autor só publica se confirmou WhatsApp/SMS
- **CEP precisa estar dentro da cidade** ou raio de 50km

### Mecanismos com IA (vem do plano 06)
- Moderação automática classifica como auto_approve / flag_for_review / auto_reject
- Detecta padrões de golpe (preço muito abaixo, descrição genérica, urgência artificial)
- Marca anúncios "ouro pra nada" (R$ 100 num iPhone novo) como suspeitos

### Mecanismo da comunidade
- Botão "Reportar" em todo classified
- 3 reports em 24h → despublica automaticamente, vai pra fila admin
- Cidadão com >5 reports validados ganha selo "olheiro confiável" (peso maior nos reports futuros)

## 8. Definition of Done

### Banco
- [ ] Migration aplicada com tabelas filhas (vehicles/jobs/services/items)
- [ ] Trigger de auto-unpublish após 3 reports
- [ ] RLS testada com 4 papéis
- [ ] Feature flag e pricing_cents em `city_modules.config`

### Server-side
- [ ] 11 Server Actions com Zod e log de audit
- [ ] `pricing.ts` calcula corretamente por tipo + city
- [ ] `lib/payments/` (do plano 07) reaproveitado sem duplicar
- [ ] Cron de expiração rodando (avisa 3 dias antes)
- [ ] Cron de auto-unpublish funcionando

### UI público
- [ ] `/classificados` hub com 4 cards
- [ ] 4 listagens especializadas com filtros próprios
- [ ] 4 fichas especializadas
- [ ] Busca cross-type
- [ ] Botão report funciona e gera entrada em `classified_reports`
- [ ] Vagas com badge "GRÁTIS" e CTA "Cadastrar vaga é grátis"
- [ ] Mobile responsivo, Lighthouse > 85

### UI painel
- [ ] Cidadão: wizard novo classified com tipo + campos especializados
- [ ] Cidadão: meus classificados, "marcar como vendido", renovar
- [ ] Admin: fila de aprovação com abas por tipo
- [ ] Admin: inbox de reports com link rápido
- [ ] Admin: bulk actions (aprovar/rejeitar 10+ em uma ação)
- [ ] Email pro autor em cada decisão (Resend)

### Fraude
- [ ] Velocity check (3+ classifieds/hora bloqueia)
- [ ] Auto-unpublish após 3 reports em 24h
- [ ] IA do plano 06 modera antes de chegar no admin
- [ ] Painel mostra hints de fraude (autor sem histórico, foto duplicada simples por hash)

### Davia
- [ ] `classifieds-front.html` (novo) com fluxos por tipo
- [ ] `classifieds-pricing.html` (novo) explicando o racional comercial
- [ ] Mermaid `classifieds-approval.mmd`

### Build & qualidade
- [ ] `pnpm build` limpo
- [ ] `pnpm lint` zero
- [ ] Smoke test ponta-a-ponta gravado em `.claude/plans/08-resultados.md`

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Cidadão acha caro | Comunicação clara nos CTAs: "Anunciar custa R$ X. Vale 60 dias. É pra evitar golpe." |
| Vaga falsa (recrutador suspeito) | Mesmo gratuita, passa por moderação admin; reports da comunidade tiram do ar |
| Veículo com placa real exposta | Schema só guarda `placa_final` (último dígito); admin esconde foto se aparecer placa em descrição |
| Foto com criança | Política de uso proíbe; IA modera; report comunitário; admin remove |
| Móvel já vendido fica anos no ar | Cron + email "ainda disponível?"; expira automático em 60 dias |
| Anúncio mesmo após expiração via cache | Revalidate ISR ou tag invalidation no `markAsSoldAction` |
| Spam de baixo valor (R$ 50 vendendo coisa de R$ 30) | Filtro mínimo: itens < R$ 100 vão para "Oferto/Doo" gratuito (categoria sem paywall) |

## 10. Mini-sub-vertical: "Oferto / Doo" (extensão grátis)

**Decisão pós-write:** itens muito baratos (< R$ 100) ou doações deveriam ser **gratuitos** — paywall não faz sentido pra alguém doando berço usado.

- Categoria nova: `classifieds.subtype='doacao'` ou flag `is_free_item=true`
- Tags: "doação", "oferto", "trocas"
- Sem paywall, mas mesma fila de aprovação admin
- Limite: 5 doações por mês por cidadão (anti-spam)

Vira ponte de comunidade local — cidade pequena adora isso.

## 11. Próximo passo

Plano 09 — **SEO + a11y + analytics + newsletter** (polish técnico antes do soft launch).
