'use client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import StatCard from '@/components/cards/StatCard';
import ChartBar from '@/components/charts/ChartBar';
import ChartPie from '@/components/charts/ChartPie';
import ChartLine from '@/components/charts/ChartLine';
import { useStores } from '@/components/providers/StoreProvider';

export default function DashboardPage() {
  const { stores: MOCK_STORES, dongSummaries: MOCK_DONG_SUMMARIES, industryStats: MOCK_INDUSTRY_STATS, salesTrends: MOCK_SALES_TRENDS, isLoading } = useStores();

  // 핵심 지표 계산
  if (isLoading) return <LoadingSpinner />;

  const totalStores = MOCK_STORES.length;
  const uniqueDongs = new Set(MOCK_STORES.map((s) => s.adongNm || s.ldongNm).filter(Boolean)).size;
  const topIndustry = [...MOCK_INDUSTRY_STATS].sort((a, b) => b.storeCount - a.storeCount)[0] || { industryName: '데이터 없음', storeCount: 0 };
  const avgCompetition = MOCK_DONG_SUMMARIES.length > 0 
    ? Math.round(
        MOCK_DONG_SUMMARIES.reduce((sum, d) => sum + d.competitionIndex, 0) / MOCK_DONG_SUMMARIES.length
      )
    : 0;

  // 동별 음식점 수 (상위 10)
  const dongBarData = [...MOCK_DONG_SUMMARIES]
    .sort((a, b) => b.restaurantCount - a.restaurantCount)
    .slice(0, 10)
    .map((d) => ({ name: d.dongName, value: d.restaurantCount }));

  // 업종별 분포
  const industryPieData = MOCK_INDUSTRY_STATS
    .filter((i) => i.storeCount > 0)
    .map((i) => ({ name: i.industryName, value: i.storeCount }))
    .sort((a, b) => b.value - a.value);

  // 매출 추이 라인 차트
  const salesLineData = MOCK_SALES_TRENDS.map((s) => ({
    name: s.period,
    value: s.totalSales,
    value2: s.avgSalesPerStore,
  }));

  // 포화 상권 (점포당 수요 최하위 - 낮은 숫자가 레드오션)
  const redOceanTop5 = [...MOCK_DONG_SUMMARIES]
    .sort((a, b) => a.competitionIndex - b.competitionIndex)
    .slice(0, 5);

  // 기회 상권 (점포당 수요 최상위 - 높은 숫자가 블루오션)
  const blueOceanTop5 = [...MOCK_DONG_SUMMARIES]
    .sort((a, b) => b.competitionIndex - a.competitionIndex)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">전주시</span> 상권 대시보드
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          전주시 전체 음식점 상권 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 핵심 지표 카드 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🏪"
          label="총 음식점 수"
          value={totalStores}
          subValue={`전주시 ${uniqueDongs}개 동`}
          trend={{ value: 5.2, label: '전분기 대비' }}
          color="primary"
          delay={1}
        />
        <StatCard
          icon="🍽️"
          label="최다 업종"
          value={topIndustry.industryName}
          subValue={`${topIndustry.storeCount}개 점포`}
          color="success"
          delay={2}
        />
        <StatCard
          icon="📈"
          label="최근 분기 매출"
          value={`${((MOCK_SALES_TRENDS[MOCK_SALES_TRENDS.length - 1]?.totalSales || 0) / 10000).toFixed(1)}억`}
          subValue="전주시 음식점 전체"
          trend={{ value: 4.5, label: '전분기' }}
          color="warning"
          delay={3}
        />
        <StatCard
          icon="⚔️"
          label="평균 잠재 고객"
          value={`${avgCompetition.toLocaleString()}명`}
          subValue="음식점 1개당 배후 인구수"
          color="danger"
          delay={4}
        />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartBar
          data={dongBarData}
          title="📍 동별 음식점 수 TOP 10"
          unit="개"
          height={320}
        />
        <ChartPie
          data={industryPieData}
          title="🍽️ 업종별 분포"
          unit="개"
          height={280}
        />
      </div>

      {/* 매출 추이 */}
      <ChartLine
        data={salesLineData}
        title="💰 분기별 매출 추이"
        unit="만원"
        height={280}
        line1Label="총 매출"
        line2Label="점포 평균"
      />

      {/* 경쟁/블루오션 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 레드오션 (포화 지역) */}
        <div className="card">
          <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
            🔴 포화 상권 (경쟁 과열)
          </h3>
          <div className="space-y-2">
            {redOceanTop5.map((d, i) => (
              <div key={d.dongName} className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-400/50">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{d.dongName}</p>
                    <p className="text-xs text-[var(--text-muted)]">인구 {d.population.toLocaleString()}명</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">점포당 {d.competitionIndex.toLocaleString()}명</p>
                  <p className="text-xs text-[var(--text-muted)]">음식점 {d.restaurantCount}개</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 블루오션 (기회 지역) */}
        <div className="card">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            🟢 기회 상권 (창업 유망)
          </h3>
          <div className="space-y-2">
            {blueOceanTop5.map((d, i) => (
              <div key={d.dongName} className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-emerald-400/50">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{d.dongName}</p>
                    <p className="text-xs text-[var(--text-muted)]">인구 {d.population.toLocaleString()}명</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">점포당 {d.competitionIndex.toLocaleString()}명</p>
                  <p className="text-xs text-[var(--text-muted)]">음식점 {d.restaurantCount}개</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
