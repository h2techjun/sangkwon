'use client';

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ChartPieProps {
  data: { name: string; value: number }[];
  height?: number;
  title?: string;
  unit?: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, unit }: { active?: boolean; payload?: Array<{ name: string; value: number }>; unit?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-sm shadow-xl border border-[var(--card-border)]">
      <p className="text-[var(--text-secondary)] text-xs">{payload[0].name}</p>
      <p className="text-indigo-400 font-bold">{payload[0].value.toLocaleString()}{unit || '개'}</p>
    </div>
  );
};

export default function ChartPie({ data, height = 300, title, unit }: ChartPieProps) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">{title}</h3>}
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="60%" height={height}>
          <RePieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip unit={unit} />} />
          </RePieChart>
        </ResponsiveContainer>

        {/* 범례 */}
        <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-2">
          {data.slice(0, 10).map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-[var(--text-secondary)] truncate max-w-[80px]">{entry.name}</span>
              <span className="text-[var(--foreground)] font-medium ml-auto">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
