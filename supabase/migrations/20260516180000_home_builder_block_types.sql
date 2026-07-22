-- ============================================================================
-- HOME BUILDER — novos tipos de bloco (wrappers das secoes hardcoded da home)
-- ============================================================================

alter type home_block_type add value if not exists 'business_promo_hero';
alter type home_block_type add value if not exists 'features_grid';
alter type home_block_type add value if not exists 'tile_strip';
alter type home_block_type add value if not exists 'service_list';
alter type home_block_type add value if not exists 'tourism_gateway';
alter type home_block_type add value if not exists 'lodging_map';
alter type home_block_type add value if not exists 'assistant_cta';
alter type home_block_type add value if not exists 'transparency_pulse';
alter type home_block_type add value if not exists 'cta_grid';
alter type home_block_type add value if not exists 'newsletter_cta';
alter type home_block_type add value if not exists 'weather';
