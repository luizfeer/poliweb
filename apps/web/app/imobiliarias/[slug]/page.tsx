import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, Phone } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { PropertyCard } from '@/components/carmo/real-estate';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { getRealtorBySlug, listProperties } from '@/lib/real-estate';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, realEstateAgencyJsonLd } from '@/lib/seo/structured-data';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const realtor = await getRealtorBySlug(slug);
  if (!realtor) return { title: 'Imobiliária não encontrada' };
  return buildMetadata({
    title: `${realtor.name} — Imobiliária em Carmo do Rio Claro/MG`,
    description:
      realtor.about ??
      `Imóveis à venda e para alugar com a ${realtor.name} em Carmo do Rio Claro/MG. Casas, apartamentos, terrenos e chácaras na região de Furnas.`,
    path: `/imobiliarias/${slug}`,
    image: realtor.logoUrl ?? realtor.coverUrl ?? undefined,
    type: 'profile',
  });
}

export default async function RealtorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const realtor = await getRealtorBySlug(slug);
  if (!realtor) notFound();
  const properties = await listProperties({ cityId: realtor.cityId, limit: 48 });
  const ownProperties = properties.filter((property) => property.realtorId === realtor.id);

  const site = resolvePublicSiteOrigin();
  const url = `${site}/imobiliarias/${slug}`;

  return (
    <AppFrame>
      <JsonLdScript
        data={realEstateAgencyJsonLd({
          name: realtor.name,
          url,
          description: realtor.about,
          telephone: realtor.whatsapp ?? realtor.phone,
          image: realtor.logoUrl ?? realtor.coverUrl,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Imobiliárias', url: `${site}/imobiliarias` },
          { name: realtor.name, url },
        ])}
      />
      <AppHeader chips={['Imobiliária', realtor.name]} />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4">
        <div className="flex items-center gap-2">
          <h1 className="m-0 font-display text-[26px] font-extrabold">{realtor.name}</h1>
          {realtor.verified && <BadgeCheck size={20} className="text-sky-700" />}
        </div>
        <p className="m-0 text-[13px] text-ink-700">{realtor.about ?? 'Imobiliária cadastrada no portal.'}</p>
        {(realtor.whatsapp || realtor.phone) && (
          <p className="m-0 inline-flex items-center gap-1 text-[13px] font-bold text-clay-600">
            <Phone size={15} />
            {realtor.whatsapp ?? realtor.phone}
          </p>
        )}
      </Band>
      <Divider />
      <Band className="space-y-3 px-3.5 py-3">
        {ownProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
        {ownProperties.length === 0 && (
          <p className="m-0 rounded-md bg-white p-3 text-[13px] text-ink-700">Nenhum imóvel publicado.</p>
        )}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
