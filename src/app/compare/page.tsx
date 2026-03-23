'use client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useMemo } from 'react';
import ChartBar from '@/components/charts/ChartBar';
import { JEONJU_DONGS } from '@/lib/mock-data';
import { useStores } from '@/components/providers/StoreProvider';

export default function ComparePage() {
  const { stores: MOCK_STORES, dongSummaries: MOCK_DONG_SUMMARIES, population: MOCK_POPULATION, isLoading } = useStores();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleDong = (dong: string) => {
    if (selected.includes(dong)) {
      setSelected(selected.filter((d) => d !== dong));
    } else if (selected.length < 3) {
      setSelected([...selected, dong]);
    }
  };

  // 선택된 동 데이터
  const compareData = useMemo(() => {
    return selected.map((dongName) => {
      const summary = MOCK_DONG_SUMMARIES.find((d) => d.dongName === dongName)!;
      const pop = MOCK_POPULATION.find((p) => p.dongName === dongName)!;
      const stores = MOCK_STORES.filter((s) => s.adongNm === dongName);

      // 타겟 인구 (20~50대)
      const targetPop = pop.ageGroups
        .filter((ag) => ['20-29', '30-39', '40-49'].includes(ag.range))
        .reduce((sum, ag) => sum + ag.count, 0);

      // 업종 다양성 (고유 업종 수)
      const uniqueIndustries = new Set(stores.map((s) => s.indsMclsNm)).size;

      // 종합 점수 계산
      const populationScore = Math.min(100, Math.round((pop.totalPopulation / 40000) * 100));
      const competitionScore = Math.max(0, Math.round(100 - summary.competitionIndex * 5)); // 경쟁 낮을수록 점수 높음
      const targetScore = Math.min(100, Math.round((targetPop / 15000) * 100));
      const diversityScore = Math.min(100, Math.round((uniqueIndustries / 10) * 100));
      const totalScore = Math.round((populationScore + competitionScore + targetScore + diversityScore) / 4);

      return {
        dongName,
        summary,
        pop,
        targetPop,
        uniqueIndustries,
        stores: stores.length,
        scores: {
          population: populationScore,
          competition: competitionScore,
          target: targetScore,
          diversity: diversityScore,
          total: totalScore,
        },
      };
    });
  }, [selected]);

  // 비교 바 차트 데이터
  const popCompare = compareData.map((d) => ({ name: d.dongName, value: d.pop.totalPopulation }));
  const storeCompare = compareData.map((d) => ({ name: d.dongName, value: d.stores }));
  const scoreCompare = compareData.map((d) => ({ name: d.dongName, value: d.scores.total }));

  // 추천 코멘트
  const recommendation = useMemo(() => {
    if (compareData.length < 2) return null;
    const best = [...compareData].sort((a, b) => b.scores.total - a.scores.total)[0];
    return best;
  }, [compareData]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">동</span> 비교 분석
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          2~3개 행정동을 선택하여 상권을 나란히 비교하세요
        </p>
      </div>

      {/* 동 선택 영역 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">📍 비교할 동을 선택하세요 (최대 3개)</h3>
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              초기화
            </button>
          )}
        </div>

        {/* 완산구 */}
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-3">완산구</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {JEONJU_DONGS.slice(0, 12).map((dong) => (
            <button
              key={dong}
              onClick={() => toggleDong(dong)}
              disabled={!selected.includes(dong) && selected.length >= 3}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selected.includes(dong)
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 ring-1 ring-indigo-500/20'
                  : selected.length >= 3
                    ? 'bg-[var(--card-border)]/30 text-[var(--text-muted)] cursor-not-allowed opacity-40'
                    : 'bg-[var(--card-border)]/50 text-[var(--text-secondary)] hover:bg-indigo-500/10 border border-transparent'
              }`}
            >
              {dong}
            </button>
          ))}
        </div>

        {/* 덕진구 */}
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">덕진구</p>
        <div className="flex flex-wrap gap-2">
          {JEONJU_DONGS.slice(12).map((dong) => (
            <button
              key={dong}
              onClick={() => toggleDong(dong)}
              disabled={!selected.includes(dong) && selected.length >= 3}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selected.includes(dong)
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 ring-1 ring-indigo-500/20'
                  : selected.length >= 3
                    ? 'bg-[var(--card-border)]/30 text-[var(--text-muted)] cursor-not-allowed opacity-40'
                    : 'bg-[var(--card-border)]/50 text-[var(--text-secondary)] hover:bg-indigo-500/10 border border-transparent'
              }`}
            >
              {dong}
            </button>
          ))}
        </div>
      </div>

      {/* 비교 결과 */}
      {compareData.length >= 2 && (
        <div className="space-y-4 fade-in">
          {/* AI 추천 */}
          {recommendation && (
            <div className="card pulse-glow border-emerald-500/30">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">{recommendation.dongName}</h3>
                  <p className="text-xs text-[var(--text-muted)]">종합 추천 점수가 가장 높은 지역</p>
                </div>
                <span className="ml-auto text-3xl font-black text-gradient">{recommendation.scores.total}점</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                인구 {recommendation.pop.totalPopulation.toLocaleString()}명 ·
                음식점 {recommendation.stores}개 ·
                타겟(20~50대) {recommendation.targetPop.toLocaleString()}명 ·
                경쟁지수 {recommendation.summary.competitionIndex}
              </p>
            </div>
          )}

          {/* 상세 비교 테이블 */}
          <div className="card overflow-x-auto">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">📊 항목별 비교</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium w-[140px]">항목</th>
                  {compareData.map((d) => (
                    <th key={d.dongName} className="text-center py-2 px-3 font-semibold text-indigo-400">{d.dongName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '총 인구', key: 'pop', format: (d: typeof compareData[0]) => d.pop.totalPopulation.toLocaleString() + '명' },
                  { label: '타겟 인구 (20~50대)', key: 'target', format: (d: typeof compareData[0]) => d.targetPop.toLocaleString() + '명' },
                  { label: '음식점 수', key: 'stores', format: (d: typeof compareData[0]) => d.stores + '개' },
                  { label: '경쟁지수', key: 'comp', format: (d: typeof compareData[0]) => String(d.summary.competitionIndex) },
                  { label: '업종 다양성', key: 'div', format: (d: typeof compareData[0]) => d.uniqueIndustries + '종' },
                  { label: '1위 업종', key: 'top', format: (d: typeof compareData[0]) => d.summary.topIndustries[0]?.name || '-' },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-[var(--card-border)]/50">
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">{row.label}</td>
                    {compareData.map((d) => (
                      <td key={d.dongName} className="py-2.5 px-3 text-center font-medium">{row.format(d)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 점수 비교 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">🎯 항목별 점수 (100점 만점)</h3>
            <div className="space-y-3">
              {['인구 규모', '경쟁 우위', '타겟 인구', '업종 다양성', '종합'].map((label, idx) => {
                const keys = ['population', 'competition', 'target', 'diversity', 'total'] as const;
                return (
                  <div key={label}>
                    <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                    <div className="flex gap-2">
                      {compareData.map((d) => {
                        const score = d.scores[keys[idx]];
                        return (
                          <div key={d.dongName} className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{d.dongName}</span>
                              <span className="text-xs font-bold text-indigo-400">{score}</span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${score}%`,
                                  background: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 선택 안내 */}
      {selected.length < 2 && (
        <div className="card text-center py-12 text-[var(--text-muted)]">
          <p className="text-4xl mb-3">⚖️</p>
          <p className="text-lg font-medium mb-1">행정동을 2~3개 선택하세요</p>
          <p className="text-sm">위에서 동을 클릭하면 상세 비교 결과가 표시됩니다</p>
          {selected.length === 1 && (
            <p className="text-sm text-indigo-400 mt-3">✅ {selected[0]} 선택됨 — 1개 더 선택해주세요</p>
          )}
        </div>
      )}
    </div>
  );
}
