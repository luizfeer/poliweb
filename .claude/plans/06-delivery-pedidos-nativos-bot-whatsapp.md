# Plano 06 — Pedidos Nativos + Bot de WhatsApp (Delivery Fase 2)

> **Pré-requisitos:** `05-comercio-catalogo-delivery-ecommerce.md` (Fase 1 — cardápio + carrinho). Este plano implementa a **Fase 2 nativa**: pedidos salvos no back, status online do restaurante, e um **bot de WhatsApp** pro comerciante operar tudo pelo zap.
> **Codinome interno:** `delivery-nativo`
> **Decisões travadas com o dono (2026-05-30):**
> 1. **Sem Go.** Estende a stack TS: edge functions Deno + worker Node. Reusa o pipeline de WhatsApp que já existe (`wa_outbound_queue` + `wa-outbound-worker` + janela de 24h).
> 2. **Mobile:** tela RN nativa na aba *Mensagens* (sem módulo Kotlin/Swift), push via `expo-notifications`.
> 3. **Entrega:** plano + fundação (migration + esqueleto do bot) nesta sessão.
> 4. **Caminho do pedido FORA do Vercel.** O write é a RPC `create_order` chamada **direto no Supabase pelo browser client** (grant `anon`+`authenticated`, RLS coberta). A notificação ao operador é enfileirada por **trigger AFTER INSERT em `orders`** — não por Server Action. Assim o Vercel só serve a página (cacheável) e o caminho do pedido escala com o Postgres. Abre exceção consciente à regra "mutations via Server Action" do CLAUDE.md, restrita ao módulo delivery.

---

## 1. Visão do fluxo (ponta a ponta)

```
┌─ COMERCIANTE ─────────────┐     ┌─ CLIENTE ──────────────────┐
│ manda "/abrir" no zap     │     │ abre /faca-pedidos no site  │
│ → loja fica ONLINE        │     │ → vê só restaurantes online │
│ (janela 24h abre)         │     │ → monta carrinho (iFood)    │
└────────────┬──────────────┘     │ → finaliza                  │
             │                    └──────────────┬──────────────┘
             │                                   │ createOrder()
             │                                   ▼
             │                     ┌─ BACK (Supabase) ──────────┐
             │                     │ create_order() RPC          │
             │                     │  - valida loja online       │
             │                     │  - recalcula preço (anti-   │
             │                     │    fraude) do catálogo      │
             │                     │  - grava order + items      │
             │                     │  - enfileira notificações   │
             │                     └──────┬──────────┬───────────┘
             │                            │          │
             ▼                            ▼          ▼
   ┌─ BOT WhatsApp ────────┐   ┌─ wa_outbound_queue ┐   ┌─ push app ┐
   │ pedido chega no zap   │◀──│ kind=interactive    │   │ expo      │
   │ do restaurante com    │   │ (botões) se janela  │   │ (operador │
   │ BOTÕES:               │   │ aberta; senão       │   │  + cliente)│
   │ [✅ Aceitar][❌ Recusar]│   │ template "novo_pedido"│ └───────────┘
   │ [📋 Ver pedidos]      │   └─────────────────────┘
   └──────────┬────────────┘
              │ operador toca botão / digita comando
              ▼
   ┌─ delivery-bot (edge fn, cron) ──────────────────┐
   │ consome wa_inbound_queue (consumer=delivery_bot)│
   │ - botões: ord_accept / ord_reject / ord_next    │
   │ - comandos: /abrir /fechar /lista /pausar /ajuda│
   │ - atualiza status → update_order_status()       │
   │ - cliente recebe atualização (push + WA)        │
   └─────────────────────────────────────────────────┘
```

**Por que não trava:** nada é enviado de forma síncrona. Toda saída é uma linha em `wa_outbound_queue`; o `wa-outbound-worker` (cron 1/min, lote 25, retry com backoff 1→16min, ciente do rate-limit 80 req/s da Meta) drena. Toda entrada cai em `wa_inbound_queue`; o `delivery-bot` (cron) drena. O webhook responde 200 na hora. Picos viram fila, não timeout.

---

## 2. Schema (migration `20260530180000_delivery_catalog_orders_bot.sql`)

### 2.1 Campos de delivery em `businesses` (Fase 1, caso ainda não migrado)
`catalog_type`, `delivery_enabled`, `pickup_enabled`, `table_service_enabled`, `delivery_fee`, `delivery_min_order`, `delivery_time_min`, `pickup_time_min`, `delivery_radius_km`, `delivery_zones jsonb`, `delivery_hours jsonb`, `order_instructions`, `pix_key`, `accepts_card_on_delivery`. (Alinhado com `DeliverySettings` em `catalog-types.ts`.)

### 2.2 Catálogo (Fase 1)
`business_catalogs`, `catalog_sections`, `catalog_items`, `catalog_item_option_groups`, `catalog_item_option_values` + RLS (público lê ativos; dono escreve via `manages_business`). Igual ao plano 05 §2.

