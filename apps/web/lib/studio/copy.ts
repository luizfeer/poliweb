import type { BusinessContext, KindId, RamoId } from './types';

export type FichaCell = { icon: string; lbl: string; val: string; small?: string };
export type VitrineItem = { name: string; price: string; meta: string; label: string };
export type HorarioRow = { day: string; hours: string };
export type HorarioCopy = { titulo: string; sub: string; rows: HorarioRow[]; note: string };
export type PixCopy = { titulo: string; sub: string; key: string; keyLabel: string; holder: string; foot: string };
export type DepoimentoCopy = { tag: string; quote: string; author: string; stars: string; foot: string };

export type RamoCopy = {
  brand: string;
  handle: string;
  cidade: string;
  bairro: string;
  hero: { tag: string; headline: string; sub: string; meta: [string, string] };
  vitrine: { titulo: string; subtitulo: string; cols: 2 | 3; items: VitrineItem[] };
  oferta: { tag: string; title: string; de: string; por: string; desconto: string; validade: string; sub: string };
  ficha: { titulo: string; sub: string; cells: FichaCell[] };
  horario: HorarioCopy;
  pix: PixCopy;
  depoimento: DepoimentoCopy;
  novidade: { tag: string; titulo: string; texto: string; meta: string };
  roteiro?: { titulo: string; sub: string; steps: { time: string; label: string; ttl: string }[] };
  cta: { headline: string; sub: string; pills: string[]; button: string };
};

const RESTAURANTE: RamoCopy = {
  brand: 'Cantina da Praça',
  handle: '@cantinadapraca',
  cidade: 'Carmo do Rio Claro',
  bairro: 'Centro',
  hero: {
    tag: 'Hoje tem',
    headline: 'Almoço que lembra a casa da vó',
    sub: 'Buffet livre com leitoa pururuca, frango caipira e o tutu que todo mundo volta pra repetir.',
    meta: ['Sábado e domingo · 11h às 15h', 'Praça Getúlio Vargas · Centro'],
  },
  vitrine: {
    titulo: 'O que sai mais',
    subtitulo: 'Peça no balcão ou chame no WhatsApp — a gente leva quentinho.',
    cols: 3,
    items: [
      { name: 'Prato feito', price: 'R$ 28', meta: 'Arroz, feijão e mais', label: 'Foto · prato' },
      { name: 'Tutu à mineira', price: 'R$ 36', meta: 'Da casa', label: 'Foto · tutu' },
      { name: 'Frango caipira', price: 'R$ 42', meta: 'Serve dois', label: 'Foto · frango' },
      { name: 'Costela na panela', price: 'R$ 48', meta: 'Sai 12h', label: 'Foto · costela' },
      { name: 'Pão de queijo', price: 'R$ 12', meta: 'A dúzia', label: 'Foto · pão' },
      { name: 'Doce de leite', price: 'R$ 9', meta: 'Sobremesa', label: 'Foto · doce' },
    ],
  },
  oferta: {
    tag: 'Só no sábado',
    title: 'Feijoada completa + caldo de cana',
    de: 'R$ 54,90',
    por: 'R$ 39,90',
    desconto: '27% off',
    validade: 'Sábado, até acabar · Pix ou cartão',
    sub: 'Reserve sua mesa pelo WhatsApp e chegue com fome.',
  },
  ficha: {
    titulo: 'Bom saber',
    sub: 'Pra você não perder a viagem.',
    cells: [
      { icon: 'Clock', lbl: 'Horário', val: '11–15h' },
      { icon: 'Truck', lbl: 'Entrega', val: 'Centro' },
      { icon: 'CreditCard', lbl: 'Pagamento', val: 'Pix' },
      { icon: 'Users', lbl: 'Capacidade', val: '60', small: 'lugares' },
    ],
  },
  novidade: {
    tag: 'Saiu do forno',
    titulo: 'Agora a gente entrega no seu bairro',
    texto: 'Fechamos parceria com os motoboys da cidade. Pediu até 14h, chega quentinho na sua porta.',
    meta: 'A partir de hoje · pedido mínimo R$ 30',
  },
  horario: {
    titulo: 'Quando a cozinha tá aberta',
    sub: 'Chega com fome no nosso horário.',
    rows: [
      { day: 'Ter a sex', hours: '11h às 15h' },
      { day: 'Sáb e dom', hours: '11h às 16h' },
      { day: 'Segunda', hours: 'Fechado' },
    ],
    note: 'Cozinha fecha 30 min antes.',
  },
  pix: {
    titulo: 'Pode pagar no Pix',
    sub: 'Sem taxa e cai na hora.',
    key: 'sua-chave-pix',
    keyLabel: 'Chave Pix',
    holder: 'Cantina da Praça',
    foot: 'Mostre o comprovante no caixa.',
  },
  depoimento: {
    tag: 'Quem comeu, voltou',
    quote: 'Comida de verdade, tempero de casa de vó. O tutu é imperdível!',
    author: 'Cliente do portal',
    stars: '★★★★★',
    foot: 'Avaliação real de cliente.',
  },
  cta: {
    headline: 'Bateu a fome?',
    sub: 'Chama no WhatsApp que a gente separa sua mesa ou manda entregar.',
    pills: ['Entrega no Centro', 'Pix e cartão', 'Feito na hora', 'Reserva de mesa'],
    button: 'Pedir no WhatsApp',
  },
};

