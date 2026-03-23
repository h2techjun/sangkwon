import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

const TRAFFIC_API_KEY = process.env.DATA_GO_KR_API_KEY || ''; // Jeonju traffic API uses this key format in the doc
const TRAFFIC_URL = 'http://openapi.jeonju.go.kr/jeonjubus/openApi/traffic/traffic_detail_common.do';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const road = searchParams.get('road');

  if (!road) {
    return NextResponse.json({ success: false, error: 'road parameter is required' }, { status: 400 });
  }

  try {
    const fetchUrl = `${TRAFFIC_URL}?ServiceKey=${TRAFFIC_API_KEY}&loadResult=${encodeURIComponent(road)}`;
    
    // 타임아웃 3초 설정 (버스 API가 응답이 늦거나 죽었을 때를 대비)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml, { explicitArray: false });

    // 응답 파싱
    if (result && result.RFC30 && result.RFC30.routeList && result.RFC30.routeList.list) {
      let list = result.RFC30.routeList.list;
      if (!Array.isArray(list)) list = [list]; // 단일 항목일 경우 배열로 변환

      // 첫 번째 항목(해당 도로의 대표값) 사용
      const trafficData = list[0];
      const speed = trafficData.SPed ? parseInt(trafficData.SPed, 10) : 0;
      const gradeCd = trafficData.cmtrGradCd ? parseInt(trafficData.cmtrGradCd, 10) : 2; 

      // gradeCd: 2(원활), 1(지체), 0(정체)
      // 정체일수록 차가 밀리고 사람이 많다는 가정 하에 "유동인구 혼잡도" 도출
      let status = '원활';
      let trafficScore = 30; // 0~100

      if (gradeCd === 0) {
        status = '혼잡';
        trafficScore = 90;
      } else if (gradeCd === 1) {
        status = '지체';
        trafficScore = 60;
      }

      return NextResponse.json({
        success: true,
        data: {
          road: road,
          status: status,
          score: trafficScore,
          speed: speed,
          isRealTime: true
        }
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5분 캐시
        }
      });
    } else {
      throw new Error('Invalid XML response format or no data');
    }

  } catch (error: any) {
    console.warn(`Traffic API failed for ${road}:`, error.message);
    
    // API 연결 실패 시(혹은 1~24시간 후 활성화 전) Graceful Fallback
    // 유동인구 50(보통)으로 가짜 데이터 반환
    return NextResponse.json({
      success: true,
      message: "Fallback to mock traffic (API not available yet)",
      data: {
        road: road,
        status: '보통',
        score: 50,
        speed: 40,
        isRealTime: false
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60', // 에러/폴백 시엔 1분만 캐시해서 빠른 복구 시도
      }
    });
  }
}
