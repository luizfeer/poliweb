-- Seed: Guias de turismo de Carmo do Rio Claro (14 páginas)
-- Todos como 'draft' exceto onde indicado

DO $$
DECLARE
  v_city_id uuid;
BEGIN
  SELECT id INTO v_city_id FROM cities WHERE slug = 'carmo-do-rio-claro';
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'City carmo-do-rio-claro not found';
  END IF;

  -- 1. Conheça Carmo do Rio Claro
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, featured, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'conheca-carmo-do-rio-claro',
    array['carmo-do-rio-claro', 'conheca-carmo', 'turismo-em-carmo-do-rio-claro'],
    'cidade',
    'Conheça Carmo do Rio Claro',
    'Uma cidade cercada pelo Lago de Furnas, marcada pela fé, pelo artesanato, pelos doces, pelas cachoeiras e pela hospitalidade mineira.',
    E'Carmo do Rio Claro reúne natureza, cultura, fé, gastronomia e tradição em um só lugar.\nBanhada pelo Lago de Furnas, a cidade atrai visitantes para pesca esportiva, passeios, cachoeiras, mirantes, eventos e experiências no interior mineiro.\nO município também é conhecido pelo artesanato em tear manual e pelos doces de frutas feitos artesanalmente.',
    '/images/carmo/lago-furnas-carmo.jpg',
    'draft', true,
    '{"title":"Conheça Carmo do Rio Claro | Guia de turismo, Lago de Furnas e atrações","description":"Guia completo para conhecer Carmo do Rio Claro: Lago de Furnas, Itaci, Serra da Tormenta, cachoeiras, artesanato, doces, eventos, pesca e turismo religioso.","keywords":["Carmo do Rio Claro","turismo em Carmo do Rio Claro","Lago de Furnas","Mar de Minas","Itaci","Serra da Tormenta","cachoeiras em Carmo do Rio Claro","artesanato em Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"waves","title":"Lago de Furnas","description":"O grande cartão-postal da cidade, ideal para pesca, passeios, contemplação e turismo de descanso."},{"icon":"mountain","title":"Serra da Tormenta","description":"Mirante natural com vista privilegiada, trilhas e prática de voo livre."},{"icon":"star","title":"Artesanato e doces","description":"Tradição local com tear manual, doces bordados e produtos típicos."},{"icon":"church","title":"Fé e tradição","description":"Turismo religioso com festas, capelas, romarias e manifestações culturais."}]'::jsonb,
    '[{"id":"atracoes","title":"Principais atrações","subtitle":"Carmo do Rio Claro tem atrações para quem busca natureza, cultura, fé e descanso.","items":[{"title":"Lago de Furnas","description":"Paisagens abertas, pesca esportiva, passeios de barco e cenários ideais para fotos.","image":"/images/carmo/lago-de-furnas.jpg","tags":["Natureza","Pesca","Passeios"]},{"title":"Itaci","description":"Distrito às margens do lago, conhecido pela balsa, pelo Santuário do Bom Jesus dos Aflitos e pela festa tradicional de agosto.","image":"/images/itaci/itaci.jpg","tags":["Distrito","Balsa","Fé"]},{"title":"Cachoeiras","description":"A cidade possui cachoeiras e piscinas naturais procuradas para lazer, banho e contato com a natureza.","image":"/images/carmo/cachoeiras.jpg","tags":["Natureza","Banho","Trilha"]},{"title":"Artesanato e doces","description":"Tradição local com peças de tear, doces em compota, doces cristalizados e produtos típicos.","image":"/images/carmo/artesanato-doces.jpg","tags":["Cultura","Compras","Tradição"]},{"title":"Museu Arqueológico","description":"Espaço cultural dedicado ao acervo arqueológico indígena da região.","image":"/images/carmo/museu-arqueologico.jpg","tags":["Cultura","História","Museu"]}]}]'::jsonb,
    '[{"title":"Planeje seu roteiro","text":"Separe pelo menos um fim de semana para conhecer lago, centro, artesanato, Serra da Tormenta e Itaci."},{"title":"Confirme horários","text":"Horários de balsas, museus, eventos e atrativos podem mudar conforme época do ano."},{"title":"Leve dinheiro em espécie","text":"Alguns pequenos comércios, festas e pontos rurais podem não aceitar cartão em todos os momentos."}]'::jsonb,
    '[{"question":"Onde fica Carmo do Rio Claro?","answer":"Carmo do Rio Claro fica no Sul de Minas Gerais, em uma região banhada pelo Lago de Furnas."},{"question":"O que fazer em Carmo do Rio Claro?","answer":"Você pode conhecer o Lago de Furnas, Itaci, Serra da Tormenta, cachoeiras, museus, artesanato, doces, eventos e pontos de turismo religioso."},{"question":"Carmo do Rio Claro é bom para fim de semana?","answer":"Sim. A cidade combina natureza, descanso, gastronomia e atrações culturais, sendo uma boa opção para roteiro de 1 ou 2 dias."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 2. Festa do Bom Jesus dos Aflitos em Itaci
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, featured, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'festa-do-bom-jesus-dos-aflitos-itaci',
    array['festa-do-itaci', 'bom-jesus-dos-aflitos', 'festa-bom-jesus-itaci'],
    'tematico',
    'Festa do Senhor Bom Jesus dos Aflitos',
    'Uma das celebrações religiosas mais tradicionais de Carmo do Rio Claro, reunindo romeiros, moradores e visitantes no distrito de Itaci.',
    E'A Festa do Senhor Bom Jesus dos Aflitos acontece tradicionalmente em torno do dia 6 de agosto, no distrito de Itaci.\nA celebração reúne momentos de fé, romaria, missas, procissão, barracas e grande movimentação de visitantes.\nDurante o período da festa, a balsa e os acessos ao distrito podem ter operação especial por causa do aumento do fluxo de pessoas.',
    '/images/itaci/festa-bom-jesus-dos-aflitos.jpg',
    'draft', true,
    '{"title":"Festa do Bom Jesus dos Aflitos em Itaci | Data, tradição e dicas","description":"Guia da tradicional Festa do Senhor Bom Jesus dos Aflitos, realizada em Itaci, distrito de Carmo do Rio Claro, com romaria, missas, procissão e barracas.","keywords":["Festa do Bom Jesus dos Aflitos","Festa do Itaci","Itaci","Carmo do Rio Claro","romaria Itaci","Bom Jesus dos Aflitos Itaci"]}'::jsonb,
    '[{"icon":"camera","title":"Data principal","description":"A festa acontece em torno do dia 6 de agosto."},{"icon":"church","title":"Santuário","description":"O Santuário do Bom Jesus dos Aflitos é o centro da celebração."},{"icon":"star","title":"Romaria","description":"A festa recebe moradores, turistas e romeiros da região."},{"icon":"ship","title":"Balsa","description":"Em dias de maior movimento, a travessia pode ter operação especial."}]'::jsonb,
    '[{"id":"programacao","title":"O que costuma ter na festa","subtitle":"A programação pode variar a cada ano, mas geralmente reúne celebrações religiosas e movimento popular.","items":[{"title":"Novena preparatória","description":"Período de preparação religiosa antes do dia principal da festa.","tags":[]},{"title":"Missas e bênçãos","description":"Celebrações religiosas ao longo do dia, especialmente no dia 6 de agosto.","tags":[]},{"title":"Procissão","description":"Momento tradicional que reúne fiéis e romeiros no distrito.","tags":[]},{"title":"Barracas e comércio local","description":"Durante a festa, o distrito recebe barracas com alimentos, produtos diversos e artigos religiosos.","tags":[]}]},{"id":"dicas","title":"Dicas para quem vai","subtitle":"Planeje a visita com antecedência para evitar imprevistos.","items":[{"title":"Chegue cedo","description":"No dia principal, o fluxo de pessoas e veículos costuma ser maior.","tags":[]},{"title":"Confira a balsa","description":"Consulte horários e possíveis operações especiais antes de sair.","tags":[]},{"title":"Leve dinheiro em espécie","description":"Algumas barracas e pequenos vendedores podem não aceitar cartão.","tags":[]},{"title":"Use roupa confortável","description":"A festa envolve caminhada, filas e permanência ao ar livre.","tags":[]}]}]'::jsonb,
    '[{"title":"Local","text":"Distrito de Itaci, Carmo do Rio Claro - MG."},{"title":"Data principal","text":"6 de agosto."},{"title":"Acesso","text":"Saindo de Carmo do Rio Claro, o acesso ao distrito envolve travessia de balsa."}]'::jsonb,
    '[{"question":"Quando acontece a Festa do Bom Jesus dos Aflitos?","answer":"A data principal é 6 de agosto, mas a programação pode começar antes, com novena e celebrações preparatórias."},{"question":"A festa acontece onde?","answer":"A festa acontece no distrito de Itaci, em Carmo do Rio Claro, próximo ao Santuário do Senhor Bom Jesus dos Aflitos."},{"question":"Precisa usar balsa para chegar?","answer":"Para quem sai de Carmo do Rio Claro, o acesso ao distrito normalmente envolve travessia de balsa pelo Lago de Furnas."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 3. Cachoeiras em Carmo do Rio Claro
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'cachoeiras-em-carmo-do-rio-claro',
    array['cachoeiras-carmo-do-rio-claro', 'cachoeiras-em-carmo', 'banho-de-cachoeira-carmo'],
    'tematico',
    'Cachoeiras em Carmo do Rio Claro',
    'Um guia para explorar quedas d''água, piscinas naturais, trilhas leves e paisagens de natureza no entorno do Lago de Furnas.',
    E'Carmo do Rio Claro possui cachoeiras, piscinas naturais e paisagens que combinam bem com roteiros de descanso e aventura leve.\nAlgumas cachoeiras ficam em áreas rurais ou propriedades privadas, por isso é importante confirmar acesso, valores e condições antes da visita.\nA melhor experiência acontece com planejamento: conferir estrada, clima, nível de água e regras de preservação.',
    '/images/carmo/cachoeira-carmo-do-rio-claro.jpg',
    'draft',
    '{"title":"Cachoeiras em Carmo do Rio Claro | Guia de natureza e banho","description":"Conheça cachoeiras e áreas naturais de Carmo do Rio Claro, com dicas de acesso, melhor época, cuidados, trilhas e pontos para banho.","keywords":["cachoeiras em Carmo do Rio Claro","Cachoeira Água Limpa","Cachoeira Pedra Molhada","Cachoeira do Mateus","Cachoeira do Poção","turismo de natureza Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"waves","title":"Água e natureza","description":"Opções para banho, fotos e descanso em meio à paisagem rural."},{"icon":"landmark","title":"Acesso rural","description":"Muitos pontos podem envolver estrada de terra ou trilhas curtas."},{"icon":"sun","title":"Melhor época","description":"Dias quentes favorecem o banho, mas é importante evitar chuva forte."},{"icon":"star","title":"Segurança","description":"Atenção a pedras escorregadias, correnteza, chuva e áreas sem estrutura."}]'::jsonb,
    '[{"id":"lista","title":"Cachoeiras e áreas naturais","subtitle":"Lista inicial para montar o guia. Confirme acesso e funcionamento antes de publicar detalhes definitivos.","items":[{"title":"Cachoeira da Água Limpa","description":"Uma das referências naturais citadas em roteiros turísticos da cidade.","image":"/images/carmo/cachoeira-agua-limpa.jpg","tags":["Natureza","Rural"]},{"title":"Parque Pedra Molhada","description":"Área associada a sequência de cachoeiras e piscinas naturais.","image":"/images/carmo/pedra-molhada.jpg","tags":["Cachoeira","Piscinas naturais"]},{"title":"Cachoeira do Mateus","description":"Ponto natural citado entre as cachoeiras de Carmo do Rio Claro.","image":"/images/carmo/cachoeira-do-mateus.jpg","tags":["Banho","Natureza"]},{"title":"Cachoeira do Poção","description":"Opção para quem busca natureza e banho em área rural.","image":"/images/carmo/cachoeira-do-pocao.jpg","tags":["Banho","Rural"]},{"title":"Cachoeira da Alegria","description":"Atrativo natural citado em listas de turismo da cidade.","image":"/images/carmo/cachoeira-da-alegria.jpg","tags":["Natureza","Passeio"]},{"title":"Aterro Santa Quitéria","description":"Região citada entre os pontos naturais de Carmo do Rio Claro.","image":"/images/carmo/aterro-santa-quiteria.jpg","tags":["Natureza","Paisagem"]}]}]'::jsonb,
    '[{"title":"Confirme se o acesso é permitido","text":"Algumas cachoeiras podem estar em propriedade particular ou ter controle de entrada."},{"title":"Evite dias de chuva forte","text":"Chuva pode aumentar correnteza e risco de tromba d''água."},{"title":"Vá com calçado adequado","text":"Pedras molhadas e trilhas podem escorregar."},{"title":"Não deixe lixo","text":"Leve tudo de volta e preserve o ambiente."}]'::jsonb,
    '[{"question":"Tem cachoeiras em Carmo do Rio Claro?","answer":"Sim. A cidade tem cachoeiras e áreas naturais citadas em roteiros turísticos, como Água Limpa, Pedra Molhada, Mateus, Poção e outras."},{"question":"As cachoeiras são gratuitas?","answer":"Depende do local. Algumas podem estar em áreas particulares ou exigir autorização. Confirme antes de ir."},{"question":"Qual a melhor época para visitar cachoeiras?","answer":"Dias quentes são melhores para banho, mas evite períodos de chuva forte por segurança."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 4. Artesanato e doces
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'artesanato-e-doces-de-carmo-do-rio-claro',
    array['artesanato-carmo-do-rio-claro', 'doces-de-carmo-do-rio-claro', 'doces-bordados-carmo'],
    'tematico',
    'Artesanato e doces de Carmo do Rio Claro',
    'Tear manual, doces de frutas, conservas artesanais e peças que contam a identidade cultural da cidade.',
    E'Carmo do Rio Claro é conhecida pela tradição do artesanato em tear manual e pelos doces de frutas preparados artesanalmente.\nAs peças de tecelagem, os doces em compota, os doces cristalizados e os famosos desenhos feitos manualmente nas conservas fazem parte da identidade local.\nEssa página pode funcionar como vitrine cultural e também como guia para quem deseja comprar lembranças, presentes e produtos típicos.',
    '/images/carmo/artesanato-doces-carmo.jpg',
    'draft',
    '{"title":"Artesanato e doces de Carmo do Rio Claro | Tradição mineira","description":"Conheça o artesanato em tear manual, os doces de frutas, doces bordados e produtos típicos de Carmo do Rio Claro.","keywords":["artesanato Carmo do Rio Claro","doces de Carmo do Rio Claro","doces bordados","tear manual","Associação dos Artesãos de Carmo do Rio Claro","produtos típicos Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"star","title":"Tear manual","description":"Peças decorativas, vestuário e produtos artesanais feitos com tradição."},{"icon":"star","title":"Doces de frutas","description":"Compotas, doces cristalizados e conservas com apresentação artesanal."},{"icon":"star","title":"Lembranças","description":"Produtos típicos para levar de presente ou recordar a viagem."},{"icon":"landmark","title":"Compra local","description":"Valorize artesãos, produtores e pequenos negócios da cidade."}]'::jsonb,
    '[{"id":"tradicao","title":"Tradições locais","subtitle":"O artesanato e os doces são parte importante da memória e da economia criativa da cidade.","items":[{"title":"Artesanato em tear","description":"Peças produzidas em tear manual, com tradição passada por gerações.","image":"/images/carmo/tear-manual.jpg","tags":["Tear","Artesanato","Cultura"]},{"title":"Doces bordados","description":"Doces de frutas em conservas e compotas com desenhos feitos manualmente.","image":"/images/carmo/doces-bordados.jpg","tags":["Doces","Tradição","Gastronomia"]},{"title":"Produtos típicos","description":"Além dos doces e teares, a cidade também se destaca por sabores mineiros, queijos, cachaças e produção local.","image":"/images/carmo/produtos-tipicos.jpg","tags":["Compras","Gastronomia","Minas"]}]},{"id":"onde-comprar","title":"Onde comprar","subtitle":"Espaço para listar lojas, associações, produtores e ateliês locais.","items":[{"title":"Associação dos Artesãos","description":"Ponto ideal para encontrar peças de artesanato local e conhecer produtores da cidade.","tags":[]},{"title":"Lojas de doces e produtos típicos","description":"Cadastre produtores e comércios locais que vendem doces, compotas, queijos, cachaças e lembranças.","tags":[]}]}]'::jsonb,
    '[{"title":"Prefira produtos locais","text":"Comprar direto dos artesãos e produtores ajuda a fortalecer a economia da cidade."},{"title":"Confira validade e transporte","text":"No caso dos doces, veja validade, embalagem e melhor forma de levar na viagem."},{"title":"Pergunte sobre encomendas","text":"Alguns artesãos e doceiros podem trabalhar sob encomenda."}]'::jsonb,
    '[{"question":"Carmo do Rio Claro é conhecida por qual artesanato?","answer":"A cidade é conhecida por trabalhos em tear manual e peças artesanais ligadas à tradição local."},{"question":"O que são doces bordados?","answer":"São doces de frutas em compotas ou conservas com desenhos feitos manualmente, tornando cada vidro uma peça única."},{"question":"Onde comprar artesanato em Carmo?","answer":"A página deve listar associação, lojas, ateliês e produtores locais após validação dos dados atualizados."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 5. Onde comer
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'onde-comer-em-carmo-do-rio-claro',
    array['restaurantes-em-carmo-do-rio-claro', 'onde-almocar-em-carmo', 'comida-em-carmo-do-rio-claro'],
    'tematico',
    'Onde comer em Carmo do Rio Claro',
    'Restaurantes, bares, lanchonetes, cafés e sabores mineiros para completar sua visita à cidade.',
    E'Carmo do Rio Claro combina turismo com boa comida: pratos mineiros, peixes, lanches, doces, cafés, sorvetes e opções familiares.\nEsta página pode funcionar como guia comercial, reunindo estabelecimentos por categoria, localização, horário e contato.\nMantenha os dados atualizados para ajudar visitantes a escolher onde almoçar, jantar ou fazer uma parada rápida.',
    '/images/carmo/gastronomia-carmo.jpg',
    'draft',
    '{"title":"Onde comer em Carmo do Rio Claro | Restaurantes, bares e comida mineira","description":"Guia de restaurantes, lanchonetes, bares, cafés, sorveterias e opções de comida mineira em Carmo do Rio Claro.","keywords":["onde comer em Carmo do Rio Claro","restaurantes Carmo do Rio Claro","comida mineira Carmo do Rio Claro","bares em Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"star","title":"Comida mineira","description":"Pratos caseiros, almoço tradicional e sabores do interior."},{"icon":"fish","title":"Peixes","description":"Boa categoria para destacar restaurantes próximos ao Lago de Furnas."},{"icon":"star","title":"Cafés e doces","description":"Paradas rápidas para café, sobremesa e produtos típicos."},{"icon":"landmark","title":"Perto de você","description":"Organize por centro, lago, Itaci, estrada e bairros."}]'::jsonb,
    '[{"id":"opcoes","title":"Categorias","subtitle":"Organize os estabelecimentos por tipo para facilitar a busca.","items":[{"title":"Restaurantes","description":"Locais para almoço, jantar, comida mineira, pratos feitos e refeições em família.","tags":[]},{"title":"Bares e porções","description":"Opções para fim de tarde, encontro com amigos e petiscos.","tags":[]},{"title":"Lanchonetes e hamburguerias","description":"Lanches, hambúrgueres, açaí, salgados e refeições rápidas.","tags":[]},{"title":"Cafés, padarias e doces","description":"Café da manhã, doces, pães, sobremesas e produtos típicos.","tags":[]},{"title":"Perto do lago","description":"Opções próximas ao Lago de Furnas, ideais para quem está em passeio.","tags":[]}]}]'::jsonb,
    '[{"title":"Confira o horário","text":"Antes de sair, confirme se o local está aberto."},{"title":"Veja se precisa reservar","text":"Em fins de semana, feriados e eventos, alguns locais podem lotar."},{"title":"Atualize contatos","text":"Mantenha telefone, WhatsApp, Instagram e endereço sempre revisados."}]'::jsonb,
    '[{"question":"Tem comida mineira em Carmo do Rio Claro?","answer":"Sim. A cidade tem opções de comida caseira, pratos mineiros, doces e produtos típicos."},{"question":"Tem restaurante perto do Lago de Furnas?","answer":"A página pode listar opções próximas ao lago, mas é importante confirmar funcionamento e endereço antes de publicar."},{"question":"Posso cadastrar meu restaurante?","answer":"Sim. O ideal é ter uma página ou formulário para cadastro de estabelecimentos locais."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 6. Onde ficar
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'onde-ficar-em-carmo-do-rio-claro',
    array['hospedagem-em-carmo-do-rio-claro', 'pousadas-em-carmo-do-rio-claro', 'hoteis-em-carmo-do-rio-claro'],
    'tematico',
    'Onde ficar em Carmo do Rio Claro',
    'Encontre opções para dormir no centro, perto do lago, na zona rural ou em regiões próximas a Itaci.',
    E'Quem visita Carmo do Rio Claro pode buscar hospedagem no centro, em pousadas rurais, em áreas próximas ao Lago de Furnas ou em regiões de acesso a Itaci.\nA melhor escolha depende do objetivo da viagem: descanso, pesca, evento, festa religiosa, turismo em família ou roteiro de fim de semana.\nEsta página deve funcionar como um diretório atualizado de hospedagens, com filtros por região, estrutura e contato.',
    '/images/carmo/hospedagem-carmo.jpg',
    'draft',
    '{"title":"Onde ficar em Carmo do Rio Claro | Pousadas, hotéis e casas de temporada","description":"Guia de hospedagem em Carmo do Rio Claro: pousadas, hotéis, chalés, casas de temporada e opções próximas ao Lago de Furnas e Itaci.","keywords":["onde ficar em Carmo do Rio Claro","pousadas em Carmo do Rio Claro","hotéis em Carmo do Rio Claro","chalés Lago de Furnas","hospedagem em Itaci"]}'::jsonb,
    '[{"icon":"landmark","title":"Centro","description":"Boa opção para quem quer praticidade, comércio e restaurantes próximos."},{"icon":"waves","title":"Perto do lago","description":"Ideal para pesca, descanso, barco e paisagens de Furnas."},{"icon":"tree","title":"Zona rural","description":"Opções para quem busca silêncio, natureza e experiência de interior."},{"icon":"church","title":"Próximo a Itaci","description":"Boa escolha para quem vai à festa ou quer visitar o distrito."}]'::jsonb,
    '[{"id":"opcoes","title":"Tipos de hospedagem","subtitle":"Organize a página por categorias para facilitar a escolha do visitante.","items":[{"title":"Hotéis e pousadas no centro","description":"Para quem quer ficar próximo a restaurantes, comércio, serviços e saída para os principais atrativos.","tags":[]},{"title":"Pousadas próximas ao Lago de Furnas","description":"Para quem busca descanso, pesca, paisagem e contato com a água.","tags":[]},{"title":"Hospedagem em Itaci ou arredores","description":"Opções úteis para quem quer visitar o distrito ou participar da Festa do Bom Jesus dos Aflitos.","tags":[]},{"title":"Chalés e casas de temporada","description":"Boa opção para famílias, grupos e visitantes que desejam mais privacidade.","tags":[]}]}]'::jsonb,
    '[{"title":"Para eventos, reserve antes","text":"Datas como festas, rodeio e feriados podem aumentar a procura por hospedagem."},{"title":"Confira a distância real","text":"Veja no mapa se a hospedagem fica no centro, perto do lago ou em área rural."},{"title":"Pergunte sobre estrada","text":"Algumas opções podem envolver estrada de terra ou acesso mais distante."}]'::jsonb,
    '[{"question":"Onde é melhor ficar em Carmo do Rio Claro?","answer":"Depende do roteiro. O centro é mais prático; áreas próximas ao Lago de Furnas são melhores para descanso, pesca e paisagem."},{"question":"Tem hospedagem perto de Itaci?","answer":"Pode haver opções no distrito e arredores, mas os dados devem ser confirmados antes da publicação."},{"question":"Precisa reservar com antecedência?","answer":"Em feriados, festas e eventos, é recomendável reservar antes."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 7. Roteiro de 1 dia
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'roteiro-de-1-dia-em-carmo-do-rio-claro',
    array['1-dia-em-carmo-do-rio-claro', 'bate-volta-carmo-do-rio-claro', 'o-que-fazer-em-carmo-em-1-dia'],
    'roteiro',
    'Roteiro de 1 dia em Carmo do Rio Claro',
    'Um plano simples para conhecer um pouco da cidade, provar sabores locais e terminar o dia com uma bela paisagem.',
    E'Mesmo em um único dia, é possível ter uma boa impressão de Carmo do Rio Claro.\nEste roteiro combina centro, gastronomia, artesanato, Lago de Furnas e um ponto de contemplação.\nOs horários são sugestões e devem ser ajustados conforme clima, funcionamento dos atrativos e tempo de deslocamento.',
    '/images/carmo/roteiro-1-dia.jpg',
    'draft',
    '{"title":"Roteiro de 1 dia em Carmo do Rio Claro | O que fazer em um bate-volta","description":"Sugestão de roteiro de 1 dia em Carmo do Rio Claro com centro, artesanato, Lago de Furnas, mirante, gastronomia e pôr do sol.","keywords":["roteiro de 1 dia em Carmo do Rio Claro","bate-volta Carmo do Rio Claro","o que fazer em Carmo do Rio Claro em 1 dia"]}'::jsonb,
    '[{"icon":"star","title":"Duração","description":"Ideal para bate-volta ou passagem rápida pela cidade."},{"icon":"camera","title":"Fotos","description":"Inclui pontos com boa paisagem e registros turísticos."},{"icon":"star","title":"Comida local","description":"Inclua almoço mineiro, doces ou café no roteiro."},{"icon":"star","title":"Lembranças","description":"Separe um tempo para artesanato e produtos típicos."}]'::jsonb,
    '[{"id":"roteiro","title":"Sugestão de roteiro","subtitle":"Adapte os horários conforme sua chegada e preferências.","items":[{"title":"08h30 — Chegada e café da manhã","description":"Comece pelo centro, escolha uma padaria ou café e organize o dia.","tags":[]},{"title":"09h30 — Centro e pontos culturais","description":"Passeie pela área central, igrejas, praças e pontos históricos.","tags":[]},{"title":"10h30 — Artesanato e doces","description":"Visite lojas, associação de artesãos ou produtores locais para conhecer tear manual e doces típicos.","tags":[]},{"title":"12h00 — Almoço mineiro","description":"Escolha um restaurante local e prove comida caseira, peixes ou pratos típicos.","tags":[]},{"title":"14h00 — Lago de Furnas ou Itaci","description":"Siga para uma área com vista para o lago ou faça um passeio até a região de Itaci, se houver tempo.","tags":[]},{"title":"16h30 — Mirante ou Serra da Tormenta","description":"Se o acesso estiver bom, finalize com uma vista panorâmica.","tags":[]},{"title":"18h00 — Pôr do sol e retorno","description":"Termine o dia com fotos e uma parada tranquila antes de voltar.","tags":[]}]}]'::jsonb,
    '[{"title":"Saia cedo","text":"Quanto mais cedo chegar, melhor será o aproveitamento do dia."},{"title":"Confira funcionamento","text":"Museus, lojas e atrativos podem ter horários específicos."},{"title":"Escolha poucos pontos","text":"Em um dia, é melhor conhecer menos lugares com calma do que correr demais."}]'::jsonb,
    '[{"question":"Dá para conhecer Carmo do Rio Claro em 1 dia?","answer":"Dá para conhecer uma parte da cidade, especialmente centro, gastronomia, artesanato e algum ponto de paisagem."},{"question":"Vale incluir Itaci no roteiro de 1 dia?","answer":"Sim, se você sair cedo e confirmar os horários da balsa. Caso contrário, pode ser melhor deixar Itaci para um roteiro de fim de semana."},{"question":"Qual o melhor horário para fotos?","answer":"O começo da manhã e o fim da tarde costumam render melhores fotos."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 8. Roteiro de fim de semana
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'roteiro-de-fim-de-semana-em-carmo-do-rio-claro',
    array['fim-de-semana-em-carmo-do-rio-claro', 'roteiro-2-dias-carmo', 'o-que-fazer-em-carmo-no-fim-de-semana'],
    'roteiro',
    'Fim de semana em Carmo do Rio Claro',
    'Um roteiro de 2 dias para aproveitar lago, cultura, comida mineira, Itaci, balsa, paisagens e descanso.',
    E'Um fim de semana permite conhecer melhor Carmo do Rio Claro, sem pressa.\nA sugestão combina chegada, comida local, Lago de Furnas, Itaci, balsa, artesanato, Serra da Tormenta e, se possível, cachoeiras.\nO roteiro pode ser adaptado para casais, famílias, grupos de amigos ou visitantes em eventos.',
    '/images/carmo/roteiro-fim-de-semana.jpg',
    'draft',
    '{"title":"Roteiro de fim de semana em Carmo do Rio Claro | Guia de 2 dias","description":"Roteiro de fim de semana em Carmo do Rio Claro com Lago de Furnas, Itaci, balsa, artesanato, gastronomia, Serra da Tormenta e cachoeiras.","keywords":["roteiro fim de semana Carmo do Rio Claro","2 dias em Carmo do Rio Claro","o que fazer em Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"camera","title":"2 dias","description":"Ideal para quem quer conhecer mais do que apenas o centro."},{"icon":"ship","title":"Itaci e balsa","description":"Inclui uma experiência clássica da região."},{"icon":"mountain","title":"Paisagens","description":"Mirantes, lago, serra e natureza."},{"icon":"star","title":"Gastronomia","description":"Tempo para almoço, jantar, café e doces típicos."}]'::jsonb,
    '[{"id":"roteiro","title":"Sugestão de roteiro","subtitle":"Organize seu fim de semana com tempo para passear e descansar.","items":[{"title":"Sexta-feira — Chegada e jantar","description":"Chegue com calma, faça check-in e escolha um restaurante ou lanche no centro.","tags":[]},{"title":"Sábado de manhã — Centro, artesanato e doces","description":"Conheça o centro, visite lojas de artesanato e experimente doces típicos.","tags":[]},{"title":"Sábado à tarde — Lago de Furnas e Itaci","description":"Siga para a região do lago e, se os horários permitirem, faça a travessia para Itaci.","tags":[]},{"title":"Sábado fim de tarde — Pôr do sol","description":"Escolha um ponto com vista para o Lago de Furnas ou para a serra.","tags":[]},{"title":"Domingo de manhã — Serra da Tormenta ou cachoeira","description":"Escolha uma experiência de natureza conforme clima, acesso e tempo disponível.","tags":[]},{"title":"Domingo almoço — Almoço mineiro e retorno","description":"Finalize com comida local antes de voltar para casa.","tags":[]}]}]'::jsonb,
    '[{"title":"Reserve hospedagem","text":"Em feriados e eventos, a procura pode aumentar."},{"title":"Confirme a balsa","text":"Se Itaci estiver no roteiro, consulte horários atualizados."},{"title":"Tenha plano B","text":"Em caso de chuva, priorize centro, gastronomia, museu, artesanato e pontos cobertos."}]'::jsonb,
    '[{"question":"O que fazer em Carmo do Rio Claro em 2 dias?","answer":"Você pode conhecer o centro, artesanato, doces, Lago de Furnas, Itaci, balsa, Serra da Tormenta e alguma cachoeira."},{"question":"É melhor ficar no centro ou perto do lago?","answer":"O centro é mais prático para serviços e restaurantes. Perto do lago é melhor para descanso, pesca e paisagem."},{"question":"Dá para ir com crianças?","answer":"Sim, mas escolha pontos de fácil acesso e confirme segurança em cachoeiras, estradas e áreas próximas à água."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 9. Pesca esportiva
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'pesca-esportiva-em-carmo-do-rio-claro',
    array['pesca-em-carmo-do-rio-claro', 'pesca-no-lago-de-furnas', 'pesca-esportiva-lago-de-furnas-carmo'],
    'tematico',
    'Pesca esportiva em Carmo do Rio Claro',
    'Um guia para quem quer pescar no Lago de Furnas com planejamento, segurança e respeito às regras ambientais.',
    E'O Lago de Furnas é um dos grandes atrativos de Carmo do Rio Claro e atrai visitantes interessados em pesca esportiva.\nA página deve reunir pontos de referência, orientações de segurança, melhores épocas, contatos de guias e cuidados com embarcações.\nTambém é importante lembrar que regras de pesca, licenças e períodos de restrição devem ser sempre consultados em fontes oficiais.',
    '/images/carmo/pesca-esportiva-lago-furnas.jpg',
    'draft',
    '{"title":"Pesca esportiva em Carmo do Rio Claro | Lago de Furnas e dicas","description":"Guia de pesca esportiva em Carmo do Rio Claro, com informações sobre Lago de Furnas, Ponte Torta, embarcações, cuidados, melhores épocas e regras.","keywords":["pesca esportiva Carmo do Rio Claro","pesca Lago de Furnas","Ponte Torta Carmo do Rio Claro","pescar em Carmo do Rio Claro","tucunaré Lago de Furnas"]}'::jsonb,
    '[{"icon":"fish","title":"Pesca esportiva","description":"Uma das experiências associadas ao Lago de Furnas."},{"icon":"anchor","title":"Barcos e estrutura","description":"Ideal listar guias, marinas, rampas e pontos de apoio."},{"icon":"landmark","title":"Pontos de referência","description":"Ponte Torta, Itaci e regiões do lago podem entrar no mapa."},{"icon":"star","title":"Regras e segurança","description":"Inclua licença, colete, clima, documentação e preservação."}]'::jsonb,
    '[{"id":"dicas","title":"Dicas para pescar em Carmo","subtitle":"Informações iniciais para uma página útil e segura.","items":[{"title":"Consulte as regras de pesca","description":"Verifique licença, tamanho mínimo, cota, período de defeso e normas ambientais vigentes.","tags":[]},{"title":"Pesque com segurança","description":"Use colete salva-vidas, confira previsão do tempo e evite navegar em condições ruins.","tags":[]},{"title":"Contrate guias locais","description":"Guias e barqueiros da região podem ajudar com pontos, logística e segurança.","tags":[]},{"title":"Respeite o lago","description":"Não deixe lixo, evite áreas proibidas e pratique pesca responsável.","tags":[]}]},{"id":"pontos","title":"Pontos e regiões de pesca","subtitle":"Lista inicial para mapear melhor a página.","items":[{"title":"Lago de Furnas","description":"Principal área para pesca e passeios náuticos em Carmo do Rio Claro.","tags":[]},{"title":"Ponte Torta","description":"Ponto conhecido no lago e lembrado por apreciadores da pesca esportiva.","tags":[]},{"title":"Região de Itaci","description":"Área do distrito às margens do Lago de Furnas, com potencial para pesca e turismo.","tags":[]}]}]'::jsonb,
    '[{"title":"Licença de pesca","text":"Verifique se você precisa de licença e quais regras estão em vigor."},{"title":"Previsão do tempo","text":"Ventos e chuvas podem tornar a navegação perigosa."},{"title":"Embarcação regularizada","text":"Confira documentação, equipamentos obrigatórios e coletes."}]'::jsonb,
    '[{"question":"Dá para pescar em Carmo do Rio Claro?","answer":"Sim. O Lago de Furnas é associado à pesca esportiva e ao turismo náutico na cidade."},{"question":"Precisa de licença para pescar?","answer":"Em muitos casos, sim. Consulte as regras oficiais vigentes antes da pescaria."},{"question":"Tem guia de pesca na cidade?","answer":"A página deve cadastrar guias, barqueiros e pontos de apoio locais após validação."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 10. Eventos
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id,
    'eventos-em-carmo-do-rio-claro',
    array['agenda-carmo-do-rio-claro', 'calendario-de-eventos-carmo', 'festas-em-carmo-do-rio-claro'],
    'tematico',
    'Eventos em Carmo do Rio Claro',
    'Festas religiosas, rodeio, carnaval, eventos culturais, turismo e programação para moradores e visitantes.',
    E'Carmo do Rio Claro tem eventos religiosos, culturais, turísticos, gastronômicos e shows ao longo do ano.\nEsta página deve ser atualizada constantemente para funcionar como agenda confiável para moradores e visitantes.\nO ideal é separar eventos por mês, categoria, local, preço e status da programação.',
    '/images/carmo/eventos-carmo.jpg',
    'draft',
    '{"title":"Eventos em Carmo do Rio Claro | Agenda, festas e programação","description":"Agenda de eventos em Carmo do Rio Claro: festas religiosas, rodeio, carnaval, eventos culturais, turismo, feriados e programação local.","keywords":["eventos em Carmo do Rio Claro","agenda Carmo do Rio Claro","festas em Carmo do Rio Claro","Carmo Rodeio Fest","Festa do Bom Jesus dos Aflitos","Expocarmo"]}'::jsonb,
    '[{"icon":"camera","title":"Calendário anual","description":"Organize os eventos por mês e por categoria."},{"icon":"church","title":"Festas religiosas","description":"Inclua Itaci, Corpus Christi, Folias de Reis e demais tradições."},{"icon":"star","title":"Shows e rodeio","description":"Divulgue eventos como Carmo Rodeio Fest e festas populares."},{"icon":"star","title":"Divulgação local","description":"Permita cadastro de eventos por organizadores."}]'::jsonb,
    '[{"id":"calendario","title":"Calendário base","subtitle":"Modelo inicial. As datas precisam ser atualizadas a cada edição.","items":[{"title":"Fevereiro ou março — Carnaval / Carmo Folia","description":"Evento popular com programação variável conforme o ano.","tags":[]},{"title":"Junho — Festas juninas e eventos familiares","description":"Arraiás, eventos comunitários e celebrações típicas.","tags":[]},{"title":"Agosto — Festa do Bom Jesus dos Aflitos em Itaci","description":"Festa religiosa tradicional, com data principal em 6 de agosto.","tags":[]},{"title":"Setembro — Carmo Rodeio Fest","description":"Evento com shows, rodeio e programação no Parque de Exposições.","tags":[]},{"title":"Dezembro — Natal e eventos de fim de ano","description":"Programações natalinas, culturais e familiares.","tags":[]}]}]'::jsonb,
    '[{"title":"Atualize por ano","text":"Eventos mudam de data, local, atrações e regras. Crie páginas anuais quando necessário."},{"title":"Informe se é gratuito","text":"Preço, ingressos e classificação indicativa ajudam o visitante a se planejar."},{"title":"Inclua localização","text":"Sempre que possível, adicione mapa, endereço e orientação de estacionamento."}]'::jsonb,
    '[{"question":"Quais são os principais eventos de Carmo do Rio Claro?","answer":"Entre os eventos e tradições que podem aparecer na agenda estão Festa do Bom Jesus dos Aflitos, Carmo Rodeio Fest, carnaval, festas religiosas, arraiás e eventos de fim de ano."},{"question":"A agenda é atualizada?","answer":"A página deve ser atualizada com base em informações oficiais e envio de organizadores."},{"question":"Posso cadastrar um evento?","answer":"Sim. O ideal é disponibilizar um formulário para envio de informações do evento."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 11. Expocarmo
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id, 'expocarmo', array['expocarmo-carmo-do-rio-claro', 'exposicao-agropecuaria-carmo-do-rio-claro'], 'tematico',
    'Expocarmo',
    'Página base para divulgar programação, shows, estrutura, ingressos e informações úteis da Expocarmo.',
    E'A Expocarmo pode ser trabalhada como uma página anual ou permanente, reunindo programação, atrações, estrutura, ingressos e orientações para visitantes.\nComo eventos mudam todos os anos, esta página deve ter campos atualizáveis e aviso de programação em confirmação.\nQuando houver divulgação oficial, crie uma versão específica por ano, como /expocarmo-2026.',
    '/images/carmo/expocarmo.jpg', 'draft',
    '{"title":"Expocarmo | Exposição e eventos em Carmo do Rio Claro","description":"Guia da Expocarmo em Carmo do Rio Claro, com informações sobre programação, shows, exposição, estrutura, ingressos e dicas para visitantes.","keywords":["Expocarmo","Expocarmo Carmo do Rio Claro","exposição agropecuária Carmo do Rio Claro","shows Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"camera","title":"Programação","description":"Espaço para datas, horários, shows e atividades."},{"icon":"star","title":"Ingressos","description":"Inclua valores, pontos de venda e links oficiais."},{"icon":"landmark","title":"Local","description":"Informe endereço, mapa, estacionamento e acesso."},{"icon":"star","title":"Estrutura","description":"Liste praça de alimentação, banheiros, segurança e regras."}]'::jsonb,
    '[{"id":"programacao","title":"Programação","subtitle":"Preencha quando houver divulgação oficial.","items":[{"title":"Shows","description":"Adicionar atrações musicais, datas e horários.","tags":[]},{"title":"Exposição","description":"Adicionar informações de exposição agropecuária, comercial ou cultural, conforme a edição.","tags":[]},{"title":"Praça de alimentação","description":"Listar opções, funcionamento e regras para vendedores.","tags":[]},{"title":"Ingressos","description":"Adicionar lote, valores, gratuidade, meia-entrada e pontos oficiais.","tags":[]}]}]'::jsonb,
    '[{"title":"Confira a edição atual","text":"Eventos podem mudar data, nome, atrações e formato."},{"title":"Compre por canais oficiais","text":"Evite golpes e links não confirmados."},{"title":"Chegue com antecedência","text":"Em dias de shows, trânsito e estacionamento podem ficar mais disputados."}]'::jsonb,
    '[{"question":"Quando acontece a Expocarmo?","answer":"A data deve ser confirmada conforme a edição atual do evento."},{"question":"Onde acontece a Expocarmo?","answer":"O local deve ser confirmado na programação oficial da edição."},{"question":"Tem shows na Expocarmo?","answer":"Pode haver programação de shows, mas as atrações precisam ser confirmadas a cada ano."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 12. Carmo Rodeio Fest
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id, 'carmo-rodeio-fest', array['carmo-rodeio-fest-2026', 'rodeio-carmo-do-rio-claro', 'festa-de-peao-carmo-do-rio-claro'], 'tematico',
    'Carmo Rodeio Fest',
    'Shows, rodeio, atrações locais e programação especial no Parque de Exposições de Carmo do Rio Claro.',
    E'O Carmo Rodeio Fest reúne shows, rodeio e programação para moradores e visitantes.\nA edição de 2026 foi divulgada para os dias 4 a 7 de setembro, no Parque de Exposições de Carmo do Rio Claro, com entrada gratuita na pista.\nComo a programação pode mudar a cada edição, mantenha esta página atualizada com dados oficiais.',
    '/images/carmo/carmo-rodeio-fest.jpg', 'draft',
    '{"title":"Carmo Rodeio Fest | Shows, rodeio e programação em Carmo do Rio Claro","description":"Guia do Carmo Rodeio Fest em Carmo do Rio Claro, com programação, shows, rodeio, local, entrada, dicas e informações para visitantes.","keywords":["Carmo Rodeio Fest","Carmo Rodeio Fest 2026","rodeio Carmo do Rio Claro","shows em Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"star","title":"Shows","description":"Atrações musicais divulgadas conforme a edição."},{"icon":"star","title":"Rodeio","description":"Programação com montarias e grande final."},{"icon":"landmark","title":"Parque de Exposições","description":"Local divulgado para a edição de 2026."},{"icon":"star","title":"Entrada","description":"Em 2026, a pista foi anunciada com entrada gratuita."}]'::jsonb,
    '[{"id":"programacao","title":"Programação 2026","subtitle":"Programação divulgada oficialmente para a edição de 2026.","items":[{"title":"04 de setembro — Henrique e Diego","description":"Show de sexta-feira.","tags":[]},{"title":"05 de setembro — Brenno e Matheus","description":"Show de sábado.","tags":[]},{"title":"06 de setembro — US Agroboy","description":"Show de domingo, véspera do feriado.","tags":[]},{"title":"07 de setembro — Atrações locais e final do rodeio","description":"Encerramento com atrações locais e grande final.","tags":[]}]},{"id":"dicas","title":"Dicas para visitantes","subtitle":"Planeje sua ida ao evento com antecedência.","items":[{"title":"Reserve hospedagem cedo","description":"Em eventos grandes, pousadas e hotéis podem lotar.","tags":[]},{"title":"Chegue com antecedência","description":"Trânsito, estacionamento e entrada podem ficar movimentados.","tags":[]},{"title":"Confirme regras oficiais","description":"Verifique itens permitidos, horários, setores e informações de segurança.","tags":[]}]}]'::jsonb,
    '[{"title":"Local","text":"Parque de Exposições de Carmo do Rio Claro."},{"title":"Edição 2026","text":"Programada para 4 a 7 de setembro."},{"title":"Entrada","text":"Pista divulgada como gratuita na edição 2026."}]'::jsonb,
    '[{"question":"Quando será o Carmo Rodeio Fest 2026?","answer":"A programação oficial divulgou o evento para os dias 4, 5, 6 e 7 de setembro de 2026."},{"question":"Onde acontece o Carmo Rodeio Fest?","answer":"A edição de 2026 foi divulgada para o Parque de Exposições de Carmo do Rio Claro."},{"question":"A entrada é gratuita?","answer":"A divulgação oficial da edição 2026 informou entrada gratuita na pista."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 13. Museu Arqueológico
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id, 'museu-arqueologico-antonio-adauto-leite', array['muari', 'museu-de-arqueologia-indigena', 'museu-arqueologico-carmo-do-rio-claro'], 'tematico',
    'Museu Arqueológico Antônio Adauto Leite',
    'Um espaço de memória dedicado ao acervo arqueológico indígena da região de Carmo do Rio Claro.',
    E'O Museu Arqueológico Antônio Adauto Leite, também chamado de MUARI, é um dos principais pontos culturais de Carmo do Rio Claro.\nO museu reúne peças e utensílios arqueológicos ligados à presença indígena na região.\nA Prefeitura anunciou a reinauguração do museu após reforma e melhorias, reforçando sua importância como patrimônio cultural local.',
    '/images/carmo/museu-arqueologico-antonio-adauto-leite.jpg', 'draft',
    '{"title":"Museu Arqueológico Antônio Adauto Leite | MUARI em Carmo do Rio Claro","description":"Conheça o Museu Arqueológico Antônio Adauto Leite, o MUARI, em Carmo do Rio Claro: acervo indígena, história, visitação e importância cultural.","keywords":["Museu Arqueológico Antônio Adauto Leite","MUARI","Museu de Arqueologia Indígena","museu em Carmo do Rio Claro"]}'::jsonb,
    '[{"icon":"landmark","title":"Patrimônio cultural","description":"Um dos principais atrativos culturais da cidade."},{"icon":"star","title":"Acervo arqueológico","description":"Peças e utensílios ligados à história indígena regional."},{"icon":"star","title":"Visita educativa","description":"Boa opção para estudantes, famílias e turistas culturais."},{"icon":"landmark","title":"Centro da cidade","description":"Ponto para compor roteiros pelo centro e atrações culturais."}]'::jsonb,
    '[{"id":"sobre","title":"Sobre o museu","subtitle":"Um espaço para conhecer parte da história anterior à formação atual da cidade.","items":[{"title":"Acervo indígena","description":"O museu reúne peças arqueológicas e utensílios encontrados na região.","tags":[]},{"title":"Importância regional","description":"É citado como um dos principais acervos arqueológicos indígenas da região.","tags":[]},{"title":"Reinauguração e melhorias","description":"O espaço passou por reforma e melhorias para valorização do patrimônio cultural.","tags":[]}]},{"id":"visitar","title":"Como visitar","subtitle":"Dados de visitação precisam ser confirmados antes da publicação final.","items":[{"title":"Horários","description":"Confirmar horários atuais de funcionamento após reinauguração.","tags":[]},{"title":"Entrada","description":"Confirmar se a entrada continua gratuita ou se houve alteração.","tags":[]},{"title":"Visitas escolares","description":"Verificar possibilidade de agendamento para grupos e escolas.","tags":[]}]}]'::jsonb,
    '[{"title":"Confirme o funcionamento","text":"Horários de museus podem mudar em feriados, reformas ou eventos."},{"title":"Combine com roteiro cultural","text":"O museu pode entrar em um passeio pelo centro, artesanato e gastronomia."},{"title":"Valorize o patrimônio","text":"Siga as regras de visitação e preservação das peças."}]'::jsonb,
    '[{"question":"O que é o MUARI?","answer":"É o Museu Arqueológico Antônio Adauto Leite, dedicado ao acervo arqueológico indígena em Carmo do Rio Claro."},{"question":"O museu está aberto?","answer":"A Prefeitura divulgou reinauguração após reforma, mas é necessário confirmar os horários atuais antes da visita."},{"question":"A entrada é gratuita?","answer":"Há registros anteriores de entrada gratuita, mas o ideal é confirmar a informação atual antes de publicar."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 14. Turismo religioso
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id, 'turismo-religioso-em-carmo-do-rio-claro', array['igrejas-em-carmo-do-rio-claro', 'turismo-de-fe-carmo', 'religiosidade-carmo-do-rio-claro'], 'tematico',
    'Turismo religioso em Carmo do Rio Claro',
    'Capelas, santuário, festas, romarias e manifestações de fé que fazem parte da identidade carmelitana.',
    E'Carmo do Rio Claro mantém tradições religiosas importantes, como festas, romarias, tapetes de Corpus Christi, Folias de Reis e devoções populares.\nEntre os pontos de destaque estão o Santuário do Bom Jesus dos Aflitos em Itaci, a Igrejinha de Nossa Senhora Aparecida na Serra da Tormenta e a Capela de Nosso Senhor dos Passos.\nEsta página pode reunir pontos de fé, datas religiosas, orientações para visitantes e programação das principais celebrações.',
    '/images/carmo/turismo-religioso-carmo.jpg', 'draft',
    '{"title":"Turismo religioso em Carmo do Rio Claro | Igrejas, festas e tradições","description":"Conheça o turismo religioso em Carmo do Rio Claro: Santuário do Bom Jesus dos Aflitos em Itaci, Serra da Tormenta, capelas, festas e tradições de fé.","keywords":["turismo religioso Carmo do Rio Claro","Santuário Bom Jesus dos Aflitos","Itaci","Capela Nossa Senhora Aparecida","Corpus Christi Carmo do Rio Claro","Folias de Reis"]}'::jsonb,
    '[{"icon":"church","title":"Santuário em Itaci","description":"Centro da Festa do Senhor Bom Jesus dos Aflitos."},{"icon":"mountain","title":"Serra da Tormenta","description":"Local da Igrejinha de Nossa Senhora Aparecida."},{"icon":"star","title":"Festas e tradições","description":"Corpus Christi, Folias de Reis e celebrações locais."},{"icon":"landmark","title":"Roteiro de fé","description":"Combine pontos religiosos com paisagens e cultura."}]'::jsonb,
    '[{"id":"pontos","title":"Pontos de fé","subtitle":"Locais para incluir no roteiro religioso da cidade.","items":[{"title":"Santuário do Senhor Bom Jesus dos Aflitos","description":"Localizado no distrito de Itaci, é o centro de uma das festas religiosas mais tradicionais da cidade.","tags":[]},{"title":"Igrejinha de Nossa Senhora Aparecida","description":"Fica na Serra da Tormenta e compõe um roteiro que une fé, paisagem e contemplação.","tags":[]},{"title":"Capela de Nosso Senhor dos Passos","description":"Capela histórica citada entre os pontos religiosos e culturais da cidade.","tags":[]},{"title":"Corpus Christi","description":"Tradição religiosa marcada por tapetes e celebrações.","tags":[]},{"title":"Folias de Reis","description":"Manifestação popular e religiosa preservada na cidade.","tags":[]}]}]'::jsonb,
    '[{"title":"Confira horários de celebrações","text":"Missas, festas e visitas podem ter datas e horários específicos."},{"title":"Respeite os espaços de oração","text":"Evite barulho, roupas inadequadas e fotos em momentos impróprios."},{"title":"Planeje Itaci com a balsa","text":"Para visitar o santuário em Itaci, confirme os horários da travessia."}]'::jsonb,
    '[{"question":"Qual é a principal festa religiosa de Itaci?","answer":"A Festa do Senhor Bom Jesus dos Aflitos, com data principal em 6 de agosto."},{"question":"Tem turismo religioso em Carmo do Rio Claro?","answer":"Sim. A cidade possui santuário, capelas, festas religiosas e tradições populares de fé."},{"question":"Dá para fazer um roteiro religioso em um dia?","answer":"Sim, especialmente combinando centro, Serra da Tormenta e Itaci, desde que os horários de balsa e visitação sejam confirmados."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 15. Como chegar
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id, 'como-chegar-em-carmo-do-rio-claro', array['como-ir-para-carmo-do-rio-claro', 'rota-para-carmo-do-rio-claro', 'distancias-carmo-do-rio-claro'], 'tematico',
    'Como chegar em Carmo do Rio Claro',
    'Informações para planejar sua rota, entender os acessos e aproveitar melhor sua chegada à cidade.',
    E'Carmo do Rio Claro fica no Sul de Minas Gerais e pode ser acessada por rodovias que ligam a cidade a polos regionais como Passos, Alfenas, Guaxupé, Varginha e outras cidades próximas.\nPara quem pretende visitar Itaci, é importante considerar a travessia de balsa pelo Lago de Furnas.\nEsta página deve ter mapa, distâncias aproximadas, rotas sugeridas e alertas atualizados de estrada.',
    '/images/carmo/estrada-carmo-do-rio-claro.jpg', 'draft',
    '{"title":"Como chegar em Carmo do Rio Claro | Rotas, distâncias e dicas","description":"Veja como chegar em Carmo do Rio Claro saindo de cidades próximas, com dicas de estrada, acesso ao Lago de Furnas, Itaci, balsa e melhores rotas.","keywords":["como chegar em Carmo do Rio Claro","rota para Carmo do Rio Claro","distância até Carmo do Rio Claro","como ir para Itaci"]}'::jsonb,
    '[{"icon":"star","title":"De carro","description":"Principal forma de acesso para turistas."},{"icon":"landmark","title":"Rotas regionais","description":"Organize trajetos saindo de cidades próximas."},{"icon":"ship","title":"Balsa para Itaci","description":"A visita ao distrito depende de planejamento da travessia."},{"icon":"star","title":"Estradas rurais","description":"Alguns atrativos podem ter acesso por estrada de terra."}]'::jsonb,
    '[{"id":"rotas","title":"Rotas úteis","subtitle":"Adicionar distâncias reais e mapas antes da publicação final.","items":[{"title":"Saindo de Passos","description":"Rota regional comum para quem vem do sudoeste mineiro.","tags":[]},{"title":"Saindo de Alfenas","description":"Opção para visitantes da região do Lago de Furnas e Sul de Minas.","tags":[]},{"title":"Saindo de Belo Horizonte","description":"Rota longa; recomenda-se conferir pedágios, condições da estrada e tempo de viagem.","tags":[]},{"title":"Saindo de São Paulo","description":"Rota para turistas vindos do estado de São Paulo. Confirmar melhor caminho atualizado em app de navegação.","tags":[]},{"title":"Indo para Itaci","description":"Saindo de Carmo do Rio Claro, considere os horários e valores da balsa.","tags":[]}]}]'::jsonb,
    '[{"title":"Use mapa atualizado","text":"Confira rota em tempo real antes de sair, especialmente em feriados."},{"title":"Atenção à balsa","text":"Se o destino for Itaci, consulte horários e valores da travessia."},{"title":"Cuidado em estradas de terra","text":"Alguns atrativos rurais podem exigir atenção redobrada, principalmente após chuva."}]'::jsonb,
    '[{"question":"Carmo do Rio Claro fica em qual estado?","answer":"Carmo do Rio Claro fica em Minas Gerais, na região Sul do estado."},{"question":"Precisa pegar balsa para chegar em Carmo do Rio Claro?","answer":"Não para chegar à cidade. A balsa é importante principalmente para acessar o distrito de Itaci saindo de Carmo."},{"question":"Qual app usar para rota?","answer":"Use Google Maps, Waze ou outro app de navegação atualizado e confira condições da estrada no dia da viagem."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

  -- 16. Perguntas frequentes
  INSERT INTO tourism_guides (city_id, slug, aliases, kind, name, tagline, description, cover_url, status, seo, highlights, sections, practical_info, faq, content_blocks)
  VALUES (
    v_city_id, 'perguntas-frequentes-carmo-do-rio-claro', array['faq-carmo-do-rio-claro', 'duvidas-carmo-do-rio-claro', 'perguntas-sobre-carmo-do-rio-claro'], 'tematico',
    'Perguntas frequentes sobre Carmo do Rio Claro',
    'Respostas rápidas para quem quer visitar a cidade, conhecer Itaci, usar a balsa, aproveitar o Lago de Furnas e montar um roteiro.',
    E'Esta página reúne respostas curtas para dúvidas comuns de turistas e moradores.\nEla também ajuda no SEO, porque responde buscas específicas sobre balsa, Itaci, Lago de Furnas, eventos, cachoeiras e hospedagem.\nMantenha as respostas atualizadas sempre que horários, valores, eventos ou regras mudarem.',
    '/images/carmo/faq-carmo-do-rio-claro.jpg', 'draft',
    '{"title":"Perguntas frequentes sobre Carmo do Rio Claro | Turismo, balsa e dicas","description":"Respostas para dúvidas comuns sobre Carmo do Rio Claro: onde fica, o que fazer, Lago de Furnas, Itaci, balsa, cachoeiras, hospedagem, eventos e melhor época.","keywords":["perguntas frequentes Carmo do Rio Claro","dúvidas Carmo do Rio Claro","FAQ Carmo do Rio Claro","turismo Carmo do Rio Claro","balsa Itaci"]}'::jsonb,
    '[{"icon":"star","title":"Respostas rápidas","description":"Dúvidas simples com linguagem direta."},{"icon":"star","title":"SEO local","description":"Boa página para ranquear perguntas específicas."},{"icon":"star","title":"Links internos","description":"Cada resposta pode levar para uma página completa."},{"icon":"star","title":"Atualização constante","description":"Valores, horários e eventos precisam ser revisados."}]'::jsonb,
    '[]'::jsonb,
    '[{"title":"Atualize respostas sensíveis","text":"Horários, valores, eventos e funcionamento mudam com frequência."},{"title":"Use links internos","text":"Cada pergunta deve apontar para uma página mais completa quando existir."},{"title":"Adicione novas dúvidas","text":"Use perguntas reais de visitantes, WhatsApp, Google e redes sociais."}]'::jsonb,
    '[{"question":"Onde fica Carmo do Rio Claro?","answer":"Carmo do Rio Claro fica no Sul de Minas Gerais, em uma região banhada pelo Lago de Furnas."},{"question":"O que fazer em Carmo do Rio Claro?","answer":"Você pode visitar o Lago de Furnas, Itaci, Serra da Tormenta, cachoeiras, museu, pontos religiosos, restaurantes, artesanato e eventos."},{"question":"Carmo do Rio Claro tem lago?","answer":"Sim. A cidade é banhada pelo Lago de Furnas, conhecido como Mar de Minas."},{"question":"Como chegar em Itaci?","answer":"Saindo de Carmo do Rio Claro, o acesso ao distrito de Itaci envolve a travessia de balsa pelo Lago de Furnas."},{"question":"A balsa de Itaci é paga?","answer":"Moradores podem ter gratuidade conforme regras municipais. Para visitantes, há cobrança conforme o tipo de veículo."},{"question":"Quando acontece a Festa do Bom Jesus dos Aflitos?","answer":"A data principal é 6 de agosto, no distrito de Itaci."},{"question":"Tem cachoeiras em Carmo do Rio Claro?","answer":"Sim. A cidade possui cachoeiras e áreas naturais que podem fazer parte do roteiro turístico."},{"question":"Qual a melhor época para visitar?","answer":"Depende do objetivo: agosto é forte para turismo religioso em Itaci; meses quentes favorecem lago e cachoeiras; períodos mais secos ajudam em trilhas e mirantes."},{"question":"Onde comer em Carmo do Rio Claro?","answer":"A cidade tem restaurantes, lanchonetes, bares, cafés e opções de comida mineira."},{"question":"Onde ficar em Carmo do Rio Claro?","answer":"Você pode buscar hospedagem no centro, perto do lago, na zona rural ou na região de Itaci, conforme seu roteiro."}]'::jsonb,
    '[]'::jsonb
  ) ON CONFLICT (city_id, slug) DO NOTHING;

END $$;
