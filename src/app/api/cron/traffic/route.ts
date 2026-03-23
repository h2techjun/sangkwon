import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseStringPromise } from 'xml2js';

// Vercel Cron으로 매시간 호출되는 배치 작업 API 엔드포인트
const TRAFFIC_API_KEY = process.env.DATA_GO_KR_API_KEY || ''; 
const TRAFFIC_URL = 'http://openapi.jeonju.go.kr/jeonjubus/openApi/traffic/traffic_detail_common.do';

// 전주시 주요 상권 척도가 되는 주요 15개 도로망 (대표 행정동 맵핑)
const TARGET_ROADS = [
  { road: '기린대로', dong: '송천1동' },
  { road: '호남로', dong: '중앙동' },
  { road: '홍산로', dong: '효자4동' },
  { road: '홍산중앙로', dong: '효자4동' },
  { road: '백제대로', dong: '서신동' },
  { road: '팔달로', dong: '풍남동' },
  { road: '용머리로', dong: '효자1동' },
  { road: '장승배기로', dong: '평화1동' },
  { road: '동부대로', dong: '우아2동' },
  { road: '아중로', dong: '인후3동' },
  { road: '안덕원로', dong: '인후2동' },
  { road: '가련산로', dong: '덕진동' },
  { road: '견훤로', dong: '우아1동' },
  { road: '쑥고개로', dong: '효자3동' },
  { road: '조경단로', dong: '금암1동' },
];

export async function GET(request: Request) {
  // 간단한 API Route 보안 (Cron secret)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ error: 'Unauthorized CRON Job execution' }, { status: 401 });
  }

  const currentHour = new Date().getHours();
  const historyRecords = [];

  for (const item of TARGET_ROADS) {
    try {
      const fetchUrl = `${TRAFFIC_URL}?ServiceKey=${TRAFFIC_API_KEY}&loadResult=${encodeURIComponent(item.road)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5초 타임아웃
      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const xml = await response.text();
      const result = await parseStringPromise(xml, { explicitArray: false });

      if (result && result.RFC30 && result.RFC30.routeList && result.RFC30.routeList.list) {
        let list = result.RFC30.routeList.list;
        if (!Array.isArray(list)) list = [list]; 

        const trafficData = list[0];
        const gradeCd = trafficData.cmtrGradCd ? parseInt(trafficData.cmtrGradCd, 10) : 2; 

        // 0(혼잡), 1(지체), 2(원활) -> 유동인구 0~100 환산
        let trafficScore = 30;
        if (gradeCd === 0) trafficScore = 90;
        else if (gradeCd === 1) trafficScore = 65;

        // 보다 생동감 있는 차례를 위해 Jitter(난수) 약간 추가
        trafficScore += Math.floor(Math.random() * 15) - 5; 

        historyRecords.push({
          dong_name: item.dong,
          road_name: item.road,
          hour: currentHour,
          score: Math.min(100, Math.max(0, trafficScore))
        });
      }
    } catch (e) {
       console.warn(`[CRON] ${item.road} Traffic API Fetch Failed`);
    }
  }

  // 데이터 수집이 성공한 건에 대해서 DB Bulk Insert
  if (historyRecords.length > 0) {
    const { error } = await supabase.from('traffic_history').insert(historyRecords);
    if (error) {
       console.error("[CRON] DB Insert 실패", error.message);
       return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: historyRecords.length, data: historyRecords });
  }

  return NextResponse.json({ success: true, message: 'No traffic data gathered (API inactive?)', count: 0 });
}
