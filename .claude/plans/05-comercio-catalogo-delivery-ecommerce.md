# Plano 05 — Catálogo, Delivery e E-commerce

> **Pré-requisitos:** `01-comercio-admin.md` concluído (ficha pública, painel merchant, claim flow, reviews).
> **Posição no backlog:** Sprint 2C — pode rodar em paralelo ou logo após o 01.
> **Codinome interno:** `catalogo-delivery`

---

## 1. Contexto e decisões de design

### O problema
O guia comercial atual (Sprint 01) é só uma ficha de informações — telefone, horário, endereço. Mas os comerciantes de Carmo precisam de mais:
- Restaurante quer publicar o cardápio e receber pedidos
- Loja quer mostrar os produtos com preço
- Delivery quer configurar taxa, raio e horário de entrega

### Decisão: modelo de catálogo unificado
Food menus e catálogos de produtos têm estrutura idêntica. Usamos as mesmas tabelas com um campo `catalog_type`:
- `'food_menu'` → restaurantes, pizzarias, lanchonetes (com extras e customizações)
- `'product_catalog'` → lojas de roupa, ferragens, pet shop (com variações e estoque)

Isso evita duplicação de código e admin UI.

### Decisão: ordering em 3 fases
- **Fase 1 (este plano):** carrinho client-side → gera mensagem WhatsApp → zero infra de pagamento
- **Fase 2 (sprint futuro):** pedidos nativos com PIX (Pagar.me/MercadoPago) + realtime
- **Fase 3 (pós-MVP):** variações de produto, controle de estoque, frete para outras cidades

### Por que WhatsApp primeiro?
- 100% dos comerciantes de Carmo já usam WhatsApp para pedidos
- Zero atrito para o merchant: não precisa configurar pagamento
- Valida demanda antes de investir em infra de pagamento

---

## 2. Schema — novas tabelas e colunas

### 2a. Campos novos em `businesses` (migration nova)

```sql
alter table businesses add column if not exists
  catalog_type       text,          -- 'food_menu' | 'product_catalog' | null (sem catálogo)
  delivery_enabled   boolean default false,
  pickup_enabled     boolean default false,
  table_service_enabled boolean default false,   -- "comer no local"
  delivery_fee       numeric(10,2),              -- R$ taxa fixa; null = calculada por zona
  delivery_min_order numeric(10,2),              -- pedido mínimo para delivery
  delivery_time_min  int,                        -- tempo estimado em minutos
  delivery_radius_km numeric(5,2),               -- raio máximo de entrega
  delivery_zones     jsonb default '[]'::jsonb,  -- [{name, fee, polygon}] para zonas avançadas
  delivery_hours     jsonb default '{}'::jsonb,  -- horários de entrega (pode diferir do hours)
  order_instructions text,                       -- "anote seu endereço completo no pedido"
  pix_key            text,                       -- chave PIX para pagamento manual
  accepts_card_on_delivery boolean default false;
```

### 2b. Catálogos (`business_catalogs`)
Um negócio pode ter múltiplos catálogos (ex: cardápio de almoço vs jantar). Normalmente tem 1.

```sql
create table business_catalogs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,          -- "Cardápio Principal", "Menu Happy Hour"
  description  text,
  catalog_type text not null,          -- 'food_menu' | 'product_catalog'
  active       boolean default true,
  display_order int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

### 2c. Seções do catálogo (`catalog_sections`)

```sql
create table catalog_sections (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references business_catalogs(id) on delete cascade,
  name        text not null,         -- "Pizzas", "Bebidas", "Camisetas"
  description text,
  cover_url   text,
  display_order int default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);
