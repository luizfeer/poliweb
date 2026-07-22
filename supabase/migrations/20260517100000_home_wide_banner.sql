-- ============================================================================
-- HOME BUILDER — novo tipo de bloco wide_banner (banner full-width, sem carrossel)
-- ============================================================================

alter type home_block_type add value if not exists 'wide_banner';