### 2.3 Presença / "loja online" — `business_delivery_status`
Uma linha por negócio. É a fonte de verdade do "aparece no /faca-pedidos".
- `is_online`, `online_since`, `auto_offline_at` (expira sozinho — fim do expediente ou +N horas, evita loja "fantasma" online), `busy_mode` (aceita mas com tempo maior), `pause_reason`, `last_changed_by`, `source` (`whatsapp|panel|app|auto`).
- Leitura pública (a lista precisa). Escrita por `manages_business` + service role (bot).
- Cron `delivery-auto-offline` desliga lojas com `auto_offline_at < now()`.

### 2.4 Operadores de WhatsApp — `business_wa_operators`
Mapeia **quais números de zap controlam qual negócio** (o bot só obedece comandos de operador conhecido e verificado).
- `business_id`, `phone_number` (E.164 só dígitos), `display_name`, `role` (`owner|operator`), `active`, `verified_at`.
- Verificação: operador manda um código que o dono gerou no painel (Fase 2.1) — no MVP, `city_admin` cadastra o número e marca `verified_at`.

### 2.5 Pedidos — `orders`, `order_items`, `order_status_history` (RLS ATIVA)
Enums (guardados contra duplicação):
- `order_status`: `pending | confirmed | preparing | ready | dispatched | delivered | cancelled | rejected`
- `order_kind`: `delivery | pickup | table`
- `order_payment_method`: `pix | card_on_delivery | cash | whatsapp`
- `order_payment_status`: `pending | paid | refunded`

`orders` campos-chave: `code` (número curto diário por negócio, ex. `#7`), `channel` (`web|app|whatsapp`), totais, snapshots de endereço/cliente (guest), timestamps por estágio, `change_for`, `merchant_notes`. **Máquina de estados** validada em `update_order_status()`.

`order_items`: snapshot de nome/preço/opções (imutável após o pedido).

`order_status_history`: trilha de auditoria de cada transição (quem, quando, nota).

`order_daily_counters(business_id, day, seq)`: gera o `code` por negócio/dia.

### 2.6 Funções (SECURITY DEFINER)
- **`create_order(...)`** → recebe carrinho cru, **recalcula preço do catálogo no servidor** (anti-tampering), valida loja online + pedido mínimo, grava `order` + `order_items` + history `pending`, retorna `{order_id, code, totais, status}`. `grant execute` a `anon` + `authenticated` (guest pode pedir).
- **`update_order_status(p_order_id, p_status, p_note, p_actor)`** → valida transição, seta timestamps, grava history, notifica o cliente (`create_notification`).
- **`set_business_online(p_business_id, p_online, p_auto_offline, p_source)`** → toggle de presença (painel/app). Bot usa service role direto.
- **`wa_session_open` / `wa_touch_session`** → já existem (reuso).

### 2.7 Extensão do hub WhatsApp
- `alter table wa_inbound_queue add column consumer text default 'assistant'` — discrimina `assistant` (IA) vs `delivery_bot`. (Único consumidor hoje é o webhook → seguro.)
- `alter table wa_outbound_queue add column interactive jsonb` — carrega o payload de botões pra mensagens `kind='interactive'`.

### 2.8 RLS (resumo)
- Catálogo: público lê ativo; dono escreve.
- `business_delivery_status`: público lê; dono/escala escreve.
- `orders`/itens/history: cliente vê os seus (`customer_id = auth.uid()`), comerciante vê os do negócio (`manages_business`). Inserção só via `create_order` (definer). Update via `manages_business` ou definer.
- `business_wa_operators`: gerido por `manages_business` + `city_admin`.

---

## 3. Bot de WhatsApp — `supabase/functions/delivery-bot/`

Edge function Deno, **mesma arquitetura do `wa-outbound-worker`** (cron, lote, lock otimista, service role). Drena `wa_inbound_queue where consumer='delivery_bot' and status='pending'`.

### 3.1 Resolução de identidade
Para cada inbound: acha `business_wa_operators` por `from_number` (ativo+verificado). Se não for operador → ignora (futuro: tratar como cliente). Um número pode operar +1 negócio → se ambíguo, bot pergunta qual.

### 3.2 Botões interativos (vêm em `interactive.button_reply.id`)
- `ord_accept:<order_id>` → `confirmed` (e responde tempo estimado)
- `ord_reject:<order_id>` → `rejected` (pede motivo na próxima msg)
- `ord_next:<order_id>` → avança estado (`confirmed→preparing→ready→dispatched→delivered`)
- `menu:list` → roda `/lista`

### 3.3 Comandos de texto
| Comando | Ação |
|---|---|
| `/abrir` | loja online (janela 24h já está aberta pela própria msg) |
| `/fechar` | loja offline |
| `/pausar [min]` | `busy_mode` por N min (aceita com tempo maior) |
| `/lista` | lista pedidos abertos: `#code • status • há Xmin • total` |
| `/pedido <code>` | detalhe de um pedido + botões de ação |
| `/aceitar <code>` / `/recusar <code>` | atalho sem botão |
| `/pronto <code>` / `/saiu <code>` / `/entregue <code>` | avança status |
| `/ajuda` | lista de comandos |

