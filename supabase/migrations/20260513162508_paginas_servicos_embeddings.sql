create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  page_key text not null,
  title text not null,
  subtitle text,
  description text not null,
  url text not null,
  module_key text,
  keywords jsonb not null default '[]'::jsonb,
  content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, page_key),
  constraint site_pages_url_internal check (url like '/%' and url not like '//%')
);

create index if not exists idx_site_pages_city_active
  on public.site_pages(city_id, active, module_key);

alter table public.site_pages enable row level security;

drop policy if exists "site_pages_public_read" on public.site_pages;
create policy "site_pages_public_read" on public.site_pages
  for select to anon, authenticated
  using (active = true);

drop policy if exists "site_pages_admin_all" on public.site_pages;
create policy "site_pages_admin_all" on public.site_pages
  for all to authenticated
  using (public.is_super_admin() or public.is_city_admin(city_id))
  with check (public.is_super_admin() or public.is_city_admin(city_id));

drop trigger if exists trg_site_pages_updated_at on public.site_pages;
create trigger trg_site_pages_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

create or replace function public.enqueue_site_page_indexing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation text;
  v_id uuid;
  v_city_id uuid;
begin
  if tg_op = 'DELETE' then
    v_operation := 'delete';
    v_id := old.id;
    v_city_id := old.city_id;
  else
    v_operation := case when new.active then 'upsert' else 'delete' end;
    v_id := new.id;
    v_city_id := new.city_id;
  end if;

  insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
  values ('site_page', v_id, v_city_id, v_operation)
  on conflict (entity_type, entity_id) do update
    set operation = excluded.operation,
        city_id = excluded.city_id,
        processed_at = null,
        attempts = 0,
        last_error = null,
        enqueued_at = now(),
        updated_at = now();

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_site_pages_indexing on public.site_pages;
create trigger trg_site_pages_indexing
  after insert or update or delete on public.site_pages
  for each row execute function public.enqueue_site_page_indexing();

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.site_pages (
  city_id,
  page_key,
  title,
  subtitle,
  description,
  url,
  module_key,
  keywords,
  content,
  active
)
select
  carmo.id,
  page.page_key,
  page.title,
  page.subtitle,
  page.description,
  page.url,
  'utilities',
  page.keywords::jsonb,
  page.content,
  true
