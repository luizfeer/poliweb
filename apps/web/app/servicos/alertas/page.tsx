import { AlertTriangle, Bell } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { AlertBanner } from '@/components/public/utilities/alert-banner';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import { listActiveAlerts } from '@/lib/utilities/queries';

export const metadata = {
  title: 'Alertas de serviço - Portal Carmelitano',
};

export default async function AlertasPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const alerts = await listActiveAlerts({ city_id: city.id, includeRecentResolved: true });

  return (
    <AppFrame>
      <AppHeader chips={['Água', 'Energia', 'Clima', 'Saúde']} searchHref="/servicos" />
      <Band className="px-3.5 py-4">
        <UtilityHero
          icon={Bell}
          kicker="Alertas de serviço"
          title={`Avisos importantes de ${city.name}`}
          description="Acompanhe interrupções, comunicados ativos e alertas resolvidos nos últimos 30 dias."
          stat={`${alerts.filter((alert) => alert.active).length} ativos · ${alerts.length} no histórico recente`}
          tone={
            alerts.some((alert) => alert.severity === 'critical' && alert.active) ? 'clay' : 'white'
          }
          footer={
            <p className="text-ink-800 m-0 flex gap-2 text-[13px] font-semibold leading-relaxed">
              <AlertTriangle
                className="text-clay-700 mt-0.5 shrink-0"
                size={18}
                aria-hidden="true"
              />
              Em caso de risco imediato, use os canais oficiais de emergência.
            </p>
          }
        />
      </Band>
      <Divider />
      <Band className="space-y-2 px-3.5 py-3">
        {alerts.length === 0 && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
            Nenhum alerta no momento.
          </p>
        )}
        {alerts.map((alert) => (
          <AlertBanner key={alert.id} alert={alert} compact={!alert.active} />
        ))}
      </Band>
      <TabBar
        active="servicos"
        badges={
          alerts.filter((alert) => alert.active).length
            ? { servicos: alerts.filter((alert) => alert.active).length }
            : undefined
        }
      />
    </AppFrame>
  );
}
