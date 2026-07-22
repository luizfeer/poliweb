-- Vídeo do YouTube no guia (hero público), não por vínculo de entidade

alter table tourism_guides
  add column if not exists youtube_url text;

comment on column tourism_guides.youtube_url is 'URL pública do YouTube para embed opcional no hero do guia';

alter table guide_linked_entities
  drop column if exists youtube_url;
