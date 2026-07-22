export const copasaCarmoDoRioClaroSeed = {
  slug: 'copasa-carmo-do-rio-claro',
  title: 'Copasa em Carmo do Rio Claro: atendimento, falta de água, segunda via e serviços',
  category: 'Serviços públicos',
  provider: 'Copasa',
  city: 'Carmo do Rio Claro',
  state: 'Minas Gerais',
  lastVerifiedAt: '2026-05-12',
  shortDescription:
    'Guia rápido com os principais canais da Copasa para moradores de Carmo do Rio Claro: segunda via, falta de água, vazamentos, religação, tarifa social, troca de titularidade, parcelamento e atendimento presencial.',
  hero: {
    title: 'Precisa resolver algo com a Copasa?',
    subtitle:
      'Veja como pedir segunda via, comunicar falta de água, informar vazamento, solicitar religação, negociar débitos, alterar titularidade e buscar atendimento presencial em Carmo do Rio Claro.',
    alert:
      'Em caso de vazamento de água na rua, falta de água ou retorno de esgoto, registre a ocorrência pelos canais oficiais da Copasa.',
  },
  mainContacts: [
    {
      label: 'Central de Atendimento Copasa',
      value: '115',
      type: 'phone',
      description: 'Telefone principal da Copasa para atendimento ao cliente em Minas Gerais.',
      availability: '24 horas por dia',
      services: [
        'Falta de água',
        'Vazamento de água',
        'Vazamento de esgoto',
        'Religação',
        'Segunda via',
        'Consulta de débitos',
        'Informações gerais',
      ],
      sourceUrl: 'https://www.copasa.com.br/',
    },
    {
      label: 'Central 0800 Copasa',
      value: '0800 0300 115',
      type: 'phone',
      description: 'Canal telefônico alternativo informado pela Copasa para relacionamento com clientes.',
      availability: '24 horas por dia',
      sourceUrl: 'https://www.copasa.com.br/',
    },
    {
      label: 'WhatsApp Copasa',
      value: '(31) 99770-7000',
      type: 'whatsapp',
      description:
        'Canal digital para solicitar serviços, tirar dúvidas e acessar atendimento automatizado ou assistido.',
      availability:
        'Segunda a sexta, das 8h às 18h; sábado, domingo e feriados, exceto nacionais, das 8h às 12h.',
      services: [
        'Segunda via',
        'Falta de água',
        'Vazamento',
        'Religação',
        'Parcelamento',
        'Troca de titularidade',
        'Tarifa social',
        'Atualização cadastral',
      ],
      url: 'https://api.whatsapp.com/send?phone=5531997707000',
      sourceUrl: 'https://news.copasa.com.br/agencias-da-copasa-terao-novos-horarios-de-atendimento-em-marco/',
    },
    {
      label: 'Ouvidoria Copasa',
      value: '0800 0310 866',
      type: 'phone',
      description:
        'Canal para reclamações, sugestões, elogios ou situações que não foram resolvidas pelos canais comuns.',
      availability: 'Segunda a sexta, das 7h às 19h, exceto feriados.',
      important: 'Antes de acionar a Ouvidoria, anote o protocolo gerado no atendimento anterior.',
      sourceUrl: 'https://ouvidoria.copasa.com.br/',
    },
  ],
  digitalChannels: [
    {
      name: 'Agência Virtual Copasa',
      description:
        'Portal online para solicitar serviços, consultar contas, emitir segunda via, registrar falta de água, vazamentos e outros atendimentos.',
      url: 'https://copasaportalprd.azurewebsites.net/Copasa.Portal/home/index',
      tags: ['online', '24h', 'serviços'],
    },
    {
      name: 'Aplicativo Copasa Digital',
      description:
        'Aplicativo oficial da Copasa para Android e iOS. Permite acessar segunda via, informar falta de água, comunicar vazamentos, consultar histórico de consumo e outros serviços.',
      url: 'https://play.google.com/store/apps/details?id=br.com.copasa.copasadigital.app',
      tags: ['app', 'android', 'ios'],
    },
    {
      name: 'WhatsApp Copasa',
      description: 'Atendimento pelo número (31) 99770-7000 para serviços e orientações.',
      url: 'https://api.whatsapp.com/send?phone=5531997707000',
      tags: ['whatsapp', 'rápido'],
    },
    {
      name: 'Webchat Copasa',
      description: 'Atendimento pelo chat no site oficial da Copasa.',
      url: 'https://www.copasa.com.br/',
      tags: ['chat', 'site oficial'],
    },
  ],
  localAgency: {
    title: 'Agência de Atendimento da Copasa em Carmo do Rio Claro',
    status: 'confirmar_antes_de_publicar',
    note:
      'Dados encontrados no Portal MG, com atualização em 30/07/2021. Recomenda-se confirmar no site da Copasa, na conta de água ou pelo 115 antes de publicar como informação definitiva.',
    address: {
      street: 'Leonardo Bernardo Carielo',
      number: 'S/Nº',
      neighborhood: 'Jardim América',
      city: 'Carmo do Rio Claro',
      state: 'MG',
      zipCode: '37150-000',
    },
    phone: '115 // (35) 3561-1196',
    email: 'dtmq@copasa.com.br',
    openingHours: 'De 10h às 12h e de 14h às 16h',
    sourceUrl: 'https://www.mg.gov.br/instituicao_unidade/agencia-de-atendimento-621',
    servicesListedByPortalMG: [
      'Confirmar o número de economias e/ou categoria do imóvel',
      'Consultar contas de água já pagas',
      'Consultar demonstrativo de tarifa proporcional',
      'Consultar previsão de execução dos serviços de água e esgoto',
      'Simular valores da conta de água',
      'Solicitar esclarecimentos sobre dados e valor da conta',
      'Solicitar mudança do nome do titular da conta',
      'Solicitar parcelamento de débitos de água e esgoto',
    ],
  },
  services: [
    {
      slug: 'segunda-via',
      title: 'Segunda via da conta',
      summary: 'Permite emitir a segunda via da conta de água e esgoto da Copasa.',
      channels: ['Agência Virtual Copasa', 'Aplicativo Copasa Digital', 'WhatsApp Copasa', 'Telefone 115', 'Agência presencial'],
      howTo: [
        'Acesse a Agência Virtual ou o app Copasa Digital.',
        'Escolha a opção de segunda via de conta.',
        'Informe os dados solicitados, como CPF/CNPJ, matrícula ou identificador da conta.',
        'Baixe a conta, copie o código de barras ou utilize o QR Code Pix, se disponível.',
      ],
      requiredInfo: ['CPF ou CNPJ do titular', 'Matrícula ou identificador da conta'],
      sourceUrl: 'https://copasaportalprd.azurewebsites.net/Copasa.Portal/home/index',
    },
    {
      slug: 'falta-de-agua',
      title: 'Estou sem água',
      summary: 'Serviço para comunicar falta de água no imóvel ou na região.',
      channels: ['Telefone 115', '0800 0300 115', 'Agência Virtual', 'App Copasa Digital', 'WhatsApp Copasa'],
      howTo: [
        'Verifique se o registro interno do imóvel está aberto.',
        'Confirme se o problema também ocorre em imóveis vizinhos.',
        "Acesse um dos canais da Copasa e informe 'falta de água'.",
        'Tenha em mãos a conta de água, matrícula ou dados do titular.',
        'Anote o número do protocolo.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Matrícula da conta', 'Endereço do imóvel', 'Telefone para contato'],
      priority: 'high',
      sourceUrl: 'https://ouvidoria.copasa.com.br/',
    },
    {
      slug: 'vazamento-agua-rua',
      title: 'Vazamento de água na rua',
      summary:
        'Use este serviço quando houver água escorrendo na rua, calçada, passeio, rede pública ou próximo ao hidrômetro.',
      channels: ['Telefone 115', '0800 0300 115', 'Agência Virtual', 'App Copasa Digital', 'WhatsApp Copasa'],
      howTo: [
        'Identifique o local exato do vazamento.',
        'Informe ponto de referência, bairro e rua.',
        'Se possível, envie foto pelo canal digital.',
        'Anote o protocolo de atendimento.',
      ],
      requiredInfo: ['Endereço completo', 'Ponto de referência', 'Descrição do problema'],
      priority: 'high',
      sourceUrl: 'https://denuncias.copasa.com.br/',
    },
    {
      slug: 'vazamento-esgoto',
      title: 'Vazamento ou retorno de esgoto',
      summary:
        'Serviço para comunicar retorno de esgoto, entupimento ou vazamento na rede pública de esgotamento sanitário.',
      channels: ['Telefone 115', '0800 0300 115', 'Agência Virtual', 'App Copasa Digital', 'WhatsApp Copasa'],
      howTo: [
        'Informe se o problema está dentro do imóvel, no passeio ou na rua.',
        'Descreva se há mau cheiro, esgoto retornando ou tampa de poço extravasando.',
        'Informe endereço completo e ponto de referência.',
        'Anote o protocolo.',
      ],
      requiredInfo: ['Endereço completo', 'Ponto de referência', 'Descrição do problema', 'Telefone para contato'],
      priority: 'high',
      sourceUrl: 'https://ouvidoria.copasa.com.br/',
    },
    {
      slug: 'religacao-agua',
      title: 'Religação de água',
      summary: 'Serviço para solicitar o restabelecimento do abastecimento quando o fornecimento foi suspenso.',
      channels: ['Agência Virtual', 'App Copasa Digital', 'WhatsApp Copasa', 'Telefone 115', 'Agência presencial'],
      howTo: [
        'Verifique se há débitos pendentes.',
        'Regularize a situação, quando o corte tiver sido por falta de pagamento.',
        'Solicite a religação por um canal oficial.',
        'Informe CPF/CNPJ, matrícula e endereço do imóvel.',
        'Anote o protocolo e acompanhe o prazo informado.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Matrícula da conta', 'Endereço do imóvel', 'Comprovante de pagamento, se solicitado'],
      sourceUrl: 'https://novaconta.copasa.com.br/',
    },
    {
      slug: 'troca-titularidade',
      title: 'Troca de titularidade',
      summary: 'Altera o nome do responsável pela conta de água e esgoto.',
      channels: ['Agência Virtual', 'WhatsApp Copasa', 'Agência presencial'],
      howTo: [
        'Acesse a Agência Virtual ou entre em contato pelo WhatsApp.',
        'Solicite mudança de titularidade.',
        'Informe os dados do imóvel e do novo titular.',
        'Envie os documentos solicitados.',
      ],
      requiredInfo: ['CPF ou CNPJ do novo titular', 'Documento de identificação', 'Matrícula da conta', 'Documento de vínculo com o imóvel, quando solicitado'],
      sourceUrl: 'https://ouvidoria.copasa.com.br/',
    },
    {
      slug: 'parcelamento-debitos',
      title: 'Parcelamento de débitos',
      summary: 'Permite negociar contas em atraso de água e esgoto, conforme regras vigentes da Copasa.',
      channels: ['Agência Virtual', 'WhatsApp Copasa', 'Telefone 115', 'Agência presencial'],
      howTo: [
        'Consulte os débitos em aberto.',
        'Verifique as opções de parcelamento disponíveis.',
        'Confirme as condições antes de aceitar.',
        'Guarde o comprovante e o protocolo.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Matrícula da conta', 'Dados do titular'],
      sourceUrl: 'https://www.mg.gov.br/instituicao_unidade/agencia-de-atendimento-621',
    },
    {
      slug: 'autoleitura-hidrometro',
      title: 'Informar autoleitura do hidrômetro',
      summary: 'Serviço para informar a leitura do hidrômetro quando necessário.',
      channels: ['Agência Virtual', 'App Copasa Digital', 'WhatsApp Copasa'],
      howTo: [
        'Verifique os números pretos do hidrômetro.',
        'Acesse um canal digital da Copasa.',
        'Escolha a opção de autoleitura.',
        'Informe a leitura e confirme os dados do imóvel.',
      ],
      requiredInfo: ['Matrícula da conta', 'Leitura atual do hidrômetro', 'CPF ou CNPJ, se solicitado'],
      sourceUrl: 'https://novaconta.copasa.com.br/',
    },
    {
      slug: 'conta-por-email',
      title: 'Conta por e-mail',
      summary: 'Serviço para receber a conta de água e esgoto por e-mail.',
      channels: ['Agência Virtual', 'App Copasa Digital', 'WhatsApp Copasa'],
      howTo: [
        'Acesse um canal digital da Copasa.',
        'Escolha a opção de conta por e-mail ou atualização cadastral.',
        'Informe o e-mail correto.',
        'Confirme a solicitação.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Matrícula da conta', 'E-mail válido'],
      sourceUrl: 'https://novaconta.copasa.com.br/',
    },
    {
      slug: 'certidao-negativa-debito',
      title: 'Certidão negativa de débito',
      summary: 'Documento que informa se existem ou não débitos vinculados à matrícula do imóvel.',
      channels: ['App Copasa Digital', 'Agência Virtual', 'Agência presencial'],
      howTo: [
        'Acesse a Agência Virtual ou app Copasa Digital.',
        'Selecione a opção de certidão negativa de débito.',
        'Informe os dados solicitados.',
        'Emita ou baixe o documento.',
      ],
      requiredInfo: ['CPF ou CNPJ', 'Matrícula da conta'],
      sourceUrl: 'https://play.google.com/store/apps/details?id=br.com.copasa.copasadigital.app',
    },
    {
      slug: 'tarifa-social',
      title: 'Tarifa Social da Copasa',
      summary:
        'Benefício para famílias em situação de vulnerabilidade, com desconto na conta de água e esgoto conforme critérios de renda e cadastro social.',
      currentRules2026: {
        socialTariff1:
          'Famílias em situação de extrema pobreza, com renda por pessoa igual ou inferior a R$ 218,00 conforme CadÚnico, têm desconto de 65% sobre o valor total da conta.',
        socialTariff2:
          'Famílias de baixa renda, com renda mensal de até meio salário mínimo por pessoa, têm desconto de 55% na tarifa fixa e 50% na parte variável do consumo.',
        bpc: 'Famílias com beneficiários do BPC também podem se enquadrar, conforme critérios vigentes.',
      },
      channels: ['WhatsApp Copasa', 'Webchat no site da Copasa', 'Agência presencial'],
      howTo: [
        'Mantenha o CadÚnico atualizado no CRAS.',
        'Separe documento de identidade, CPF e conta de água da residência.',
        'Separe comprovante de inscrição no CadÚnico ou documento comprobatório do BPC.',
        'Solicite a inclusão pelo WhatsApp, Webchat ou agência presencial.',
        'Aguarde a análise da documentação.',
      ],
      requiredInfo: ['Documento de identidade', 'CPF', 'Conta de água da residência', 'Comprovante de inscrição no CadÚnico ou comprovante do BPC'],
      sourceUrl: 'https://news.copasa.com.br/copasa-implanta-nova-modalidade-de-tarifa-social-com-descontos-definidos-pela-arsae-mg/',
    },
  ],
  localSanitationData: {
    title: 'Dados de saneamento de Carmo do Rio Claro',
    source: 'Instituto Água e Saneamento / SINISA 2023 / IBGE',
    providerInfo: {
      waterProvider: 'Companhia de Saneamento de Minas Gerais - COPASA',
      sewageProvider: 'Companhia de Saneamento de Minas Gerais - COPASA',
      legalNature: 'Sociedade de economia mista',
      operatingArea: 'Com delegação atendendo sede e localidades',
    },
    waterSupply: {
      publicWaterServiceCoverage: '66,9% da população total',
      peopleWithPublicWaterService: 14168,
      averageWaterTariff: 'R$ 6,30 por m³',
      averagePerCapitaConsumption: '175,6 litros por habitante/dia',
      distributionLossIndex: '19,8%',
      hydrometerCoverage: '99,9%',
    },
    sewage: {
      publicSewageServiceCoverage: '64,8% da população total',
      peopleWithPublicSewageService: 13716,
      sewageCollectionIndex: '76,2%',
      sewageTreatmentOfCollectedVolume: '100%',
      sewageTreatmentOfGeneratedVolume: '76,2%',
      untreatedSewageReleasedIn2022: '214,6 mil m³',
    },
    sourceUrl: 'https://www.aguaesaneamento.org.br/municipios-e-saneamento/mg/carmo-do-rio-claro',
  },
  safetyAndUsefulGuides: [
    {
      title: 'Vazamento na rua',
      text:
        'Informe o endereço completo, ponto de referência e, se possível, envie foto pelo canal digital. Não tente abrir buracos, mexer em registros públicos ou quebrar calçadas por conta própria.',
      priority: 'high',
    },
    {
      title: 'Falta de água',
      text:
        'Antes de registrar, verifique se o registro do imóvel está aberto e se vizinhos também estão sem água. Isso ajuda a identificar se o problema é interno ou da rede.',
      priority: 'high',
    },
    {
      title: 'Retorno de esgoto',
      text:
        'Evite contato com o esgoto, mantenha crianças e animais afastados e registre a ocorrência imediatamente nos canais oficiais.',
      priority: 'high',
    },
    {
      title: 'Conta muito alta',
      text:
        'Verifique histórico de consumo, possíveis vazamentos internos, leitura do hidrômetro e solicite esclarecimento à Copasa se houver divergência.',
      priority: 'medium',
    },
    {
      title: 'Guarde o protocolo',
      text:
        'Sempre anote o número de protocolo. Ele é necessário para acompanhar a solicitação e também para acionar a Ouvidoria, se o problema não for resolvido.',
      priority: 'medium',
    },
  ],
  faq: [
    {
      question: 'Qual é o telefone da Copasa em Carmo do Rio Claro?',
      answer: 'O telefone principal da Copasa é 115. Também há o 0800 0300 115, informado pela companhia como canal telefônico de atendimento.',
    },
    { question: 'Qual é o WhatsApp da Copasa?', answer: 'O WhatsApp da Copasa é (31) 99770-7000.' },
    {
      question: 'A Copasa atende 24 horas?',
      answer: 'A Central Telefônica, a Agência Virtual e o aplicativo Copasa Digital funcionam 24 horas. O WhatsApp e o Webchat têm horários específicos de atendimento.',
    },
    {
      question: 'Onde fica a agência da Copasa em Carmo do Rio Claro?',
      answer: 'Segundo o Portal MG, a agência fica na Leonardo Bernardo Carielo, S/Nº, Jardim América, Carmo do Rio Claro/MG. Como a página foi atualizada em 2021, confirme antes pelo 115 ou pela conta de água.',
    },
    {
      question: 'Como pedir segunda via da Copasa?',
      answer: 'A segunda via pode ser emitida pela Agência Virtual, aplicativo Copasa Digital, WhatsApp, telefone 115 ou atendimento presencial.',
    },
    {
      question: 'Como comunicar falta de água?',
      answer: 'Use o telefone 115, 0800 0300 115, Agência Virtual, app Copasa Digital ou WhatsApp. Tenha em mãos a matrícula da conta, endereço e dados do titular.',
    },
    {
      question: 'Como informar vazamento de água?',
      answer: 'Registre pelos canais oficiais da Copasa, informando endereço completo, ponto de referência e descrição do vazamento.',
    },
    {
      question: 'Quando devo acionar a Ouvidoria da Copasa?',
      answer: 'Quando o atendimento anterior não for resolvido no prazo, o serviço for mal executado ou você discordar da resposta recebida. Tenha o protocolo em mãos.',
    },
    {
      question: 'Quem tem direito à Tarifa Social da Copasa?',
      answer: 'Famílias inscritas no CadÚnico dentro dos critérios de renda e beneficiários do BPC podem ter direito, conforme as regras vigentes da Arsae-MG e da Copasa.',
    },
    {
      question: 'Quais documentos preciso para Tarifa Social?',
      answer: 'Documento de identidade, CPF, conta de água da residência e comprovante do CadÚnico ou documento comprobatório do BPC.',
    },
  ],
  seo: {
    title: 'Copasa Carmo do Rio Claro: telefone, segunda via, falta de água e atendimento',
    description:
      'Veja telefone da Copasa em Carmo do Rio Claro, WhatsApp, segunda via, falta de água, vazamentos, religação, tarifa social, agência presencial e Ouvidoria.',
    keywords: [
      'Copasa Carmo do Rio Claro',
      'telefone Copasa Carmo do Rio Claro',
      'Copasa segunda via',
      'Copasa falta de água',
      'Copasa vazamento',
      'Copasa WhatsApp',
      'Copasa 115',
      'Tarifa Social Copasa',
      'agência Copasa Carmo do Rio Claro',
      'Copasa religação',
    ],
  },
  sources: [
    { title: 'Portal MG - Agência de Atendimento Copasa em Carmo do Rio Claro', url: 'https://www.mg.gov.br/instituicao_unidade/agencia-de-atendimento-621' },
    { title: 'Copasa - Agência Virtual', url: 'https://copasaportalprd.azurewebsites.net/Copasa.Portal/home/index' },
    { title: 'Copasa - Canais de relacionamento e horários', url: 'https://news.copasa.com.br/agencias-da-copasa-terao-novos-horarios-de-atendimento-em-marco/' },
    { title: 'Ouvidoria Copasa', url: 'https://ouvidoria.copasa.com.br/' },
    { title: 'Copasa - Nova Conta', url: 'https://novaconta.copasa.com.br/' },
    { title: 'Copasa - Tarifa Social 2026', url: 'https://news.copasa.com.br/copasa-implanta-nova-modalidade-de-tarifa-social-com-descontos-definidos-pela-arsae-mg/' },
    { title: 'Instituto Água e Saneamento - Carmo do Rio Claro', url: 'https://www.aguaesaneamento.org.br/municipios-e-saneamento/mg/carmo-do-rio-claro' },
  ],
  publicationNotes: [
    'Confirmar presencialmente ou pelo 115 se o endereço e horário da agência de Carmo do Rio Claro continuam iguais, pois o Portal MG mostra atualização de 2021.',
    'Não publicar telefone local como único canal; destacar sempre 115, 0800 0300 115, Agência Virtual, app e WhatsApp.',
    'Para informações emergenciais, priorizar telefone 115.',
    'Para Tarifa Social, manter aviso de que regras podem mudar conforme resolução da Arsae-MG.',
  ],
} as const;

export type CopasaInfo = typeof copasaCarmoDoRioClaroSeed;
export type CopasaService = CopasaInfo['services'][number];