const LOJA: RamoCopy = {
  brand: 'Maria Bonita Modas',
  handle: '@mariabonitamodas',
  cidade: 'Carmo do Rio Claro',
  bairro: 'Rua do Comércio',
  hero: {
    tag: 'Chegou coleção nova',
    headline: 'Inverno na praça, do seu jeito',
    sub: 'Tricô, jaqueta e bota pra encarar o friozinho da serra sem perder o estilo.',
    meta: ['Parcelamos em 4x', 'Rua do Comércio, 212 · Centro'],
  },
  vitrine: {
    titulo: 'Acabou de chegar',
    subtitulo: 'Passe na loja pra provar — separamos seu número.',
    cols: 2,
    items: [
      { name: 'Tricô gola alta', price: 'R$ 119', meta: 'P ao GG', label: 'Foto · tricô' },
      { name: 'Jaqueta jeans', price: 'R$ 189', meta: 'Forrada', label: 'Foto · jaqueta' },
      { name: 'Bota cano curto', price: 'R$ 229', meta: '34 ao 39', label: 'Foto · bota' },
      { name: 'Lenço estampado', price: 'R$ 49', meta: 'Vários tons', label: 'Foto · lenço' },
    ],
  },
  oferta: {
    tag: 'Liquida de inverno',
    title: 'Segunda peça com metade do preço',
    de: 'R$ 240',
    por: 'R$ 180',
    desconto: 'Leve 2',
    validade: 'Até sábado · na loja e no WhatsApp',
    sub: 'Vale pra coleção passada. Enquanto durar o estoque.',
  },
  ficha: {
    titulo: 'Como comprar',
    sub: 'Do jeito que for melhor pra você.',
    cells: [
      { icon: 'CreditCard', lbl: 'Parcela', val: '4x', small: 'sem juros' },
      { icon: 'Truck', lbl: 'Entrega', val: 'Grátis', small: 'no Centro' },
      { icon: 'Clock', lbl: 'Aberto', val: '9–18h' },
      { icon: 'MessageCircle', lbl: 'Provador', val: 'Vídeo' },
    ],
  },
  novidade: {
    tag: 'Novidade',
    titulo: 'Agora tem provador por chamada de vídeo',
    texto: 'Sem tempo de passar na loja? A gente mostra as peças por vídeo e reserva o que você gostar.',
    meta: 'Chame no WhatsApp pra agendar',
  },
  horario: {
    titulo: 'Quando a loja abre',
    sub: 'Passe pra provar com calma.',
    rows: [
      { day: 'Seg a sex', hours: '09h às 18h' },
      { day: 'Sábado', hours: '09h às 13h' },
      { day: 'Domingo', hours: 'Fechado' },
    ],
    note: 'WhatsApp responde fora do horário.',
  },
  pix: {
    titulo: 'Pague no Pix',
    sub: 'Confirma na hora e já reserva sua peça.',
    key: 'sua-chave-pix',
    keyLabel: 'Chave Pix',
    holder: 'Maria Bonita Modas',
    foot: 'Mande o comprovante no WhatsApp.',
  },
  depoimento: {
    tag: 'Quem provou, levou',
    quote: 'Peças lindas e atendimento que ajuda de verdade a escolher. Recomendo!',
    author: 'Cliente do portal',
    stars: '★★★★★',
    foot: 'Avaliação real de cliente.',
  },
  cta: {
    headline: 'Vem ver de pertinho',
    sub: 'Manda mensagem que a gente separa seu número e mostra as novidades.',
    pills: ['4x sem juros', 'Troca fácil', 'Entrega no Centro', 'Provador em casa'],
    button: 'Chamar no WhatsApp',
  },
};

