'use client';

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
] as const;

export type PeriodDays = 7 | 30 | 90;

type PeriodPickerProps = {
  value: PeriodDays;
  onChange: (value: PeriodDays) => void;
};

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === p.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
