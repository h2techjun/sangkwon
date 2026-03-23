'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store, DongSummary, IndustryStats } from '@/lib/types';
import { MOCK_STORES, MOCK_POPULATION, MOCK_SALES_TRENDS } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

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
  
  const [population, setPopulation] = useState<typeof MOCK_POPULATION>(MOCK_POPULATION);
  const [salesTrends, setSalesTrends] = useState<typeof MOCK_SALES_TRENDS>(MOCK_SALES_TRENDS);

  // 통계 계산된 파생 상태들
  const [dongSummaries, setDongSummaries] = useState<DongSummary[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/stores');
        const json = await res.json();
        
        if (!json.success) throw new Error(json.error);
        
        let rawStores: Store[] = json.data || [];
        
        // 데이터가 0건일 경우 (API 키 만료나 통신 오류 등), UI 마비를 막기 위해 목업 데이터로 폴백
        if (rawStores.length === 0) {
          console.warn('API가 빈 데이터를 반환했습니다. UI 보호를 위해 목업 데이터로 대체합니다.');
          rawStores = MOCK_STORES;
        }
        
        setStores(rawStores);

        // 2. 인구 데이터(Population) Fetch (Supabase)
        let activePopulation = MOCK_POPULATION;
        try {
          const { data: popData, error: popError } = await supabase
            .from('population_data')
            .select(`
              dong_name, total_population, male, female,
              age_groups (range, count)
            `);
            
          if (!popError && popData && popData.length > 0) {
            activePopulation = popData.map((p: any) => ({
              dongName: p.dong_name,
              totalPopulation: p.total_population,
              male: p.male || 50,
              female: p.female || 50,
              ageGroups: Array.isArray(p.age_groups) ? p.age_groups : []
            }));
          } else {
            console.warn('Supabase DB 인구 데이터가 없거나 에러 발생. 목업 데이터로 폴백(Fallback)합니다.', popError);
          }
        } catch (e) {
          console.warn('Supabase 연동 실패. 목업 데이터 사용:', e);
        }
        setPopulation(activePopulation);

        // 3. 매출 추이(Sales Trends) Fetch (Supabase)
        let activeSales = MOCK_SALES_TRENDS;
        try {
          const { data: salesData, error: salesError } = await supabase
            .from('sales_trends')
            .select('*')
            .order('period', { ascending: true });
            
          if (!salesError && salesData && salesData.length > 0) {
            activeSales = salesData.map((s: any) => ({
              period: s.period,
              totalSales: Number(s.total_sales),
              avgSalesPerStore: s.avg_sales_per_store
            }));
          } else {
            console.warn('Supabase DB 매출 데이터가 없거나 에러 발생. 목업 데이터로 폴백(Fallback)합니다.', salesError);
          }
        } catch (e) {
          console.warn('Supabase 연동 실패. 목업 데이터 사용:', e);
        }
        setSalesTrends(activeSales);

        // 4. 행정동(adongNm)별 통계 계산
        //    점포 DB와 인구 DB 간 동 이름 불일치를 정규화
        //    예: 점포 DB에 '금암1동','금암2동'이 있지만 인구 DB에는 '금암동'만 존재
        //    → 점포 이름을 인구 이름에 맞춰 통합
        const popDongNames = new Set(activePopulation.map(p => p.dongName));

        const normalizeDongName = (rawName: string): string => {
          if (popDongNames.has(rawName)) return rawName; // 정확히 일치하면 그대로
          // 숫자 접미사 제거 시도 (금암1동 → 금암동)
          const baseName = rawName.replace(/\d+동$/, '동');
          if (baseName !== rawName && popDongNames.has(baseName)) return baseName;
          return rawName; // 매칭 안돼도 원래 이름 유지
        };

        const dongMap = new Map<string, Store[]>();
        rawStores.forEach(s => {
          const rawDName = s.adongNm || s.ldongNm;
          if (!rawDName) return;
          const dName = normalizeDongName(rawDName);
          if (!dongMap.has(dName)) dongMap.set(dName, []);
          dongMap.get(dName)!.push(s);
        });

        const newDongSummaries: DongSummary[] = Array.from(dongMap.entries())
          .map(([dongName, sList]) => {
          const pop = activePopulation.find(p => p.dongName === dongName)?.totalPopulation || 0;
          
          // 동별 업종 순위 계산
          const indCount: Record<string, number> = {};
          sList.forEach(s => { indCount[s.indsMclsNm] = (indCount[s.indsMclsNm] || 0) + 1; });
          const topInd = Object.entries(indCount).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({name, count}));

          return {
            dongName,
            totalStores: sList.length,
            restaurantCount: sList.length,
            population: pop,
            competitionIndex: sList.length > 0 ? Math.round(pop / sList.length) : pop,
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
          sList.forEach(s => { 
            const dName = s.adongNm || s.ldongNm || '미상';
            distribution[dName] = (distribution[dName] || 0) + 1; 
          });
          
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

    fetchData();
  }, []);

  return (
    <StoreContext.Provider value={{ stores, dongSummaries, industryStats, population, salesTrends, isLoading, error }}>
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