const SERVICOS: RamoCopy = {
  brand: 'Espaço Bela Flor',
  handle: '@espacobelaflor',
  cidade: 'Carmo do Rio Claro',
  bairro: 'Bairro Santa Cruz',
  hero: {
    tag: 'Agenda aberta',
    headline: 'Seu cabelo pronto pra festa',
    sub: 'Corte, escova e maquiagem com hora marcada. Sai daqui linda pro casamento, formatura ou só pra você.',
    meta: ['Terça a sábado · com hora', 'Bairro Santa Cruz · Carmo'],
  },
  vitrine: {
    titulo: 'Nossos serviços',
    subtitulo: 'Agende pelo WhatsApp e escolha seu horário.',
    cols: 2,
    items: [
      { name: 'Corte feminino', price: 'R$ 60', meta: 'Com finalização', label: 'Foto · corte' },
      { name: 'Escova', price: 'R$ 45', meta: 'Modeladora', label: 'Foto · escova' },
      { name: 'Maquiagem', price: 'R$ 120', meta: 'Festa', label: 'Foto · maquiagem' },
      { name: 'Manicure e pé', price: 'R$ 55', meta: 'Combo', label: 'Foto · unhas' },
    ],
  },
  oferta: {
    tag: 'Promoção da semana',
    title: 'Dia da noiva com café da manhã',
    de: 'R$ 690',
    por: 'R$ 540',
    desconto: '22% off',
    validade: 'Agende para junho ou julho',
    sub: 'Cabelo, maquiagem e unhas, sem pressa, no seu dia.',
  },
  ficha: {
    titulo: 'Como funciona',
    sub: 'Atendimento com hora pra você não esperar.',
    cells: [
      { icon: 'Clock', lbl: 'Horário', val: '9–19h' },
      { icon: 'MessageCircle', lbl: 'Agenda', val: 'Online' },
      { icon: 'CreditCard', lbl: 'Pagamento', val: 'Pix' },
      { icon: 'Star', lbl: 'Avaliação', val: '4,9' },
    ],
  },
  novidade: {
    tag: 'Agenda de junho',
    titulo: 'Abrimos os horários de festa junina',
    texto: 'É época de arraiá e a agenda enche rápido. Garanta já seu horário de penteado e maquiagem.',
    meta: 'Vagas limitadas · agende pelo WhatsApp',
  },
  horario: {
    titulo: 'Horário de atendimento',
    sub: 'Atendemos com hora marcada.',
    rows: [
      { day: 'Ter a sex', hours: '09h às 19h' },
      { day: 'Sábado', hours: '08h às 17h' },
      { day: 'Dom e seg', hours: 'Fechado' },
    ],
    note: 'Agende pra garantir seu horário.',
  },
  pix: {
    titulo: 'Pode pagar no Pix',
    sub: 'Confirma o agendamento na hora.',
    key: 'sua-chave-pix',
    keyLabel: 'Chave Pix',
    holder: 'Espaço Bela Flor',
    foot: 'Envie o comprovante pra confirmar.',
  },
  depoimento: {
    tag: 'Quem se cuidou aqui, ama',
    quote: 'Saí de lá me sentindo nova. Profissionais atenciosas e caprichosas!',
    author: 'Cliente do portal',
    stars: '★★★★★',
    foot: 'Avaliação real de cliente.',
  },
  cta: {
    headline: 'Bora marcar?',
    sub: 'Me chama no WhatsApp que a gente acha o melhor horário pra você.',
    pills: ['Com hora marcada', 'Pix e cartão', 'Estacionamento', '5 anos na cidade'],
    button: 'Agendar no WhatsApp',
  },
};

