# Plano 10 — Soft launch operacional + ativação de monetização

> **Pré-requisito:** Planos 05–09 concluídos. Build limpo, Lighthouse ≥ 90, newsletter funcionando, conteúdo real populado. Domínio definitivo registrado.

## 1. Contexto

A parte técnica está pronta. Agora é **operação humana**: colocar o portal nas mãos de 50–100 betatesters reais de Carmo do Rio Claro, ouvir feedback, corrigir o que dói, e em paralelo **ativar as primeiras receitas**.

Esta sprint é menos código, mais coordenação:
- Material gráfico de divulgação
- Lista de betatesters com convite gradual
- Painel de leads de anunciantes
- Ativação dos slots de banner que estavam vazios desde o Sprint 0
- Runbook operacional pra quem vai cuidar do portal no dia-a-dia
- Healthcheck público + interno

**Decisões estratégicas:**
- **Lançamento gradual em 3 ondas:** 10 amigos próximos → 30 betatesters → 100 cidadãos. Janela total: 4 semanas.
- **Ads ativados desde já**, mas com inventário pequeno (~5 slots) e venda manual (sem checkout self-service).
- **Não gastar dinheiro em anúncio pago** no soft launch. Boca-a-boca + parceria com rádio/igreja/associação comercial.
- **Métricas-bússola:** DAU (visitantes únicos diários), retorno em 7 dias, contact_reveals/dia, signups, classifieds postados, leads de anunciantes.

## 2. Tabelas e RLS

### Ads ativados

`ad_slots` e `advertisements` já existem (`20260429120600_transparency_ads_ai.sql`).

A complementar (migration `20260501XXXXXX_ads_activation.sql`):

- [ ] `ad_slots.dimensions jsonb` — width/height/aspect ratio por slot (já pode ter)
- [ ] `ad_slots.position text` — `home_top`, `home_sidebar`, `comercio_top`, `turismo_inline`, `transparencia_inline`, `agenda_top`
- [ ] `ad_slots.max_active int default 1` — quantos anúncios rodam em rotação
- [ ] `advertisements.weight int default 1` — peso na rotação (pra premium aparecer mais)
- [ ] `advertisements.click_count int default 0`, `view_count int default 0` — métricas
- [ ] `advertisements.advertiser_business_id` — link com o negócio anunciante
- [ ] `ad_clicks` — log granular: `ad_id`, `viewer_session_hash`, `clicked_at`, `referrer_path`

**RLS:** SELECT público dos `advertisements` ativos; INSERT/UPDATE só `is_city_admin(city_id)`. Logs `ad_clicks` SELECT só admin, INSERT via service role no Edge Function.

### Pedidos de anúncio (formulário `/anuncie`)

- [ ] `ad_inquiries` — pedidos de quem quer anunciar: `city_id`, `business_name`, `cnpj`, `contact_name`, `phone`, `email`, `interest` (slot desejado), `monthly_budget_cents`, `message`, `status enum('new','contacted','negotiating','closed_won','closed_lost')`, `assigned_to_profile_id`, `created_at`

### Healthcheck público

- [ ] `system_status_events` — eventos de saúde do sistema: `service` (db, cron-do, cron-atas, payment-gateway, etc.), `status` (up|degraded|down), `started_at`, `resolved_at`, `notes`
- [ ] Página pública `/status` (estilo statuspage.io minimalista)

## 3. Server-side

### 3.1 Lib de ads

`apps/web/lib/ads/`:
- `types.ts`
- `queries.ts` — `getAdForSlot(position, cityId)` retorna 1 ad (rotação ponderada)
- `tracking.ts` — `logImpression(adId, sessionHash)`, `logClick(adId, ...)`
- `rotation.ts` — algoritmo: pondera `weight` * `(1 - recent_view_rate)` pra alternar

### 3.2 Server Actions

`apps/web/app/anuncie/actions.ts`:
- `submitAdInquiryAction(input)` — Zod, insere em `ad_inquiries`, notifica admin por email Resend.