```

### 2d. Itens do catálogo (`catalog_items`)

```sql
create table catalog_items (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references catalog_sections(id) on delete cascade,
  business_id   uuid not null references businesses(id) on delete cascade, -- denormalizado para RLS/query
  name          text not null,
  description   text,
  price         numeric(10,2) not null,
  promotional_price numeric(10,2),         -- preço promocional (sobrepõe price)
  promo_valid_until timestamptz,
  photo_url     text,
  serves        text,                       -- "1-2 pessoas", "500ml"
  prep_time_min int,                        -- tempo de preparo estimado
  calories      int,                        -- para menus com info nutricional
  tags          text[] default '{}',        -- ['vegano','sem_gluten','picante','destaque']
  available     boolean default true,       -- toggle rápido disponível/indisponível
  stock_qty     int,                        -- null = sem controle; 0 = esgotado
  sku           text,                       -- para e-commerce
  display_order int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_catalog_items_section on catalog_items(section_id, available);
create index idx_catalog_items_business on catalog_items(business_id);
```

### 2e. Grupos de opções (`catalog_item_option_groups`)
Customizações do item (ex: Tamanho, Bordas, Adicionais).

```sql
create table catalog_item_option_groups (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references catalog_items(id) on delete cascade,
  name        text not null,           -- "Tamanho", "Tipo de massa", "Adicionais"
  description text,
  min_choices int default 0,           -- 0 = opcional; 1+ = obrigatório
  max_choices int default 1,           -- 1 = selecionar 1; >1 = múltiplos; null = sem limite
  display_order int default 0,
  created_at  timestamptz default now()
);
```

### 2f. Valores de opção (`catalog_item_option_values`)

```sql
create table catalog_item_option_values (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references catalog_item_option_groups(id) on delete cascade,
  name        text not null,           -- "Grande", "Cheddar", "Sem cebola"
  price_add   numeric(10,2) default 0, -- acréscimo ao preço (+R$ 3,00)
  available   boolean default true,
  display_order int default 0,
  created_at  timestamptz default now()
);
```

### 2g. Pedidos — Fase 2 (estrutura pronta, não ativa no MVP)

```sql
-- criada na migration mas sem RLS ativa até Fase 2
create table orders (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete restrict,
  city_id        uuid not null references cities(id) on delete restrict,
  customer_id    uuid references profiles(id) on delete set null,  -- null = guest
  status         text default 'pending',   -- pending|confirmed|preparing|dispatched|delivered|cancelled
  order_type     text not null,            -- 'delivery'|'pickup'|'table'
  total_items    numeric(10,2) not null,
  delivery_fee   numeric(10,2) default 0,
  discount       numeric(10,2) default 0,
  total          numeric(10,2) not null,
  payment_method text,                     -- 'pix'|'card_on_delivery'|'cash'|'whatsapp'
  payment_status text default 'pending',   -- pending|paid|refunded
  -- delivery info
  delivery_address  jsonb,                 -- snapshot do endereço
  delivery_notes    text,
  estimated_time_min int,
  -- customer info snapshot (para guests)
  customer_name     text,
  customer_phone    text,
  -- controle
  notes             text,                  -- obs do cliente
  merchant_notes    text,                  -- obs do merchant (ex: motivo do cancelamento)
  confirmed_at      timestamptz,
  dispatched_at     timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  item_id     uuid references catalog_items(id) on delete set null,  -- null se item deletado
  name        text not null,           -- snapshot do nome
  unit_price  numeric(10,2) not null,  -- snapshot do preço
  qty         int not null default 1,
  options_snapshot jsonb default '[]'::jsonb,  -- [{group, value, price_add}]
  subtotal    numeric(10,2) not null,
  notes       text,                    -- "sem cebola", "bem passado"
  created_at  timestamptz default now()
);

create table order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     text not null,
  changed_by uuid references profiles(id),
  note       text,
  created_at timestamptz default now()
);
```

### 2h. RLS — novas tabelas

```sql
-- Catálogos: público lê ativos; merchant gerencia os seus
alter table business_catalogs      enable row level security;
alter table catalog_sections       enable row level security;
alter table catalog_items          enable row level security;
alter table catalog_item_option_groups enable row level security;
alter table catalog_item_option_values enable row level security;

-- leitura pública
create policy "catalogs_public_read" on business_catalogs for select using (active);
create policy "sections_public_read" on catalog_sections  for select using (active);
create policy "items_public_read"    on catalog_items     for select using (available or manages_business(business_id));
create policy "option_groups_read"   on catalog_item_option_groups for select using (true);
create policy "option_values_read"   on catalog_item_option_values for select using (available);

-- escrita pelo dono
create policy "catalogs_owner_write" on business_catalogs for all
  using (manages_business(business_id)) with check (manages_business(business_id));
