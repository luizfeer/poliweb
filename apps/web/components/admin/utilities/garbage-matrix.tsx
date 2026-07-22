import type { GarbageScheduleByDay } from '@/lib/utilities/types';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TYPE_LABEL: Record<string, string> = {
  common: 'Comum',
  recyclable: 'Reciclável',
  organic: 'Orgânico',
  electronic: 'Eletrônico',
  special: 'Especial',
};

export function GarbageMatrix({ schedule }: { schedule: GarbageScheduleByDay }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            {DAYS.map((day) => (
              <th key={day} className="p-3 font-semibold">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {DAYS.map((day, index) => (
              <td key={day} className="min-w-36 border-r p-3 align-top last:border-r-0">
                <div className="space-y-2">
                  {(schedule[index] ?? []).map((item) => (
                    <div key={item.id} className="rounded-lg bg-muted p-2">
                      <p className="font-semibold">{item.districtName}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABEL[item.type]} · {item.startTime?.slice(0, 5) ?? '--:--'}
                      </p>
                    </div>
                  ))}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
