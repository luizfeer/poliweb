import type { PharmacyShift } from '@/lib/utilities/types';

export function PharmacyShiftCalendar({ shifts }: { shifts: PharmacyShift[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {shifts.map((shift) => (
        <article key={shift.id} className="rounded-2xl border bg-card p-4">
          <p className="text-sm font-semibold">{shift.pharmacyName ?? 'Farmácia'}</p>
          <h2 className="mt-1 font-sans text-lg font-bold">
            {shift.startDate} até {shift.endDate}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{shift.shiftType === 'plantao_24h' ? 'Plantão 24h' : 'Noturno'}</p>
          {shift.notes && <p className="mt-2 text-sm">{shift.notes}</p>}
        </article>
      ))}
    </div>
  );
}
