-- ============================================================================
-- FAQ seed — Carmo do Rio Claro
-- Perguntas e respostas iniciais para o assistente.
-- Atualizar conforme dados reais confirmados com a Prefeitura.
-- ============================================================================

with carmo as (select id from cities where slug = 'carmo-do-rio-claro')
insert into city_faqs (city_id, question, answer, is_active) values

-- ── Portal ────────────────────────────────────────────────────────────────────
(
  (select id from carmo),
  'O que é o Carmo Local?',
  'O Carmo Local é o portal hiperlocal de Carmo do Rio Claro/MG. Reúne em um só lugar serviços públicos (coleta de lixo, farmácias de plantão, telefones úteis), turismo (pousadas, atrações, pesca esportiva), comércio local, agenda de eventos, classificados e transparência municipal com o Diário Oficial resumido por IA.',
  true
),
(
  (select id from carmo),
  'Como cadastrar meu negócio no Carmo Local?',
  'Acesse o site, crie uma conta gratuita e solicite o papel de comerciante no painel. Após aprovação pelo admin da cidade, você poderá preencher a ficha do seu negócio com fotos, descrição, horário de funcionamento, endereço e formas de pagamento.',
  true
),
(
  (select id from carmo),
  'O Carmo Local tem aplicativo para celular?',
  'Ainda não há app nativo. O site é adaptado para celular (PWA) e pode ser adicionado à tela inicial do seu smartphone como um aplicativo. No navegador, toque em "Compartilhar" e depois "Adicionar à tela inicial".',
  true
),
(
  (select id from carmo),
  'Como anunciar um classificado no Carmo Local?',
  'Crie uma conta, acesse a seção de Classificados e publique seu anúncio gratuitamente. Você pode anunciar veículos, imóveis, vagas de emprego, serviços e itens em geral. O anúncio fica ativo por 30 dias e pode ser renovado.',
  true
),

-- ── Prefeitura e contatos ────────────────────────────────────────────────────
(
  (select id from carmo),
  'Qual o horário de funcionamento da Prefeitura de Carmo do Rio Claro?',
  'A Prefeitura Municipal de Carmo do Rio Claro funciona de segunda a sexta-feira em horário comercial (geralmente 8h às 17h). Telefone geral: (35) 3561-2000. Confirme horários específicos de secretarias diretamente com a Prefeitura, pois podem variar.',
  true
),
(
  (select id from carmo),
  'Qual o telefone da Prefeitura de Carmo do Rio Claro?',
  'O telefone geral da Prefeitura Municipal de Carmo do Rio Claro é (35) 3561-2000. A Secretaria de Saúde e a Vigilância Sanitária também atendem por esse número em horário comercial.',
  true
),
(
  (select id from carmo),
  'Como entrar em contato com o Conselho Tutelar de Carmo do Rio Claro?',
  'O Conselho Tutelar de Carmo do Rio Claro funciona em regime de plantão local. Telefone: (35) 3561-2000 (ramal Prefeitura). Em emergências envolvendo crianças e adolescentes, acione também o Disque 100 (denúncias nacionais, gratuito).',
  true
),
(
  (select id from carmo),
  'Qual o número da Câmara Municipal de Carmo do Rio Claro?',
  'A Câmara Municipal de Carmo do Rio Claro pode ser acessada pelo site oficial em carmodorioclaro.cam.mg.gov.br. As sessões plenárias e atas estão disponíveis na seção de Transparência do Carmo Local, resumidas por IA.',
  true
),

-- ── Saúde ────────────────────────────────────────────────────────────────────
(
  (select id from carmo),
  'Onde fica a UBS (Unidade Básica de Saúde) de Carmo do Rio Claro?',
  'A UBS Centro de Carmo do Rio Claro fica no Centro e atende de segunda a sexta, das 7h às 17h. Serviços: clínica geral, vacinação e enfermagem. Telefone: (35) 3561-2000. Consulte a seção Saúde do portal para informações sobre campanhas e outros postos.',
  true
),
(
  (select id from carmo),
  'Quais são os números de emergência em Carmo do Rio Claro?',
  'Principais números de emergência: SAMU 192 (urgências médicas), Bombeiros 193, Polícia Militar 190, Polícia Civil 197. Prefeitura: (35) 3561-2000. Para mais contatos locais, acesse /servicos/telefones no Carmo Local.',
  true
),

-- ── Farmácias ────────────────────────────────────────────────────────────────
(
  (select id from carmo),
  'Quais farmácias funcionam em Carmo do Rio Claro?',
  'As principais farmácias no Centro de Carmo do Rio Claro são: Farmácia Central — Rua Camilo Aschar (35) 3561-1000; Drogaria Carmelitana — Av. José Evaristo Santana (35) 3561-1001; Farmácia Popular Carmo — Rua Coronel Antônio Jacinto (35) 3561-1002. O plantão rotativo é exibido em /servicos/farmacias.',
  true
),
(
  (select id from carmo),
  'Qual farmácia está de plantão hoje em Carmo do Rio Claro?',
  'O plantão de farmácias em Carmo do Rio Claro é rotativo entre as farmácias credenciadas. Consulte a farmácia de plantão de hoje em tempo real na seção /servicos/farmacias do Carmo Local, que é atualizada diariamente.',
  true
),

