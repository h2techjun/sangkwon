'use client';

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartLineProps {
  data: { name: string; value: number; value2?: number }[];
  height?: number;
  title?: string;
  unit?: string;
  line1Label?: string;
  line2Label?: string;
}

const CustomTooltip = ({ active, payload, label, unit, line1Label, line2Label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  unit?: string;
  line1Label?: string;
  line2Label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-sm shadow-xl border border-[var(--card-border)]">
      <p className="text-[var(--text-secondary)] text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className={`font-bold ${p.dataKey === 'value' ? 'text-indigo-400' : 'text-emerald-400'}`}>
          {p.dataKey === 'value' ? (line1Label || '') : (line2Label || '')} {p.value.toLocaleString()}{unit || ''}
        </p>
      ))}
    </div>
  );
};

export default function ChartLine({ data, height = 300, title, unit, line1Label, line2Label }: ChartLineProps) {
  const hasLine2 = data.some((d) => d.value2 !== undefined);

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ReLineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--card-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} line1Label={line1Label} line2Label={line2Label} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4, fill: '#6366f1', stroke: 'var(--background)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#6366f1', stroke: '#a78bfa', strokeWidth: 2 }}
          />
          {hasLine2 && (
            <Line
              type="monotone"
              dataKey="value2"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', stroke: 'var(--background)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#6ee7b7', strokeWidth: 2 }}
              strokeDasharray="5 5"
            />
          )}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
