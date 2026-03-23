'use client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import ChartBar from '@/components/charts/ChartBar';
import ChartPie from '@/components/charts/ChartPie';
import StatCard from '@/components/cards/StatCard';
import PopulationHotspots from '@/components/PopulationHotspots';
import { JEONJU_DONGS } from '@/lib/mock-data';
import { useStores } from '@/components/providers/StoreProvider';

export default function PopulationPage() {
  const { stores, dongSummaries: MOCK_DONG_SUMMARIES, population: MOCK_POPULATION, isLoading } = useStores();
  const [selectedDong, setSelectedDong] = useState<string | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficData, setTrafficData] = useState<any>(null);

  useEffect(() => {
    if (!selectedDong || stores.length === 0) {
      setTrafficData(null);
      return;
    }
    
    // Find the primary road name based on stores in the district
    const dongStores = stores.filter(s => s.adongNm === selectedDong);
    const roadCounts: Record<string, number> = {};
    dongStores.forEach(s => {
      if (!s.rdnm) return;
      const match = s.rdnm.match(/([가-힣]+로|[가-힣]+길|능산[0-9]*길)/);
      if (match) {
        const road = match[0];
        roadCounts[road] = (roadCounts[road] || 0) + 1;
      }
    });
    
    const entries = Object.entries(roadCounts).sort((a,b) => b[1] - a[1]);
    const topRoad = entries.length > 0 ? entries[0][0] : '팔달로';

    setTrafficLoading(true);
    fetch(`/api/traffic?road=${encodeURIComponent(topRoad)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrafficData(data.data);
        else setTrafficData({ road: topRoad, status: '조회불가', score: 0 });
      })
      .catch(() => setTrafficData({ road: topRoad, status: '오류', score: 0 }))
      .finally(() => setTrafficLoading(false));
      
  }, [selectedDong, stores]);

  if (isLoading) return <LoadingSpinner />;

  // 총 인구
  const totalPop = MOCK_POPULATION.reduce((sum, p) => sum + p.totalPopulation, 0);
  const totalMale = MOCK_POPULATION.reduce((sum, p) => sum + p.male, 0);
  const totalFemale = MOCK_POPULATION.reduce((sum, p) => sum + p.female, 0);

  // 동별 인구 (정렬)
  const sortedByPop = [...MOCK_POPULATION].sort((a, b) => b.totalPopulation - a.totalPopulation);
  const popBarData = sortedByPop.slice(0, 15).map((p) => ({
    name: p.dongName,
    value: p.totalPopulation,
  }));

  // 전체 연령대 합산
  const totalAgeGroups: Record<string, number> = {};
  MOCK_POPULATION.forEach((p) => {
    p.ageGroups.forEach((ag) => {
      totalAgeGroups[ag.range] = (totalAgeGroups[ag.range] || 0) + ag.count;
    });
  });
  const agePieData = Object.entries(totalAgeGroups).map(([name, value]) => ({ name, value }));

  // 선택된 동 데이터
  const selectedPopData = selectedDong ? MOCK_POPULATION.find((p) => p.dongName === selectedDong) : null;
  const selectedDongData = selectedDong ? MOCK_DONG_SUMMARIES.find((d) => d.dongName === selectedDong) : null;

  // 잠재 고객 지수 (20~50대 인구 / 음식점 수)
  const potentialCustomerIndex = MOCK_POPULATION.map((p) => {
    const target = p.ageGroups
      .filter((ag) => ['20-29', '30-39', '40-49'].includes(ag.range))
      .reduce((sum, ag) => sum + ag.count, 0);
    const dong = MOCK_DONG_SUMMARIES.find((d) => d.dongName === p.dongName);
    const restaurants = dong?.restaurantCount || 1;
    return {
      name: p.dongName,
      value: Math.round(target / restaurants),
      targetPop: target,
      restaurants,
    };
  }).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">인구</span> 분석
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          전주시 행정동별 인구 구조와 잠재 고객 밀도를 분석합니다
        </p>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="전주시 총 인구" value={totalPop} color="primary" delay={1} />
        <StatCard icon="👨" label="남성 인구" value={totalMale} subValue={`${((totalMale / totalPop) * 100).toFixed(1)}%`} color="info" delay={2} />
        <StatCard icon="👩" label="여성 인구" value={totalFemale} subValue={`${((totalFemale / totalPop) * 100).toFixed(1)}%`} color="danger" delay={3} />
        <StatCard icon="🏘️" label="행정동 수" value={JEONJU_DONGS.length} subValue="완산구 + 덕진구" color="success" delay={4} />
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartBar data={popBarData} title="📍 동별 인구 수 TOP 15" unit="명" height={360} />
        <ChartPie data={agePieData} title="🎂 전체 연령대 분포" unit="명" height={300} />
      </div>

      {/* 시간대별 유동인구 핫스팟 (새 기능) */}
      <PopulationHotspots />

      {/* 잠재 고객 지수 랭킹 */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">🎯 잠재 고객 지수 (20~50대 인구 ÷ 음식점 수)</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          숫자가 클수록 고객 확보 잠재력이 높은 지역 (경쟁 대비 수요가 많음)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {potentialCustomerIndex.slice(0, 9).map((item, i) => (
            <button
              key={item.name}
              onClick={() => setSelectedDong(item.name)}
              className={`p-4 rounded-xl text-left transition-all hover:bg-indigo-500/10 ${
                selectedDong === item.name ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : 'bg-[var(--card-border)]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  i < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--card-border)] text-[var(--text-muted)]'
                }`}>
                  #{i + 1}
                </span>
                <span className="text-2xl font-bold text-gradient">{item.value}</span>
              </div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                타겟 인구 {item.targetPop.toLocaleString()} · 음식점 {item.restaurants}개
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 동 상세 */}
      {selectedPopData && selectedDongData && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">👥 {selectedDong} 인구 상세</h3>
            <button
              onClick={() => setSelectedDong(null)}
              className="text-xs px-3 py-1 rounded-lg bg-[var(--card-border)] text-[var(--text-secondary)] hover:bg-indigo-500/20"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-xs text-[var(--text-muted)]">총 인구</p>
              <p className="text-xl font-bold text-indigo-400">{selectedPopData.totalPopulation.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-[var(--text-muted)]">남성</p>
              <p className="text-xl font-bold text-blue-400">{selectedPopData.male.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <p className="text-xs text-[var(--text-muted)]">여성</p>
              <p className="text-xl font-bold text-pink-400">{selectedPopData.female.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-[var(--text-muted)]">점포당 배후인구</p>
              <p className="text-xl font-bold text-amber-400">{selectedDongData.competitionIndex.toLocaleString()}명</p>
            </div>
          </div>

          {trafficLoading ? (
            <div className="p-4 rounded-xl mb-4 border border-[var(--card-border)] bg-[var(--card-border)]/10 animate-pulse flex items-center justify-center">
              <span className="text-sm font-semibold text-[var(--text-muted)] tracking-wide">실시간 유동인구(교통망) 상태 분석 중... 🚦</span>
            </div>
          ) : trafficData && (
            <div className={`p-5 rounded-xl mb-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              trafficData.score >= 80 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 
              trafficData.score >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  {trafficData.isRealTime ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                    </span>
                  ) : <span className="opacity-70">⏳</span>}
                  실시간 활성 유동인구 지수
                </h4>
                <p className="text-[11px] opacity-70 mt-1.5 font-medium">
                  {trafficData.isRealTime 
                    ? `대표 상권 도로 [ ${trafficData.road} ] 실시간 API 연동 상태`
                    : `대표 상권 도로 [ ${trafficData.road} ] API 통신 대기 중 (50점/보통 추정 결괏값)`}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-3xl font-black">{trafficData.status}</div>
                <div className="text-xs font-bold opacity-80 mt-1 tracking-wider uppercase">
                  SCORE {trafficData.score}
                </div>
              </div>
            </div>
          )}

          <ChartBar
            data={selectedPopData.ageGroups.map((ag) => ({ name: ag.range, value: ag.count }))}
            title={`🎂 ${selectedDong} 연령대별 인구`}
            unit="명"
            height={250}
          />
        </div>
      )}
    </div>
  );
}
