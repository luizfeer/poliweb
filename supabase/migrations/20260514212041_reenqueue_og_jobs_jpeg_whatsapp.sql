-- Reenfileira OG image jobs para todas as entidades publicadas/ativas
-- para regenerar a square (WhatsApp) como JPEG em vez de WebP.
-- Pula entidades que já têm job pendente.

do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('business',        'businesses',         'status = ''published'''),
      ('attraction',      'attractions',        'status = ''published'''),
      ('accommodation',   'accommodations',     'status = ''published'''),
      ('restaurant',      'restaurants',        'status = ''published'''),
      ('fishing_guide',   'fishing_guides',     'status = ''published'''),
      ('tourism_guide',   'tourism_guides',     'status = ''published'''),
      ('property',        'properties',         'status = ''published'''),
      ('church',          'churches',           'status = ''published'''),
      ('ferry_route',     'ferry_routes',       'active = true'),
      ('community_group', 'community_groups',   'status = ''published'''),
      ('classified',      'classifieds',        'status = ''published'''),
      ('event',           'events',             'status = ''published'''),
      ('lost_pet',        'lost_pets',          'status = ''published'''),
      ('lost_and_found',  'lost_and_found',     'status = ''published'''),
      ('obituary',        'obituaries',         'status = ''published'''),
      ('health_campaign', 'health_campaigns',   'status = ''published''')
    ) as t(entity_type, table_name, where_clause)
  loop
    begin
      execute format(
        'insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
         select city_id, %L, id, ''pending''
         from public.%I
         where %s
           and not exists (
             select 1 from public.og_image_jobs j
             where j.entity_type = %L and j.entity_id = %I.id and j.status = ''pending''
           )',
        rec.entity_type, rec.table_name, rec.where_clause, rec.entity_type, rec.table_name
      );
    exception when undefined_table or undefined_column then
      raise notice 'pulando %: tabela/coluna ausente', rec.entity_type;
    end;
  end loop;
end $$;
