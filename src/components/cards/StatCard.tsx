'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  delay?: number;
}

const COLOR_MAP = {
  primary: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', shadow: 'shadow-indigo-500/10' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', shadow: 'shadow-emerald-500/10' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', shadow: 'shadow-amber-500/10' },
  danger: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', shadow: 'shadow-red-500/10' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', shadow: 'shadow-blue-500/10' },
};

export default function StatCard({ icon, label, value, subValue, trend, color = 'primary', delay = 0 }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`relative overflow-hidden card glow-border fade-in ${delay > 0 ? `fade-in-delay-${delay}` : ''}`}
    >
      {/* 호버 시 발생하는 빛(Shimmer) 효과 */}
      <motion.div 
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '200%', opacity: 0.15 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 z-0 pointer-events-none"
      />
      
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center text-2xl ${c.shadow} shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            trend.value >= 0 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            <span className="text-[var(--text-muted)] ml-1">{trend.label}</span>
          </span>
        )}
      </div>

      <p className="relative z-10 text-sm text-[var(--text-secondary)] mb-1">{label}</p>
      <p className={`relative z-10 text-3xl font-bold ${c.text} stat-number`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subValue && (
        <p className="relative z-10 text-xs text-[var(--text-muted)] mt-2">{subValue}</p>
      )}
    </motion.div>
  );
}
