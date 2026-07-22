-- ============================================================================
-- HOME BUILDER — novo tipo de bloco hero_composite (web-only)
-- Painel grande customizável: hero com imagem + CTA destacado + grid 2x2.
-- Mobile ignora esse bloco (não renderiza).
-- ============================================================================

alter type home_block_type add value if not exists 'hero_composite';
