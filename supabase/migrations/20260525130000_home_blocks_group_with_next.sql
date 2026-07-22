-- ============================================================================
-- HOME BUILDER — agrupamento horizontal de blocos no desktop
-- Quando group_with_next = true, o renderer web agrupa este bloco com o próximo
-- num grid 2-col (8/12 + 4/12). group_title substitui os títulos individuais.
-- Mobile ignora os campos e renderiza cada bloco normalmente.
-- ============================================================================

alter table public.home_blocks
  add column if not exists group_with_next boolean not null default false,
  add column if not exists group_title text;
