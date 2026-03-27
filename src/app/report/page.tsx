'use client';

import { useStores } from '@/components/providers/StoreProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Store } from '@/lib/types';

interface RoadData {
  name: string;
  dong: string;
  count: number;
  population: number;
  mainIndustry: string;
  subIndustries: { name: string; count: number }[];
  aptCount: number; // 해당 도로의 아파트 상가 수
}

export default function ReportPage() {
  const { stores, dongSummaries, population, isLoading } = useStores();

  const analysis = useMemo(() => {
    if (stores.length === 0 || dongSummaries.length === 0) return null;

    const totalPop = population.reduce((a, b) => a + b.totalPopulation, 0);
    const totalStores = stores.length;
    const avgPopPerStore = totalStores > 0 ? Math.round(totalPop / totalStores) : 0;

    // ─── 동별 아파트 밀집도 계산 ───
    // bldNm에 '아파트' 포함 점포 수 = 해당 동의 아파트 단지 밀집 대리 지표
    const dongAptCount: Record<string, number> = {};
    const roadAptCount: Record<string, number> = {};
    // 아파트 단지명 수집 (중복 제거)
    const dongAptNames: Record<string, Set<string>> = {};
    stores.forEach(s => {
      const bldNm = (s as Store & { bldNm?: string }).bldNm || '';
      const dong = s.adongNm || s.ldongNm || '';
      if (bldNm.includes('아파트')) {
        dongAptCount[dong] = (dongAptCount[dong] || 0) + 1;
        if (!dongAptNames[dong]) dongAptNames[dong] = new Set();
        dongAptNames[dong].add(bldNm);
        
        let roadName = '';
        if (s.rdnm) {
          const parts = s.rdnm.split(' ');
          roadName = parts[parts.length - 1];
        }
        if (roadName) roadAptCount[roadName] = (roadAptCount[roadName] || 0) + 1;
      }
    });

    // 인구 밀도 기반 아파트 밀집도 추정 (인구 많은데 면적 작은 동 = 아파트 단지)
    // population / restaurantCount가 높으면 주거 비중 높음
    const dongAptScore: Record<string, number> = {};
    dongSummaries.forEach(d => {
      const aptShops = dongAptCount[d.dongName] || 0;
      const aptNames = dongAptNames[d.dongName]?.size || 0;
      // 아파트 점수 = 아파트 단지 수 × 5 + 아파트 상가 수 + (인구밀집도 보너스)
      const popDensityBonus = d.population > 30000 ? 20 : d.population > 20000 ? 10 : 0;
      dongAptScore[d.dongName] = aptNames * 5 + aptShops + popDensityBonus;
    });

    // ─── 도로별 집계 ───
    const roadMap = new Map<string, { count: number; dong: string; industries: Record<string, number>; aptCount: number }>();
    stores.forEach(s => {
      let roadName = '';
      if (s.rdnm) {
        const parts = s.rdnm.split(' ');
        roadName = parts[parts.length - 1];
      } else if (s.rdnmAdres) {
        const parts = s.rdnmAdres.split(' ');
        const idx = parts.findIndex(p => /[로길]$/.test(p));
        if (idx >= 0) roadName = parts[idx];
      }
      if (!roadName || roadName.length < 2) return;
      const dong = s.adongNm || s.ldongNm || '';
      if (!roadMap.has(roadName)) roadMap.set(roadName, { count: 0, dong, industries: {}, aptCount: 0 });
      const entry = roadMap.get(roadName)!;
      entry.count++;
      entry.industries[s.indsMclsNm] = (entry.industries[s.indsMclsNm] || 0) + 1;
      if ((s as Store & { bldNm?: string }).bldNm?.includes('아파트')) entry.aptCount++;
    });

    // 모든 도로 데이터 구축
    const allRoads: RoadData[] = Array.from(roadMap.entries())
      .filter(([, v]) => v.count >= 3)
      .map(([name, v]) => {
        const dongData = dongSummaries.find(d => d.dongName === v.dong);
        const topInd = Object.entries(v.industries).sort((a, b) => b[1] - a[1]);
        return {
          name,
          dong: v.dong,
          count: v.count,
          population: dongData?.population || 0,
          mainIndustry: topInd[0]?.[0] || '-',
          subIndustries: topInd.slice(0, 3).map(([name, count]) => ({ name, count })),
          aptCount: v.aptCount + (roadAptCount[name] || 0),
        };
      });

    // ─── 핵심 분석: 매출 핫스팟 & 인접 기회 ───
    // 매출 핫 도로 = 점포 수 가장 많은 도로 (사람들이 몰리니까 가게가 많다)
    const hotRoads = [...allRoads].sort((a, b) => b.count - a.count).slice(0, 15);

    // 같은 동 내 인접 기회 도로 찾기
    // 핫 도로와 같은 동에 있으면서, 핫 도로보다 점포가 적지만 적당히(5개 이상) 있는 도로
    const adjacencyOpportunities: {
      hotRoad: RoadData;
      nearbyRoad: RoadData;
      synergy: number; // 시너지 점수: 핫 도로 점포수 * (해당 도로 점포수 / 핫 도로 점포수의 역수)
    }[] = [];

    hotRoads.forEach(hot => {
      const sameAreaRoads = allRoads.filter(r =>
        r.dong === hot.dong &&
        r.name !== hot.name &&
        r.count >= 5 &&
        r.count < hot.count * 0.7 // 핫 도로의 70% 미만 → 경쟁 부담 줄고
      );

      sameAreaRoads.forEach(nearby => {
        // 시너지 = 핫 도로 점포수 × 성장여력 + 아파트 밀집 보너스
        const baseSynergy = hot.count * (1 - nearby.count / hot.count) * 10;
        const aptBonus = (dongAptScore[nearby.dong] || 0) * 3; // 아파트 밀집 보너스
        const synergy = Math.round(baseSynergy + aptBonus);
        adjacencyOpportunities.push({ hotRoad: hot, nearbyRoad: nearby, synergy });
      });
    });

    adjacencyOpportunities.sort((a, b) => b.synergy - a.synergy);
    const topAdjacency = adjacencyOpportunities.slice(0, 10);

    // 동별 매출 추정 (점포 수 = 매출 대리 지표)
    const dongByRevenue = [...dongSummaries]
      .filter(d => d.restaurantCount > 0 && d.population > 0)
      .map(d => ({
        ...d,
        estimatedRevenue: d.restaurantCount, // 점포 수 = 매출 규모 대리 지표
        density: Math.round(d.restaurantCount / (d.population / 10000) * 10) / 10,
        popPerStore: Math.round(d.population / d.restaurantCount),
      }))
      .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);

    // 업종 분포
    const indMap: Record<string, number> = {};
    stores.forEach(s => { indMap[s.indsMclsNm] = (indMap[s.indsMclsNm] || 0) + 1; });
    const topIndustries = Object.entries(indMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // 연령대
    const ageMap: Record<string, number> = {};
    population.forEach(p => {
      if (p.ageGroups) p.ageGroups.forEach(ag => {
        ageMap[ag.range] = (ageMap[ag.range] || 0) + ag.count;
      });
    });
    const dominantAge = Object.entries(ageMap).sort((a, b) => b[1] - a[1])[0];

    return {
      totalPop, totalStores, avgPopPerStore,
      hotRoads, topAdjacency, dongByRevenue,
      topIndustries, dominantAge, allRoads,
      dongAptScore, dongAptNames: Object.fromEntries(
        Object.entries(dongAptNames).map(([k, v]) => [k, v.size])
      ) as Record<string, number>,
    };
  }, [stores, dongSummaries, population]);

  if (isLoading) return <LoadingSpinner />;

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-2xl mb-2">📊</p>
        <h2 className="text-lg font-bold text-white mb-2">데이터가 부족합니다</h2>
        <p className="text-sm text-gray-400">점포 또는 행정동 데이터를 불러오지 못했습니다.<br />잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[900px] mx-auto">
      {/* 보고서 헤더 */}
      <div className="text-center fade-in py-4">
        <p className="text-xs text-indigo-400 font-semibold tracking-widest mb-2">JEONJU COMMERCIAL ANALYSIS</p>
        <h1 className="text-3xl font-black mb-2">
          <span className="text-gradient">전주시 음식점 창업</span> 입지 분석 보고서
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {analysis.totalStores.toLocaleString()}개 점포 · {analysis.totalPop.toLocaleString()}명 인구 기반 분석
        </p>
        <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
          <span>📅 데이터: 2024.12 (점포) / 인구통계</span>
          <span>🏢 {analysis.dongByRevenue.length}개 행정동</span>
        </div>
      </div>

      {/* ━━━ 섹션 1: 종합 요약 ━━━ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-indigo-500"></span>
          📋 종합 요약
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-[10px] text-gray-400 mb-1">전주시 총 인구</p>
            <p className="text-xl font-black text-indigo-400">{analysis.totalPop.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-[10px] text-gray-400 mb-1">총 음식점</p>
            <p className="text-xl font-black text-purple-400">{analysis.totalStores.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-gray-400 mb-1">점포당 평균 배후인구</p>
            <p className="text-xl font-black text-amber-400">{analysis.avgPopPerStore}명</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] text-gray-400 mb-1">주요 소비 연령대</p>
            <p className="text-xl font-black text-emerald-400">{analysis.dominantAge?.[0] || '-'}세</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20">
          <p className="text-sm leading-relaxed text-gray-300">
            <span className="text-amber-400 font-bold">💡 분석 원칙:</span> 점포가 많은 곳 = 사람이 많이 찾는 곳입니다.
            빈 곳은 빈 이유가 있습니다. <span className="text-white font-bold">가장 좋은 전략은 매출이 잘 나오는 핫 도로의 바로 옆이나 인근 도로</span>에
            자리를 잡아 유동인구를 공유하면서 임대료와 경쟁은 줄이는 것입니다.
          </p>
        </div>
      </motion.section>

      {/* ━━━ 섹션 2: 매출 핫 도로 TOP 10 (가장 장사 잘되는 곳) ━━━ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-red-500"></span>
          🔥 매출 핫 도로 TOP 10
        </h2>
        <p className="text-xs text-gray-500 mb-4">점포가 가장 밀집한 도로 = 사람이 가장 많이 오는 곳 (매출 대리 지표)</p>

        <div className="space-y-2">
          {analysis.hotRoads.slice(0, 10).map((r, i) => {
            const maxCount = analysis.hotRoads[0]?.count || 1;
            const barWidth = (r.count / maxCount) * 100;
            return (
              <div key={r.name} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                  i < 3 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{r.name}</span>
                      <span className="text-[10px] text-gray-500">{r.dong}</span>
                      {r.subIndustries.slice(0, 2).map(si => (
                        <span key={si.name} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">{si.name} {si.count}</span>
                      ))}
                    </div>
                    <span className="text-sm font-black text-red-400">{r.count}개</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ━━━ 섹션 3: 핫 도로 인접 기회 (핵심 추천) ━━━ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 border-2 border-green-500/30">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-green-500"></span>
          ⭐ 핵심 추천: 핫 도로 인접 기회 입지
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          매출 핫 도로와 같은 동에 위치하여 유동인구를 공유하면서, 경쟁은 상대적으로 덜한 도로입니다.
        </p>

        {analysis.topAdjacency.length === 0 ? (
          <p className="text-sm text-gray-400">인접 기회 데이터를 계산 중입니다...</p>
        ) : (
          <div className="space-y-3">
            {analysis.topAdjacency.map((opp, i) => (
              <div key={`${opp.hotRoad.name}-${opp.nearbyRoad.name}`} className="p-4 rounded-xl bg-green-500/5 border border-green-500/15 hover:border-green-500/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded">#{i + 1}</span>
                      <span className="text-base font-black text-white">{opp.nearbyRoad.name}</span>
                      <span className="text-xs text-gray-500">{opp.nearbyRoad.dong}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span>점포 {opp.nearbyRoad.count}개</span>
                      <span>·</span>
                      <span className="text-amber-400">인접 핫 도로: {opp.hotRoad.name} ({opp.hotRoad.count}개)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">시너지 점수</p>
                    <span className="text-lg font-black text-green-400">{opp.synergy}</span>
                  </div>
                </div>

                {/* 비교 바 */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-red-400 w-16 text-right">🔥 핫&nbsp;</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${(opp.hotRoad.count / analysis.hotRoads[0]!.count) * 100}%` }} />
                    </div>
                    <span className="text-gray-500 w-10">{opp.hotRoad.count}개</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-green-400 w-16 text-right">⭐ 추천</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${(opp.nearbyRoad.count / analysis.hotRoads[0]!.count) * 100}%` }} />
                    </div>
                    <span className="text-gray-500 w-10">{opp.nearbyRoad.count}개</span>
                  </div>
                </div>

                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {(analysis.dongAptScore[opp.nearbyRoad.dong] || 0) > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25 font-bold">
                      🏢 아파트 밀집 ({analysis.dongAptNames[opp.nearbyRoad.dong] || 0}개 단지)
                    </span>
                  )}
                  {opp.nearbyRoad.population > 30000 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25">
                      🚗 대규모 배후 ({opp.nearbyRoad.population.toLocaleString()}명)
                    </span>
                  )}
                  {opp.nearbyRoad.subIndustries.map(si => (
                    <span key={si.name} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {si.name} {si.count}
                    </span>
                  ))}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    배후인구 {opp.nearbyRoad.population.toLocaleString()}명
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ━━━ 섹션 4: 동별 매출 활성도 ━━━ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-amber-500"></span>
          📍 동별 상권 활성도 순위
        </h2>
        <p className="text-xs text-gray-500 mb-4">점포가 많을수록 → 유동인구가 많고 → 매출이 높은 지역</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-500 border-b border-white/5">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left py-2">행정동</th>
                <th className="text-right py-2">음식점 수</th>
                <th className="text-right py-2">인구</th>
                <th className="text-right py-2">점포당 인구</th>
                <th className="text-right py-2">밀집도</th>
                <th className="text-center py-2">평가</th>
              </tr>
            </thead>
            <tbody>
              {analysis.dongByRevenue.slice(0, 15).map((d, i) => {
                const verdict = d.popPerStore < 30 ? { text: '과열', color: 'text-red-400', bg: 'bg-red-500/10' }
                  : d.popPerStore < 60 ? { text: '치열', color: 'text-amber-400', bg: 'bg-amber-500/10' }
                  : d.popPerStore < 120 ? { text: '적정', color: 'text-green-400', bg: 'bg-green-500/10' }
                  : { text: '여유', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
                return (
                  <tr key={d.dongName} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                    <td className="py-2.5 pr-2">
                      <span className={`text-[10px] font-bold ${i < 3 ? 'text-amber-400' : 'text-gray-500'}`}>{i + 1}</span>
                    </td>
                    <td className="py-2.5 font-medium text-white">{d.dongName}</td>
                    <td className="py-2.5 text-right text-indigo-400 font-bold">{d.restaurantCount.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-gray-400">{d.population.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold text-white">{d.popPerStore}명</td>
                    <td className="py-2.5 text-right text-gray-500">{d.density}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${verdict.bg} ${verdict.color}`}>{verdict.text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ━━━ 섹션 5: 업종 경쟁 분포 ━━━ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-purple-500"></span>
          🍽️ 업종별 경쟁 현황
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analysis.topIndustries.map(([name, count], i) => {
            const share = Math.round((count / analysis.totalStores) * 100);
            const colors = [
              'from-amber-500 to-orange-500', 'from-blue-500 to-indigo-500',
              'from-green-500 to-emerald-500', 'from-purple-500 to-pink-500',
              'from-red-500 to-rose-500', 'from-cyan-500 to-teal-500',
              'from-yellow-500 to-amber-500', 'from-violet-500 to-purple-500',
            ];
            return (
              <div key={name} className="p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{name}</span>
                  <span className="text-[10px] text-gray-500">#{i + 1}</span>
                </div>
                <p className="text-lg font-black text-white">{count.toLocaleString()}<span className="text-xs text-gray-500 font-normal">개</span></p>
                <div className="h-1 rounded-full bg-gray-800 mt-2 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${colors[i] || colors[0]}`} style={{ width: `${share}%` }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">전체의 {share}%</p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ━━━ 섹션 6: 최종 결론 ━━━ */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-emerald-500"></span>
          📊 최종 결론 & 전략
        </h2>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <h3 className="text-sm font-bold text-green-400 mb-2">⭐ 추천 전략: &quot;핫 도로 옆자리&quot;</h3>
            <p className="text-sm text-gray-300 mb-2">
              아래 도로들은 매출 핫 도로와 같은 동에 있어 유동인구를 공유하면서, 임대료와 경쟁 부담이 적습니다.
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              {analysis.topAdjacency.slice(0, 3).map(opp => (
                <li key={`c-${opp.nearbyRoad.name}`}>
                  • <span className="text-white font-medium">{opp.nearbyRoad.name}</span> ({opp.nearbyRoad.dong})
                  — 핫 도로 <span className="text-red-400">{opp.hotRoad.name}</span> 인접, 점포 {opp.nearbyRoad.count}개
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
            <h3 className="text-sm font-bold text-red-400 mb-2">🔥 매출 최고 지역 (경쟁 치열)</h3>
            <p className="text-sm text-gray-300 mb-2">
              매출은 확실하지만 임대료·경쟁이 극심합니다. 차별화된 컨셉이 필수입니다.
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              {analysis.hotRoads.slice(0, 3).map(r => (
                <li key={`h-${r.name}`}>
                  • <span className="text-white font-medium">{r.name}</span> ({r.dong})
                  — {r.count}개 점포 밀집, {r.mainIndustry} 주력
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-gray-500/10 to-slate-500/10 border border-gray-500/20">
            <h3 className="text-sm font-bold text-gray-400 mb-2">⚠️ 주의 사항</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• 점포가 없는 도로는 상권 형성이 안 된 주거지·공업지역일 가능성 높음</li>
              <li>• 실제 임대료·권리금은 현장 확인 필수</li>
              <li>• 본 데이터는 2024.12 기준이며, 신규 개발 지역은 반영 안 됨</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* 푸터 */}
      <div className="text-center py-4 text-[10px] text-gray-600">
        <p>본 보고서는 소상공인시장진흥공단 상가정보(2024.12) 및 통계청 인구통계를 기반으로 자동 생성되었습니다.</p>
        <p>© 2026 전주상권 분석 시스템 · M.I.N.E.R.V.A.</p>
      </div>
    </div>
  );
}
