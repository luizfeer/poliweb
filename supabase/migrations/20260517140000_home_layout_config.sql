-- ============================================================================
-- HOME BUILDER — config no layout (margem topo, fade da navbar)
-- ============================================================================

alter table home_layouts
  add column if not exists config jsonb not null default '{}'::jsonb;
