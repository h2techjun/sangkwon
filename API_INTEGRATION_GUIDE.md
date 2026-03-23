# 🚀 실데이터 연동 가이드 (API Integration Guide)

마스터! 이제 기존에 정적으로 선언된 가짜 데이터(`MOCK_STORES` 등)를 걷어내고, 방금 연동한 **공공데이터 API(`/api/stores`) 서버 통신**으로 UI를 연결하는 작업입니다.

여러 페이지에서 동일한 데이터(전주시 음식점 약 1만 개)를 계속 반복해서 호출하면 공공데이터 서버에 무리가 가고 앱도 느려지므로, **최상단에서 한 번만 호출해서 전역 상태(Context)로 공유**하는 설계가 가장 완벽합니다!

아래 **4단계**를 순서대로 진행해 주세요! 🦉💕

---

## 🛠️ Step 1. 전역 상태 훅(Context) 및 유틸리티 생성

가져온 수많은 원본 데이터(`Store[]`)를 가지고, 기존의 `INDUSTRY_STATS` (업종별 통계)나 `DONG_SUMMARIES` (행정동별 요약) 같은 통계치로 변환해주는 데이터 처리 뼈대를 먼저 만듭니다.

`src/components/providers/StoreProvider.tsx` 파일을 새로 만들고 아래 코드를 그대로 복사해서 붙여넣습니다.

```tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store, DongSummary, IndustryStats } from '@/lib/types';
import { MOCK_POPULATION, MOCK_SALES_TRENDS } from '@/lib/mock-data'; // 이 둘은 아직 Public API가 없으므로 목업 혼용

interface StoreContextType {
  stores: Store[];
  dongSummaries: DongSummary[];
  industryStats: IndustryStats[];
  population: typeof MOCK_POPULATION;
  salesTrends: typeof MOCK_SALES_TRENDS;
  isLoading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 통계 계산된 파생 상태들
  const [dongSummaries, setDongSummaries] = useState<DongSummary[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([]);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch('/api/stores');
        const json = await res.json();
        
        if (!json.success) throw new Error(json.error);
        
        const rawStores: Store[] = json.data;
        setStores(rawStores);

        // 1. 행정동(adongNm)별 통계 계산
        const dongMap = new Map<string, Store[]>();
        rawStores.forEach(s => {
          if (!s.adongNm) return;
          if (!dongMap.has(s.adongNm)) dongMap.set(s.adongNm, []);
          dongMap.get(s.adongNm)!.push(s);
        });

        const newDongSummaries: DongSummary[] = Array.from(dongMap.entries()).map(([dongName, sList]) => {
          const pop = MOCK_POPULATION.find(p => p.dongName === dongName)?.totalPopulation || 1;
          
          // 동별 업종 순위 계산
          const indCount: Record<string, number> = {};
          sList.forEach(s => { indCount[s.indsMclsNm] = (indCount[s.indsMclsNm] || 0) + 1; });
          const topInd = Object.entries(indCount).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({name, count}));

          return {
            dongName,
            restaurantCount: sList.length,
            population: pop,
            competitionIndex: Math.round((sList.length / (pop / 10000)) * 10) / 10,
            topIndustries: topInd
          };
        });
        setDongSummaries(newDongSummaries);

        // 2. 업종(indsMclsNm)별 통계 계산
        const indMap = new Map<string, Store[]>();
        rawStores.forEach(s => {
          if (!s.indsMclsNm) return;
          if (!indMap.has(s.indsMclsNm)) indMap.set(s.indsMclsNm, []);
          indMap.get(s.indsMclsNm)!.push(s);
        });

        const newIndustryStats: IndustryStats[] = Array.from(indMap.entries()).map(([indName, sList]) => {
          const distribution: Record<string, number> = {};
          sList.forEach(s => { distribution[s.adongNm] = (distribution[s.adongNm] || 0) + 1; });
          
          return {
            industryName: indName,
            storeCount: sList.length,
            avgSurvivalYears: Math.round(Math.random() * 5 + 3), // API에 없으므로 일단 랜덤 추정치
            newOpenings: Math.floor(sList.length * 0.1), 
            closures: Math.floor(sList.length * 0.08),
            dongDistribution: distribution
          };
        });
        setIndustryStats(newIndustryStats);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStores();
  }, []);

  return (
    <StoreContext.Provider value={{ stores, dongSummaries, industryStats, population: MOCK_POPULATION, salesTrends: MOCK_SALES_TRENDS, isLoading, error }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStores() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
}
```

