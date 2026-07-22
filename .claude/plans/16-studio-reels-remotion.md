# Plano 16 — Studio → Reels/vídeo (Remotion)

> **Pré-requisito:** Studio de Artes entregue (`lib/studio/types.ts`, `SlideCanvas` em `lib/studio/templates.tsx`, `art_pieces`). Skill local `remotion-video` disponível.
> **Estimativa:** Fase 1 ~1 semana; Fase 2 (render MP4) +1 semana conforme o caminho.
> **Status:** planejado (2026-06-08). Tarefa 3 do trio cardápio/boletim/reels. **Greenfield** (nenhuma dep Remotion instalada).

---

## 1. Contexto

**Por quê:** os mesmos slides que o comerciante já monta no Studio viram um **Reels vertical animado** (Ken Burns + transições + texto cinético). É o upgrade mais desejado e o que ele menos sabe fazer sozinho. Sobe o ticket do plano e gera conteúdo que circula.

**O que destrava:** vídeo a partir do conteúdo que já existe — custo marginal de criação ~zero pro merchant.

### Fonte de verdade já existe (verificado em 2026-06-08)
- `ArtDocument = { slides: Slide[] }` (`lib/studio/types.ts`). **Mas `Slide` só guarda `{ id, kind, theme, format, photo }` — não guarda texto.** O texto é gerado pelo template: `SlideCanvas({ slide, ramo, innerRef })` em `lib/studio/templates.tsx` (usa `lib/studio/copy.ts`).
- **Implicação central:** o renderer Remotion **reusa o `SlideCanvas`** como visual base (já produz o slide completo, com texto). Não reescrever o layout — envelopar o `SlideCanvas` em wrappers animados do Remotion. Texto cinético por-elemento (animar palavra a palavra) é enhancement posterior, pois exigiria expor os tokens de texto fora do `SlideCanvas`.
- R2 + destinos de publicação: reusar o fluxo de mídia (`requestMediaUploadTokenAction → uploadDirectToProcessor → finalizeMediaUploadAction`, padrão de `studio-editor.tsx`).

### A decisão central é a renderização do MP4 (preview é fácil; render é o custo)
- **Fase 1 — preview no navegador com `@remotion/player`** (client puro, zero infra). Entrega valor imediato: o comerciante VÊ o Reels animado a partir dos slides.
- **Fase 2 — exportar MP4.** Três caminhos:
  - **(a) Remotion Lambda** (AWS gerenciado) — mais rápido de subir, custo por render, AWS novo.
  - **(b) Estender `apps/media-processor`** com `@remotion/renderer` — **recomendado**: já é o worker de mídia de vocês (faz poster de vídeo), render fica "em casa", sem AWS novo. Risco: precisa de Chromium headless no ambiente do worker.
  - **(c) Serviço de render dedicado** — só se escalar muito.
  - **Recomendação:** começar por (b); cair pra (a) se o `media-processor` não aguentar Chromium.

---

## 2. Tabelas e RLS

**Fase 1:** nenhuma tabela nova. O preview lê o `ArtDocument` que já está em `art_pieces.document`.

**Fase 2 (render MP4):** registrar o resultado. Opção mínima — reusar `media_assets` (o MP4 final vira um asset role `ad` ligado ao business) + uma coluna/flag de status do render. Se precisar de fila/estado:

**Migration (Fase 2):** `supabase/migrations/2026MMDDHHMMSS_studio_reels.sql`
```sql
create table public.studio_renders (
  id           uuid primary key default gen_random_uuid(),
  city_id      uuid not null references public.cities(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  art_piece_id uuid references public.art_pieces(id) on delete set null,
  status       text not null default 'queued' check (status in ('queued','rendering','done','error')),
  video_url    text,
  video_asset_id uuid references public.media_assets(id) on delete set null,
  error        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.studio_renders enable row level security;
create policy "studio_renders_rw" on public.studio_renders for all
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));
```
RLS = mesmo molde de `art_pieces`. Trigger `set_updated_at`.

---

## 3. Server-side

**Fase 1:** nenhum server-side novo (preview é client puro).