Respostas do bot vão pra `wa_outbound_queue` como `text` (janela 24h aberta) ou `interactive` (botões). Idempotência por `dedup_key`.

### 3.4 Notificação ao cliente
A cada transição relevante, `update_order_status` chama `create_notification` (push app + in-app, já entregue pelo `worker/jobs/push-deliveries`). Se o cliente tiver opt-in WA, também enfileira um `text`/`template`.

---

## 4. Web

- **`/faca-pedidos`** (público, por cidade): lista negócios com `is_online=true` + `delivery_enabled/pickup_enabled`, badge "Aberto agora ~Xmin", filtro com delivery / retirada / aberto. Fonte: view/query `online_stores(city_id)`.
- **`/comercio/negocio/[slug]/cardapio`**: já existe (mock). Trocar mock por `getCatalogWithItems()` real e o checkout passa a chamar **`createOrderAction`** (pedido nativo) em vez de só abrir `wa.me`. Fallback `wa.me` quando a loja não tem operador/bot configurado.
- **Write direto (sem Vercel)** `lib/delivery/create-order.ts` (`'use client'`):
  - `createOrder(input)` → `supabase.rpc('create_order')` pelo **browser client**. A notificação ao operador (interactive se janela aberta, senão template `novo_pedido`) é enfileirada pelo **trigger `trg_orders_notify`** no banco — não pelo cliente.
- **Leituras RSC** `lib/delivery/orders.ts`: `getOnlineStores(cityId)` / `getOpenOrders(businessId)` (Server Components, cacheáveis).
- **Painel merchant** `/painel/comercio/[id]/pedidos`: fila realtime (Supabase Realtime em `orders`) com som; mesmas ações do bot. (Pode vir depois do bot — o bot já cobre a operação.)

---

## 5. Mobile (Expo, RN nativo na aba Mensagens)

- Aba **Mensagens** ganha seção "Pedidos": cliente acompanha seus pedidos (status em tempo real via Realtime) e o **operador** (se for merchant) recebe novos pedidos com push.
- Push de novo pedido pro operador via `device_push_tokens` + pipeline existente. Toque abre a tela do pedido com ações (Aceitar / Avançar) → chamam as mesmas RPCs.
- Sem módulo Kotlin/Swift agora. (Alerta sonoro contínuo estilo iFood-merchant fica como evolução: Expo Module nativo — anotado no backlog.)

---

## 6. Fases de entrega

**F0 — Fundação (esta sessão):** migration (catálogo + pedidos + presença + operadores + extensão do hub WA + RPCs + RLS); `delivery-bot` (esqueleto de comandos/botões); `wa-webhook` enfileira transacional pro bot; `wa-outbound-worker` suporta `interactive`; `lib/delivery/orders.ts` (createOrderAction + getOnlineStores).

**F1 — Web ligada:** trocar mock do cardápio por dados reais; `/faca-pedidos`; checkout → `createOrderAction`; templates Meta (`novo_pedido`).

**F2 — Painel + Realtime:** fila de pedidos no painel merchant com som; verificação de operador self-service.

**F3 — Mobile:** seção Pedidos na aba Mensagens (cliente + operador) + push.

**F4 — Pagamento:** PIX (Asaas, já integrado no projeto) → `payment_status`.

---

## 7. Riscos / decisões

| Risco | Mitigação |
|---|---|
| Loja fica "online" esquecida | `auto_offline_at` + cron de auto-offline + `/fechar` |
| Preço adulterado no client | `create_order` recalcula tudo do catálogo no servidor |
| 1º pedido com janela 24h fechada (sem botões) | enfileira template `novo_pedido`; operador responde → janela abre → botões/comados liberados |
| Número de operador trocado/golpe | só `verified_at`; cadastro por `city_admin`/dono |
| Conflito com worker IA na inbound queue | coluna `consumer` separa filas; IA deve filtrar `consumer='assistant'` |
| Bot interpreta cliente como comando | só processa `from_number` de operador conhecido |

---

## 8. Definition of Done — F0 (esta sessão)

- [ ] Migration aplica: catálogo + `orders/order_items/order_status_history` (RLS ativa) + `business_delivery_status` + `business_wa_operators` + counters + enums + RPCs (`create_order`, `update_order_status`, `set_business_online`) + extensão `wa_inbound_queue.consumer` / `wa_outbound_queue.interactive`.
- [ ] `wa-webhook` enfileira inbound transacional com `consumer='delivery_bot'`.
- [ ] `wa-outbound-worker` envia `kind='interactive'`.
- [ ] `delivery-bot` parseia comandos + botões e atualiza status via RPC.
- [ ] `lib/delivery/create-order.ts`: `createOrder` (RPC direto no Supabase) + `lib/delivery/orders.ts`: `getOnlineStores` (RSC).
- [ ] Migration 20260530190000: trigger `trg_orders_notify` enfileira WhatsApp (interactive/template) ao criar pedido.
- [ ] Davia: atualizar `whatsapp.html` + `businesses.html`, criar `delivery-orders.html` com o diagrama do fluxo.
</content>