const POUSADA: RamoCopy = {
  brand: 'Recanto da Furnas',
  handle: '@recantodafurnas',
  cidade: 'Carmo do Rio Claro',
  bairro: 'Beira da represa',
  hero: {
    tag: 'Reserve já',
    headline: 'Acorde com a represa na janela',
    sub: "Chalés à beira d'água, café da manhã caseiro e pôr do sol no deck. O sossego que a cidade grande não tem.",
    meta: ['Beira da represa · Furnas', 'Diárias a partir de R$ 380'],
  },
  vitrine: {
    titulo: 'Onde você fica',
    subtitulo: 'Café da manhã incluso em todos. Reserve pelo WhatsApp.',
    cols: 2,
    items: [
      { name: 'Chalé Mirante', price: 'R$ 580', meta: 'Casal · vista plena', label: 'Foto · chalé' },
      { name: 'Suíte Família', price: 'R$ 720', meta: 'Até 4 pessoas', label: 'Foto · suíte' },
      { name: 'Chalé Cerrado', price: 'R$ 380', meta: 'Casal', label: 'Foto · chalé' },
      { name: 'Bangalô do Lago', price: 'R$ 640', meta: 'Casal · varanda', label: 'Foto · bangalô' },
    ],
  },
  oferta: {
    tag: 'Fora de temporada',
    title: '3 diárias pelo preço de 2',
    de: 'R$ 1.140',
    por: 'R$ 760',
    desconto: 'Pague 2',
    validade: 'Domingo a quinta · até agosto',
    sub: 'Some o feriado e fuja da correria por uns dias.',
  },
  ficha: {
    titulo: 'O que está incluso',
    sub: 'Tudo na diária, sem pegadinha.',
    cells: [
      { icon: 'Coffee', lbl: 'Café da manhã', val: 'Incluso' },
      { icon: 'Wifi', lbl: 'Wi-Fi', val: '200 mb' },
      { icon: 'Waves', lbl: 'Piscina', val: 'Aquecida' },
      { icon: 'Car', lbl: 'Estacionamento', val: 'Coberto' },
    ],
  },
  roteiro: {
    titulo: 'Um dia por aqui',
    sub: 'Do café na varanda ao pôr do sol no deck.',
    steps: [
      { time: '08:00', label: 'Manhã', ttl: 'Café caseiro com pão na chapa e bolo de fubá' },
      { time: '10:00', label: 'Lago', ttl: 'Caiaque e banho na prainha particular' },
      { time: '13:00', label: 'Almoço', ttl: "Peixe da represa na beira d'água" },
      { time: '17:30', label: 'Deck', ttl: 'Pôr do sol com a represa toda dourada' },
    ],
  },
  novidade: {
    tag: 'Novidade no recanto',
    titulo: 'Agora alugamos lancha pra passeio',
    texto: 'Quer conhecer as ilhas e cachoeiras de barco? Reserve a lancha junto com a sua diária.',
    meta: 'Saídas com piloto · combine na reserva',
  },
  horario: {
    titulo: 'Check-in e check-out',
    sub: 'Pra você se programar com folga.',
    rows: [
      { day: 'Check-in', hours: 'a partir das 14h' },
      { day: 'Check-out', hours: 'até 12h' },
      { day: 'Recepção', hours: '08h às 20h' },
    ],
    note: 'Late check-out sob consulta.',
  },
  pix: {
    titulo: 'Reserve com Pix',
    sub: 'Garanta a diária na hora, sem taxa.',
    key: 'sua-chave-pix',
    keyLabel: 'Chave Pix',
    holder: 'Recanto da Furnas',
    foot: 'Envie o comprovante pra confirmar.',
  },
  depoimento: {
    tag: 'Quem ficou, quer voltar',
    quote: 'Vista de tirar o fôlego e um sossego que renova. Já queremos voltar!',
    author: 'Hóspede do portal',
    stars: '★★★★★',
    foot: 'Avaliação real de hóspede.',
  },
  cta: {
    headline: 'Sua folga começa aqui',
    sub: 'Confere a disponibilidade pelo WhatsApp — a gente responde rapidinho.',
    pills: ['Café incluso', 'Pé na água', 'Pet friendly', 'Estacionamento'],
    button: 'Reservar no WhatsApp',
  },
};

