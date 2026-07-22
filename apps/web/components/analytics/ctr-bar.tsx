'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export type CtrBarData = {
  name: string;
  rate: number;
};

type CtrBarProps = {
  data: CtrBarData[];
};

export function CtrBar({ data }: CtrBarProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">CTR (clique por visualização)</p>
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="%" />
            <Tooltip
              formatter={(value) => {
                const num = typeof value === 'number' ? value : Number(value);
                if (!Number.isFinite(num)) return ['—', 'CTR'];
                return [`${num.toFixed(1)}%`, 'CTR'];
              }}
            />
            <Bar dataKey="rate" fill="#e0561b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
