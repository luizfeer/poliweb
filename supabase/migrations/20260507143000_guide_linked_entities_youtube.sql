alter table guide_linked_entities
  add column youtube_url text;

comment on column guide_linked_entities.youtube_url is 'Link público do YouTube para embed opcional no guia';
