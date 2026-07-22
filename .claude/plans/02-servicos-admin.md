# Plano 02 — Admin de serviços públicos (utilities)

> **Pré-requisitos:** `00-auth-painel.md` concluído.
> **Tema:** retenção diária (cidadão volta toda semana pra checar coleta, plantão, telefones, alertas).

## 1. Contexto

- Módulo `utilities` no `city_modules` — primeiro passo do MVP de utilidade pública.
- Conteúdo é **curado pelo city_admin** (cidadão não posta). Sem UGC = sem moderação.
- Alertas (`service_alerts`) podem vir de scrapers Cemig/Copasa no futuro; por ora, manual.
- Tudo filtrado por `city_id` + `district_id` quando aplicável (coleta é por bairro).

## 2. Tabelas e RLS

Tudo já existe; são 7 tabelas em `20260429120500_utilities.sql`:

- [x] `garbage_schedules` — coleta por bairro, por dia da semana, por tipo.
- [x] `emergency_contacts` — telefones úteis com categorias.
- [x] `pharmacies` + `pharmacy_shifts` — farmácias e plantão por intervalo de datas.
- [x] `health_facilities` + `health_campaigns` — UBS, hospitais, vacinação.
- [x] `service_alerts` — água, energia, trânsito, clima, segurança, saúde.
- [x] RLS: leitura pública (`active`); escrita só `is_city_admin(city_id)`.

**Pendências:**
- [ ] Migration nova: índice `idx_alerts_active_partial on service_alerts(city_id) where active and (end_at is null or end_at > now())` para a query mais quente.
- [ ] Função `current_pharmacy_on_duty(p_city_id uuid, p_date date default current_date)` retornando `setof pharmacies` (join com `pharmacy_shifts` onde `start_date <= p_date <= end_date`).
- [ ] Seeds para Carmo (lê de `data/carmo-utilities-seed.json` que o city_admin preenche): coleta dos bairros principais, ~10 contatos de emergência, farmácias da cidade, UBS Centro/Vila Nova.

## 3. Server-side

### Queries (RSC)

- `apps/web/lib/utilities/queries.ts`:
  - `getGarbageSchedule({ city_id, district_id? })` — agrupa por dia da semana.
  - `listEmergencyContacts({ city_id, category? })`.
  - `getPharmacyOnDuty({ city_id, date })` — usa `current_pharmacy_on_duty`.
  - `listPharmacies({ city_id })`.
  - `listHealthFacilities({ city_id, type?, district_id? })`.
  - `listActiveAlerts({ city_id })` — só ativos e dentro de `end_at`.

### Server Actions

#### `app/painel/cidade/servicos/coleta/actions.ts`

- **`upsertGarbageScheduleAction`** — Zod:
  ```ts
  z.object({
    id: z.string().uuid().optional(),
    city_id: z.string().uuid(),
    district_id: z.string().uuid(),
    type: z.enum(['common','recyclable','organic','electronic','special']),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    notes: z.string().max(300).nullable(),
    active: z.boolean(),
  })
  ```
  Tabela `garbage_schedules`. RLS: `is_city_admin(city_id)`. Side: `audit_log`.
- **`deleteGarbageScheduleAction`** — `{ id }`.
- **`bulkImportGarbageAction`** — `{ city_id, csv: string }` parse + upsert em massa (caso a prefeitura mande planilha).

#### `app/painel/cidade/servicos/contatos/actions.ts`

- **`upsertEmergencyContactAction`** — `{ id?, city_id, category, name, phone, whatsapp?, short_dial?, description?, hours?, display_order, active }`.
- **`reorderEmergencyContactsAction`** — `{ city_id, ordered_ids: uuid[] }`. Atualiza `display_order` em batch.

#### `app/painel/cidade/servicos/farmacias/actions.ts`

- **`upsertPharmacyAction`** — `{ id?, city_id, name, address?, phone?, whatsapp?, is_24h, lat?, lng?, google_maps_url?, active }`.
- **`upsertPharmacyShiftAction`** — `{ id?, pharmacy_id, start_date, end_date, shift_type: 'plantao_24h'|'noturno', notes? }`. Validar overlap (não pode ter 2 plantões do mesmo tipo no mesmo dia na mesma farmácia).
- **`bulkImportShiftsAction`** — `{ city_id, csv }` (escala mensal típica vem em planilha).