`apps/web/app/painel/cidade/anuncios/actions.ts`:
- `createAdvertisementAction(input)` — admin cria ad ativo (subir banner, target_url, slot, weight, end_at).
- `pauseAdAction(id)`, `archiveAdAction(id)`.
- `assignInquiryAction(inquiryId, userId)` — atribui lead a um membro da equipe.
- `markInquiryStatusAction(id, status)` — pipeline de vendas.

### 3.3 Healthcheck

`apps/web/app/api/health/route.ts` — endpoint público:
```ts
{
  status: 'ok' | 'degraded' | 'down',
  services: {
    db: { status, latency_ms },
    storage: { status },
    cron_diario_oficial: { last_run, status },
    cron_atas: { ... },
    cron_alertas: { ... },
    payment_gateway: { ... }
  },
  version: '1.x.x',
  uptime_seconds: ...
}
```

`/status` consome esse endpoint + tabela `system_status_events` pra histórico.

### 3.4 Convites (betatesters)

`apps/web/lib/invites/`:
- Geração de token de invite com `city_id` + `tag` (onda 1/2/3)
- Página `/convite/[token]` — pre-fill cadastro com email, marca origem
- Track quantos invites foram aceitos por onda (analytics)

### 3.5 Crons novos

- Diário: arquivar ads com `end_at < now()`
- Diário: snapshot de KPIs (DAU, signups, contact_reveals, classifieds, ad_clicks) em tabela `daily_kpis` pra histograma
- Semanal: relatório por email pro super_admin com KPIs da semana

## 4. UI público

### Rotas novas

- `/anuncie` — landing comercial: por que anunciar, planos disponíveis, formulário pra contato. Sem checkout self-service no soft launch.
- `/status` — healthcheck público (estilo Cloudflare/GitHub status)
- `/convite/[token]` — landing personalizada de invite (já no plano 09 cobre o cadastro real)
- `/sobre/lancamento` (opcional) — narrativa do soft launch ("Carmo Local em fase beta")

### Componentes

- `components/ads/AdSlot` — atualizar pra puxar do DB ao invés de retornar placeholder. Lazy load; falha silenciosa se sem ad ativo.
- `components/ads/AdImpressionTracker` — `'use client'` mínimo que dispara `logImpression` quando ad entra no viewport (IntersectionObserver)
- `components/marketing/AdsLandingHero` — pra `/anuncie`
- `components/marketing/AdsPricingTable` — tabela com 3 planos
- `components/marketing/AdsContactForm` — formulário com validação Zod
- `components/status/StatusIndicator` — bola verde/amarela/vermelha por serviço

### Slots inicialmente ativos

| Slot | Posição | Plano | Preço/mês |
|---|---|---|---|
| `home_top` | Banner 728×120 abaixo do AppHeader | Premium | R$ 500 |
| `home_inline` | Card horizontal entre seções | Featured | R$ 200 |
| `comercio_top` | Banner topo do hub `/comercio` | Premium | R$ 350 |
| `turismo_inline` | Card entre pousadas | Featured | R$ 250 |
| `agenda_top` | Banner topo de `/agenda` | Featured | R$ 150 |

(Preços iniciais, ajustar com base em interesse real.)

## 5. UI painel

### `/painel/cidade/anuncios/`

- `page.tsx` — dashboard: ads rodando, métricas (impressions, clicks, CTR), receita do mês
- `slots/page.tsx` — gerencia slots (criar novos, ajustar dimensões)
- `campanhas/page.tsx` — lista de advertisements ativos/pausados
- `campanhas/nova/page.tsx` — wizard: anunciante, slot, banner upload, target_url, datas, peso
- `leads/page.tsx` — pipeline de `ad_inquiries` (kanban: New → Contacted → Negotiating → Closed)
- `leads/[id]/page.tsx` — detalhe + histórico de interação

### `/painel/cidade/launch/` (operacional do soft launch)

- `page.tsx` — dashboard: KPIs do dia/semana, total de signups por onda, classifieds postados, contact_reveals
- `convites/page.tsx` — gera tokens, vê quem usou, exporta CSV
- `feedback/page.tsx` — caixa de mensagens recebidas via formulário público
- `kpis/page.tsx` — gráficos históricos (DAU, retention 7d, signups)

