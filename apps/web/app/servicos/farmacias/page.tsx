import { MapPin, Navigation, PhoneCall, Pill } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { PharmacyDutyBanner } from '@/components/public/utilities/pharmacy-duty-banner';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import { getPharmacyOnDuty, listPharmacies } from '@/lib/utilities/queries';

export const metadata = {
  title: 'Farmácias de plantão - Portal Carmelitano',
};

export default async function FarmaciasPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const [duty, pharmacies] = await Promise.all([
    getPharmacyOnDuty({ city_id: city.id }),
    listPharmacies({ city_id: city.id }),
  ]);

  return (
    <AppFrame>
      <AppHeader chips={['Plantão', '24h', 'Centro']} searchHref="/servicos" />
      <Band className="px-3.5 py-4">
        <UtilityHero
          icon={Pill}
          kicker="Farmácias"
          title={`Plantão e farmácias em ${city.name}`}
          description="Veja a farmácia de plantão e a lista de locais para ligar ou abrir no mapa antes de sair."
          stat={`${pharmacies.length} farmácias cadastradas.`}
          tone="sun"
        >
          <section className="border-sun-100 rounded-xl border bg-white p-3">
            <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">Plantão</p>
            <h2 className="text-ink-900 m-0 mt-1 font-sans text-[16px] font-extrabold">
              {duty[0]?.name ?? 'Escala não informada'}
            </h2>
          </section>
        </UtilityHero>
      </Band>
      <PharmacyDutyBanner pharmacies={duty} />
      <Divider className="mt-3" />
      <Band className="space-y-2 px-3.5 py-3">
        {pharmacies.map((pharmacy) => (
          <article
            key={pharmacy.id}
            className="border-ink-100 shadow-card relative overflow-hidden rounded-2xl border bg-white p-4"
          >
            <Pill
              className="text-sun-500/12 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
              aria-hidden="true"
            />
            <h2 className="font-display text-ink-900 relative m-0 text-[17px] font-extrabold">
              {pharmacy.name}
            </h2>
            {pharmacy.address && (
              <p className="text-ink-700 relative m-0 mt-1 flex items-center gap-1.5 text-[13px]">
                <MapPin size={15} />
                {pharmacy.address}
              </p>
            )}
            <div className="relative mt-3 flex gap-2">
              {pharmacy.phone && (
                <a
                  className="bg-clay-500 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-bold text-white no-underline"
                  href={`tel:${pharmacy.phone.replace(/\D/g, '')}`}
                >
                  <PhoneCall size={15} aria-hidden="true" />
                  {pharmacy.phone}
                </a>
              )}
              {pharmacy.googleMapsUrl && (
                <a
                  className="border-ink-100 text-ink-900 inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-[13px] font-bold no-underline"
                  href={pharmacy.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation size={15} aria-hidden="true" />
                  Mapa
                </a>
              )}
            </div>
          </article>
        ))}
      </Band>
      <TabBar active="servicos" />
    </AppFrame>
  );
}
