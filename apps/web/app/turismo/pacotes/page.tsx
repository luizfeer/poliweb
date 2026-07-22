import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { listTourPackages } from '@/lib/tourism';

export const metadata = { title: 'Pacotes turísticos - Portal Carmelitano' };

function money(value: number | null): string {
  return value === null
    ? 'Sob consulta'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default async function PacotesPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  const packages = await listTourPackages({ city_id: city.id });

  return (
    <AppFrame>
      <AppHeader chips={['Roteiros', 'Pesca', 'Furnas']} />
      <TourismAdminEditBar href="/painel/cidade/turismo/pacotes" />
      <Band variant="paper-card" className="px-3.5 py-4">
        <h1 className="font-display m-0 text-[28px] font-extrabold">Pacotes turísticos</h1>
      </Band>
      <Divider />
      <Band className="space-y-3 px-3.5 py-3">
        {packages.map((item) => (
          <article key={item.id} className="border-ink-100 rounded-md border bg-white p-3">
            <h2 className="m-0 font-sans text-[15px] font-extrabold">{item.title}</h2>
            {item.description && (
              <p className="text-ink-700 m-0 mt-1 text-[13px]">{item.description}</p>
            )}
            <p className="text-ink-600 m-0 mt-2 text-[12px]">
              {item.durationHours ?? '?'}h · {money(item.price)}
            </p>
          </article>
        ))}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
