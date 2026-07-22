-- Publicar todos os guias de turismo de Carmo do Rio Claro
UPDATE tourism_guides
SET status = 'published', updated_at = now()
WHERE city_id = (SELECT id FROM cities WHERE slug = 'carmo-do-rio-claro')
  AND status = 'draft';
