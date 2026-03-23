// 목업 데이터 — API 키 없이 개발/데모용
import type { Store, PopulationData, IndustryStats, DongSummary, SalesTrend } from './types';

/** 전주시 행정동 목록 (완산구 + 덕진구) */
export const JEONJU_DONGS = [
  // 완산구
  '중앙동', '풍남동', '노송동', '완산동', '동서학동', '서서학동',
  '중화산동', '서신동', '평화동', '삼천동', '효자동', '전미동',
  // 덕진구
  '진북동', '인후동', '덕진동', '금암동', '팔복동', '우아동',
  '호성동', '송천동', '조촌동', '여의동', '혁신동',
];

/** 음식점 업종 분류 */
export const FOOD_INDUSTRIES = [
  '한식', '중식', '일식', '양식', '분식', '치킨', '피자',
  '패스트푸드', '카페/디저트', '주점/포차', '배달전문', '뷔페', '기타',
];

/** 전주시 중심 좌표 */
export const JEONJU_CENTER = { lat: 35.8242, lng: 127.1480 };

/** 목업: 음식점 데이터 (전주시 주요 지역) */
export const MOCK_STORES: Store[] = (() => {
  const stores: Store[] = [];
  const storeNames: Record<string, string[]> = {
    '한식': ['전주비빔밥집', '콩나물국밥 본점', '한정식 미소', '막걸리와 전', '갈비명가', '순두부마을', '해물탕 대가', '보쌈왕'],
    '중식': ['차이나팩토리', '짬뽕대왕', '마라탕하우스', '베이징덕', '중화루', '양꼬치 달인'],
    '일식': ['스시히로', '돈카츠하우스', '라멘공방', '일식참', '사시미 전주점'],
    '양식': ['파스타공장', '스테이크앤그릴', '브런치카페', '피자나라', '버거킹 전주점'],
    '카페/디저트': ['카페거리 1호점', '한옥카페', '디저트랩', '전주커피', '달콤한오후', '바리스타공방', '아이스크림픽'],
    '치킨': ['황금올리브 전주', '교촌치킨', '굽네치킨', '네네치킨 전주점'],
    '분식': ['떡볶이천국', '김밥나라', '라면공화국', '만두명가'],
  };

  let id = 1;
  JEONJU_DONGS.forEach((dong) => {
    const storeCount = Math.floor(Math.random() * 30) + 10;
    for (let i = 0; i < storeCount; i++) {
      const industries = Object.keys(storeNames);
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const names = storeNames[industry];
      const name = names[Math.floor(Math.random() * names.length)];

      stores.push({
        bizesId: `JJ${String(id).padStart(6, '0')}`,
        bizesNm: `${name} ${dong}점`,
        brchNm: `${dong}점`,
        indsLclsNm: '음식',
        indsMclsNm: industry,
        indsSclsNm: industry,
        ksicNm: `${industry} 음식점업`,
        ctprvnNm: '전북특별자치도',
        signguNm: JEONJU_DONGS.indexOf(dong) < 12 ? '전주시 완산구' : '전주시 덕진구',
        adongNm: dong,
        ldongNm: dong,
        lnmAdres: `전북특별자치도 전주시 ${dong} ${Math.floor(Math.random() * 200) + 1}`,
        rdnmAdres: `전북특별자치도 전주시 ${dong}로 ${Math.floor(Math.random() * 200) + 1}`,
        // 전주시 범위 내 랜덤 좌표
        lat: 35.79 + Math.random() * 0.07,
        lon: 127.1 + Math.random() * 0.1,
      });
      id++;
    }
  });
  return stores;
})();

/** 목업: 동별 인구 데이터 */
export const MOCK_POPULATION: PopulationData[] = JEONJU_DONGS.map((dong) => {
  const totalPop = Math.floor(Math.random() * 40000) + 8000;
  const ageRanges = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];

  // 연령대별 비율을 현실적으로 설정
  const ratios = [0.07, 0.09, 0.15, 0.14, 0.16, 0.15, 0.12, 0.08, 0.04];
  const ageGroups = ageRanges.map((range, i) => ({
    range,
    count: Math.floor(totalPop * ratios[i] * (0.8 + Math.random() * 0.4)),
  }));

  return {
    dongName: dong,
    totalPopulation: totalPop,
    male: Math.floor(totalPop * (0.47 + Math.random() * 0.06)),
    female: Math.floor(totalPop * (0.47 + Math.random() * 0.06)),
    ageGroups,
  };
});

/** 목업: 업종별 통계 */
export const MOCK_INDUSTRY_STATS: IndustryStats[] = FOOD_INDUSTRIES.map((name) => {
  const stores = MOCK_STORES.filter((s) => s.indsMclsNm === name);
  const dongDist: Record<string, number> = {};
  stores.forEach((s) => {
    dongDist[s.adongNm] = (dongDist[s.adongNm] || 0) + 1;
  });

  return {
    industryName: name,
    storeCount: stores.length,
    avgSurvivalYears: Math.round((Math.random() * 6 + 1) * 10) / 10,
    newOpenings: Math.floor(Math.random() * 20) + 3,
    closures: Math.floor(Math.random() * 15) + 1,
    dongDistribution: dongDist,
  };
});

/** 목업: 동별 상권 요약 */
export const MOCK_DONG_SUMMARIES: DongSummary[] = JEONJU_DONGS.map((dong) => {
  const stores = MOCK_STORES.filter((s) => s.adongNm === dong);
  const pop = MOCK_POPULATION.find((p) => p.dongName === dong);

  // 업종별 수 계산
  const industryCounts: Record<string, number> = {};
  stores.forEach((s) => {
    industryCounts[s.indsMclsNm] = (industryCounts[s.indsMclsNm] || 0) + 1;
  });
  const topIndustries = Object.entries(industryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const population = pop?.totalPopulation || 20000;

  return {
    dongName: dong,
    totalStores: stores.length,
    restaurantCount: stores.length,
    population,
    competitionIndex: Math.round((stores.length / population) * 10000) / 10, // 인구 1만명당 음식점 수
    topIndustries,
  };
});

/** 목업: 매출 추이 */
export const MOCK_SALES_TRENDS: SalesTrend[] = [
  { period: '2025-Q1', totalSales: 245000, avgSalesPerStore: 320 },
  { period: '2025-Q2', totalSales: 268000, avgSalesPerStore: 345 },
  { period: '2025-Q3', totalSales: 312000, avgSalesPerStore: 398 },
  { period: '2025-Q4', totalSales: 289000, avgSalesPerStore: 372 },
  { period: '2026-Q1', totalSales: 302000, avgSalesPerStore: 385 },
];
