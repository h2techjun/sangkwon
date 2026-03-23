// 전주시 상권분석 공통 타입 정의

/** 소상공인 상가정보 API 응답 타입 */
export interface Store {
  bizesId: string;        // 상가업소번호
  bizesNm: string;        // 상호명
  brchNm: string;         // 지점명
  indsLclsNm: string;     // 업종 대분류명
  indsMclsNm: string;     // 업종 중분류명
  indsSclsNm: string;     // 업종 소분류명
  ksicNm: string;         // 표준산업분류명
  ctprvnNm: string;       // 시도명
  signguNm: string;       // 시군구명
  adongNm: string;        // 행정동명
  ldongNm: string;        // 법정동명
  rdnm?: string;          // 도로명 (DB)
  lnmAdres: string;       // 도로명주소
  rdnmAdres: string;      // 지번주소
  lon: number;            // 경도
  lat: number;            // 위도
}

/** 행정동별 인구 데이터 */
export interface PopulationData {
  dongName: string;       // 행정동명
  totalPopulation: number;
  male: number;
  female: number;
  ageGroups: AgeGroup[];
}

export interface AgeGroup {
  range: string;          // "0-4", "5-9", ... "85+"
  count: number;
}

/** 업종별 통계 */
export interface IndustryStats {
  industryName: string;   // 업종명
  storeCount: number;     // 점포 수
  avgSurvivalYears: number; // 평균 업력 (년)
  newOpenings: number;    // 신규 개업 수
  closures: number;       // 폐업 수
  dongDistribution: Record<string, number>; // 동별 분포
}

/** 동별 상권 요약 */
export interface DongSummary {
  dongName: string;
  totalStores: number;
  restaurantCount: number;
  population: number;
  competitionIndex: number;   // 경쟁 지수 (인구 대비 음식점 비율)
  topIndustries: { name: string; count: number }[];
}

/** 매출 추이 (전주시 포털) */
export interface SalesTrend {
  period: string;         // "2025-Q1", "2025-Q2"
  totalSales: number;     // 총 매출 (만원)
  avgSalesPerStore: number;
}

/** 비교 분석 결과 */
export interface CompareResult {
  dongs: DongSummary[];
  recommendation: string;
  scores: {
    dongName: string;
    populationScore: number;
    competitionScore: number;
    totalScore: number;
  }[];
}

/** API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  cached?: boolean;
}
