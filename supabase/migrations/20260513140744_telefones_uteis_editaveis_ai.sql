-- Telefones úteis: campos editoriais, seed curado e indexação para IA/busca.

alter table public.emergency_contacts
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists source_type text not null default 'oficial',
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists needs_verification boolean not null default false,
  add column if not exists note text,
  add column if not exists when_to_use text,
  add column if not exists last_verified_at date,
  add column if not exists updated_at timestamptz default now();

drop trigger if exists trg_emergency_contacts_updated on public.emergency_contacts;
create trigger trg_emergency_contacts_updated
before update on public.emergency_contacts
for each row execute function public.set_updated_at();

create index if not exists idx_contacts_tags_gin on public.emergency_contacts using gin(tags);
create index if not exists idx_contacts_source_verification
  on public.emergency_contacts(city_id, needs_verification, source_type);

create or replace function public.enqueue_emergency_contact_indexing()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
    values ('emergency_contact', old.id, old.city_id, 'delete')
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
  values ('emergency_contact', new.id, new.city_id, case when new.active then 'upsert' else 'delete' end)
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

drop trigger if exists emergency_contacts_indexing on public.emergency_contacts;
create trigger emergency_contacts_indexing
after insert or update or delete on public.emergency_contacts
for each row execute function public.enqueue_emergency_contact_indexing();

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.emergency_contacts
where city_id = (select id from carmo)
  and category in ('emergencia', 'utilidade', 'prefeitura', 'saude')
  and name in (
    'Policia Militar',
    'Bombeiros',
    'Defesa Civil',
    'Prefeitura Municipal',
    'Secretaria de Saude',
    'Vigilancia Sanitaria',
    'Conselho Tutelar',
    'Cemig',
    'Copasa',
    'SAMU'
  );

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_contacts(category, name, phone, email, address, hours_legacy_text, short_dial, description, when_to_use, tags, source_type, needs_verification, note, display_order) as (
  values
    ('emergencia', 'Polícia Militar', '190', null, null, '24h', '190', 'Atendimento policial de emergência.', 'Crimes em andamento, ameaça, violência, acidentes com risco, perturbação grave ou necessidade de atendimento policial imediato.', '["polícia militar","emergência","segurança"]'::jsonb, 'oficial-estadual', false, null, 10),
    ('emergencia', 'SAMU', '192', null, null, '24h', '192', 'Atendimento móvel de urgência.', 'Emergências médicas, mal súbito, queda grave, acidente com feridos, infarto, AVC, desmaio ou risco à vida.', '["samu","emergência médica","saúde"]'::jsonb, 'servico-nacional', false, null, 20),
    ('emergencia', 'Corpo de Bombeiros', '193', null, null, '24h', '193', 'Incêndio, salvamento e resgate.', 'Incêndios, salvamentos, acidentes, afogamentos, captura de animais em situação de risco e resgates.', '["bombeiros","incêndio","resgate","salvamento"]'::jsonb, 'oficial-estadual', false, null, 30),
    ('emergencia', 'Defesa Civil', '199', null, null, '24h', '199', 'Riscos, chuvas fortes e desastres.', 'Alagamentos, deslizamentos, quedas de árvores, riscos estruturais e situações de desastre.', '["defesa civil","chuva","risco","desastre"]'::jsonb, 'oficial-estadual', false, null, 40),
    ('denuncia', 'Disque Denúncia', '181', null, null, '24h', '181', 'Denúncias anônimas de interesse policial.', 'Denúncias anônimas sobre crimes, tráfico, violência, armas, foragidos e informações de interesse policial.', '["denúncia anônima","segurança","crimes"]'::jsonb, 'oficial-estadual', false, null, 50),
    ('seguranca', 'Polícia Civil', '197', null, null, '24h', '197', 'Informações e acionamento da Polícia Civil.', 'Informações relacionadas à Polícia Civil e acionamento de serviços estaduais de segurança.', '["polícia civil","segurança"]'::jsonb, 'oficial-estadual', false, null, 60),

    ('prefeitura', 'Prefeitura Municipal de Carmo do Rio Claro', '(35) 3561-2000', 'contato@carmodorioclaro.mg.gov.br', 'Rua Delfim Moreira, 62 - Centro', 'Segunda a sexta, das 08h15 às 17h', null, 'Atendimento geral ao cidadão.', null, '["prefeitura","atendimento geral","cidadão"]'::jsonb, 'oficial', false, null, 100),
    ('prefeitura', 'Protocolo', '(35) 93618-0671', null, null, null, null, 'Protocolo e atendimento da Prefeitura.', null, '["protocolo","atendimento","prefeitura"]'::jsonb, 'oficial', false, null, 110),
    ('prefeitura', 'Ouvidoria Municipal', '(35) 3561-2000', 'ouvidoria@carmodorioclaro.mg.gov.br', 'Rua Delfim Moreira, 62', 'Das 8h às 17h', null, 'Canal para reclamações, sugestões e manifestações.', null, '["ouvidoria","reclamações","sugestões","prefeitura"]'::jsonb, 'oficial', false, null, 120),
    ('prefeitura', 'Departamento de Compras', '(35) 93618-0681', null, null, null, null, 'Atendimento a compras e fornecedores.', null, '["compras","prefeitura","fornecedores"]'::jsonb, 'oficial', false, null, 130),
    ('prefeitura', 'Departamento de Convênios', '(35) 93618-0811', null, null, null, null, 'Departamento municipal de convênios.', null, '["convênios","prefeitura"]'::jsonb, 'oficial', false, null, 140),
    ('prefeitura', 'Departamento de Licitações', '(35) 93618-0943', null, null, null, null, 'Licitações e atendimento a fornecedores.', null, '["licitações","prefeitura","fornecedores"]'::jsonb, 'oficial', false, null, 150),
    ('prefeitura', 'Recursos Humanos - RH', '(35) 99956-5524', null, null, null, null, 'Recursos humanos da Prefeitura.', null, '["rh","servidor público","prefeitura"]'::jsonb, 'oficial', false, null, 160),

    ('secretarias', 'Secretaria de Saúde', '(35) 93618-0923', 'sms@carmodorioclaro.mg.gov.br', 'Praça Jairo Reis, 115 - Centro', 'Das 07h às 16h', null, 'Secretaria Municipal de Saúde.', null, '["saúde","prefeitura","sus"]'::jsonb, 'oficial', false, null, 200),
    ('secretarias', 'Secretário Adjunto de Saúde', '(35) 3561-2162', 'saude@carmodorioclaro.mg.gov.br', 'Praça Jairo Reis, 115', 'Das 8h às 17h', null, 'Administração municipal de saúde.', null, '["saúde","administração","sus"]'::jsonb, 'oficial', false, null, 210),
    ('secretarias', 'Secretaria de Assistência Social', '(35) 92002-5620', 'acao.social@carmodorioclaro.mg.gov.br', 'Praça Tito Carlos Pereira, 35 - Centro', 'Das 8h às 17h', null, 'Assistência social, CRAS e benefícios.', null, '["assistência social","cras","benefícios"]'::jsonb, 'oficial', false, null, 220),
    ('secretarias', 'Secretaria de Obras e Serviços Públicos', '(35) 3561-2881', 'obras@carmodorioclaro.mg.gov.br', 'Rua Delfim Moreira, 66 - Centro', 'Das 8h às 17h', null, 'Obras, ruas, estradas e serviços públicos.', null, '["obras","serviços públicos","estradas","ruas"]'::jsonb, 'oficial', false, null, 230),
    ('secretarias', 'Secretário Adjunto de Obras e Serviços Públicos', '(35) 3561-2881', 'obras@carmodorioclaro.mg.gov.br', 'Rua José Pimenta Freire, 148', 'Das 7h às 16h', null, 'Administração de obras e serviços públicos.', null, '["obras","serviços públicos"]'::jsonb, 'oficial', false, null, 240),
    ('secretarias', 'Secretaria de Fazenda', '(35) 92002-5589', 'tributos@carmodorioclaro.mg.gov.br', 'Rua Delfim Moreira, 62', 'Das 08h às 17h', null, 'Tributos, IPTU, taxas e nota fiscal.', null, '["tributos","iptu","taxas","nota fiscal"]'::jsonb, 'oficial', false, null, 250),
    ('secretarias', 'Secretaria de Governo', '(35) 92002-5537', 'educacao@carmodorioclaro.mg.gov.br', 'Praça Dona Maria Goulart, 37', 'Das 08h às 17h', null, 'Secretaria de Governo.', null, '["governo","educação","prefeitura"]'::jsonb, 'oficial', false, null, 260),
    ('secretarias', 'Secretaria de Cultura e Turismo', '(35) 93618-0985', 'cultura@carmodorioclaro.mg.gov.br', 'Praça Maria Goulart, 37', 'Das 8h às 17h', null, 'Cultura, turismo e eventos.', null, '["turismo","cultura","eventos"]'::jsonb, 'oficial', false, null, 270),
    ('secretarias', 'Secretaria de Esportes e Lazer', '(35) 92002-5586', 'esporte@carmodorioclaro.mg.gov.br', 'Rua Irmãs da Providência', 'Das 08h às 17h', null, 'Esporte, lazer e eventos esportivos.', null, '["esporte","lazer","eventos esportivos"]'::jsonb, 'oficial', false, null, 280),
    ('secretarias', 'Secretaria de Agropecuária, Desenvolvimento Econômico e Piscicultura', '(35) 93618-0963', 'agropecuaria@carmodorioclaro.mg.gov.br', 'Praça Maria Goulart, 37', 'Das 8h às 17h', null, 'Agropecuária, desenvolvimento econômico e piscicultura.', null, '["agropecuária","desenvolvimento econômico","piscicultura"]'::jsonb, 'oficial', false, null, 290),
    ('secretarias', 'Secretaria de Administração', '(35) 93618-0719', 'administracao@carmodorioclaro.mg.gov.br', 'Rua Delfim Moreira, 62 - Centro', 'Das 8h às 17h', null, 'Administração municipal.', null, '["administração","prefeitura"]'::jsonb, 'oficial', false, null, 300),
    ('secretarias', 'Defesa Civil Municipal', '(35) 3561-2000', 'defesacivil@carmodorioclaro.mg.gov.br', 'Rua Padre José Risolias, 130 - Jardim América', 'Das 8h às 17h', null, 'Defesa Civil municipal.', null, '["defesa civil","chuva","emergência","risco"]'::jsonb, 'oficial', false, null, 310),

    ('saude', 'CAPS', '(35) 99839-3144', null, null, null, null, 'Centro de Atenção Psicossocial.', null, '["caps","saúde mental","sus"]'::jsonb, 'oficial', false, null, 400),
    ('saude', 'ESF Benedito de Deus - Acampamento', '(35) 93618-0625', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde","acampamento"]'::jsonb, 'oficial', false, null, 410),
    ('saude', 'ESF Casemiro Galdino Bueno - Bela Vista', '(35) 99997-8418', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde","bela vista"]'::jsonb, 'oficial', false, null, 420),
    ('saude', 'ESF Continental', '(35) 99957-9524', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde","continental"]'::jsonb, 'oficial', false, null, 430),
    ('saude', 'ESF Jaime Silva - Rosário', '(35) 99976-6434', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde","rosário"]'::jsonb, 'oficial', false, null, 440),
    ('saude', 'ESF José Vicente de Paulo - Porto', '(35) 92002-5582', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde","porto"]'::jsonb, 'oficial', false, null, 450),
    ('saude', 'ESF Pedro Antônio de Melo', '(35) 99961-3964', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde"]'::jsonb, 'oficial', false, null, 460),
    ('saude', 'ESF Vilelândia - Três Barras', '(35) 93618-1236', null, null, null, null, 'Estratégia Saúde da Família.', null, '["esf","saúde","vilelândia","três barras"]'::jsonb, 'oficial', false, null, 470),
    ('saude', 'UBS Geralda Carielo', '(35) 93618-1251', null, null, null, null, 'Unidade Básica de Saúde.', null, '["ubs","saúde","atendimento básico"]'::jsonb, 'oficial', false, null, 480),
    ('saude', 'Hospital São Vicente de Paulo - Pronto Atendimento', '(35) 99731-5379', null, null, null, null, 'Pronto atendimento hospitalar.', null, '["hospital","pronto atendimento","saúde"]'::jsonb, 'noticia-local', true, 'Número divulgado em notícia local como novo contato do hospital. Confirmar diretamente com o hospital antes de publicar como oficial.', 490),
    ('saude', 'Hospital São Vicente de Paulo - Portaria e Internações', '(35) 99731-7765', null, null, null, null, 'Portaria e internações hospitalares.', null, '["hospital","internações","portaria"]'::jsonb, 'noticia-local', true, 'Número divulgado em notícia local como novo contato do hospital. Confirmar diretamente com o hospital antes de publicar como oficial.', 500),
    ('saude', 'Hospital São Vicente de Paulo - Clínica', '(35) 98847-2046', null, null, null, null, 'Clínica do Hospital São Vicente de Paulo.', null, '["hospital","clínica","saúde"]'::jsonb, 'noticia-local', true, 'Número divulgado em notícia local como novo contato do hospital. Confirmar diretamente com o hospital antes de publicar como oficial.', 510),

    ('assistencia-social', 'CRAS', '(35) 92002-5620', null, null, null, null, 'Centro de Referência de Assistência Social.', null, '["cras","assistência social","cadúnico"]'::jsonb, 'oficial', false, null, 600),
    ('assistencia-social', 'Bolsa Família', '(35) 92002-5549', null, null, null, null, 'Bolsa Família e CadÚnico.', null, '["bolsa família","cadúnico","benefícios sociais"]'::jsonb, 'oficial', false, null, 610),
    ('assistencia-social', 'Gestão de Benefícios Socioassistenciais', '(35) 3561-2479', 'bolsafamiliacrc@yahoo.com.br', 'Praça Tito Carlos Pereira, 34 - Centro', 'Das 08h às 17h', null, 'Gestão de benefícios socioassistenciais.', null, '["bolsa família","cadúnico","benefícios"]'::jsonb, 'oficial', false, null, 620),

    ('seguranca-publica', 'Polícia Militar - Emergência', '190', null, null, '24h', '190', 'Emergência policial.', null, '["polícia militar","emergência","segurança"]'::jsonb, 'oficial-estadual', false, null, 700),
    ('seguranca-publica', 'Polícia Militar de Carmo do Rio Claro - contato local', '(35) 98408-2561', null, null, null, null, 'Canal adicional local da Polícia Militar.', null, '["polícia militar","contato local","segurança"]'::jsonb, 'noticia-local', true, 'Número divulgado em notícia local como canal adicional da PM. Manter o 190 como principal para emergência.', 710),
    ('seguranca-publica', 'Polícia Civil - Emergência/Informações', '197', null, null, '24h', '197', 'Polícia Civil e serviços estaduais de segurança.', null, '["polícia civil","segurança"]'::jsonb, 'oficial-estadual', false, null, 720),
    ('seguranca-publica', 'Delegacia de Polícia Civil - Carmo do Rio Claro', '(35) 3561-1313', null, 'Rua Professora Maria Peres, 158 - Jardim América', 'De 8h30 às 18h30', null, 'Delegacia de Polícia Civil no município.', null, '["delegacia","polícia civil","boletim de ocorrência"]'::jsonb, 'oficial-estadual', false, null, 730),
    ('seguranca-publica', 'Disque Denúncia Unificado', '181', null, null, '24h', '181', 'Denúncia anônima.', null, '["denúncia anônima","segurança","crimes"]'::jsonb, 'oficial-estadual', false, null, 740),

    ('servicos-estaduais', 'Cemig', '116', null, null, '24h', '116', 'Energia elétrica, falta de luz e atendimento Cemig.', null, '["energia","falta de luz","cemig"]'::jsonb, 'oficial-estadual', false, null, 800),
    ('servicos-estaduais', 'Copasa', '115', null, null, '24h', '115', 'Água, esgoto e atendimento Copasa.', null, '["água","esgoto","copasa"]'::jsonb, 'oficial-estadual', false, null, 810),
    ('servicos-estaduais', 'LigMinas / Governo de Minas', '155', null, null, null, '155', 'Informações de serviços do Governo de Minas.', null, '["governo de minas","informações estaduais"]'::jsonb, 'oficial-estadual', false, null, 820),
    ('servicos-estaduais', 'Ouvidoria Geral do Estado', '162', null, null, null, '162', 'Ouvidoria do Governo de Minas.', null, '["ouvidoria","estado","reclamações"]'::jsonb, 'oficial-estadual', false, null, 830),
    ('servicos-estaduais', 'INSS', '135', null, null, null, '135', 'INSS, aposentadoria e benefícios.', null, '["inss","aposentadoria","benefícios"]'::jsonb, 'oficial', false, null, 840),
    ('servicos-estaduais', 'Pessoas Desaparecidas', '0800-2828-197', null, null, null, null, 'Canal sobre pessoas desaparecidas.', null, '["desaparecidos","segurança"]'::jsonb, 'oficial-estadual', false, null, 850),

    ('turismo-cultura', 'Secretaria de Cultura e Turismo', '(35) 93618-0985', 'cultura@carmodorioclaro.mg.gov.br', 'Praça Maria Goulart, 37', 'Das 8h às 17h', null, 'Cultura, turismo, eventos e visitantes.', null, '["turismo","cultura","eventos","visitantes"]'::jsonb, 'oficial', false, null, 900),
    ('turismo-cultura', 'Museu MARI', '(35) 93618-1084', null, null, null, null, 'Museu MARI.', null, '["museu","turismo","cultura"]'::jsonb, 'oficial', false, null, 910),
    ('turismo-cultura', 'Divisão de Turismo e Patrimônio Histórico e Cultural', '(35) 3561-2881', 'imprensa@carmodorioclaro.mg.gov.br', 'Rua Delfim Moreira, 62', 'Das 8h às 17h', null, 'Turismo, patrimônio histórico e cultura.', null, '["turismo","patrimônio","cultura"]'::jsonb, 'oficial', false, null, 920)
)
insert into public.emergency_contacts (
  city_id,
  category,
  name,
  phone,
  email,
  address,
  hours_legacy_text,
  short_dial,
  description,
  when_to_use,
  tags,
  source_type,
  needs_verification,
  note,
  last_verified_at,
  display_order,
  active
)
select
  carmo.id,
  seed_contacts.category,
  seed_contacts.name,
  seed_contacts.phone,
  seed_contacts.email,
  seed_contacts.address,
  seed_contacts.hours_legacy_text,
  seed_contacts.short_dial,
  seed_contacts.description,
  seed_contacts.when_to_use,
  seed_contacts.tags,
  seed_contacts.source_type,
  seed_contacts.needs_verification,
  seed_contacts.note,
  date '2026-05-13',
  seed_contacts.display_order,
  true
from carmo
cross join seed_contacts
on conflict (city_id, category, name, phone) do update
set email = excluded.email,
    address = excluded.address,
    hours_legacy_text = excluded.hours_legacy_text,
    short_dial = excluded.short_dial,
    description = excluded.description,
    when_to_use = excluded.when_to_use,
    tags = excluded.tags,
    source_type = excluded.source_type,
    needs_verification = excluded.needs_verification,
    note = excluded.note,
    last_verified_at = excluded.last_verified_at,
    display_order = excluded.display_order,
    active = excluded.active,
    updated_at = now();

insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
select 'emergency_contact', id, city_id, 'upsert'
from public.emergency_contacts
where active
on conflict (entity_type, entity_id) do update
set operation = excluded.operation,
    city_id = excluded.city_id,
    processed_at = null,
    attempts = 0,
    last_error = null,
    enqueued_at = now();