create policy "sections_owner_write" on catalog_sections for all
  using (manages_business((select business_id from business_catalogs where id = catalog_id)))
  with check (manages_business((select business_id from business_catalogs where id = catalog_id)));
create policy "items_owner_write" on catalog_items for all
  using (manages_business(business_id)) with check (manages_business(business_id));
create policy "option_groups_write" on catalog_item_option_groups for all
  using (manages_business((select business_id from catalog_items where id = item_id)))
  with check (manages_business((select business_id from catalog_items where id = item_id)));
create policy "option_values_write" on catalog_item_option_values for all
  using (manages_business((
    select ci.business_id from catalog_item_option_groups g
    join catalog_items ci on ci.id = g.item_id
    where g.id = group_id
  ))) with check (true);
```

---

## 3. Server-side

### Queries públicas — `lib/businesses/catalog.ts`

```ts
// listCatalogs({ business_id }): retorna catálogos ativos com sections + items
// getCatalogWithItems({ catalog_id, include_unavailable? }): full tree para o cardápio
// getDeliverySettings({ business_id }): campos de delivery da tabela businesses
```

### Server Actions — `app/painel/comercio/[id]/catalogo/actions.ts`

- **`upsertCatalogAction`** — `{ id?, business_id, name, catalog_type, description?, active }`
- **`upsertSectionAction`** — `{ id?, catalog_id, name, description?, display_order }`
- **`upsertItemAction`** — input Zod completo:
  ```ts
  z.object({
    id: z.string().uuid().optional(),
    section_id: z.string().uuid(),
    business_id: z.string().uuid(),
    name: z.string().min(1).max(120),
    description: z.string().max(500).nullable(),
    price: z.number().min(0),
    promotional_price: z.number().min(0).nullable(),
    promo_valid_until: z.string().datetime().nullable(),
    photo_url: z.string().url().nullable(),
    serves: z.string().max(60).nullable(),
    prep_time_min: z.number().int().nullable(),
    tags: z.array(z.string()).default([]),
    available: z.boolean().default(true),
    stock_qty: z.number().int().nullable(),
    sku: z.string().nullable(),
    display_order: z.number().int().default(0),
  })
  ```
- **`upsertOptionGroupAction`** — `{ id?, item_id, name, min_choices, max_choices, display_order }`
- **`upsertOptionValueAction`** — `{ id?, group_id, name, price_add, available, display_order }`
- **`toggleItemAvailabilityAction`** — `{ item_id, available }` — toggle rápido sem recarregar o form
- **`reorderSectionsAction`** — `{ catalog_id, ordered_ids: string[] }` — salva `display_order` em lote
- **`uploadItemPhotoAction`** — `{ item_id, file: File }` → storage `businesses/{city_slug}/{business_id}/catalog/{item_id}.webp`
- **`upsertDeliverySettingsAction`** — atualiza campos de delivery em `businesses`:
  ```ts
  z.object({
    business_id: z.string().uuid(),
    delivery_enabled: z.boolean(),
    pickup_enabled: z.boolean(),
    table_service_enabled: z.boolean(),
    delivery_fee: z.number().min(0).nullable(),
    delivery_min_order: z.number().min(0).nullable(),
    delivery_time_min: z.number().int().min(1).nullable(),
    delivery_radius_km: z.number().min(0).nullable(),
    delivery_hours: z.record(z.array(z.object({ open: z.string(), close: z.string() }))),
    order_instructions: z.string().max(500).nullable(),
    pix_key: z.string().max(100).nullable(),
    accepts_card_on_delivery: z.boolean(),
  })
  ```

### Server Actions — Fase 2 — `app/painel/comercio/[id]/pedidos/actions.ts`

- **`createOrderAction`** — cria o pedido; retorna `order_id`; dispara email ao merchant
- **`updateOrderStatusAction`** — `{ order_id, status, note? }` — só merchant/admin
- **`cancelOrderAction`** — `{ order_id, reason }` — cliente (se pending) ou merchant

### Utilitário client-side — `lib/businesses/cart.ts`

```ts
// useCart(business_id): hook React que gerencia carrinho em memória
// addItem, removeItem, updateQty, clearCart
// buildWhatsAppMessage(cart, order_type, address?, pix_key?): string formatada
// getCartTotal(cart): { items_total, delivery_fee, total }
```

---

## 4. UI Público

### `/comercio/negocio/[slug]/cardapio` — Cardápio / Catálogo

Página principal do pedido. RSC para dados, `'use client'` apenas no `<CartProvider>`.

```
Layout:
┌─────────────────────────────────────┐
│  [Banner do negócio]                │
│  Nome • ⭐4.3 • Aberto agora        │
│  🛵 Delivery ~40min • R$5 frete     │
│  📦 Retirada disponível             │
├──────────────────┬──────────────────┤
│  Nav de seções   │  Sacola flutuante│
│  (sticky)        │  (client)        │
├──────────────────┤                  │
│  [Seção: Pizzas] │  2x Margherita  │
│    item card     │  1x Coca 2L     │
│    item card     │  ─────────────  │
│  [Seção: Bebidas]│  Subtotal R$71  │
│    ...           │  [Fazer Pedido] │
└──────────────────┴──────────────────┘
```

**Componentes:**
- `components/public/businesses/catalog/CatalogNav.tsx` — nav sticky por seção
- `components/public/businesses/catalog/CatalogSection.tsx` — seção com items
- `components/public/businesses/catalog/CatalogItemCard.tsx` — card clicável
- `components/public/businesses/catalog/ItemDetailModal.tsx` — modal com opções/customizações + add to cart
- `components/public/businesses/catalog/CartDrawer.tsx` — sacola lateral (mobile: drawer de baixo)
- `components/public/businesses/catalog/CartProvider.tsx` — context client com `useCart`
- `components/public/businesses/catalog/CheckoutModal.tsx` — modal final com: tipo (delivery/pickup), endereço, pagamento, botão "Enviar via WhatsApp"

**Fluxo WhatsApp:**
1. Usuário abre CheckoutModal
2. Preenche tipo (delivery = endereço obrigatório), método de pagamento
3. Clica "Confirmar pedido"
4. `buildWhatsAppMessage()` gera texto formatado:
   ```
   *Pedido via Portal Carmo* 🛒
   ━━━━━━━━━━━━━━━━━━━━
   2x Pizza Margherita G – R$ 59,90
      └ Borda: Cheddar (+R$ 5,00)
   1x Coca-Cola 2L – R$ 12,00
   ━━━━━━━━━━━━━━━━━━━━
   *Subtotal:* R$ 71,90
   *Frete:* R$ 5,00
   *Total: R$ 76,90*
   
   *Tipo:* 🛵 Delivery
   *Endereço:* Rua das Flores, 123 – Centro
   *Pagamento:* PIX (chave: 11999999999)
   
   Enviado pelo carmorc.com.br
   ```
5. Abre `window.open('https://wa.me/55{whatsapp}?text={encoded}', '_blank')`

**Tags de filtragem na listagem de itens:**
- `vegano` 🌱, `sem_gluten` 🌾✕, `picante` 🌶️, `destaque` ⭐, `novo` 🆕
- Filtro inline no topo do cardápio

### `/comercio/[categoria]` e listagem — indicadores de delivery

- Cards de negócio ganham badge "🛵 Delivery" quando `delivery_enabled = true`
- Filtro lateral: "Com delivery", "Retira na loja", "Aberto agora"
- Ordenação: "Mais rápido", "Menor frete", "Mais avaliados"

---

## 5. UI Painel

### Merchant — `/painel/comercio/[id]/catalogo`

Nova aba no painel do merchant (ao lado de Dados, Mídia, Horários, Promoções, Reviews).

```
Tabs:
[Dados] [Mídia] [Horários] [Catálogo] [Delivery] [Promoções] [Reviews] [Estatísticas]
```

**`/painel/comercio/[id]/catalogo`**
- Lista de catálogos do negócio (geralmente 1)
- Botão "Novo catálogo" (para casos como almoço/jantar diferentes)
- Card de catálogo → abre editor

**`/painel/comercio/[id]/catalogo/[catalog_id]`**
- Visão em árvore: Seção > Itens (drag & drop para reordenar)
- Botão "+ Seção", "Reordenar"
- Cada seção: acordeão com lista de itens
- Cada item: linha com foto thumb, nome, preço, toggle disponível, botões editar/deletar
- Botão "+ Item" dentro de cada seção
- `<ItemFormDialog>` — modal com form completo do item + grupos de opção

**`<ItemFormDialog>` / `<ItemFormSheet>`**
```
Tabs do form:
[Informações] [Opções/Customizações] [Foto]

