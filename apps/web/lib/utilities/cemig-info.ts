export const cemigInfoSeed = {
  slug: 'cemig',
  title: 'Cemig: atendimento, segunda via, falta de energia e serviços',
  category: 'Serviços públicos',
  provider: 'Cemig',
  state: 'Minas Gerais',
  lastVerifiedAt: '2026-05-12',
  shortDescription:
    'Guia rápido com os principais canais e serviços da Cemig para moradores: falta de energia, segunda via, religação, tarifa social, atendimento presencial, segurança e consulta de desligamentos.',
  hero: {
    title: 'Precisa resolver algo com a Cemig?',
    subtitle:
      'Veja os principais canais oficiais para pedir segunda via, comunicar falta de energia, solicitar religação, consultar débitos, alterar titularidade, buscar atendimento presencial e acompanhar desligamentos.',
    alert:
      'Em caso de risco com rede elétrica, fio caído, acidente ou situação urgente, não toque nos cabos e acione a Cemig pelo 116.',
  },
  mainContacts: [
    {
      label: 'Telefone Cemig em Minas Gerais',
      value: '116',
      type: 'phone',
      description:
        'Canal principal para atendimento, inclusive falta de energia, religação e situações emergenciais.',
      availability: 'Atendimento conforme serviço solicitado. Emergências podem ser comunicadas pelo 116.',
      sourceUrl: 'https://www.cemig.com.br/atendimento/canais-de-atendimento/',
    },
    {
      label: 'Telefone para quem está fora de Minas Gerais',
      value: '0800 721 0116',
      type: 'phone',
      description:
        'Canal indicado pela Cemig para atendimento de clientes que estão fora do estado de Minas Gerais.',
      sourceUrl: 'https://www.cemig.com.br/atendimento/canais-de-atendimento/',
    },
    {
      label: 'Atendimento para pessoas com deficiência auditiva',
      value: '0800 723 8007',
      type: 'phone',
      description:
        'Canal de atendimento telefônico informado pela Cemig para pessoas surdas ou com deficiência auditiva.',
      sourceUrl: 'https://www.cemig.com.br/atendimento/canais-de-atendimento/',
    },
    {
      label: 'Ouvidoria Cemig',
      value: '0800 728 3838',
      type: 'phone',
      description:
        'Use quando já houver um protocolo anterior e a demanda não tiver sido resolvida pelos canais comuns.',
      note:
        'A Ouvidoria exige número de protocolo do atendimento anterior. Atendimento telefônico em dias úteis, das 8h às 18h.',
      sourceUrl: 'https://www.cemig.com.br/ouvidoria/',
    },
    {
      label: 'WhatsApp Cemig',
      value: '(31) 3506-1160',
      type: 'whatsapp',
      description:
        'Canal digital para segunda via, falta de energia, débitos, religação, leitura e outros serviços.',
      instructions:
        "Salve o número, envie uma mensagem e digite o serviço desejado, como: 'segunda via', 'estou sem luz', 'religação' ou 'consultar débitos'.",
      sourceUrl: 'https://www.cemig.com.br/atendimento/servicos-por-canal-de-atendimento/',
    },
    {
      label: 'SMS Cemig',
      value: '29810',
      type: 'sms',
      description:
        'Canal por SMS para alguns serviços, como comunicar falta de energia ou informar leitura, conforme disponibilidade do atendimento.',
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/estou-sem-luz/',
    },
  ],
  digitalChannels: [
    {
      name: 'Cemig Atende Web',
      description:
        'Portal online para segunda via, falta de energia, religação, ligação nova, tarifa social, alteração de titularidade e atualização cadastral.',
      url: 'https://atende.cemig.com.br/',
      tags: ['online', 'login', 'serviços'],
    },
    {
      name: 'Aplicativo Cemig Atende',
      description:
        'Aplicativo oficial para Android e iOS. Permite pagar contas com Pix, pedir segunda via, informar falta de energia e acessar outros serviços.',
      url: 'https://www.cemig.com.br/atendimento/canais-de-atendimento/',
      tags: ['app', 'android', 'ios'],
    },
    {
      name: 'WhatsApp Cemig',
      description: 'Atendimento automático pelo número (31) 3506-1160.',
      url: 'https://api.whatsapp.com/send/?phone=553135061160',
      tags: ['whatsapp', 'rápido'],
    },
    {
      name: 'Telegram CemigBot',
      description:
        'Atendimento pelo bot @cemigbot no Telegram para segunda via, falta de energia, leitura e débitos.',
      url: 'https://t.me/cemigbot',
      tags: ['telegram', 'bot'],
    },
  ],
  services: [
    {
      slug: 'segunda-via-conta',
      title: 'Segunda via da conta',
      summary:
        'A segunda via pode ser solicitada pelos canais digitais, telefone 116, Telegram, CemigBot e outros canais de atendimento.',
      howTo: [
        'Acesse o Cemig Atende Web ou app Cemig Atende.',
        "Escolha a opção 'Segunda Via'.",
        'Informe CPF/CNPJ e número da instalação.',
        'Baixe o PDF, envie por e-mail ou utilize o código Pix para pagamento, quando disponível.',
        "Também é possível ligar 116 e dizer 'segunda via' no atendimento automático.",
      ],
      requiredInfo: ['CPF ou CNPJ do titular', 'Número da instalação'],
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/segunda-via-de-conta/',
    },
    {
      slug: 'estou-sem-luz',
      title: 'Estou sem luz',
      summary:
        'Antes de abrir a solicitação, verifique se os disjuntores da caixa de medição e do quadro interno estão acionados. Depois, comunique a falta de energia pelos canais da Cemig.',
      howTo: [
        'Verifique o disjuntor da caixa de medição e os disjuntores internos.',
        'Acesse o Cemig Atende Web, app, WhatsApp, Telegram, CemigBot, SMS 29810 ou ligue 116.',
        "Digite ou diga 'estou sem luz'.",
        'Tenha em mãos CPF/CNPJ e número da instalação.',
        'Confirme um telefone celular válido para contato da equipe de campo.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Número da instalação', 'Telefone celular para contato'],
      emergencyNote:
        'Se houver fio partido, poste danificado, árvore sobre a rede ou risco de choque, não se aproxime e ligue 116.',
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/estou-sem-luz/',
    },
    {
      slug: 'religacao',
      title: 'Religação de energia',
      summary:
        'A religação restabelece a energia quando o serviço foi suspenso por falta de pagamento, solicitação do cliente ou reparo no padrão.',
      howTo: [
        'Regularize eventuais débitos, quando o corte tiver sido por falta de pagamento.',
        'Solicite pelo WhatsApp Cemig ou telefone 116.',
        "No atendimento, informe 'Religação' ou 'Religar energia'.",
        'Tenha CPF/CNPJ e número da instalação.',
        'Confirme telefone de contato e observe as orientações sobre execução e eventual taxa de religação.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Número da instalação', 'Telefone celular válido'],
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/religacao/',
    },
    {
      slug: 'consultar-debitos',
      title: 'Consultar débitos',
      summary: 'Permite consultar contas em aberto ou vencidas pelos canais digitais da Cemig.',
      howTo: [
        'Entre em contato pelo WhatsApp Cemig.',
        "Digite 'consultar débitos'.",
        'Siga as instruções do atendimento automático.',
        'Informe CPF/CNPJ e número da instalação.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Número da instalação'],
      sourceUrl: 'https://www.cemig.com.br/atendimento/servicos-por-canal-de-atendimento/',
    },
    {
      slug: 'informar-conta-paga',
      title: 'Informar conta paga',
      summary:
        'A Cemig permite informar pagamento de faturas com até 15 dias vencidas para ajudar a evitar suspensão do fornecimento.',
      howTo: [
        'Acesse o WhatsApp Cemig pelo número (31) 3506-1160.',
        'Informe CPF/CNPJ e número da instalação.',
        "Digite 'informar conta paga'.",
        'Envie foto do comprovante, se solicitado.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Número da instalação', 'Comprovante de pagamento, se solicitado'],
      important:
        'Após determinado prazo, a ordem de corte pode já ter sido emitida. Nesse caso, pode ser necessário apresentar o comprovante diretamente à equipe da Cemig.',
      sourceUrl: 'https://www.cemig.com.br/atendimento/servicos-por-canal-de-atendimento/',
    },
    {
      slug: 'tarifa-social',
      title: 'Tarifa Social de Energia Elétrica',
      summary:
        'Benefício para famílias em situação de vulnerabilidade social, também chamado de Tarifa de Baixa Renda.',
      eligibility: [
        'Famílias com renda mensal por pessoa de até meio salário mínimo.',
        'Famílias com renda total de até três salários mínimos com integrante que tenha doença ou deficiência e utilize equipamentos elétricos essenciais ao tratamento.',
        'Beneficiários do BPC.',
        'Famílias inscritas e atualizadas no CadÚnico, conforme regras do benefício.',
      ],
      howTo: [
        'Mantenha o CadÚnico ou BPC atualizado.',
        'A conta de energia deve estar na titularidade de um dos beneficiários, quando aplicável.',
        "Caso tenha direito e o benefício não apareça, solicite pelo Cemig Atende Web na opção 'Tarifa Social' ou procure atendimento presencial.",
      ],
      requiredInfo: [
        'CPF do responsável pela unidade consumidora',
        'Número da unidade consumidora',
        'Código familiar do CadÚnico ou número do BPC',
        'Relatório médico, quando o benefício envolver uso contínuo de equipamento elétrico por doença ou deficiência',
      ],
      benefit:
        'Para Residencial Baixa Renda, a Cemig informa desconto de 100% para consumo de até 80 kWh/mês; consumo acima desse limite não recebe desconto nessa faixa.',
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/tarifa-social/',
    },
    {
      slug: 'ligacao-nova',
      title: 'Ligação nova e aumento de carga',
      summary:
        'Ligação nova é a primeira conexão da unidade consumidora à rede da Cemig. Aumento de carga é necessário quando o padrão atual não atende à demanda do imóvel.',
      howTo: [
        'Acesse o Cemig Atende Web.',
        'Escolha o serviço de ligação nova ou aumento de carga.',
        'Preencha os dados solicitados.',
        'Anexe a documentação necessária.',
        'Acompanhe a vistoria e instalação.',
      ],
      deadlines:
        'A Cemig informa prazos de até 5 dias úteis para vistoria e instalação de medição até 2,3 kV, até 10 dias úteis entre 2,3 kV e 69 kV, e até 15 dias úteis acima de 69 kV, podendo haver prazo maior quando for necessária extensão de rede.',
      fees:
        'A Cemig informa que não há cobrança para execução do serviço de Ligação Nova, mas pode haver cobrança na primeira fatura caso seja necessária mais de uma vistoria.',
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/ligacao-nova-e-aumento-de-carga/prazo-para-a-ligacao-nova-da-energia/',
    },
    {
      slug: 'alteracao-titularidade',
      title: 'Alteração de titularidade',
      summary:
        'Troca o nome do responsável pela conta de energia, comum em casos de compra, aluguel ou mudança de imóvel.',
      howTo: [
        'Acesse o Cemig Atende Web.',
        "Selecione 'Alteração de Titularidade'.",
        'Aceite o termo de adesão.',
        'Informe o número da instalação que aparece na conta de energia.',
        'Preencha o formulário e anexe os documentos solicitados.',
      ],
      requiredInfo: ['Número da instalação', 'Dados do novo titular', 'Documentos solicitados no atendimento'],
      sourceUrl: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/alteracao-de-titularidade/',
    },
    {
      slug: 'informar-leitura',
      title: 'Informar leitura do medidor',
      summary:
        'Serviço para clientes de baixa tensão enviarem a leitura do medidor, especialmente quando não for possível a visita do leiturista.',
      howTo: [
        'Use WhatsApp, SMS 29810, Telegram ou canais digitais disponíveis.',
        "Digite 'informar leitura'.",
        'Informe CPF/CNPJ, número da instalação e a leitura anotada no medidor.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Número da instalação', 'Leitura atual do medidor'],
      sourceUrl: 'https://www.cemig.com.br/atendimento/servicos-por-canal-de-atendimento/',
    },
    {
      slug: 'desligamento-programado',
      title: 'Consulta de desligamento programado',
      summary:
        'Permite consultar interrupções programadas por município, bairro ou número da unidade consumidora.',
      howTo: [
        'Acesse a página de Desligamento Programado.',
        'Pesquise pelo município e bairro ou pelo número da unidade consumidora.',
        'Confira se há previsão de interrupção nos próximos dias.',
        'Mantenha seus dados atualizados no Cemig Atende para receber avisos por SMS e e-mail.',
      ],
      sourceUrl: 'https://www.cemig.com.br/desligamento-programado/',
    },
    {
      slug: 'mapa-fornecimento',
      title: 'Mapa de fornecimento de energia',
      summary:
        'Mapa para acompanhar o status do fornecimento de energia, com informações sobre desligamentos emergenciais e programados em andamento.',
      howTo: [
        'Acesse o Mapa de Fornecimento de Energia.',
        'Busque por cidade, endereço ou número da unidade consumidora.',
        'Veja se há desligamento emergencial ou programado na região.',
      ],
      sourceUrl: 'https://www.cemig.com.br/mapa-de-fornecimento-de-energia/',
    },
    {
      slug: 'equipamentos-vitais',
      title: 'Cadastro de pessoas com equipamentos vitais',
      summary:
        'Cadastro para pessoas que dependem de energia elétrica para equipamentos essenciais à vida.',
      examples: [
        'Respiradores ou ventiladores pulmonares',
        'Concentradores de oxigênio',
        'CPAP e BIPAP',
        'Bombas de infusão',
        'Oxímetros',
        'Equipamentos de diálise peritoneal automática',
        'Outras situações avaliadas por médico',
      ],
      howTo: [
        'O cadastro pode ser feito pelo titular da conta.',
        'É necessária documentação médica que comprove a necessidade.',
        'Atualize os dados pelo app Cemig Atende, Cemig Atende Web ou atendimento presencial.',
      ],
      sourceUrl:
        'https://www.cemig.com.br/como-solicitar-os-principais-servicos/atualizacao-cadastral-e-cadastramento-de-pessoas-com-equipamentos-vitais/',
    },
  ],
  attendanceLocations: {
    title: 'Locais de atendimento presencial',
    description:
      'A Cemig possui uma página para consultar postos de atendimento presencial. O cidadão deve pesquisar pelo nome da cidade para encontrar o local mais próximo.',
    instructions: [
      'Acesse a página de locais de atendimento.',
      'Pesquise pelo nome do município.',
      'Confira endereço, horário e disponibilidade antes de ir ao local.',
    ],
    url: 'https://www.cemig.com.br/atendimento/locais-de-atendimento/',
    localSearchHint: 'Pesquisar por: Carmo do Rio Claro, MG',
  },
  safetyGuides: [
    {
      title: 'Fio caído ou rede elétrica danificada',
      text:
        'Não toque nos fios, não tente remover objetos da rede e não se aproxime. Ligue para a Cemig pelo 116.',
      priority: 'high',
    },
    {
      title: 'Poda de árvores perto da rede elétrica',
      text:
        'Não realize podas próximas à rede elétrica por conta própria. A Cemig orienta solicitar o serviço à prefeitura quando não houver conflito direto com a rede.',
      priority: 'high',
    },
    {
      title: 'Instalação de antenas, internet ou estruturas metálicas',
      text:
        'Evite subir com hastes, vergalhões ou estruturas metálicas perto da rede. A Cemig recomenda manter distância mínima de 1,5 metro da fiação.',
      priority: 'medium',
    },
    {
      title: 'Eventos, palcos e estruturas temporárias',
      text:
        'Antes de montar palcos, tendas, andaimes ou coberturas, verifique a distância da rede elétrica e planeje a instalação com segurança.',
      priority: 'medium',
    },
  ],
  faq: [
    {
      question: 'Qual é o telefone da Cemig?',
      answer:
        'Em Minas Gerais, o telefone principal é 116. Para atendimento fora de Minas Gerais, use 0800 721 0116.',
    },
    {
      question: 'Qual é o WhatsApp da Cemig?',
      answer: 'O WhatsApp informado pela Cemig é (31) 3506-1160.',
    },
    {
      question: 'Como pedir segunda via da conta da Cemig?',
      answer:
        'Você pode pedir pelo Cemig Atende Web, aplicativo Cemig Atende, WhatsApp, Telegram, CemigBot ou telefone 116. Tenha em mãos CPF/CNPJ e número da instalação.',
    },
    {
      question: 'Como avisar que estou sem luz?',
      answer:
        'Verifique primeiro os disjuntores. Depois, comunique pelos canais Cemig Atende Web, app, WhatsApp, Telegram, CemigBot, SMS 29810 ou telefone 116.',
    },
    {
      question: 'Como solicitar religação?',
      answer:
        "Regularize os débitos, quando houver, e solicite pelo WhatsApp da Cemig ou telefone 116 informando 'Religação' ou 'Religar energia'.",
    },
    {
      question: 'Como saber se tenho Tarifa Social?',
      answer:
        "Confira na conta de luz o campo 'Subclasse'. Se estiver como 'Residencial Baixa Renda' ou 'Residencial Desconto Social', o desconto já está sendo aplicado.",
    },
    {
      question: 'Quando devo acionar a Ouvidoria?',
      answer:
        'Depois de tentar resolver pelos canais oficiais e ter um protocolo anterior. A Ouvidoria avalia casos que não foram solucionados satisfatoriamente.',
    },
    {
      question: 'Como consultar atendimento presencial da Cemig?',
      answer: 'Acesse a página de locais de atendimento da Cemig e pesquise pelo nome da cidade.',
    },
    {
      question: 'Como consultar desligamento programado?',
      answer:
        'Acesse a página de Desligamento Programado e busque pelo município, bairro ou número da unidade consumidora.',
    },
    {
      question: 'Onde vejo se há interrupção de energia na minha região?',
      answer:
        'Use o Mapa de Fornecimento de Energia da Cemig, pesquisando por cidade, endereço ou número da unidade consumidora.',
    },
  ],
  seo: {
    title: 'Cemig: telefone, segunda via, falta de energia e atendimento',
    description:
      'Veja telefones da Cemig, WhatsApp, segunda via de conta, falta de energia, religação, tarifa social, locais de atendimento e desligamentos programados.',
  },
  sources: [
    {
      title: 'Canais de Atendimento - Cemig',
      url: 'https://www.cemig.com.br/atendimento/canais-de-atendimento/',
    },
    {
      title: 'Serviços por canal de atendimento - Cemig',
      url: 'https://www.cemig.com.br/atendimento/servicos-por-canal-de-atendimento/',
    },
    {
      title: 'Segunda Via de Conta - Cemig',
      url: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/segunda-via-de-conta/',
    },
    {
      title: 'Estou sem luz - Cemig',
      url: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/estou-sem-luz/',
    },
    {
      title: 'Religação - Cemig',
      url: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/religacao/',
    },
    {
      title: 'Tarifa Social - Cemig',
      url: 'https://www.cemig.com.br/como-solicitar-os-principais-servicos/tarifa-social/',
    },
    {
      title: 'Locais de Atendimento - Cemig',
      url: 'https://www.cemig.com.br/atendimento/locais-de-atendimento/',
    },
    {
      title: 'Desligamento Programado - Cemig',
      url: 'https://www.cemig.com.br/desligamento-programado/',
    },
    {
      title: 'Mapa de Fornecimento de Energia - Cemig',
      url: 'https://www.cemig.com.br/mapa-de-fornecimento-de-energia/',
    },
    {
      title: 'Ouvidoria - Cemig',
      url: 'https://www.cemig.com.br/ouvidoria/',
    },
  ],
} as const;

export type CemigInfo = typeof cemigInfoSeed;
export type CemigService = CemigInfo['services'][number];