export const STUDIO_COPY: Record<RamoId, RamoCopy> = {
  restaurante: RESTAURANTE,
  loja: LOJA,
  servicos: SERVICOS,
  pousada: POUSADA,
};

// ── Conteúdo por card (override do copy do ramo) ─────────────────────────────
export type SlideContent = {
  brand?: string;
  handle?: string;
  cidade?: string;
  bairro?: string;
  hero?: Partial<RamoCopy['hero']>;
  vitrine?: Partial<RamoCopy['vitrine']>;
  oferta?: Partial<RamoCopy['oferta']>;
  ficha?: Partial<RamoCopy['ficha']>;
  horario?: Partial<HorarioCopy>;
  pix?: Partial<PixCopy>;
  depoimento?: Partial<DepoimentoCopy>;
  novidade?: Partial<RamoCopy['novidade']>;
  roteiro?: Partial<NonNullable<RamoCopy['roteiro']>>;
  cta?: Partial<RamoCopy['cta']>;
};

/** Mapeia o tipo do card para a seção do copy que ele consome. */
export const KIND_SECTION: Record<KindId, keyof SlideContent> = {
  hero: 'hero',
  oferta: 'oferta',
  vitrine: 'vitrine',
  ficha: 'ficha',
  horario: 'horario',
  pix: 'pix',
  depoimento: 'depoimento',
  novidade: 'novidade',
  roteiro: 'roteiro',
  cta: 'cta',
};

/** Funde o conteúdo do card sobre o copy base (seção a seção). */
export function resolveCopy(base: RamoCopy, content?: SlideContent): RamoCopy {
  if (!content) return base;
  const out: RamoCopy = { ...base };
  if (content.brand) out.brand = content.brand;
  if (content.handle) out.handle = content.handle;
  if (content.cidade) out.cidade = content.cidade;
  if (content.bairro) out.bairro = content.bairro;
  if (content.hero) out.hero = { ...base.hero, ...content.hero };
  if (content.vitrine) out.vitrine = { ...base.vitrine, ...content.vitrine };
  if (content.oferta) out.oferta = { ...base.oferta, ...content.oferta };
  if (content.ficha) out.ficha = { ...base.ficha, ...content.ficha };
  if (content.horario) out.horario = { ...base.horario, ...content.horario };
  if (content.pix) out.pix = { ...base.pix, ...content.pix };
  if (content.depoimento) out.depoimento = { ...base.depoimento, ...content.depoimento };
  if (content.novidade) out.novidade = { ...base.novidade, ...content.novidade };
  if (content.roteiro) out.roteiro = base.roteiro ? { ...base.roteiro, ...content.roteiro } : (content.roteiro as NonNullable<RamoCopy['roteiro']>);
  if (content.cta) out.cta = { ...base.cta, ...content.cta };
  return out;
}

/** Semente de conteúdo de um card a partir de um copy (real do comércio ou padrão). */
export function seedSlideContent(kind: KindId, copy?: RamoCopy): SlideContent | undefined {
  if (!copy) return undefined;
  const section = KIND_SECTION[kind];
  const content: SlideContent = {
    brand: copy.brand,
    handle: copy.handle,
    cidade: copy.cidade,
    bairro: copy.bairro,
  };
  const value = copy[section as keyof RamoCopy];
  if (value && section !== 'brand' && section !== 'handle') {
    switch (section) {
      case 'hero':
        content.hero = value as NonNullable<SlideContent['hero']>;
        break;
      case 'vitrine':
        content.vitrine = value as NonNullable<SlideContent['vitrine']>;
        break;
      case 'oferta':
        content.oferta = value as NonNullable<SlideContent['oferta']>;
        break;
      case 'ficha':
        content.ficha = value as NonNullable<SlideContent['ficha']>;
        break;
      case 'horario':
        content.horario = value as NonNullable<SlideContent['horario']>;
        break;
      case 'pix':
        content.pix = value as NonNullable<SlideContent['pix']>;
        break;
      case 'depoimento':
        content.depoimento = value as NonNullable<SlideContent['depoimento']>;
        break;
      case 'novidade':
        content.novidade = value as NonNullable<SlideContent['novidade']>;
        break;
      case 'roteiro':
        content.roteiro = value as NonNullable<SlideContent['roteiro']>;
        break;
      case 'cta':
        content.cta = value as NonNullable<SlideContent['cta']>;
        break;
    }
  }
  return content;
}

