'use client';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartBarProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  barColor?: string;
  title?: string;
  unit?: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; unit?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-sm shadow-xl border border-[var(--card-border)]">
      <p className="text-[var(--text-secondary)] text-xs">{label}</p>
      <p className="text-indigo-400 font-bold">{payload[0].value.toLocaleString()}{unit || ''}</p>
    </div>
  );
};

export default function ChartBar({ data, height = 300, title, unit }: ChartBarProps) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--card-border)' }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
