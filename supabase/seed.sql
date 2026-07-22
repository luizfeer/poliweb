-- ============================================================================
-- SEED — dados iniciais do MVP
-- Cidade-foco: Carmo do Rio Claro/MG (CRC). Demais cidades vêm em sprints futuras.
-- ============================================================================

-- ── Cidade ──────────────────────────────────────────────────────────────────

insert into cities (slug, name, state, status, timezone, lat, lng, population, ibge_code, about) values
  ('carmo-do-rio-claro', 'Carmo do Rio Claro', 'MG', 'active', 'America/Sao_Paulo',
   -20.9747, -46.1158, 21000, '3113503',
   'Carmo do Rio Claro fica no sul de Minas Gerais, banhada pela represa de Furnas, próxima à Serra da Canastra. Vocação turística ligada à pesca esportiva, balneários, gastronomia regional e cafeicultura.')
on conflict (slug) do nothing;

-- Cidade placeholder para teste de multi-tenancy (não publicada)
insert into cities (slug, name, state, status) values
  ('capitolio', 'Capitólio', 'MG', 'coming_soon')
on conflict (slug) do nothing;

-- ── Bairros de Carmo do Rio Claro ──────────────────────────────────────────
-- ATENÇÃO: lista preliminar — confirmar com prefeitura antes do launch.

with crc as (select id from cities where slug = 'carmo-do-rio-claro')
insert into districts (city_id, slug, name, zone, display_order)
select crc.id, slug, name, zone, n
from crc, (values
  ('centro',           'Centro',            'centro',  10),
  ('sao-jose',         'São José',          'centro',  20),
  ('alto-da-cruz',     'Alto da Cruz',      'norte',   30),
  ('santo-antonio',    'Santo Antônio',     'norte',   40),
  ('vila-nova',        'Vila Nova',         'norte',   50),
  ('jardim-aeroporto', 'Jardim Aeroporto',  'sul',     60),
  ('sao-pedro',        'São Pedro',         'sul',     70),
  ('cohab',            'Cohab',             'sul',     80),
  ('beira-rio',        'Beira Rio',         'leste',   90),
  ('zona-rural',       'Zona Rural',        'rural',  100)
) as d(slug, name, zone, n)
on conflict (city_id, slug) do nothing;

-- ── Módulos de Carmo ────────────────────────────────────────────────────────
-- Sprint 0: ads/transparency ficam cadastrados, mas entram desligados até terem
-- scraper, IA e inventário comercial prontos.

with crc as (select id from cities where slug = 'carmo-do-rio-claro')
insert into city_modules (city_id, module_key, enabled)
select crc.id, m.key, m.key not in ('transparency', 'ads')
from crc, modules m
on conflict (city_id, module_key) do update
set enabled = excluded.enabled;

-- Capitólio começa só com módulos turismo/utilidade (preview)
with cap as (select id from cities where slug = 'capitolio')
insert into city_modules (city_id, module_key, enabled)
select cap.id, key, key in ('utilities','tourism','events')
from cap, modules
on conflict (city_id, module_key) do update
set enabled = excluded.enabled;

-- ── Categorias globais de comércio (hierárquicas) ──────────────────────────

insert into business_categories (city_id, slug, name, parent_id, icon, display_order) values
  -- ROOT
  (null, 'alimentacao',         'Alimentação',           null, 'utensils-crossed', 10),
  (null, 'saude',               'Saúde',                 null, 'heart-pulse',      20),
  (null, 'beleza',              'Beleza e bem-estar',    null, 'sparkles',         30),
  (null, 'casa-e-construcao',   'Casa e construção',     null, 'hammer',           40),
  (null, 'veiculos',            'Veículos',              null, 'car',              50),
  (null, 'moda',                'Moda e acessórios',     null, 'shirt',            60),
  (null, 'servicos',            'Serviços',              null, 'briefcase',        70),
  (null, 'educacao',            'Educação',              null, 'graduation-cap',   80),
  (null, 'turismo-lazer',       'Turismo e lazer',       null, 'mountain',         90),
  (null, 'agro-rural',          'Agropecuária',          null, 'tractor',         100),
  (null, 'pets',                'Pets',                  null, 'paw-print',       110)
on conflict do nothing;

-- Subcategorias de Alimentação
with parent as (select id from business_categories where slug = 'alimentacao' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('restaurantes',       'Restaurantes',         10),
  ('lanchonetes',        'Lanchonetes',          20),
  ('pizzarias',          'Pizzarias',            30),
  ('padarias',           'Padarias e confeitarias', 40),
  ('bares',              'Bares',                50),
  ('cafeterias',         'Cafeterias',           60),
  ('mercados',           'Mercados e atacados',  70),
  ('acai-sorvetes',      'Açaí e sorveterias',   80),
  ('marmitarias',        'Marmitarias',          90)
) as t(slug, name, n)
on conflict do nothing;

