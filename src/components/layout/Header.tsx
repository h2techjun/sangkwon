'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/search', label: '매물 분석', icon: '🏠' },
  { href: '/map', label: '지도 분석', icon: '🗺️' },
  { href: '/roads', label: '도로별 매출', icon: '🏪' },
  { href: '/industry', label: '업종 분석', icon: '🍽️' },
  { href: '/population', label: '유동인구 & 트래픽', icon: '🔥' },
  { href: '/report', label: '분석 보고서', icon: '📑' },
];

export default function Header() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  
  // 스크롤에 따른 동적 배경 및 블러 투명도 계산
  const bg = useTransform(scrollY, [0, 50], ['rgba(26, 29, 39, 0.4)', 'rgba(26, 29, 39, 0.85)']);
  const blur = useTransform(scrollY, [0, 50], ['blur(8px)', 'blur(16px)']);

  return (
    <motion.header 
      style={{ backgroundColor: bg, backdropFilter: blur, WebkitBackdropFilter: blur }}
      className="sticky top-0 z-50 border-b border-[var(--card-border)] transition-colors duration-300"
    >
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/logo.png" alt="전주상권" width={40} height={40} className="rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow" />
          <div>
            <h1 className="text-lg font-bold text-gradient leading-tight">전주상권</h1>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">상권분석 시스템</p>
          </div>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link flex items-center gap-2 text-sm ${
                pathname === item.href ? 'active' : ''
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* 상태 배지 (마이크로 애니메이션 핑 효과) */}
        <div className="flex items-center gap-2">
          <div className="relative px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Data
          </div>
        </div>
      </div>
    </motion.header>
  );
}
