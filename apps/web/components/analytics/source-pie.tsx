'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export type SourcePieData = {
  name: string;
  value: number;
};

type SourcePieProps = {
  data: SourcePieData[];
};

const COLORS = ['#e0561b', '#3c6b36', '#2e78c2', '#f4b73a', '#c81e4a'];

export function SourcePie({ data }: SourcePieProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">De onde vieram</p>
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label={({ name, percent }) => {
                const pct = typeof percent === 'number' ? percent : 0;
                return `${name}: ${(pct * 100).toFixed(0)}%`;
              }}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
