import { Store } from './types';

const DATA_GO_KR_BASE_URL = 'https://apis.data.go.kr/B553077/api/open/sdsc2';
const JEONJU_SIGNGU_CODES = ['45111', '45113']; // 완산구, 덕진구
const FOOD_INDUSTRY_CODE_OLD = 'Q'; // 구 상권분석 업종코드 (음식)
const FOOD_INDUSTRY_CODE_NEW = 'I2'; // 신 상권분석 업종코드 (음식점업)

export async function fetchStoresFromApi(): Promise<Store[]> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey || apiKey === 'DEMO_KEY') {
    throw new Error('API Key is missing');
  }

  const allStores: Store[] = [];

  // 완산구와 덕진구를 순회하며 데이터 페치
  for (const signguCd of JEONJU_SIGNGU_CODES) {
    try {
      // 1. 업종대분류 Q (또는 I2) 로 호출
      // 파라미터: type=json, divId=signguCd, key=45111, indsLclsCd=Q, numOfRows=1000
      let url = `${DATA_GO_KR_BASE_URL}/storeListInSigngu?serviceKey=${apiKey}&pageNo=1&numOfRows=1000&divId=signguCd&key=${signguCd}&indsLclsCd=${FOOD_INDUSTRY_CODE_OLD}&type=json`;
      
      let res = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐시
      let data = await res.json();

      // 만약 Q 코드로 안나오면 신규 I2 코드로 재시도
      if (!data?.body?.items || data.body.items.length === 0) {
        url = `${DATA_GO_KR_BASE_URL}/storeListInSigngu?serviceKey=${apiKey}&pageNo=1&numOfRows=1000&divId=signguCd&key=${signguCd}&indsLclsCd=${FOOD_INDUSTRY_CODE_NEW}&type=json`;
        res = await fetch(url, { next: { revalidate: 3600 } });
        data = await res.json();
      }

      if (data?.body?.items && Array.isArray(data.body.items)) {
        allStores.push(...data.body.items);
      }
    } catch (error) {
      console.error(`Error fetching data for signguCd ${signguCd}:`, error);
    }
  }

  return allStores;
}