Informações:
  Nome*, Descrição, Preço*, Preço promo + válido até,
  Serve (1-2 pessoas), Tempo de preparo, Calorias,
  Tags (multiselect), Disponível (toggle), SKU, Estoque

Opções/Customizações:
  Lista de grupos: [+ Adicionar grupo]
  Grupo: Nome, Mín/Máx escolhas, lista de valores
  Valor: Nome, Acréscimo (R$), Disponível

Foto:
  Upload + preview + crop
```

**`/painel/comercio/[id]/delivery`** — configurações de delivery
```
Toggle: Aceita Delivery / Aceita Retirada / Serviço de Mesa

Se delivery:
  Taxa de entrega: [R$] ou [Por zona]
  Pedido mínimo: R$
  Tempo estimado: min
  Raio: km (+ preview no mapa Maplibre)
  Zonas avançadas: [{Nome, Taxa}] + polígono no mapa (v2)
  Chave PIX: [campo]
  Aceita cartão na entrega: [toggle]
  Instruções para o pedido: [textarea]

Horários de delivery:
  [Copiar horário do negócio] ou configurar separado
  mesmo componente HoursEditor
```

### Merchant — `/painel/comercio/[id]/pedidos` (Fase 2)

Fila de pedidos em tempo real via Supabase Realtime.

```
Status tabs: [Novos (3)] [Em preparo] [A caminho] [Concluídos] [Cancelados]

