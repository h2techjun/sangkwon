'use client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState } from 'react';
import ChartBar from '@/components/charts/ChartBar';
import ChartPie from '@/components/charts/ChartPie';
import { useStores } from '@/components/providers/StoreProvider';

export default function IndustryPage() {
  const { stores: MOCK_STORES, industryStats: MOCK_INDUSTRY_STATS, isLoading } = useStores();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;

  const sortedIndustries = [...MOCK_INDUSTRY_STATS].sort((a, b) => b.storeCount - a.storeCount);

  // 선택된 업종 데이터
  const selectedData = selectedIndustry
    ? MOCK_INDUSTRY_STATS.find((i) => i.industryName === selectedIndustry)
    : null;

  // 동별 분포 바 차트 데이터
  const dongDistData = selectedData
    ? Object.entries(selectedData.dongDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  // 개폐업 현황 데이터
  const openCloseData = MOCK_INDUSTRY_STATS.map((i) => ({
    name: i.industryName,
    value: i.newOpenings,
    value2: i.closures,
  }));

  // 업종별 점포 수 바 차트
  const industryBarData = sortedIndustries.map((i) => ({
    name: i.industryName,
    value: i.storeCount,
  }));

  // 업종별 평균 업력
  const survivalData = [...MOCK_INDUSTRY_STATS]
    .sort((a, b) => b.avgSurvivalYears - a.avgSurvivalYears)
    .map((i) => ({
      name: i.industryName,
      value: i.avgSurvivalYears,
    }));

  return (
    <div className="space-y-6">
      <div className="fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">업종별</span> 분석
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          음식점 세부 업종별 현황과 트렌드를 분석합니다
        </p>
      </div>

      {/* 업종 선택 칩 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedIndustry(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !selectedIndustry
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:border-indigo-500/30'
          }`}
        >
          전체
        </button>
        {sortedIndustries.map((ind) => (
          <button
            key={ind.industryName}
            onClick={() => setSelectedIndustry(ind.industryName)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedIndustry === ind.industryName
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:border-indigo-500/30'
            }`}
          >
            {ind.industryName}
            <span className="ml-1.5 text-xs text-[var(--text-muted)]">{ind.storeCount}</span>
          </button>
        ))}
      </div>

      {/* 선택된 업종 상세 */}
      {selectedData ? (
        <div className="space-y-4 fade-in">
          <div className="card">
            <h3 className="text-lg font-bold mb-4">
              🍽️ {selectedData.industryName} <span className="text-sm text-[var(--text-muted)] font-normal">업종 상세</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs text-[var(--text-muted)]">총 점포 수</p>
                <p className="text-2xl font-bold text-indigo-400">{selectedData.storeCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-[var(--text-muted)]">평균 업력</p>
                <p className="text-2xl font-bold text-emerald-400">{selectedData.avgSurvivalYears}년</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-[var(--text-muted)]">신규 개업</p>
                <p className="text-2xl font-bold text-blue-400">+{selectedData.newOpenings}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-[var(--text-muted)]">폐업</p>
                <p className="text-2xl font-bold text-red-400">-{selectedData.closures}</p>
              </div>
            </div>
          </div>

          <ChartBar
            data={dongDistData}
            title={`📍 ${selectedData.industryName} — 동별 분포`}
            unit="개"
            height={280}
          />
        </div>
      ) : (
        /* 전체 뷰 */
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartBar
              data={industryBarData}
              title="🍽️ 업종별 점포 수"
              unit="개"
              height={320}
            />
            <ChartBar
              data={survivalData}
              title="⏳ 업종별 평균 업력 (년)"
              unit="년"
              height={320}
            />
          </div>

          {/* 업종별 상세 테이블 */}
          <div className="card overflow-x-auto">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">📊 업종별 종합 현황</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">#</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">업종</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">점포 수</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">평균 업력</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">신규</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">폐업</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-medium">순증감</th>
                </tr>
              </thead>
              <tbody>
                {sortedIndustries.map((ind, i) => {
                  const netChange = ind.newOpenings - ind.closures;
                  return (
                    <tr
                      key={ind.industryName}
                      className="border-b border-[var(--card-border)]/50 hover:bg-indigo-500/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedIndustry(ind.industryName)}
                    >
                      <td className="py-2.5 px-3 text-[var(--text-muted)]">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{ind.industryName}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-400 font-semibold">{ind.storeCount}</td>
                      <td className="py-2.5 px-3 text-right">{ind.avgSurvivalYears}년</td>
                      <td className="py-2.5 px-3 text-right text-blue-400">+{ind.newOpenings}</td>
                      <td className="py-2.5 px-3 text-right text-red-400">-{ind.closures}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${netChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {netChange >= 0 ? '+' : ''}{netChange}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
