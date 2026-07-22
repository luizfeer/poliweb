-- Seed: Guia "Conheça Itaci" para Carmo do Rio Claro
insert into tourism_guides (
  city_id,
  slug,
  aliases,
  kind,
  name,
  tagline,
  description,
  cover_url,
  status,
  featured,
  seo,
  highlights,
  sections,
  practical_info,
  faq,
  content_blocks
) values (
  (select id from cities where slug = 'carmo-do-rio-claro'),
  'conheca-itaci',
  array['conheca-itacy', 'itacy', 'itaci'],
  'distrito',
  'Conheça Itaci: fé, lago e tradição no coração de Furnas',
  'Um distrito cercado pelas águas do Lago de Furnas, conhecido pela travessia de balsa, pelo Santuário do Senhor Bom Jesus dos Aflitos e pela simplicidade acolhedora do interior de Minas.',
  E'Itaci, também chamado por muitos de Itacy, é um distrito de Carmo do Rio Claro localizado em uma região privilegiada do Lago de Furnas.\nO lugar combina fé, natureza, travessia de balsa, pesca, paisagens tranquilas e uma das festas religiosas mais tradicionais da região: a Festa do Senhor Bom Jesus dos Aflitos.\nÉ um destino ideal para quem deseja descansar, visitar o santuário, contemplar o lago, registrar belas fotos e viver uma experiência simples e autêntica no interior mineiro.',
  '/images/itaci/lago-furnas-itaci.jpg',
  'published',
  true,
  '{
    "title": "Conheça Itaci | Guia do distrito, balsa, Lago de Furnas e Festa do Bom Jesus",
    "description": "Guia completo para conhecer Itaci, distrito de Carmo do Rio Claro às margens do Lago de Furnas. Veja o que fazer, como chegar, balsa, festas, melhores épocas e dicas para visitantes.",
    "keywords": ["Itaci", "Itacy", "Carmo do Rio Claro", "Lago de Furnas", "Balsa do Itaci", "Bom Jesus dos Aflitos", "Turismo em Carmo do Rio Claro", "Mar de Minas", "Distrito de Itaci"]
  }'::jsonb,
  '[
    {"icon": "waves", "title": "Lago de Furnas", "description": "Paisagens abertas, pôr do sol, pesca, passeios de barco e contato direto com o Mar de Minas."},
    {"icon": "church", "title": "Santuário do Bom Jesus", "description": "Principal referência religiosa do distrito e ponto central da tradicional festa de agosto."},
    {"icon": "ship", "title": "Travessia de balsa", "description": "A chegada a Itaci já faz parte da experiência, com a travessia pelas águas de Furnas."},
    {"icon": "camera", "title": "Cenários para fotos", "description": "Lago, barcos, céu aberto, estrada, natureza e clima de interior para fotos e vídeos."}
  ]'::jsonb,
  '[
    {
      "id": "o-que-fazer",
      "title": "O que fazer em Itaci",
      "subtitle": "Mesmo sendo um distrito pequeno, Itaci oferece experiências marcantes para quem gosta de natureza, fé e tranquilidade.",
      "items": [
        {
          "title": "Conhecer o Santuário do Senhor Bom Jesus dos Aflitos",
          "description": "O santuário é o principal ponto religioso do distrito e recebe romeiros especialmente durante a festa tradicional em agosto.",
          "image": "/images/itaci/santuario-bom-jesus.jpg",
          "alt": "Santuário do Senhor Bom Jesus dos Aflitos em Itaci",
          "tags": ["Fé", "Tradição", "História"]
        },
        {
          "title": "Atravessar de balsa",
          "description": "A travessia entre Carmo do Rio Claro e Itaci é um dos elementos mais característicos do passeio. Para muitos visitantes, a experiência começa antes mesmo de chegar ao distrito.",
          "image": "/images/itaci/balsa-itaci.jpg",
          "alt": "Balsa realizando a travessia para Itaci",
          "tags": ["Balsa", "Acesso", "Experiência"]
        },
        {
          "title": "Contemplar o Lago de Furnas",
          "description": "Itaci é banhado pelas águas de Furnas, oferecendo paisagens tranquilas, contato com a natureza e uma bela vista do lago.",
          "image": "/images/itaci/lago-de-furnas.jpg",
          "alt": "Lago de Furnas visto da região de Itaci",
          "tags": ["Natureza", "Lago", "Paisagem"]
        },
        {
          "title": "Ver o pôr do sol",
          "description": "O fim da tarde em Itaci é um dos melhores momentos para fotos, descanso e contemplação do lago.",
          "image": "/images/itaci/por-do-sol-itaci.jpg",
          "alt": "Pôr do sol no Lago de Furnas em Itaci",
          "tags": ["Fotos", "Pôr do sol", "Descanso"]
        },
        {
          "title": "Pescar ou passear de barco",
          "description": "A região é procurada por quem gosta de pesca, passeios no lago e momentos de lazer próximos à água.",
          "image": "/images/itaci/pesca-furnas.jpg",
          "alt": "Pesca e barcos no Lago de Furnas",
          "tags": ["Pesca", "Barco", "Lazer"]
        },
        {
          "title": "Aproveitar a comida simples do interior",
          "description": "Quem visita Itaci pode encontrar opções de alimentação e pousadas na região, especialmente em períodos de festa ou maior movimento.",
          "image": "/images/itaci/comida-mineira.jpg",
          "alt": "Comida mineira servida em ambiente simples e familiar",
          "tags": ["Gastronomia", "Interior", "Família"]
        }
      ]
    },
    {
      "id": "balsa",
      "title": "Balsa de Itaci",
      "subtitle": "A balsa é uma das principais formas de acesso ao distrito e uma parte importante da experiência de quem visita Itaci.",
      "content": [
        "A travessia liga Carmo do Rio Claro ao distrito de Itaci pelo Lago de Furnas.",
        "Moradores de Carmo do Rio Claro podem ter gratuidade, conforme regras municipais e comprovação de residência.",
        "Para visitantes e não moradores, os valores podem variar conforme o tipo e o tamanho do veículo."
      ],
      "fares": [
        {"type": "Moradores de Carmo do Rio Claro", "price": "Gratuito", "note": "Mediante comprovação, conforme regras locais."},
        {"type": "Carros de não moradores", "price": "A partir de R$ 10,00", "note": "Valor informado para referência. Confirmar antes da viagem."},
        {"type": "Veículos maiores e caminhões", "price": "Pode chegar a R$ 25,00", "note": "Varia conforme tamanho/categoria do veículo."}
      ],
      "warning": "Horários e valores da balsa podem mudar em feriados, festas, eventos e períodos de maior movimento. Sempre confirme antes de sair.",
      "cta": {"label": "Ver horários atualizados da balsa", "href": "/horarios-das-balsas"}
    },
    {
      "id": "festa-bom-jesus",
      "title": "Festa do Senhor Bom Jesus dos Aflitos",
      "subtitle": "A principal tradição religiosa de Itaci acontece em torno do dia 6 de agosto e reúne romeiros, moradores e visitantes da região.",
      "date": {"month": "Agosto", "mainDay": "6 de agosto", "period": "A programação costuma incluir novena, alvorada, missas, procissão, bênçãos e barracas."},
      "description": "A Festa do Senhor Bom Jesus dos Aflitos é o momento de maior movimento no distrito. Durante esse período, Itaci recebe milhares de pessoas que participam das celebrações religiosas, visitam o santuário e movimentam o comércio local.",
      "programHighlights": [
        "Novena preparatória",
        "Alvorada festiva",
        "Missas ao longo do dia",
        "Procissão",
        "Bênção dos fiéis",
        "Barracas com artigos religiosos, alimentos e produtos diversos",
        "Operação especial da balsa em dias de grande movimento"
      ],
      "tips": [
        "Chegue cedo, principalmente no dia 6 de agosto.",
        "Confirme os horários especiais da balsa.",
        "Leve dinheiro em espécie para pequenas compras.",
        "Use roupas e calçados confortáveis.",
        "Em dias de festa, espere maior fluxo de veículos e pessoas."
      ]
    },
    {
      "id": "melhor-epoca",
      "title": "Melhor época para visitar Itaci",
      "subtitle": "Cada período do ano oferece uma experiência diferente no distrito.",
      "seasons": [
        {"period": "Julho e agosto", "idealFor": "Fé, festa religiosa e clima mais seco", "description": "Época próxima à tradicional Festa do Senhor Bom Jesus dos Aflitos. Ideal para quem deseja viver a experiência religiosa e cultural de Itaci."},
        {"period": "Setembro e outubro", "idealFor": "Fotos, passeios e clima agradável", "description": "Boa época para contemplar o lago, fazer registros e aproveitar dias mais tranquilos."},
        {"period": "Dezembro a março", "idealFor": "Verão, lago e turismo de descanso", "description": "Período mais quente e movimentado, ideal para quem busca lazer próximo à água. Pode haver mais chuva."},
        {"period": "Abril, maio e junho", "idealFor": "Passeios tranquilos e menor movimento", "description": "Boa opção para quem prefere visitar com mais calma, fora dos períodos de festa e férias."}
      ]
    },
    {
      "id": "locais",
      "title": "Locais e pontos de referência",
      "subtitle": "Alguns pontos que podem fazer parte do roteiro de quem visita Itaci e arredores.",
      "places": [
        {"name": "Santuário do Senhor Bom Jesus dos Aflitos", "category": "Religioso", "description": "Principal ponto de fé do distrito e centro da tradicional festa de agosto.", "address": "Distrito de Itaci, Carmo do Rio Claro - MG", "featured": true, "needsVerification": false},
        {"name": "Lago de Furnas", "category": "Natureza", "description": "O grande atrativo natural da região, ideal para contemplação, pesca, passeios e fotos.", "address": "Região de Itaci, Carmo do Rio Claro - MG", "featured": true, "needsVerification": false},
        {"name": "Travessia da Balsa Carmo do Rio Claro x Itaci", "category": "Acesso", "description": "Travessia pelo Lago de Furnas que liga a cidade ao distrito.", "address": "Carmo do Rio Claro - MG", "featured": true, "needsVerification": false},
        {"name": "Pousada Refúgio das Estrelas", "category": "Hospedagem e alimentação", "description": "Opção localizada no distrito, com estrutura de pousada, alimentação e lazer.", "address": "Rua Bom Jesus, Distrito de Itaci", "featured": false, "needsVerification": true},
        {"name": "Estância Bela Vida", "category": "Alimentação e lazer", "description": "Opção na região entre Carmo do Rio Claro e Itaci, associada a restaurante, lazer e pesca.", "address": "Estrada Carmo do Rio Claro x Itaci", "featured": false, "needsVerification": true}
      ]
    }
  ]'::jsonb,
  '[
    {"title": "Confirme a balsa antes de sair", "text": "A travessia pode ter alterações de horário em feriados, eventos, festas religiosas ou por questões operacionais."},
    {"title": "Leve dinheiro em espécie", "text": "Em distritos e festas locais, alguns pontos de venda podem não aceitar cartão ou Pix em todos os momentos."},
    {"title": "Vá com tempo", "text": "A travessia de balsa, o movimento e as condições do dia podem alterar o tempo total do passeio."},
    {"title": "Respeite os moradores", "text": "Itaci é um distrito pequeno. Dirija com cuidado, respeite áreas particulares e mantenha o local limpo."},
    {"title": "Atenção em dias de festa", "text": "No período da Festa do Bom Jesus dos Aflitos, o fluxo de pessoas, veículos e balsas aumenta bastante."}
  ]'::jsonb,
  '[
    {"question": "Itaci e Itacy são o mesmo lugar?", "answer": "Sim. O nome mais usado oficialmente é Itaci, mas muitas pessoas também escrevem ou pesquisam como Itacy."},
    {"question": "Onde fica Itaci?", "answer": "Itaci é um distrito de Carmo do Rio Claro, no Sul de Minas Gerais, localizado às margens do Lago de Furnas."},
    {"question": "Como chegar em Itaci?", "answer": "Saindo de Carmo do Rio Claro, o acesso ao distrito é feito por balsa, atravessando o Lago de Furnas."},
    {"question": "A balsa para Itaci é gratuita?", "answer": "Para moradores de Carmo do Rio Claro, pode haver gratuidade mediante comprovação. Para não moradores, há cobrança conforme o veículo."},
    {"question": "Quanto custa a balsa para Itaci?", "answer": "Como referência, carros de não moradores podem pagar a partir de R$ 10,00, variando conforme o tamanho do veículo. Caminhões e veículos maiores podem chegar a cerca de R$ 25,00. Confirme os valores antes da viagem."},
    {"question": "Quando acontece a Festa do Bom Jesus dos Aflitos?", "answer": "A festa tradicional acontece em torno do dia 6 de agosto, com programação religiosa, romaria, missas, procissão e barracas."},
    {"question": "O que fazer em Itaci?", "answer": "Você pode conhecer o Santuário do Senhor Bom Jesus dos Aflitos, atravessar de balsa, contemplar o Lago de Furnas, pescar, passear de barco, ver o pôr do sol e aproveitar a tranquilidade do distrito."},
    {"question": "Itaci é bom para passeio em família?", "answer": "Sim. É um destino tranquilo, com paisagens bonitas, tradição religiosa e clima de interior."},
    {"question": "Qual a melhor época para visitar Itaci?", "answer": "Agosto é a melhor época para quem quer participar da festa religiosa. Para passeios tranquilos e fotos, meses como setembro, outubro, abril e maio também são boas opções."}
  ]'::jsonb,
  '[
    {"type": "quote", "title": "Frase de destaque", "text": "Itaci é o tipo de lugar onde a travessia já faz parte da memória da viagem."},
    {"type": "banner", "title": "Vai visitar Itaci?", "text": "Confira os horários da balsa, planeje sua rota e aproveite o melhor do Lago de Furnas.", "button": {"label": "Consultar horários", "href": "/horarios-das-balsas"}}
  ]'::jsonb
);
