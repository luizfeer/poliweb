import { Building2 } from 'lucide-react';
import { AppFrame, AppHeader, Band, TabBar } from '@/components/carmo';
import { RealtorCard } from '@/components/carmo/real-estate';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { getCurrentCity } from '@/lib/cities';
import { listRealtors } from '@/lib/real-estate';

export const metadata = { title: 'Imobiliárias - Portal Carmelitano' };

export default async function RealtorsPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  const realtors = await listRealtors(100);

  return (
    <AppFrame>
      <AppHeader chips={['CRECI', 'Venda', 'Aluguel']} />
      <PublicHero
        icon={Building2}
        kicker="Empresas verificadas"
        title="Imobiliárias"
        description={`Imobiliárias cadastradas em ${city.name} para compra, aluguel, temporada e avaliação de imóveis.`}
        tone="sky"
        meta={<PublicHeroPill tone="sky">{realtors.length} imobiliárias</PublicHeroPill>}
      />
      <Band className="space-y-3 px-3.5 py-3">
        {realtors.map((realtor) => (
          <RealtorCard key={realtor.id} realtor={realtor} />
        ))}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