-- ── Coleta de lixo ───────────────────────────────────────────────────────────
(
  (select id from carmo),
  'Quais são os dias de coleta de lixo em Carmo do Rio Claro?',
  'A coleta de lixo em Carmo do Rio Claro varia por bairro. Os bairros atendidos incluem Centro, São José, Alto da Cruz, Vila Nova, Jardim Aeroporto, São Pedro e Cohab. Consulte o calendário completo por bairro em /servicos/coleta no Carmo Local.',
  true
),
(
  (select id from carmo),
  'Onde descartar o lixo reciclável em Carmo do Rio Claro?',
  'A coleta seletiva em Carmo do Rio Claro é feita em dias específicos por bairro. Separe recicláveis (papel, plástico, vidro, metal) e coloque na calçada no dia da coleta seletiva do seu bairro. Consulte o calendário em /servicos/coleta.',
  true
),

-- ── Turismo ──────────────────────────────────────────────────────────────────
(
  (select id from carmo),
  'O que tem para fazer em Carmo do Rio Claro?',
  'Carmo do Rio Claro oferece: pesca esportiva na represa de Furnas (dourado, tucunaré, tilápia), balneários e praia de água doce, trilhas na região da Serra da Canastra, gastronomia regional mineira, turismo rural e cafeicultura. A cidade fica a cerca de 320 km de Belo Horizonte.',
  true
),
(
  (select id from carmo),
  'Onde fica a represa de Furnas em relação a Carmo do Rio Claro?',
  'A represa de Furnas banha Carmo do Rio Claro diretamente. É uma das maiores represas do Brasil, com mais de 1.400 km de margens. O acesso às margens e balneários locais fica a poucos minutos do centro da cidade.',
  true
),
(
  (select id from carmo),
  'Tem pesca esportiva em Carmo do Rio Claro?',
  'Sim! A pesca esportiva é uma das principais atrações de Carmo do Rio Claro. A represa de Furnas é famosa pela pesca de dourado, tucunaré, tilápia e lambari. Há guias de pesca locais credenciados com barcos e todo o equipamento. Consulte os guias em /turismo.',
  true
),
(
  (select id from carmo),
  'Tem pousadas em Carmo do Rio Claro?',
  'Sim, Carmo do Rio Claro tem pousadas, hospedagens e chalés, especialmente voltados para quem vem pescar ou curtir a represa de Furnas. Veja opções com preços, fotos e avaliações em /turismo/onde-ficar no Carmo Local.',
  true
),
(
  (select id from carmo),
  'Onde comer em Carmo do Rio Claro?',
  'Carmo do Rio Claro tem restaurantes com culinária mineira, frutos do rio (especialmente peixe da represa de Furnas), lanchonetes e padarias. Veja a lista completa com endereços e opções de delivery em /turismo/onde-comer no Carmo Local.',
  true
),
(
  (select id from carmo),
  'Como chegar em Carmo do Rio Claro?',
  'Carmo do Rio Claro fica no sul de Minas Gerais, a aproximadamente 320 km de Belo Horizonte e 380 km de São Paulo. O acesso principal é pela BR-491 e MG-050. Não há aeroporto local; o mais próximo é o de Varginha ou Passos. Há serviço de ônibus interestadual.',
  true
),

-- ── Transparência ────────────────────────────────────────────────────────────
(
  (select id from carmo),
  'Onde vejo o Diário Oficial de Carmo do Rio Claro?',
  'O Diário Oficial de Carmo do Rio Claro está disponível no site da Prefeitura (carmodorioclaro.mg.gov.br) e no Carmo Local em /transparencia, onde as edições são resumidas automaticamente por IA para facilitar a leitura.',
  true
),
(
  (select id from carmo),
  'Como acompanhar as licitações e editais da Prefeitura de Carmo do Rio Claro?',
  'As licitações e editais da Prefeitura de Carmo do Rio Claro são publicados no portal da Prefeitura e no Carmo Local em /transparencia. O portal atualiza automaticamente as novas publicações e exibe um resumo de cada processo.',
  true
),
(
  (select id from carmo),
  'Onde ficam as atas das sessões da Câmara Municipal de Carmo do Rio Claro?',
  'As atas das sessões plenárias da Câmara Municipal são publicadas no site oficial da Câmara (carmodorioclaro.cam.mg.gov.br) e no Carmo Local em /transparencia, com resumo gerado por IA para cada sessão.',
  true
),

-- ── Igreja e vida religiosa ──────────────────────────────────────────────────
(
  (select id from carmo),
  'Qual o horário das missas na Paróquia Nossa Senhora do Carmo?',
  'A Paróquia Nossa Senhora do Carmo (Igreja Matriz), no Centro de Carmo do Rio Claro, é referência católica da cidade. Padre Gilmar Antônio Pimenta. Telefone: (35) 99859-9661. Instagram: @paroquianscmg. Consulte os horários das missas diretamente com a paróquia, pois podem variar por época do ano.',
  true
),

-- ── Eventos ─────────────────────────────────────────────────────────────────
(
  (select id from carmo),
  'Tem eventos em Carmo do Rio Claro?',
  'Sim! A agenda de eventos de Carmo do Rio Claro inclui festas religiosas, shows, torneios de pesca, eventos rurais e feiras. Acompanhe a programação atualizada em /comunidade/agenda no Carmo Local.',
  true
);