#### `app/painel/cidade/servicos/saude/actions.ts`

- **`upsertHealthFacilityAction`** — `{ id?, city_id, district_id?, name, type: 'ubs'|'hospital'|'upa'|'odonto'|'psf', address?, phone?, hours?, services: string[], lat?, lng?, active }`.
- **`upsertHealthCampaignAction`** — `{ id?, city_id, title, description?, target_group?, vaccine_or_topic?, start_at?, end_at?, location?, cover_url?, active }`.

#### `app/painel/cidade/servicos/alertas/actions.ts`

- **`upsertAlertAction`** — `{ id?, city_id, type, severity: 'info'|'warning'|'critical', title, description?, affected_area?, affected_district_ids: uuid[], start_at, end_at?, source?, source_url?, active }`. Side: dispara push (futuro PWA) + email pra inscritos (pós-MVP).
- **`closeAlertAction`** — `{ id }` → seta `active=false`, `end_at=now()`.

## 4. UI público

Rota raiz: `/servicos`.

- `app/servicos/page.tsx` — landing com 5 cards: Coleta, Telefones, Farmácias, Saúde, Alertas. Hero mostra alerta crítico ativo no topo se houver.
- `app/servicos/coleta/page.tsx` — seletor de bairro (default = bairro do profile se logado, senão Centro). Tabela 7 dias × tipos. Componente `GarbageWeekGrid`.
- `app/servicos/telefones/page.tsx` — lista agrupada por categoria; click-to-call em mobile.
- `app/servicos/farmacias/page.tsx` — banner "Plantão hoje: **X**" + lista geral + mapa.
- `app/servicos/saude/page.tsx` — abas UBS / Hospital / Campanhas. Mapa com pins.
- `app/servicos/alertas/page.tsx` — feed cronológico (ativos + últimos 30 dias resolvidos).

Componentes:
- `components/public/utilities/GarbageWeekGrid.tsx`
- `components/public/utilities/PhoneCard.tsx` (com `tel:` e `wa.me/` links)
- `components/public/utilities/PharmacyDutyBanner.tsx`
- `components/public/utilities/AlertBanner.tsx` (severity-aware: info=azul, warning=âmbar, critical=vermelho persistente até `dismiss`)

## 5. UI painel

Tudo em `/painel/cidade/servicos/...` (city_admin):

- `/coleta` — tabela cruzada (linhas = bairros, colunas = dias). Botão "Importar CSV". Inline edit.
- `/contatos` — lista drag-and-drop por categoria, dialog de edição.
- `/farmacias` — lista de farmácias + sub-página `/[id]/plantao` com calendário mensal.
- `/saude` — duas listas (UBS, campanhas) + dialog.
- `/alertas` — feed admin com filtro por status/severidade. Botão "Novo alerta" abre modal completo.

Componentes:
- `components/admin/utilities/GarbageMatrix.tsx`
- `components/admin/utilities/PharmacyShiftCalendar.tsx`
- `components/admin/utilities/AlertForm.tsx`
- `components/admin/utilities/CsvImportDialog.tsx` (genérico, recebe schema Zod e action)

## 6. Definition of Done

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Migration nova com índice parcial em <code>service_alerts</code> e função <code>current_pharmacy_on_duty</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Seed Carmo aplicado: bairros principais com coleta + 10 contatos + farmácias + 1 UBS</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions de coleta/contatos/farmácias/saúde/alertas implementadas com Zod e <code>audit_log</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Bulk import CSV funciona pra coleta e plantões</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Página pública <code>/servicos</code> com 5 cards + alerta crítico no topo</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Página <code>/servicos/coleta</code> mostra grade semanal por bairro</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Página <code>/servicos/farmacias</code> destaca plantão do dia</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel city_admin com matriz de coleta + drag&drop de telefones + calendário de plantão</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Click-to-call e <code>wa.me</code> testados em mobile real</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Davia atualizada: nova página <code>utilities.html</code> com diagrama de fluxo de alertas</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p><code>pnpm build</code> + <code>pnpm lint</code> verdes; Lighthouse mobile &gt; 85</p></li>
</ul>