-- Subcategorias de Saúde
with parent as (select id from business_categories where slug = 'saude' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('clinicas',           'Clínicas',             10),
  ('medicos',            'Médicos',              20),
  ('odontologia',        'Odontologia',          30),
  ('fisioterapia',       'Fisioterapia',         40),
  ('psicologia',         'Psicologia',           50),
  ('farmacias',          'Farmácias',            60),
  ('laboratorios',       'Laboratórios',         70),
  ('oticas',             'Óticas',               80)
) as t(slug, name, n)
on conflict do nothing;

-- Subcategorias de Beleza
with parent as (select id from business_categories where slug = 'beleza' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('saloes-cabelo',      'Salões de cabelo',     10),
  ('barbearias',         'Barbearias',           20),
  ('manicure',           'Manicure / pedicure',  30),
  ('estetica',           'Estética',             40),
  ('spa-massagem',       'Spa e massagem',       50)
) as t(slug, name, n)
on conflict do nothing;

-- Subcategorias de Casa e construção
with parent as (select id from business_categories where slug = 'casa-e-construcao' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('material-construcao','Material de construção',  10),
  ('marcenaria',         'Marcenaria',               20),
  ('serralheria',        'Serralheria',              30),
  ('eletricistas',       'Eletricistas',             40),
  ('encanadores',        'Encanadores',              50),
  ('pintores',           'Pintores',                 60),
  ('moveis-decoracao',   'Móveis e decoração',       70),
  ('jardinagem',         'Jardinagem',               80)
) as t(slug, name, n)
on conflict do nothing;

-- Subcategorias de Veículos
with parent as (select id from business_categories where slug = 'veiculos' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('concessionarias',    'Concessionárias',          10),
  ('oficinas',           'Oficinas mecânicas',       20),
  ('auto-pecas',         'Auto peças',               30),
  ('lava-jato',          'Lava-jato',                40),
  ('borracharias',       'Borracharias',             50),
  ('motos',              'Motos / motopeças',        60)
) as t(slug, name, n)
on conflict do nothing;

-- Subcategorias de Serviços
with parent as (select id from business_categories where slug = 'servicos' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('contabilidade',      'Contabilidade',            10),
  ('advocacia',          'Advocacia',                20),
  ('arquitetura',        'Arquitetura e engenharia', 30),
  ('imobiliaria',        'Imobiliárias',             40),
  ('limpeza',            'Limpeza',                  50),
  ('graficas',           'Gráficas',                 60),
  ('fotografia',         'Fotografia e filmagem',    70),
  ('eventos',            'Buffets e eventos',        80),
  ('transportes',        'Transportes',              90)
) as t(slug, name, n)
on conflict do nothing;

-- Subcategorias de Turismo e lazer
with parent as (select id from business_categories where slug = 'turismo-lazer' and city_id is null)
insert into business_categories (city_id, slug, name, parent_id, display_order)
select null, slug, name, parent.id, n
from parent, (values
  ('pousadas-hoteis',    'Pousadas e hotéis',         10),
  ('guias-turisticos',   'Guias turísticos',          20),
  ('aluguel-barcos',     'Aluguel de barcos',         30),
  ('passeios-pesca',     'Passeios e pesca',          40),
  ('academias',          'Academias',                 50)
) as t(slug, name, n)
on conflict do nothing;

-- ── Categorias de eventos (globais) ────────────────────────────────────────

insert into event_categories (city_id, slug, name, icon, display_order) values
  (null, 'cultural',     'Cultural',          'palette',         10),
  (null, 'religioso',    'Religioso',         'church',          20),
  (null, 'esportivo',    'Esportivo',         'trophy',          30),
  (null, 'gastronomico', 'Gastronômico',      'utensils',        40),
  (null, 'civico',       'Cívico',            'flag',            50),
  (null, 'rural',        'Rural / agro',      'tractor',         60),
  (null, 'infantil',     'Infantil',          'baby',            70)
on conflict do nothing;

-- ── Slots de anúncio padrão para Carmo ─────────────────────────────────────

with crc as (select id from cities where slug = 'carmo-do-rio-claro')
insert into ad_slots (city_id, key, description, width, height) select crc.id, key, descr, w, h from crc, (values
  ('home_top',       'Banner topo da home',                 970, 250),
  ('home_sidebar',   'Sidebar da home',                     300, 600),
  ('listing_inline', 'Card inline em listagens',            728,  90),
  ('category_top',   'Banner topo de páginas de categoria', 970, 250),
  ('property_card',  'Card patrocinado em listagem imóvel', 300, 250)
) as s(key, descr, w, h)
on conflict (city_id, key) do nothing;