from carmo
cross join (
  values
    (
      'servicos',
      'Serviços públicos',
      'Utilidade pública',
      'Atalhos para saúde, telefones úteis, coleta, água, energia, farmácias, alertas, clima e outros serviços de Carmo do Rio Claro.',
      '/servicos',
      '["servicos", "utilidade publica", "saude", "telefone", "coleta", "agua", "energia", "farmacia", "alerta", "clima"]',
      'Página central de serviços públicos do Portal Carmelitano. Reúne atalhos para telefones úteis, postos de saúde, atendimento médico, farmácias, coleta de lixo, Cemig, Copasa, alertas, clima e serviços essenciais de Carmo do Rio Claro.'
    ),
    (
      'servicos-telefones',
      'Telefones úteis de Carmo do Rio Claro',
      'Prefeitura, saúde, emergência e serviços',
      'Lista de telefones importantes da Prefeitura, secretarias, saúde, assistência social, segurança pública, Cemig, Copasa e atendimento ao cidadão.',
      '/servicos/telefones',
      '["telefone", "telefones uteis", "prefeitura", "secretaria", "saude", "cras", "caps", "policia", "samu", "bombeiros", "cemig", "copasa", "emergencia"]',
      'Guia de telefones úteis de Carmo do Rio Claro. Inclui contatos da Prefeitura, protocolo, ouvidoria, secretarias municipais, saúde, ESFs, UBS, CAPS, assistência social, CRAS, Bolsa Família, Polícia Militar, Polícia Civil, SAMU, Bombeiros, Defesa Civil, Cemig, Copasa, INSS, turismo e cultura. Os números são clicáveis para ligar e celulares podem ter WhatsApp quando disponível.'
    ),
    (
      'servicos-saude',
      'Postos de saúde e atendimento médico em Carmo',
      'ESF, UBS, CAPS, vacinas e farmácia',
      'Contatos de ESFs, UBS Geralda Carielo, CAPS, Farmácia Municipal, Sala de Vacinas, vigilâncias, Secretaria de Saúde e pronto atendimento.',
      '/servicos/saude',
      '["saude", "posto de saude", "postos de saude", "esf", "psf", "ubs", "caps", "farmacia municipal", "vacina", "sala de vacinas", "vigilancia sanitaria", "vigilancia epidemiologica", "samu", "hospital"]',
      'Página de saúde pública de Carmo do Rio Claro. Mostra telefones rápidos para SAMU, pronto atendimento, Secretaria Municipal de Saúde, CAPS, Sala de Vacinas, Farmácia Municipal e UBS Geralda Carielo. Lista ESFs e UBS por unidade, endereço, horário, serviços, requisitos, telefone e WhatsApp quando houver. Orienta quando procurar ESF ou UBS, quando ir ao pronto atendimento e quando ligar para o SAMU.'
    ),
    (
      'servicos-agua',
      'Água e esgoto',
      'Copasa e orientações',
      'Orientações para falta de água, vazamento, segunda via, religação, esgoto e atendimento da Copasa.',
      '/servicos/agua',
      '["agua", "copasa", "esgoto", "falta de agua", "vazamento", "segunda via", "religacao", "conta de agua"]',
      'Página de água e esgoto para Carmo do Rio Claro. Reúne orientações sobre Copasa, falta de água, vazamentos, esgoto, segunda via de conta, religação, atendimento, documentos necessários e cuidados em ocorrências.'
    ),
    (
      'servicos-energia',
      'Energia elétrica',
      'Cemig e atendimento',
      'Orientações para falta de energia, segunda via, religação, troca de titularidade, poda, poste e canais da Cemig.',
      '/servicos/energia',
      '["energia", "cemig", "falta de luz", "falta de energia", "segunda via", "religacao", "poste", "poda", "conta de luz"]',
      'Página de energia elétrica para Carmo do Rio Claro. Reúne orientações sobre Cemig, falta de luz, segunda via, religação, troca de titularidade, risco em poste, poda, instalação e canais oficiais de atendimento.'
    ),
    (
      'servicos-coleta',
      'Coleta de lixo',
      'Bairros e dias de coleta',
      'Agenda de coleta por bairro, horários, tipo de resíduo e orientações para descarte.',
      '/servicos/coleta',
      '["coleta", "lixo", "coleta de lixo", "bairro", "residuo", "reciclavel", "descarte"]',
      'Página de coleta de lixo em Carmo do Rio Claro. Mostra agenda de coleta por bairro, tipo de resíduo, horários e orientações para colocar o lixo corretamente e evitar descarte irregular.'
    ),
    (
      'servicos-farmacias',
      'Farmácias',
      'Plantão e atendimento',
      'Farmácias cadastradas, contatos, endereço, WhatsApp e plantões quando informados.',
      '/servicos/farmacias',
      '["farmacia", "farmacias", "plantao", "remedio", "medicamento", "telefone farmacia", "whatsapp farmacia"]',
      'Página de farmácias em Carmo do Rio Claro. Lista farmácias cadastradas, telefone, WhatsApp, endereço, funcionamento e plantões quando houver informação.'
    ),
    (
      'servicos-alertas',
      'Alertas da cidade',
      'Avisos de serviço público',
      'Alertas ativos sobre água, energia, trânsito, saúde, clima, risco e serviços municipais.',
      '/servicos/alertas',
      '["alerta", "avisos", "chuva", "risco", "interrupcao", "servico publico", "emergencia", "transito"]',
      'Página de alertas públicos de Carmo do Rio Claro. Reúne avisos sobre interrupção de serviços, água, energia, trânsito, saúde, clima, risco, eventos e comunicados importantes para moradores.'
    ),
    (
      'servicos-clima',
      'Clima em Carmo do Rio Claro',
      'Previsão do tempo',
      'Previsão do tempo, temperatura, chuva, vento e condições para atividades locais.',
      '/servicos/clima',
      '["clima", "tempo", "previsao", "chuva", "temperatura", "vento", "frio", "calor"]',
      'Página de clima em Carmo do Rio Claro. Mostra previsão do tempo, temperatura, chuva, vento e condições úteis para moradores, turismo, pesca, estrada, eventos e atividades ao ar livre.'
    ),
    (
      'servicos-balsas',
      'Balsas',
      'Travessias no Lago de Furnas',
      'Rotas, horários, status, alertas e detalhes das balsas da região de Furnas.',
      '/balsas',
      '["balsa", "balsas", "travessia", "furnas", "lago de furnas", "horario balsa", "rota"]',
      'Página de balsas da região de Furnas. Mostra travessias, rotas, horários, status, alertas e detalhes úteis para deslocamento entre Carmo do Rio Claro e cidades próximas.'
    )
) as page(page_key, title, subtitle, description, url, keywords, content)
on conflict (city_id, page_key) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    description = excluded.description,
    url = excluded.url,
    module_key = excluded.module_key,
    keywords = excluded.keywords,
    content = excluded.content,
    active = excluded.active,
    updated_at = now();

insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
select 'site_page', id, city_id, 'upsert'
from public.site_pages
where active = true
on conflict (entity_type, entity_id) do update
set operation = 'upsert',
    city_id = excluded.city_id,
    processed_at = null,
    attempts = 0,
    last_error = null,
    enqueued_at = now(),
    updated_at = now();
