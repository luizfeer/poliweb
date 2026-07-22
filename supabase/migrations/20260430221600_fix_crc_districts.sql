-- ============================================================================
-- Migration: substitui bairros falsos de Carmo do Rio Claro pelos reais
-- Fonte: levantamento por prioridade comercial/prática (abr/2026)
-- ============================================================================

-- 1. Remove todos os bairros falsos da cidade
delete from districts
where city_id = (select id from cities where slug = 'carmo-do-rio-claro');

-- 2. Insere os 28 bairros reais (slugs sem acento, PT-BR)
with crc as (select id from cities where slug = 'carmo-do-rio-claro')
insert into districts (city_id, slug, name, zone, display_order)
select crc.id, slug, name, zone, display_order
from crc, (values
  ('centro',                          'Centro',                              'centro',   10),
  ('acampamento',                     'Acampamento',                         'norte',    20),
  ('rosario',                         'Rosário',                             'oeste',    30),
  ('porto',                           'Porto',                               'sul',      40),
  ('jardim-america',                  'Jardim América',                      'leste',    50),
  ('bela-vista',                      'Bela Vista',                          'sudeste',  60),
  ('sao-benedito',                    'São Benedito',                        'sul',      70),
  ('honduras',                        'Honduras',                            'sul',      80),
  ('porto-rico',                      'Porto Rico',                          'sudeste',  90),
  ('porto-rico-ii',                   'Porto Rico II',                       'sudeste', 100),
  ('planalto',                        'Planalto',                            'oeste',   110),
  ('planalto-ii',                     'Planalto II',                         'oeste',   120),
  ('jardim-oliveira',                 'Jardim Oliveira',                     'sudoeste', 130),
  ('oliveiras',                       'Oliveiras',                           'sudoeste', 140),
  ('jardim-nosso-senhor-dos-passos',  'Jardim Nosso Senhor dos Passos I',    'sul',     150),
  ('jardim-nosso-senhor-dos-passos-ii','Jardim Nosso Senhor dos Passos II',  'sul',     160),
  ('jardim-america-do-sul',           'Jardim América do Sul',               'leste',   170),
  ('jardim-europa',                   'Jardim Europa',                       'leste',   180),
  ('jardim-sao-lucas',                'Jardim São Lucas',                    'nordeste', 190),
  ('jacuba',                          'Jacuba',                              'noroeste', 200),
  ('coracao-eucaristico',             'Coração Eucarístico',                 'nordeste', 210),
  ('nossa-senhora-de-lourdes',        'Nossa Senhora de Lourdes',            'norte',   220),
  ('tres-barras',                     'Três Barras',                         'oeste',   230),
  ('campo-eliseos',                   'Campo Elíseos',                       'norte',   240),
  ('continental',                     'Continental',                         'nordeste', 250),
  ('ferreira',                        'Ferreira',                            'sul',     260),
  ('jardim-palmeiras',                'Jardim Palmeiras',                    'leste',   270),
  ('jardim-nossa-senhora-do-carmo',   'Jardim Nossa Senhora do Carmo',       'sul',     280)
) as d(slug, name, zone, display_order)
on conflict (city_id, slug) do update
  set name = excluded.name,
      zone = excluded.zone,
      display_order = excluded.display_order;