### `/painel/super/operacao/`

(Pra você, super_admin, monitorar tudo):
- Status de todos os crons
- Custo IA do mês (do plano 06)
- Receita ads do mês
- Erros recentes (últimos 100)
- Top 10 perfis com atividade (proxy de engajamento)

## 6. Plano de lançamento (4 semanas)

### Semana -1 (preparação)
- [ ] Domínio `carmolocal.com.br` apontado pro Vercel
- [ ] SSL automático Vercel + redirect www → apex
- [ ] Email transacional `noreply@carmolocal.com.br` configurado no Resend
- [ ] SPF/DKIM/DMARC validados
- [ ] Conteúdo real populado: 50+ negócios aprovados, 20+ pousadas, 10+ eventos próximos, 5+ obras públicas
- [ ] Dashboard `/painel/super/operacao` mostrando dados de verdade
- [ ] Material gráfico produzido:
  - 3 posts Instagram (apresentando o portal)
  - Card pra grupo de WhatsApp dos bairros
  - Folheto A5 imprimível pra colar em mural de igreja, padaria, mercado
  - Spot de 30s pra rádio local (texto + áudio gravado)

### Semana 1 — Onda 1 (10 pessoas, círculo íntimo)
Família, amigos próximos, 2-3 comerciantes parceiros que toparam ser cobaia.
- [ ] Convites com tag `wave-1` enviados manualmente
- [ ] Reunião de 30min com cada um pra explicar o produto e pedir feedback
- [ ] Issue tracker em `.claude/plans/10-feedback-wave-1.md` com bugs/sugestões
- [ ] Critério de avanço: 8/10 conseguiram cadastrar e usar 1 feature útil

### Semana 2 — Onda 2 (30 pessoas)
Lideranças locais: presidente associação comercial, padre, vereador (apartidário), 5 comerciantes, 3 imobiliárias, 2 pousadas grandes, 5 cidadãos diversos.
- [ ] Tag `wave-2`
- [ ] Email + WhatsApp pessoal explicando o convite
- [ ] Reunião coletiva (online ou presencial) — apresentação 20min + Q&A
- [ ] Pedir 1 ação concreta: "cadastre seu negócio" ou "poste 1 evento" ou "convide 3 amigos"
- [ ] Critério de avanço: 20/30 ativos em 5 dias + zero bug crítico

### Semana 3 — Onda 3 (100 pessoas)
Cidadania ampla: mensagem em grupos de bairro, post da prefeitura/câmara (se conseguir), spot de rádio.
- [ ] Tag `wave-3`
- [ ] Convite aberto: link `carmolocal.com.br` direto, sem token
- [ ] Acompanhamento diário do dashboard
- [ ] Resposta em <2h pra qualquer dúvida/bug
- [ ] Critério de avanço: 60+ signups, 10+ classifieds postados, 0 incidente crítico

### Semana 4 — Avaliação e ajuste
- [ ] Pesquisa NPS via newsletter (escala 0-10 + "o que melhoraria?")
- [ ] Análise de funis: onde as pessoas desistem? (signup → first action → return)
- [ ] Lista priorizada de bugs/melhorias pra próxima sprint (Plano 11)
- [ ] Decisão: launch público completo OU mais 2 semanas de ajuste

## 7. Definition of Done

### Técnico
- [ ] `/anuncie` no ar com formulário funcional
- [ ] Painel de leads de anunciantes operacional
- [ ] AdSlot puxando do DB e logando impressions/clicks
- [ ] 5 slots configurados, prontos pra primeiros anunciantes
- [ ] `/status` página pública saudável
- [ ] Cron de KPIs rodando, dashboard `/painel/super/operacao` ao vivo
- [ ] `/convite/[token]` funcionando com tag rastreável

