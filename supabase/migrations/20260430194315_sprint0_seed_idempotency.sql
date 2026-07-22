-- ============================================================================
-- 0009 — SPRINT 0: idempotência de seeds globais
-- ============================================================================

-- Postgres permite múltiplos NULLs em UNIQUE(city_id, slug). Como usamos
-- city_id null para categorias globais, estes índices parciais impedem
-- duplicatas quando o seed roda mais de uma vez.

create unique index if not exists uq_business_categories_global_slug
on public.business_categories (slug)
where city_id is null;

create unique index if not exists uq_event_categories_global_slug
on public.event_categories (slug)
where city_id is null;