// ── Copy derivado dos dados reais do comércio ────────────────────────────────
function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full;
}

function priceLabel(value?: string): string {
  return value && value.trim() ? value : '';
}

/** Monta um RamoCopy preenchido com os dados reais do comércio. */
export function buildBusinessCopy(ctx: BusinessContext): RamoCopy {
  const base = STUDIO_COPY[ctx.ramo];
  const handle = ctx.handle;
  const cidade = ctx.cidade || base.cidade;
  const bairro = ctx.district || ctx.address || base.bairro;
  const products = ctx.products.slice(0, 6);
  const cols: 2 | 3 = products.length >= 5 || ctx.ramo === 'restaurante' ? 3 : 2;

  const vitrineItems: VitrineItem[] = products.length
    ? products.map((p) => ({
        name: p.name,
        price: priceLabel(p.price),
        meta: p.meta ?? '',
        label: '',
      }))
    : base.vitrine.items;

  const review = ctx.reviews[0];
  const hoursRows: HorarioRow[] = ctx.hoursText.length ? ctx.hoursText : base.horario.rows;

  const contactWpp = ctx.whatsapp || ctx.phone;
  const ficheCells: FichaCell[] = [];
  if (hoursRows.length) ficheCells.push({ icon: 'Clock', lbl: 'Horário', val: hoursRows[0].hours });
  if (ctx.payments.length) ficheCells.push({ icon: 'CreditCard', lbl: 'Pagamento', val: ctx.payments.slice(0, 2).join(', ') });
  if (contactWpp) ficheCells.push({ icon: 'MessageCircle', lbl: 'Contato', val: 'WhatsApp' });
  if (ctx.address) ficheCells.push({ icon: 'MapPin', lbl: 'Onde fica', val: bairro });
  const cells = ficheCells.length >= 2 ? ficheCells.slice(0, 4) : base.ficha.cells;

  return {
    brand: ctx.name,
    handle,
    cidade,
    bairro,
    hero: {
      tag: base.hero.tag,
      headline: ctx.name,
      sub: ctx.description?.slice(0, 160) || base.hero.sub,
      meta: [hoursRows[0] ? `${hoursRows[0].day} · ${hoursRows[0].hours}` : base.hero.meta[0], bairro],
    },
    vitrine: {
      titulo: base.vitrine.titulo,
      subtitulo: contactWpp ? 'Chame no WhatsApp pra pedir ou reservar.' : base.vitrine.subtitulo,
      cols,
      items: vitrineItems,
    },
    oferta: { ...base.oferta },
    ficha: { titulo: base.ficha.titulo, sub: base.ficha.sub, cells },
    horario: {
      titulo: base.horario.titulo,
      sub: base.horario.sub,
      rows: hoursRows,
      note: ctx.hoursNote || base.horario.note,
    },
    pix: {
      ...base.pix,
      key: ctx.pixKey || base.pix.key,
      holder: ctx.name,
    },
    depoimento: review
      ? {
          tag: base.depoimento.tag,
          quote: review.comment.slice(0, 220),
          author: firstName(review.author),
          stars: '★★★★★'.slice(0, Math.max(1, Math.min(5, review.rating))),
          foot: 'Avaliação real publicada no portal.',
        }
      : { ...base.depoimento },
    novidade: { ...base.novidade },
    roteiro: base.roteiro ? { ...base.roteiro } : undefined,
    cta: {
      ...base.cta,
      pills: ctx.amenities.length ? ctx.amenities.slice(0, 4) : base.cta.pills,
    },
  };
}