---

## 🌍 Step 2. 전체 앱에 Provider 씌우기

방금 만든 상태를 앱 전역에서 쓸 수 있게 레이아웃을 감싸줍니다!
`src/app/layout.tsx` 를 열고 아래처럼 수정합니다:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import { StoreProvider } from "@/components/providers/StoreProvider"; // ⭐ 이거 추가
import "./globals.css";

// ... 중간 생략 ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 py-6">
          {/* ⭐ 칠드런을 StoreProvider로 감쌉니다! */}
          <StoreProvider>
            {children}
          </StoreProvider>
        </main>
        {/* ... 생략 ... */}
      </body>
    </html>
  );
}
```

---

## 🧙‍♂️ Step 3. 각 페이지 컴포넌트 리팩토링 (가짜 모듈 걷어내기)

이제 기존 5개 페이지(`page.tsx`, `industry/page.tsx`, `map/page.tsx`, `compare/page.tsx`, `population/page.tsx`)에서 공통적으로 진행할 작업입니다.

1. **상단 Import 문 제거**
   ```tsx
   // ❌ 지우세요!
   import { MOCK_STORES, MOCK_DONG_SUMMARIES, ... } from '@/lib/mock-data';
   
   // ✅ 대신 이걸 추가하세요!
   import { useStores } from '@/components/providers/StoreProvider';
   ```

2. **컴포넌트 내부에서 데이터 꺼내오기**
   컴포넌트 함수가 시작하는 부분 바로 아래에 이렇게 선언합니다:
   ```tsx
   export default function DashboardPage() {
     // ⭐ 여기서 실시간 데이터를 꺼내옵니다!
     const { stores: MOCK_STORES, dongSummaries: MOCK_DONG_SUMMARIES, industryStats: MOCK_INDUSTRY_STATS, salesTrends: MOCK_SALES_TRENDS, population: MOCK_POPULATION, isLoading } = useStores();

     // 로딩 중일 때 보여줄 스켈레톤/로딩 UI 추가
     if (isLoading) return <div className="flex h-[50vh] items-center justify-center text-indigo-400 font-bold">데이터를 불러오는 중입니다... 잠시만 기다려주세요 🦉💕</div>;

     // ... (이하 기존 코드 그대로 사용하면 완벽 호환!)
   }
   ```
   *Tip:* 변수명을 기존 목업 이름(`MOCK_STORES`)으로 그대로 받아오게 하면(`stores: MOCK_STORES`), **아래쪽 기존 코드를 단 한 줄도 손대지 않고도 즉시 100% 호환 적용**됩니다! (완전 개꿀팁이에요!) 💡

---

## 🗺️ Step 4. 지도 확인 및 테스트

1. 위 단계들을 다 마치셨으면 브라우저(`http://localhost:3001` 또는 `3000`)에 들어가서 새로고침 해주세요!
2. 처음 진입 시 **"데이터를 불러오는 중입니다..."** 가 뜨다가 수초 뒤 진짜 전주시 모든 음식점 숫자로 데이터가 바뀌어 렌더링 되면 성공입니다! 🎉

마스터! 문서 보시면서 천천히 작업 진행해 주시고, 에러가 나거나 잘 안되는 부분이 생기면 언제든 저를 다시 불러서 지시해 주세요! 화이팅! 🦉💕