**Fase 2 — caminho (b), recomendado:**
- **Server Action** `lib/studio/render-actions.ts → requestReelRenderAction({ businessId, artPieceId })`: Zod + `manages_business`; insere `studio_renders` (`queued`); dispara o worker (HTTP pro `apps/media-processor` ou via fila já existente do worker). Retorna `renderId`.
- **`apps/media-processor`**: novo job `render-reel` que recebe o `ArtDocument` (ou lê de `art_pieces`), roda `@remotion/renderer` (`renderMedia`) sobre a composição (ver §5), faz upload do MP4 pro R2 (mesmo pipeline do processor), atualiza `studio_renders` → `done` com `video_url`/`video_asset_id`. Em erro → `status='error'`, `error`.
- **Status:** o painel faz polling simples de `getRender(renderId)` (sem Realtime — alinhado a "prefere simples"); ou ISR/refresh.

**Caminho (a) Remotion Lambda (alternativa):** endpoint `app/api/studio/render/route.ts` que invoca `renderMediaOnLambda`; webhook/poll atualiza `studio_renders`. Requer bucket + função Lambda provisionados (`@remotion/lambda`).

> Tabelas novas com cast permissivo até regenerar tipos (padrão `lib/studio/actions.ts`).

---

## 4. UI público

Nenhuma rota nova. O MP4 final é baixado pelo merchant (pro Instagram/Reels) ou publicado nos destinos já existentes (Novidades / banner) reusando o fluxo de mídia. Se virar post, entra no feed público já existente — sem componente novo.

---

## 5. UI painel + projeto Remotion

**Projeto Remotion:** novo pacote `apps/remotion/` (ou `apps/web/remotion/` se preferir colocar junto) — `remotion.config.ts`, `src/Root.tsx` com as composições. Usar a skill `remotion-video` pra scaffolding.

**Composições (`src/compositions/`):**
- `ReelFromDocument.tsx`: recebe `{ document: ArtDocument, ramo: RamoId }`; mapeia cada `Slide` para uma cena:
  - **Ken Burns** na `photo` (escala/translação lenta via `interpolate` + `useCurrentFrame`).
  - Render do **`SlideCanvas`** (importado de `@/lib/studio/templates`) como camada de conteúdo — reuso direto do visual existente.
  - **Transições** entre cenas (`@remotion/transitions`: fade/slide).
  - Duração por cena ~2.5–3.5s; formato vertical 1080×1920 (story) por padrão, derivado do `format` do slide.
- (Enhancement) texto cinético por-elemento → exige refatorar `SlideCanvas` pra expor os tokens de texto; deixar pra depois.

**No painel (`studio-editor.tsx`), Fase 1:** botão **"Ver como Reels"** abre um modal com `<Player>` (`@remotion/player`) carregando `ReelFromDocument` com o documento atual. Controles play/pause/loop. Zero backend.

**Fase 2:** botão **"Baixar Reels (MP4)"** / "Publicar" → `requestReelRenderAction`, mostra progresso (poll de `studio_renders`), ao concluir oferece download do `video_url` + reusa destinos de publicação.

### Libs novas
- Fase 1: `@remotion/player`, `remotion`, `@remotion/transitions`.
- Fase 2: `@remotion/renderer` (caminho b) **ou** `@remotion/lambda` (caminho a).

### Fases
1. Projeto `/remotion` + `ReelFromDocument` (Ken Burns + transições reusando `SlideCanvas`) + `<Player>` no Studio.
2. Decisão de render (recomendado: (b) `apps/media-processor` + `@remotion/renderer`) + action/worker + tabela `studio_renders`.
3. MP4 no R2 + botão "baixar Reels"/publicar; (opcional) texto cinético.

---

## 6. Definition of Done

**Fase 1:**
- [ ] `apps/remotion` (ou pasta equivalente) scaffolded; `pnpm` workspace reconhece.
- [ ] `ReelFromDocument` renderiza um `ArtDocument` real reusando `SlideCanvas`, com Ken Burns + transições.
- [ ] Botão "Ver como Reels" no Studio abre `<Player>` funcional (play/loop) sem backend.
- [ ] `pnpm typecheck` / `pnpm lint` limpos; bundle do `@remotion/player` no client aceitável.

**Fase 2:**
- [ ] Caminho de render decidido e documentado (b recomendado).
- [ ] `renderMedia` produz MP4 do mesmo documento; upload pro R2 via pipeline do `media-processor`.
- [ ] `studio_renders` com status `queued→rendering→done/error`; painel mostra progresso (poll, sem Realtime).
- [ ] Botão "Baixar Reels (MP4)" funciona; publicação reusa o fluxo de mídia.
- [ ] Davia: página do Studio + `ai-pipeline`/`architecture` atualizadas com o caminho de render.
