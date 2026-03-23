import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import { StoreProvider } from "@/components/providers/StoreProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "전주상권 | 전주시 상권분석 시스템",
  description: "전주시 음식점 상권분석 프로그램 — 행정동별 업종 분석, 인구 분석, 매출 추이, 동 비교를 통해 최적의 창업 입지를 찾아보세요.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-6 py-6 overflow-x-hidden">
          <StoreProvider>
            {children}
          </StoreProvider>
        </main>
        <footer className="text-center py-6 text-[10px] md:text-xs text-[var(--text-muted)] border-t border-[var(--card-border)] pb-8">
          전주상권 분석 시스템 © 2026 · 공공데이터 기반 · MVP v1.0
        </footer>
      </body>
    </html>
  );
}
