import { TrendingDown, TrendingUp } from 'lucide-react';

type StatsCardProps = {
  label: string;
  value: string | number;
  delta?: number;
};

export function StatsCard({ label, value, delta }: StatsCardProps) {
  const positive = delta === undefined ? undefined : delta >= 0;
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {delta !== undefined && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {positive ? '+' : ''}
          {delta}%
        </p>
      )}
    </div>
  );
}
