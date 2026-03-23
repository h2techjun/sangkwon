'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner({ message = '데이터를 불러오는 중입니다...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-6">
      {/* 바깥쪽 회전 글로우 마스크 */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 opacity-80"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-2 rounded-full border-4 border-transparent border-b-cyan-400 border-l-emerald-400 opacity-60"
        />
        {/* 중앙 심볼 */}
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-12 h-12 rounded-2xl bg-gradient-card border border-[var(--card-border)] flex items-center justify-center shadow-lg shadow-indigo-500/20"
        >
          <span className="text-xl">🏪</span>
        </motion.div>
      </div>

      {/* 텍스트 메세지 */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2"
      >
        <h3 className="text-lg font-bold text-gradient leading-tight">{message}</h3>
        <span className="text-xs text-[var(--text-muted)] tracking-widest uppercase">Jeonju Sangkwon DB</span>
      </motion.div>
    </div>
  );
}
