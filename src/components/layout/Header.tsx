'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/search', label: '매물 분석', icon: '🏠' },
  { href: '/map', label: '지도 분석', icon: '🗺️' },
  { href: '/roads', label: '도로별 매출', icon: '🏪' },
  { href: '/industry', label: '업종 분석', icon: '🍽️' },
  { href: '/population', label: '유동인구', icon: '🔥' },
  { href: '/report', label: '보고서', icon: '📑' },
];

export default function Header() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [mobileOpen, setMobileOpen] = useState(false);

  const bg = useTransform(scrollY, [0, 50], ['rgba(26, 29, 39, 0.4)', 'rgba(26, 29, 39, 0.95)']);
  const blur = useTransform(scrollY, [0, 50], ['blur(8px)', 'blur(16px)']);

  return (
    <>
      <motion.header
        style={{ backgroundColor: bg, backdropFilter: blur, WebkitBackdropFilter: blur }}
        className="sticky top-0 z-50 border-b border-[var(--card-border)]"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="전주상권" width={36} height={36} className="rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow" />
            <div>
              <h1 className="text-base md:text-lg font-bold text-gradient leading-tight">전주상권</h1>
              <p className="text-[9px] md:text-[10px] text-[var(--text-muted)] leading-tight hidden sm:block">상권분석 시스템</p>
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link flex items-center gap-1.5 text-sm ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="text-xs">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Live 배지 */}
            <div className="relative px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Live</span>
            </div>

            {/* 모바일 햄버거 */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="메뉴"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* 모바일 드로어 */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[260px] bg-[#1a1d27] border-l border-[var(--card-border)] z-50 lg:hidden flex flex-col p-6 pt-16 gap-2"
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