Cada pedido:
  Card com: #número, horário, cliente, tipo, itens resumidos, total
  Ações rápidas: [Aceitar] [Recusar] [Marcar pronto]
  Clique abre drawer com pedido completo

Sons de notificação quando novo pedido chega (client-side Audio API)
```

### City admin — `/painel/cidade/comercio`

Adicionar coluna "Catálogo" na tabela de negócios: `Sim/Não` + link para ver.

---

## 6. Componentes a criar

```
components/
  public/businesses/
    catalog/
      CatalogNav.tsx          -- nav sticky de seções
      CatalogSection.tsx      -- seção com grid de items
      CatalogItemCard.tsx     -- card clicável
      ItemDetailModal.tsx     -- modal com opções + add to cart
      CartProvider.tsx        -- context client
      CartDrawer.tsx          -- sacola flutuante/lateral
      CheckoutModal.tsx       -- modal de finalização + WA
      DeliveryBadge.tsx       -- "🛵 Delivery ~40min"
      ItemTag.tsx             -- tag vegano/sem glúten/etc
    
  admin/businesses/
    catalog/
      CatalogTree.tsx         -- árvore seção > itens com DnD
      ItemFormDialog.tsx      -- form completo de item
      OptionGroupEditor.tsx   -- editor de grupos de opção
      SectionFormDialog.tsx   -- form de seção
    delivery/
      DeliverySettingsForm.tsx  -- form completo de delivery
      DeliveryRadiusMap.tsx     -- mapa Maplibre com raio visual
      HoursEditorDelivery.tsx   -- reutiliza HoursEditor
