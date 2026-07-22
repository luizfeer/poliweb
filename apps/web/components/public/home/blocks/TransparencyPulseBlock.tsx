import { Band, SectionHeader } from '@/components/carmo';
import { TransparencyPulseWidget } from '@/components/public/transparency/transparency-pulse-widget';
import { getTransparencySnapshot } from '@/lib/transparency';

type Props = {
  cityId: string;
  cityName: string;
  modules: string[];
  title: string | null;
};

export async function TransparencyPulseBlock({ cityId, cityName, modules, title }: Props) {
  if (!modules.includes('transparency')) return null;

  const snapshot = await getTransparencySnapshot(cityId);
  if (!snapshot) return null;

  return (
    <>
      <SectionHeader
        title={title ?? 'Transparencia em destaque'}
        kicker="Transparencia"
        action={{ label: 'Abrir', href: '/transparencia' }}
      />
      <Band className="px-3.5 pb-3">
        <TransparencyPulseWidget snapshot={snapshot} cityName={cityName} />
      </Band>
    </>
  );
}
