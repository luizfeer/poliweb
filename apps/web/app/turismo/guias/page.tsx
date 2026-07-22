import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, SectionHeader, TabBar } from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { GuideCard } from '@/components/public/tourism/guide-card';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { listGuides } from '@/lib/tourism';

export const metadata = {
  title: 'Guias de turismo - Portal Carmelitano',
  description:
    'Guias completos sobre Carmo do Rio Claro: distritos, cachoeiras, eventos, roteiros, gastronomia e mais.',
};

export const revalidate = 60;

export default async function GuiasPage() {
  const city = await getCurrentCity();
  if (!city) {
    return (
      <AppFrame>
        <AppHeader chips={['Guias']} />
        <Band className="px-3.5 py-5">
          <h1 className="font-display m-0 text-[22px] font-extrabold">
            Não foi possível carregar a cidade
          </h1>
          <p className="text-ink-700 m-0 mt-2 text-[14px] leading-relaxed">
            Verifique a conexão com o banco (variáveis Supabase) e se existe um registro em{' '}
            <code className="bg-paper-deep rounded px-1 font-mono text-[13px]">public.cities</code>{' '}
            para o slug configurado em{' '}
            <code className="bg-paper-deep rounded px-1 font-mono text-[13px]">
              NEXT_PUBLIC_DEFAULT_CITY_SLUG
            </code>
            .
          </p>
          <p className="m-0 mt-3">
            <Link href="/turismo" className="text-clay-700 text-[14px] font-semibold underline">
              Voltar ao turismo
            </Link>
          </p>
        </Band>
      </AppFrame>
    );
  }

  if (!city.modules.includes('tourism')) {
    return (
      <AppFrame>
        <AppHeader chips={['Guias']} />
        <TourismAdminEditBar href="/painel/cidade/turismo" />
        <Band className="px-3.5 py-5">
          <h1 className="font-display m-0 text-[28px] font-extrabold">Guias de turismo</h1>
          <p className="text-ink-700 m-0 mt-2 rounded-md border bg-white p-4 text-[14px]">
            O módulo de turismo ainda não está ativo nesta cidade.
          </p>
        </Band>
      </AppFrame>
    );
  }

  const guides = await listGuides({ city_id: city.id });

  const featured = guides.filter((g) => g.featured);
  const byKind = {
    distrito: guides.filter((g) => g.kind === 'distrito'),
    cidade: guides.filter((g) => g.kind === 'cidade'),
    tematico: guides.filter((g) => g.kind === 'tematico'),
    roteiro: guides.filter((g) => g.kind === 'roteiro'),
  };

  return (
    <AppFrame>
      <AppHeader chips={['Guias', 'Roteiros', 'Dicas']} />
      <TourismAdminEditBar href="/painel/cidade/turismo" />

      <PublicHero
        icon={BookOpen}
        kicker="Guias locais"
        title="Guias de turismo"
        description={`Tudo sobre ${city.name}: distritos, cachoeiras, eventos, onde comer, onde ficar e mais.`}
        tone="green"
        meta={
          <>
            <PublicHeroPill tone="green">{guides.length} guias</PublicHeroPill>
            <PublicHeroPill tone="paper">{featured.length} destaques</PublicHeroPill>
          </>
        }
      />

      {featured.length > 0 && (
        <>
          <SectionHeader title="Em destaque" />
          <Band className="space-y-2 px-3.5 pb-3">
            {featured.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Band>
          <Divider />
        </>
      )}

      {byKind.distrito.length > 0 && (
        <>
          <SectionHeader title="Distritos" />
          <Band className="space-y-2 px-3.5 pb-3">
            {byKind.distrito.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Band>
          <Divider />
        </>
      )}

      {byKind.tematico.length > 0 && (
        <>
          <SectionHeader title="Guias temáticos" />
          <Band className="space-y-2 px-3.5 pb-3">
            {byKind.tematico.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Band>
          <Divider />
        </>
      )}

      {byKind.roteiro.length > 0 && (
        <>
          <SectionHeader title="Roteiros" />
          <Band className="space-y-2 px-3.5 pb-3">
            {byKind.roteiro.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Band>
          <Divider />
        </>
      )}

      {byKind.cidade.length > 0 && (
        <>
          <SectionHeader title="Sobre a cidade" />
          <Band className="space-y-2 px-3.5 pb-3">
            {byKind.cidade.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Band>
        </>
      )}

      {guides.length === 0 && (
        <Band className="px-3.5 pb-6">
          <p className="border-ink-100 text-ink-700 m-0 rounded-md border bg-white p-4 text-[14px]">
            Ainda não há guias publicados para esta cidade. Se você é da equipe, cadastre no painel
            em{' '}
            <Link href="/painel/cidade/turismo" className="text-clay-700 font-semibold underline">
              Turismo (cidade)
            </Link>
            .
          </p>
        </Band>
      )}
      <TabBar active="home" />
    </AppFrame>
  );
}
