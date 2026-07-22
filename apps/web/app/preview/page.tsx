import { Droplet, Fish, HeartPulse, House, PhoneCall, Store, Trash2, Zap } from 'lucide-react';

import {
  AICallout,
  AppFrame,
  AppHeader,
  Band,
  CupomCard,
  Divider,
  HScroll,
  HeroBanner,
  ListItem,
  Logo,
  Pill,
  PousadaCard,
  ProductCard,
  RoundCat,
  SectionHeader,
  TileCard,
} from '@/components/carmo';

/**
 * Showcase do Design System Portal Carmelitano.
 * Use em dev (`/preview`) para inspecionar todos os componentes em uso.
 */
export default function PreviewPage() {
  return (
    <AppFrame>
      <AppHeader />

      <SectionHeader title="Logo" kicker="Brand" />
      <Band variant="paper-card" className="mx-3 flex items-center gap-6 rounded-md px-4 py-4">
        <Logo variant="mark" />
        <Logo variant="lockup" width={140} />
      </Band>

      <Divider />

      <SectionHeader title="Paleta" kicker="Tokens" />
      <div className="grid grid-cols-5 gap-2 px-3.5">
        {[
          ['bg-clay-500', 'clay-500'],
          ['bg-clay-600', 'clay-600'],
          ['bg-cerrado-500', 'cerrado'],
          ['bg-cerrado-700', 'cerrado-700'],
          ['bg-sun-500', 'sun-500'],
          ['bg-sky-700', 'sky-700'],
          ['bg-discount', 'discount'],
          ['bg-ink-900', 'ink-900'],
          ['bg-paper-deep', 'paper-deep'],
          ['bg-paper-card', 'paper-card'],
        ].map(([cls, label]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className={`border-ink-200 h-12 w-12 rounded-md border ${cls}`} />
            <span className="text-ink-600 text-[10px]">{label}</span>
          </div>
        ))}
      </div>

      <Divider />

      <SectionHeader title="Pills" kicker="Components" />
      <div className="flex flex-wrap gap-2 px-3.5">
        <Pill label="Padrão" />
        <Pill label="Ativo" active />
        <Pill icon={Trash2} label="Com ícone" />
        <Pill label="Com chevron" chevron />
      </div>

      <Divider />

      <SectionHeader title="Hero banner" />
      <HeroBanner
        kicker="Conhecendo a Canastra"
        title="Trilhas e cachoeiras pra fim de semana"
        pills={['Trilhas', 'Cachoeiras']}
        accent="cerrado"
      />

      <Divider />

      <SectionHeader title="Round Cats" />
      <HScroll>
        <RoundCat label="Lixo" icon={Trash2} bg="clay" />
        <RoundCat label="Saúde" icon={HeartPulse} bg="cerrado" />
        <RoundCat label="Telefones" icon={PhoneCall} bg="sky" />
        <RoundCat label="Energia" icon={Zap} bg="sun" />
        <RoundCat label="Água" icon={Droplet} bg="paper-deep" />
        <RoundCat label="Pesca" icon={Fish} bg="cerrado" />
        <RoundCat label="Comércio" icon={Store} bg="clay" />
        <RoundCat label="Imóveis" icon={House} bg="sky" />
      </HScroll>

      <Divider />

      <SectionHeader title="Cupons" />
      <HScroll>
        <CupomCard brand="Restaurante Mineirão" off="20%" illo="🍲" />
        <CupomCard brand="Pousada Beira Rio" off="15%" illo="🛏️" />
        <CupomCard brand="Lanchonete do Zé" off="10%" illo="🍔" />
      </HScroll>

      <Divider />

      <SectionHeader title="Tile cards" />
      <HScroll>
        <TileCard title="Coleta na sua rua" subtitle="Ver calendário" illo="🗑ï¸" />
        <TileCard title="Farmácia hoje" subtitle="Plantão até 22h" illo="💊" />
        <TileCard title="Camping kit 4 pessoas" off="20%" illo="⛺" />
      </HScroll>

      <Divider />

      <SectionHeader title="Product cards" />
      <HScroll>
        <ProductCard
          title="Vara de pesca telescópica 3m"
          price="119"
          frac="00"
          off="15%"
          illo="🎣"
        />
        <ProductCard
          title="Botina trilha couro"
          price="259"
          frac="00"
          kicker="Retirada na loja"
          illo="🥾"
        />
        <ProductCard title="Caixa térmica 45L" price="349" frac="90" illo="🧊" />
      </HScroll>

      <Divider />

      <SectionHeader title="Pousadas" />
      <HScroll>
        <PousadaCard
          name="Recanto da Furnas"
          dist="2,4 km · Beira Rio"
          price="320"
          rating={4.8}
          tags={['piscina', 'pesca']}
          illo="🏞️"
        />
        <PousadaCard
          name="Chalés do Mirante"
          dist="6,1 km"
          price="450"
          rating={4.6}
          tags={['café', 'pet']}
          illo="🌅"
        />
      </HScroll>

      <Divider />

      <SectionHeader title="List items" />
      <Band variant="paper-card">
        <ListItem
          icon={Trash2}
          iconBg="clay-50"
          iconFg="clay-600"
          title="Coleta de lixo"
          when="Coleta hoje"
        />
        <ListItem
          icon={HeartPulse}
          iconBg="cerrado-100"
          iconFg="cerrado-700"
          title="UBS Centro"
          sub="Vacinação contra gripe"
        />
        <ListItem
          icon={Droplet}
          iconBg="sky-100"
          iconFg="sky-700"
          title="Falta d'água"
          sub="Vila Nova · sex 8h–14h"
          divider={false}
        />
      </Band>

      <Divider />

      <SectionHeader title="AI callout" kicker="Transparência" />
      <AICallout
        title="Câmara aprovou orçamento da educação"
        body="Esta semana foi aprovado o orçamento de 2026 para educação municipal — 28% à manutenção de escolas, 12% à merenda."
        source={{ label: 'Ver projeto original', href: '#' }}
      />

      <div className="h-12" />
    </AppFrame>
  );
}
