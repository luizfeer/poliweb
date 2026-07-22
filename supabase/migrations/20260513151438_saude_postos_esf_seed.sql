-- Postos de saude e atendimento medico de Carmo do Rio Claro.
-- Mantem as unidades editaveis pelo painel de servicos/saude e enfileira para IA/busca.

alter table public.health_facilities
  add column if not exists slug text,
  add column if not exists neighborhood text,
  add column if not exists secondary_phone text,
  add column if not exists whatsapp text,
  add column if not exists source_type text not null default 'oficial',
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists requirements jsonb not null default '[]'::jsonb,
  add column if not exists needs_verification boolean not null default false,
  add column if not exists note text,
  add column if not exists last_verified_at date,
  add column if not exists display_order integer not null default 0,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_health_facilities_city_slug
  on public.health_facilities(city_id, slug)
  where slug is not null;

drop trigger if exists trg_health_facilities_updated on public.health_facilities;
create trigger trg_health_facilities_updated
before update on public.health_facilities
for each row execute function public.set_updated_at();

create or replace function public.enqueue_health_facility_indexing()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
    values ('health_facility', old.id, old.city_id, 'delete')
    on conflict (entity_type, entity_id) do update
      set operation = excluded.operation,
          city_id = excluded.city_id,
          processed_at = null,
          attempts = 0,
          last_error = null,
          enqueued_at = now();
    return old;
  end if;

  insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
  values ('health_facility', new.id, new.city_id, case when new.active then 'upsert' else 'delete' end)
  on conflict (entity_type, entity_id) do update
    set operation = excluded.operation,
        city_id = excluded.city_id,
        processed_at = null,
        attempts = 0,
        last_error = null,
        enqueued_at = now();

  return new;
end;
$$;

