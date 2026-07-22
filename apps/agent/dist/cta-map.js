/**
 * Mapa de query → CTAs. Avaliado em ordem; o primeiro match adiciona seus botões.
 * Várias regras podem casar e os botões serão concatenados (deduplicados por href).
 */
const RULES = [
    // Alimentação / restaurantes
    {
        match: /\brestaurante|delivery|comida|comer|almoçar|jantar|lanche|pizza|pizzaria|pão|padaria|sorvete|bar\b|açougue|mercado|sacolão|conveniência/i,
        buttons: [{ label: 'Ver alimentação', href: '/comercio/alimentacao', variant: 'primary' }],
    },
    // Saúde
    {
        match: /\bfarmác|remédio|médico|dentista|clínica|hospital|consult/i,
        buttons: [{ label: 'Ver saúde', href: '/comercio/saude', variant: 'primary' }],
    },
    // Beleza
    {
        match: /\bsalão|cabel|barbe|estética|manicure|pedicure|unha|maquiag|sobrancelh/i,
        buttons: [{ label: 'Ver beleza', href: '/comercio/beleza', variant: 'primary' }],
    },
    // Casa / construção
    {
        match: /\bmaterial.*construção|loja.*tinta|ferragem|móveis|decoração|eletrodom|reforma/i,
        buttons: [{ label: 'Ver casa', href: '/comercio/casa', variant: 'primary' }],
    },
    // Veículos
    {
        match: /\boficina|mecânic|borracharia|auto.*peça|moto|carro.*venda|posto.*combust/i,
        buttons: [{ label: 'Ver veículos', href: '/comercio/veiculos', variant: 'primary' }],
    },
    // Serviços
    {
        match: /\beletricista|encanador|pedreiro|chaveiro|jardineiro|frete|mudança|conserto/i,
        buttons: [{ label: 'Ver serviços', href: '/comercio/servicos', variant: 'primary' }],
    },
    // Turismo — onde ficar
    {
        match: /\bpousada|hotel|hospedag|onde.*ficar|chalé|airbnb/i,
        buttons: [{ label: 'Onde ficar', href: '/turismo/onde-ficar', variant: 'primary' }],
    },
    // Turismo — o que fazer
    {
        match: /\bpasseio|atra(c|ç)ão|o que fazer|trilha|cachoeira|mirante|ponto turístico/i,
        buttons: [{ label: 'O que fazer', href: '/turismo/o-que-fazer', variant: 'primary' }],
    },
    // Turismo — pesca
    {
        match: /\bpesca|pescar|pescaria|pesqueiro|guia.*pesca|tucunaré|pirarucu/i,
        buttons: [{ label: 'Pesca e guias', href: '/turismo/pesca', variant: 'primary' }],
    },
    // Turismo — pacotes / roteiros
    {
        match: /\bpacote|roteiro|tour|excursão/i,
        buttons: [{ label: 'Pacotes', href: '/turismo/pacotes', variant: 'secondary' }],
    },
    // Eventos / agenda
    {
        match: /\bevento|festa|show|agenda|cultural|fim de semana|sábado|domingo|forró|sertanejo|rodeio/i,
        buttons: [{ label: 'Agenda completa', href: '/agenda', variant: 'primary' }],
    },
    // Notícias
    {
        match: /\bnotíci|nóticia|jornal|últim|novidade|reportagem/i,
        buttons: [{ label: 'Ver notícias', href: '/', variant: 'secondary' }],
    },
    // Comunidade — igrejas / cultos
    {
        match: /\bmissa|culto|celebraç|liturgia|igreja|paróquia|capela/i,
        buttons: [{ label: 'Igrejas e cultos', href: '/comunidade/igrejas', variant: 'primary' }],
    },
    // Classificados
    {
        match: /\bvender|comprar|usado|seminovo|classificado|barganha|troca/i,
        buttons: [{ label: 'Classificados', href: '/classificados', variant: 'primary' }],
    },
    // Imóveis
    {
        match: /\balug(ar|uel)|imóvel|imovel|casa.*venda|terreno|apartamento|chácara/i,
        buttons: [{ label: 'Imóveis', href: '/imoveis', variant: 'primary' }],
    },
    // Balsas / travessia
    {
        match: /\bbalsa|travessia|ferry|itaci|itapiché|águas verdes|aguas verdes/i,
        buttons: [{ label: 'Horários das balsas', href: '/balsas', variant: 'primary' }],
    },
    // Pets / achados / obituários
    {
        match: /\bpet|cachorro|gato|adoção/i,
        buttons: [{ label: 'Pets', href: '/comunidade/pets', variant: 'primary' }],
    },
    {
        match: /\bachad|perdid/i,
        buttons: [{ label: 'Achados e perdidos', href: '/comunidade/achados', variant: 'primary' }],
    },
    {
        match: /\bobituár|óbito|falecim|velório/i,
        buttons: [{ label: 'Obituários', href: '/comunidade/obituarios', variant: 'primary' }],
    },
];
/** Regras para detectar categoria de comércio e gerar CTA de indicação via WhatsApp. */
const REFERRAL_RULES = [
    {
        match: /\brestaurante|delivery|comida|comer|almoçar|jantar|lanche|pizza|pizzaria|pão|padaria|sorvete|bar\b|açougue|mercado|sacolão|conveniência/i,
        categoryLabel: 'alimentação',
    },
    { match: /\bfarmác|remédio|médico|dentista|clínica|hospital|consult/i, categoryLabel: 'saúde' },
    {
        match: /\bsalão|cabel|barbe|estética|manicure|pedicure|unha|maquiag|sobrancelh/i,
        categoryLabel: 'beleza',
    },
    {
        match: /\bmaterial.*construção|loja.*tinta|ferragem|móveis|decoração|eletrodom|reforma/i,
        categoryLabel: 'casa e construção',
    },
    {
        match: /\boficina|mecânic|borracharia|auto.*peça|moto|carro.*venda|posto.*combust/i,
        categoryLabel: 'veículos',
    },
    {
        match: /\beletricista|encanador|pedreiro|chaveiro|jardineiro|frete|mudança|conserto/i,
        categoryLabel: 'serviços',
    },
    { match: /\bpousada|hotel|hospedag|onde.*ficar|chalé|airbnb/i, categoryLabel: 'hospedagem' },
    {
        match: /\bpasseio|atra(c|ç)ão|o que fazer|trilha|cachoeira|mirante|ponto turístico/i,
        categoryLabel: 'turismo',
    },
    { match: /\bpesca|pescar|pescaria|pesqueiro|guia.*pesca/i, categoryLabel: 'pesca' },
    { match: /\bpacote|roteiro|tour|excursão/i, categoryLabel: 'pacotes turísticos' },
    {
        match: /\bevento|festa|show|agenda|cultural|forró|sertanejo|rodeio/i,
        categoryLabel: 'eventos',
    },
    { match: /\bmissa|culto|celebraç|liturgia|igreja|paróquia|capela/i, categoryLabel: 'igrejas' },
    {
        match: /\bvender|comprar|usado|seminovo|classificado|barganha|troca/i,
        categoryLabel: 'classificados',
    },
    {
        match: /\balug(ar|uel)|imóvel|imovel|casa.*venda|terreno|apartamento|chácara/i,
        categoryLabel: 'imóveis',
    },
    { match: /\bpet|cachorro|gato|adoção/i, categoryLabel: 'pets' },
    {
        match: /\bvestido|terno|fantasia|roupa|decoração|buffet|som|dj|foto|filmagem|salão.*festa|bolo|doce|salgado|mesa|cadeira|talher/i,
        categoryLabel: 'eventos e festas',
    },
];
export function ctaForQuery(query) {
    const out = [];
    const seen = new Set();
    for (const rule of RULES) {
        if (!rule.match.test(query))
            continue;
        for (const btn of rule.buttons) {
            if (seen.has(btn.href))
                continue;
            seen.add(btn.href);
            out.push(btn);
        }
    }
    return out;
}
/** Palavras que indicam busca específica de item/serviço — não devem ativar CTA de comércio. */
const REFERRAL_EXCLUSIONS = [
    'vestido',
    'terno',
    'fantasia',
    'roupa',
    'roupas',
    'mesa',
    'cadeira',
    'talher',
    'prato',
    'copo',
    'panela',
    'carro',
    'moto',
    'van',
    'ônibus',
    'onibus',
    'trator',
    'máquina',
    'maquina',
    'equipamento',
    'ferramenta',
    'inflável',
    'inflavel',
    'brinquedo',
    'pula-pula',
    'piscina',
    'iate',
    'barco',
    'lancha',
    'jet',
    'ski',
];
/**
 * Retorna um CTA de recomendação via WhatsApp quando a busca não retorna resultados
 * e detectamos uma categoria de comércio/serviço.
 * A mensagem é uma recomendação pessoal para o dono do comércio.
 */
export function referralCtaForQuery(query, cityName) {
    const normalized = query.toLowerCase();
    // Se tem palavra de exclusão, não sugere CTA de comércio
    if (REFERRAL_EXCLUSIONS.some((w) => normalized.includes(w)))
        return null;
    for (const rule of REFERRAL_RULES) {
        if (rule.match.test(normalized)) {
            const text = encodeURIComponent(`Oi! Vi que tem um portal sobre ${cityName} e pensei em recomendar vocês. Tem como se cadastrar lá?`);
            return {
                label: `Conheço um lugar de ${rule.categoryLabel} — Indicar`,
                href: `https://wa.me/?text=${text}`,
                variant: 'secondary',
            };
        }
    }
    return null;
}
