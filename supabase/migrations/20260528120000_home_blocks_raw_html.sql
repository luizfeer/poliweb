-- ============================================================================
-- HOME BUILDER - bloco raw_html (admin escreve HTML sanitizado direto)
-- ============================================================================
-- Permite ao city_admin/super_admin atualizar trechos da home com HTML
-- arbitrario sem depender de release no app mobile (a versao puxa via Supabase
-- no cold start). A galeria de imagens reusa media_assets/media_links existente
-- via DirectMediaUpload (entityType='home_block', role='gallery').
--
-- O config jsonb desse tipo de bloco tem o shape:
--   {
--     "html": "<p>conteudo...</p>",   -- HTML bruto editavel
--     "padding": "comfortable" | "tight" | "none"
--   }
--
-- Sanitizacao acontece SEMPRE no render (server-side DOMPurify no web, e via
-- WebView isolado no mobile), nunca confiando no que esta no DB.

alter type home_block_type add value if not exists 'raw_html';