drop trigger if exists health_facilities_indexing on public.health_facilities;
create trigger health_facilities_indexing
after insert or update or delete on public.health_facilities
for each row execute function public.enqueue_health_facility_indexing();

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_facilities(
  slug, name, type, neighborhood, address, phone, secondary_phone, whatsapp, hours_legacy_text,
  services, requirements, tags, source_type, needs_verification, note, display_order
) as (
  values
    ('secretaria-municipal-de-saude', 'Secretaria Municipal de Saúde', 'secretaria', 'Centro', 'Praça Jairo Reis, 115 - Centro', '(35) 93618-0923', null, '(35) 93618-0923', 'Das 07h às 16h',
      '["Informações sobre a rede municipal de saúde","Agendamentos e orientações conforme disponibilidade","Encaminhamentos","Acompanhamento de programas municipais de saúde","Atendimento administrativo da saúde"]'::jsonb,
      '[]'::jsonb, '["secretaria de saúde","sus","agendamentos","encaminhamentos"]'::jsonb, 'oficial', false, null, 10),
    ('ubs-geralda-carielo', 'UBS Geralda Carielo', 'ubs', 'Bela Vista II', null, '(35) 93618-1251', null, '(35) 93618-1251', 'Informação publicada em 2024: das 07h às 22h, com atenção básica das 07h às 16h e urgências leves das 16h às 22h',
      '["Atenção básica","Atendimento a moradores da zona rural","Atendimento de urgências leves no período informado","Consultas médicas","Enfermagem","Tratamento odontológico","Encaminhamento para especialidades","Fornecimento de medicação básica","Visitas domiciliares"]'::jsonb,
      '[]'::jsonb, '["ubs","bela vista","atenção básica","urgências leves"]'::jsonb, 'oficial', true, 'Confirmar se o horário ampliado informado em 2024 segue igual.', 100),
    ('esf-rua-nova-pedro-antonio-de-mello', 'ESF Pedro Antônio de Mello - Rua Nova', 'psf', 'Rua Nova / Jardim América', 'Rua Inácia Gabriela, 398', '(35) 99961-3964', '(35) 3561-1007', '(35) 99961-3964', 'Das 07h às 16h',
      '["Clínico geral","Pediatria","Ginecologia","Nutrição","Enfermagem","Visitas domiciliares","Curativos, injeções e retirada de pontos","Solicitação de receitas, exames e medicação conforme rotina da unidade"]'::jsonb,
      '[]'::jsonb, '["esf","rua nova","jardim américa","atenção básica"]'::jsonb, 'oficial', true, 'Confirmar endereço, pois há páginas oficiais com endereços divergentes.', 110),
    ('esf-acampamento-benedito-de-deus', 'ESF Benedito de Deus - Acampamento', 'psf', 'Acampamento', 'Rua Antônio Jacinto Ferreira, 189 - Acampamento', '(35) 93618-0625', '(35) 3561-3270', '(35) 93618-0625', 'Das 07h às 16h',
      '["Clínico geral","Pediatria","Ginecologia","Nutrição","Psicologia","Odontologia","Enfermagem","Visitas domiciliares","Curativos, injeções e retirada de pontos"]'::jsonb,
      '[]'::jsonb, '["esf","acampamento","atenção básica"]'::jsonb, 'oficial', false, null, 120),
    ('esf-bela-vista-casemiro-galdino-bueno', 'ESF Casemiro Galdino Bueno - Bela Vista', 'psf', 'Bela Vista', 'Rua Maurício Melo de Carvalho', '(35) 99997-8418', '(35) 3561-2468', '(35) 99997-8418', 'Das 07h às 16h',
      '["Clínico geral","Pediatria","Ginecologia","Nutrição","Psicologia","Odontologia","Enfermagem","Visitas dos agentes comunitários de saúde","Curativos, injeções e retirada de pontos"]'::jsonb,
      '[]'::jsonb, '["esf","bela vista","atenção básica"]'::jsonb, 'oficial', true, 'Confirmar endereço completo.', 130),
    ('esf-rosario-jaime-silva', 'ESF Jaime Silva - Rosário', 'psf', 'Rosário', 'Rua Irmãs da Providência, 296', '(35) 99976-6434', '(35) 3561-3167', '(35) 99976-6434', 'Das 07h às 16h',
      '["Clínico geral","Pediatria","Ginecologia","Nutrição","Psicologia","Fonoaudiologia","Odontologia","Enfermagem","Visitas dos agentes comunitários de saúde","Curativos, injeções e retirada de pontos"]'::jsonb,
      '[]'::jsonb, '["esf","rosário","atenção básica"]'::jsonb, 'oficial', false, null, 140),
    ('esf-porto-jose-vicente-de-paulo', 'ESF José Vicente de Paulo - Porto', 'psf', 'Porto', 'Rua Valda Leite Pereira, 371 - Porto', '(35) 92002-5582', '(35) 3561-2487', '(35) 92002-5582', 'Confirmar com a unidade',
      '["Atenção básica","Acompanhamento por equipe de Saúde da Família","Consultas e orientações conforme agenda da unidade"]'::jsonb,
      '[]'::jsonb, '["esf","porto","atenção básica"]'::jsonb, 'oficial', true, null, 150),
    ('esf-vilelandia-tres-barras', 'ESF Vilelândia - Três Barras', 'psf', 'Vilelândia / Três Barras', 'Avenida José Luis Marques, 159 - Vilelândia', '(35) 93618-1236', '(35) 3561-1228', '(35) 93618-1236', 'Confirmar com a unidade',
      '["Atenção básica","Acompanhamento por equipe de Saúde da Família","Consultas e orientações conforme agenda da unidade"]'::jsonb,
      '[]'::jsonb, '["esf","vilelândia","três barras","zona rural"]'::jsonb, 'oficial', true, null, 160),
    ('esf-continental', 'ESF Continental', 'psf', 'Jardim América / Continental', 'Rua Pedro Faria, 722 - Jardim América', '(35) 99957-9524', '(35) 3561-2596', '(35) 99957-9524', 'Confirmar com a unidade',
      '["Atenção básica","Acompanhamento por equipe de Saúde da Família","Consultas e orientações conforme agenda da unidade"]'::jsonb,
      '[]'::jsonb, '["esf","continental","jardim américa"]'::jsonb, 'oficial', false, 'Página geral da Prefeitura informa que o aparelho do telefone fixo estava com defeito e indica o celular como telefone secundário.', 170),
    ('caps-carmo-do-rio-claro', 'CAPS - Centro de Atenção Psicossocial', 'caps', null, null, '(35) 99839-3144', null, '(35) 99839-3144', null,
      '["Atendimento em saúde mental","Acompanhamento psicossocial","Atendimento com equipe multiprofissional","Encaminhamentos conforme avaliação"]'::jsonb,
      '[]'::jsonb, '["caps","saúde mental","psicossocial"]'::jsonb, 'oficial', false, 'CAPS I Mentes Brilhantes inaugurado em 2024, com psiquiatria, psicologia, assistência social e oficinas terapêuticas.', 200),
    ('centro-odontologico-carmo-do-rio-claro', 'Centro Odontológico', 'odonto', 'Centro', 'Rua Camilo Aschar, 404 - Centro', '(35) 3561-2415', null, null, 'Das 07h às 11h e das 12h às 16h',
      '["Atendimento odontológico para adultos","Atendimento odontológico para crianças nas escolas","Atendimento de emergências odontológicas"]'::jsonb,
      '[]'::jsonb, '["odontologia","dentista","centro"]'::jsonb, 'oficial', false, null, 210),
    ('farmacia-municipal-carmo-do-rio-claro', 'Farmácia Municipal', 'farmacia-publica', 'São Benedito', 'Praça Argentino Rodrigues de Oliveira, 32 - São Benedito', '(35) 3561-1537', null, null, 'Das 07h às 11h30 e das 13h às 16h',
      '["Entrega de medicamentos do SUS conforme receita médica","Orientações sobre disponibilidade de medicamentos"]'::jsonb,
      '["Receita médica","Documento pessoal","Cartão SUS, quando solicitado"]'::jsonb, '["farmácia municipal","medicamentos","sus"]'::jsonb, 'oficial', false, null, 220),
    ('sala-de-vacinas-carmo-do-rio-claro', 'Sala de Vacinas', 'vacinacao', 'Jardim Continental', 'Rua Pedro Faria, 722 - Jardim Continental, no prédio do Posto de Saúde Risoleta Neves', '(35) 3561-2168', null, null, 'Das 07h às 11h e das 12h às 16h',
      '["Vacinas do Calendário Nacional de Vacinação","Vacinação de recém-nascidos, crianças, adultos e idosos","Orientação sobre caderneta de vacinação"]'::jsonb,
      '["Levar caderneta de vacinação","Documento pessoal","Cartão SUS"]'::jsonb, '["vacina","imunização","calendário nacional"]'::jsonb, 'oficial', false, null, 230),
    ('vigilancia-sanitaria-carmo-do-rio-claro', 'Vigilância Sanitária', 'vigilancia', 'Centro', 'Praça Dona Maria Goulart - Centro', '(35) 3561-2721', null, null, 'Das 08h às 11h e das 12h30 às 17h',
      '["Inspeções sanitárias na área de saúde e alimentos","Atendimento e recebimento de denúncias","Interdição cautelar de medicamentos e alimentos","Emissão de alvará sanitário"]'::jsonb,
      '[]'::jsonb, '["vigilância sanitária","denúncia","alvará sanitário"]'::jsonb, 'oficial', false, null, 240),
    ('vigilancia-epidemiologica-carmo-do-rio-claro', 'Vigilância Epidemiológica', 'vigilancia', 'Centro', 'Rua Getúlio Vargas, 622 - Centro', '(35) 3561-2162', null, null, 'Das 07h às 11h e das 12h às 16h',
      '["Prevenção e controle de doenças","Ações de combate à dengue","Visitas e monitoramento de focos do mosquito","Orientações epidemiológicas"]'::jsonb,
      '[]'::jsonb, '["vigilância epidemiológica","dengue","saúde pública"]'::jsonb, 'oficial', false, null, 250)
)
insert into public.health_facilities (
  city_id, slug, name, type, neighborhood, address, phone, secondary_phone, whatsapp,
  hours_legacy_text, services, requirements, tags, source_type, needs_verification,
  note, last_verified_at, display_order, active
)
select
  carmo.id, s.slug, s.name, s.type, s.neighborhood, s.address, s.phone, s.secondary_phone, s.whatsapp,
  s.hours_legacy_text, s.services, s.requirements, s.tags, s.source_type, s.needs_verification,
  s.note, date '2026-05-13', s.display_order, true
from carmo
cross join seed_facilities s
on conflict (city_id, name) do update
set slug = excluded.slug,
    type = excluded.type,
    neighborhood = excluded.neighborhood,
    address = excluded.address,
    phone = excluded.phone,
    secondary_phone = excluded.secondary_phone,
    whatsapp = excluded.whatsapp,
    hours_legacy_text = excluded.hours_legacy_text,
    services = excluded.services,
    requirements = excluded.requirements,
    tags = excluded.tags,
    source_type = excluded.source_type,
    needs_verification = excluded.needs_verification,
    note = excluded.note,
    last_verified_at = excluded.last_verified_at,
    display_order = excluded.display_order,
    active = excluded.active,
    updated_at = now();

insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
select 'health_facility', id, city_id, 'upsert'
from public.health_facilities
where city_id = (select id from public.cities where slug = 'carmo-do-rio-claro')
  and active
on conflict (entity_type, entity_id) do update
set operation = excluded.operation,
    city_id = excluded.city_id,
    processed_at = null,
    attempts = 0,
    last_error = null,
    enqueued_at = now();
