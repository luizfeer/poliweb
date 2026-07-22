import { Recycle, Trash2 } from 'lucide-react';
import type { GarbageSchedule, GarbageScheduleByDay } from '@/lib/utilities/types';

type GarbageWeekGridProps = {
  schedule: GarbageScheduleByDay;
};

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TYPE_LABEL: Record<string, string> = {
  common: 'Lixo úmido / orgânico',
  recyclable: 'Lixo seco / reciclável',
  organic: 'Lixo úmido / orgânico',
  electronic: 'Eletrônico',
  special: 'Especial',
};

function formatTime(start: string | null, end: string | null, notes: string | null) {
  if (!start && !end) {
    if (notes?.includes('Antes do almoço')) return 'Antes do almoço';
    if (notes?.includes('À noite')) return 'À noite';
    return 'Horário não informado';
  }
  return [start?.slice(0, 5), end?.slice(0, 5)].filter(Boolean).join(' às ');
}

type GarbageScheduleGroup = GarbageSchedule & {
  districtNames: string[];
};

function groupItems(items: GarbageSchedule[]): GarbageScheduleGroup[] {
  const groups = new Map<string, GarbageScheduleGroup>();
  for (const item of items) {
    const key = [item.type, item.startTime, item.endTime, item.notes].join('|');
    const group = groups.get(key) ?? { ...item, districtNames: [] };
    if (!group.districtNames.includes(item.districtName)) {
      group.districtNames.push(item.districtName);
    }
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

export function GarbageWeekGrid({ schedule }: GarbageWeekGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2 px-3.5 pb-3">
      {DAYS.map((day, index) => {
        const items = groupItems(schedule[index] ?? []);
        return (
          <section key={day} className="rounded-xl border border-ink-100 bg-white p-3 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 font-sans text-[15px] font-extrabold">{day}</h2>
              <span className="text-[12px] text-ink-600">
                {items.length ? `${items.length} coleta(s)` : 'Sem coleta'}
              </span>
            </div>
            <div className="mt-2 space-y-2">
              {items.map((item) => {
                const Icon = item.type === 'recyclable' ? Recycle : Trash2;
                const tone =
                  item.type === 'recyclable'
                    ? 'bg-cerrado-100 text-cerrado-700'
                    : 'bg-clay-50 text-clay-700';
                return (
                  <article key={item.id} className="rounded-lg bg-paper px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${tone}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="m-0 text-[13px] font-bold">{TYPE_LABEL[item.type]}</p>
                        <p className="m-0 text-[13px] text-ink-700">
                          {formatTime(item.startTime, item.endTime, item.notes)}
                        </p>
                        {item.districtNames.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.districtNames.slice(0, 8).map((districtName) => (
                              <span
                                key={districtName}
                                className="rounded-full border border-ink-100 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-700"
                              >
                                {districtName}
                              </span>
                            ))}
                            {item.districtNames.length > 8 && (
                              <span className="self-center text-[11px] font-semibold text-ink-500">
                                +{item.districtNames.length - 8} bairros
                              </span>
                            )}
                          </div>
                        )}
                        {item.notes && <p className="m-0 mt-1 text-[12px] text-ink-600">{item.notes}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
