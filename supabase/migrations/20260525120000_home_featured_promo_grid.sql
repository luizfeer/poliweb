-- ============================================================================
-- HOME BUILDER — novo tipo de bloco featured_promo_grid
-- Cards grandes coloridos (badge + título + subtítulo + imagem + seta) curados
-- pelo admin. Layout grid no desktop, scroll horizontal no mobile.
-- ============================================================================

alter type home_block_type add value if not exists 'featured_promo_grid';