### Operacional
- [ ] Domínio definitivo + SSL + redirect
- [ ] Material gráfico (Instagram, WhatsApp, folheto, spot rádio) produzido
- [ ] Lista de 100+ contatos pra ondas 1-3 organizada (planilha ou CRM simples)
- [ ] Conteúdo real: 50+ negócios, 20+ pousadas, 10+ eventos, 5+ obras
- [ ] Runbook publicado em `.davia/assets/runbook.html` cobrindo:
  - Como aprovar fila de moderação
  - Como rodar scraper manual
  - Como suspender conta abusiva
  - Como criar campanha de ad
  - Como atender lead de anunciante
  - Como exportar dados de cidadão (LGPD)

### Soft launch
- [ ] Onda 1 executada com 8/10 ativos
- [ ] Onda 2 executada com 20/30 ativos
- [ ] Onda 3 executada com 60+ signups
- [ ] Pesquisa NPS feita
- [ ] Lista de feedback documentada
- [ ] Decisão de launch público registrada

### Davia
- [ ] `runbook.html` completo
- [ ] `launch-playbook.html` (novo) — plano de lançamento + métricas
- [ ] `data/launch-kpis.json` — snapshot dos números do soft launch
- [ ] `data/feedback-wave-1.json`, `feedback-wave-2.json`, `feedback-wave-3.json`

### Build & qualidade
- [ ] Sem regressão em Lighthouse (≥ 90 perf, ≥ 95 a11y)
- [ ] Build limpo
- [ ] Smoke test pós-launch gravado em `.claude/plans/10-resultados.md`

## 8. KPIs-alvo do soft launch

| KPI | Mínimo | Bom | Excelente |
|---|---|---|---|
| Signups (cidadãos + comerciantes) | 50 | 80 | 120 |
| Negócios reivindicados (claim) | 5 | 15 | 30 |
| Classifieds postados | 10 | 25 | 50 |
| Contact reveals (leads gerados) | 20 | 50 | 100 |
| Newsletter subscribers confirmados | 30 | 60 | 100 |
| Leads de anunciantes (`/anuncie`) | 2 | 5 | 10 |
| NPS médio | ≥ 30 | ≥ 50 | ≥ 70 |
| Retorno em 7 dias | 25% | 40% | 55% |
| Bugs críticos reportados | <5 | <2 | 0 |

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Onda 3 não engaja (poucos signups) | Iterar copy + parceria com rádio local + post de prefeitura |
| Bug crítico aparece em Onda 1 | Pause antes de Onda 2; corrigir em 24h; re-convidar Onda 1 |
| Reclamação pública nas redes | Resposta empática em <2h; canal de suporte claro (`/contato`) |
| Anunciante reclama de pouco tráfego | Honestidade: "Estamos em fase beta, X visitas/dia atualmente"; propor desconto |
| Imprensa local descobre antes da hora | Press kit pronto + post de blog explicando o projeto |
| Sobrecarga operacional (você atende sozinho) | Onda 2 e 3 só depois que tiver 1 segundo admin treinado |
| LGPD: vazamento de dado | Plano de resposta a incidente em runbook; backup diário do Supabase; comunicação ANPD se aplicável |
| Custo Vercel/Supabase explode com tráfego | Alertas em 80% do free tier; plano de upgrade pré-aprovado |

## 10. Pós-launch — próximos passos

Depois do soft launch, sprint sequencial:
- **Plano 11 — Capitólio:** valida arquitetura multi-cidade replicando pra Capitólio (~10 fichas-âncora + módulos turismo/utilities/comunidade)
- **Plano 12 — PWA + push:** instalável + notificações de proximidade ("evento hoje a 800m de você")
- **Plano 13 — Monetização self-service:** checkout pra anunciantes via Stripe/Pagar.me; ativa paywalls dos planos 07/08
- **Plano 14 — App nativo (Expo)** se PWA não bastar pra retenção em mobile

## 11. Pergunta-chave pós soft launch

Após semana 4, com dados reais em mãos, decidir:
- **NPS ≥ 50 e DAU crescente:** abrir launch público + ativar paywalls 07/08
- **NPS 30-50:** mais 2 semanas de polish, segundo round de feedback
- **NPS < 30:** pivot — entrevistar churns, redesenhar feature problemática, postergar launch público