```

---

## 7. Edge Functions / Background

- **`supabase/functions/notify-new-order/index.ts`** (Fase 2) — chama Resend pra merchant + SMS
- **`supabase/functions/order-timeout/index.ts`** (Fase 2) — cron: cancela pedidos `pending` sem resposta em X min
- Foto de item: upload direto via `uploadItemPhotoAction`, resize client-side com `canvas` antes do upload (max 800×800, webp)

---

## 8. Integração com módulo turismo

Restaurantes e pousadas estão em `restaurants` (turismo), mas podem querer delivery também. Duas opções:
1. **Opção A (simples):** turismo e comércio são entidades separadas. Se um restaurante quer delivery, ele também cria um `businesses` record.
2. **Opção B (join):** `restaurants` ganha referência opcional para `businesses`.

**Decisão: Opção A no MVP.** Carmo tem poucos restaurantes; o admin faz os dois cadastros. Opção B pode ser implementada depois com FK.

---

## 9. Definition of Done

### Fase 1 — Cardápio + WhatsApp (entrega deste sprint)

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Migration com campos de delivery em <code>businesses</code> + tabelas <code>business_catalogs</code>, <code>catalog_sections</code>, <code>catalog_items</code>, <code>catalog_item_option_groups</code>, <code>catalog_item_option_values</code> + RLS</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Migration com tabelas <code>orders</code>, <code>order_items</code>, <code>order_status_history</code> (sem RLS ativa, só estrutura)</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions: <code>upsertCatalogAction</code>, <code>upsertSectionAction</code>, <code>upsertItemAction</code>, <code>upsertOptionGroupAction</code>, <code>upsertOptionValueAction</code>, <code>toggleItemAvailabilityAction</code>, <code>reorderSectionsAction</code>, <code>uploadItemPhotoAction</code>, <code>upsertDeliverySettingsAction</code> — todas com validação Zod</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p><code>lib/businesses/catalog.ts</code> com queries <code>getCatalogWithItems</code>, <code>getDeliverySettings</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p><code>lib/businesses/cart.ts</code>: hook <code>useCart</code> + <code>buildWhatsAppMessage</code> + <code>getCartTotal</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Página pública <code>/comercio/negocio/[slug]/cardapio</code> com nav sticky, cards, modal de item com opções, sacola flutuante, checkout modal com geração de mensagem WA</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Filtros "Com delivery" e badge "🛵 Delivery" na listagem <code>/comercio</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel merchant: aba Catálogo com árvore drag & drop, <code>ItemFormDialog</code> com tabs Informações/Opções/Foto, toggle rápido de disponibilidade</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel merchant: aba Delivery com form de configuração + mapa de raio Maplibre</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Seed: ~1 negócio demo com catálogo completo em Carmo (pizzaria "Bella Napoli" com 3 seções, 10 itens, opções de borda, entrega R$5)</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Teste E2E manual: merchant cria item → cidadão monta pedido → clica "Enviar via WhatsApp" → mensagem aparece correta no preview</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Lighthouse mobile &gt; 85 em <code>/comercio/negocio/[slug]/cardapio</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Davia: atualizar <code>businesses.html</code> + criar <code>businesses-catalog.html</code> com diagrama do modelo de catálogo e fluxo do pedido WA</p></li>
</ul>

### Fase 2 — Pedidos Nativos + PIX (sprint futuro, plano separado)

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Ativar RLS em <code>orders</code> / <code>order_items</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Integrar Pagar.me ou Mercado Pago para geração de QR PIX</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Realtime: fila de pedidos no painel do merchant com sons</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Edge Function <code>notify-new-order</code> → email merchant via Resend</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Histórico de pedidos no painel do cliente</p></li>
</ul>

### Fase 3 — E-commerce Completo (pós-MVP)

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Variações de produto (cor, tamanho) com preço e foto por variação</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Controle de estoque com alertas de baixo estoque</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Carrinho persistente no banco para usuários logados</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Frete por CEP via Correios/API para vendas fora da cidade</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Analytics de vendas: itens mais pedidos, receita por período, ticket médio</p></li>
</ul>

---

## 10. Impacto em planos existentes

| Plano | Impacto |
|---|---|
| `01-comercio-admin.md` | Adicionar aba "Catálogo" e "Delivery" ao painel merchant; migration compartilha o mesmo arquivo de businesses |
| `03-turismo-admin.md` | Restaurantes em turismo são entidades separadas (Opção A); sem conflito no MVP |
| `shimmying-singing-platypus.md` | Adicionar Sprint 2C "Catálogo + Delivery" ao backlog entre Sprint 2 e Sprint 3 |

---

## 11. Riscos

| Risco | Mitigação |
|---|---|
| Merchant não sabe configurar opções (borda, tamanho) | Tutorial passo-a-passo no onboarding do painel; defaults sensatos |
| WhatsApp link não abre em dispositivos sem WA | Fallback: copiar mensagem para área de transferência |
| Foto de item muito grande → lenta | Resize client-side com canvas antes de enviar (max 800×800, webp, 80%) |
| PIX key exposta no cardápio público | Só mostrar pix_key no modal de checkout, não indexada |
| Cardápio desatualizado (item esgotado mas `available=true`) | Toggle rápido no painel + notificação se merchant não atualiza em X dias |
