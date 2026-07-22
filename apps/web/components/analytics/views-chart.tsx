'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export type ViewsChartData = {
  date: string;
  views: number;
  totalEvents: number;
};

type ViewsChartProps = {
  data: ViewsChartData[];
};

export function ViewsChart({ data }: ViewsChartProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">Visualizações</p>
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#e0561b"
              strokeWidth={2}
              dot={false}
              name="Visualizações"
            />
            <Line
              type="monotone"
              dataKey="totalEvents"
              stroke="#3c6b36"
              strokeWidth={2}
              dot={false}
              name="Eventos totais"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
