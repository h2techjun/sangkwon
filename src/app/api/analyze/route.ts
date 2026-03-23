import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 특정 좌표 주변의 상권 종합 분석 API
// - 반경 내 점포 조회 (Supabase)
// - 카카오 키워드 검색으로 인근 아파트 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lng = Number(searchParams.get('lng') || 0);
  const lat = Number(searchParams.get('lat') || 0);
  const address = searchParams.get('address') || '';
  const radius = Number(searchParams.get('radius') || 500); // 미터

  if (!lng || !lat) {
    return NextResponse.json({ success: false, error: 'lng, lat required' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 1. 반경 내 점포 조회 (위도/경도 거리 계산)
    // 간단한 bounding box로 필터 (정확한 원형은 아니지만 충분)
    const degPerMeter = 0.00001; // 약 1.1m
    const delta = radius * degPerMeter;
    
    const { data: nearbyStores } = await supabase
      .from('jeonju_stores')
      .select('bizesNm, indsMclsNm, indsSclsNm, adongNm, rdnm, lon, lat, bldNm')
      .gte('lat', lat - delta)
      .lte('lat', lat + delta)
      .gte('lon', lng - delta)
      .lte('lon', lng + delta);

    const stores = nearbyStores || [];

    // 실제 거리 계산 후 필터
    const storesWithDist = stores.map(s => ({
      ...s,
      distance: Math.round(getDistance(lat, lng, s.lat, s.lon)),
    })).filter(s => s.distance <= radius).sort((a, b) => a.distance - b.distance);

    // 업종 집계
    const industryCount: Record<string, number> = {};
    storesWithDist.forEach(s => {
      industryCount[s.indsMclsNm] = (industryCount[s.indsMclsNm] || 0) + 1;
    });
    const topIndustries = Object.entries(industryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 도로 집계
    const roadCount: Record<string, number> = {};
    storesWithDist.forEach(s => {
      if (s.rdnm) {
        const parts = s.rdnm.split(' ');
        const roadName = parts[parts.length - 1];
        if (roadName) roadCount[roadName] = (roadCount[roadName] || 0) + 1;
      }
    });
    const topRoads = Object.entries(roadCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 동 정보
    const dongNames = new Set(storesWithDist.map(s => s.adongNm).filter(Boolean));
    const primaryDong = Array.from(dongNames)[0] || '';

    // 2. 카카오 아파트 검색
    let apartments: any[] = [];
    let aptTotal = 0;
    const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
    if (KAKAO_KEY) {
      try {
        const aptUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=아파트&x=${lng}&y=${lat}&radius=${radius}&size=15&sort=distance`;
        const aptRes = await fetch(aptUrl, {
          headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
        });
        if (aptRes.ok) {
          const aptJson = await aptRes.json();
          aptTotal = aptJson.meta?.total_count || 0;
          apartments = (aptJson.documents || [])
            .filter((d: any) => (d.place_name || '').includes('아파트') || (d.category_name || '').includes('아파트'))
            .map((d: any) => ({
              name: d.place_name,
              address: d.address_name,
              distance: Number(d.distance),
            }));
        }
      } catch (e) {
        console.warn('Apt search error:', e);
      }
    }

    // 3. 인구 데이터 조회
    let population = 0;
    if (primaryDong) {
      const { data: popData } = await supabase
        .from('jeonju_population')
        .select('total_population')
        .eq('dong_name', primaryDong)
        .limit(1);
      population = popData?.[0]?.total_population || 0;
    }

    // 4. 종합 점수 계산
    const storeScore = Math.min(storesWithDist.length * 2, 40);         // 최대 40점
    const aptScore = Math.min(apartments.length * 3, 30);                // 최대 30점
    const popScore = population > 30000 ? 20 : population > 15000 ? 15 : population > 5000 ? 10 : 5; // 최대 20점
    const roadScore = topRoads.length > 0 ? Math.min(topRoads[0].count, 10) : 0; // 최대 10점
    const totalScore = storeScore + aptScore + popScore + roadScore;

    const grade = totalScore >= 80 ? 'S' : totalScore >= 60 ? 'A' : totalScore >= 40 ? 'B' : totalScore >= 20 ? 'C' : 'D';

    return NextResponse.json({
      success: true,
      address,
      coordinates: { lng, lat },
      radius,
      dong: primaryDong,
      population,
      score: { total: totalScore, grade, store: storeScore, apt: aptScore, pop: popScore, road: roadScore },
      stores: {
        total: storesWithDist.length,
        nearest: storesWithDist.slice(0, 10).map(s => ({
          name: s.bizesNm,
          industry: s.indsMclsNm,
          distance: s.distance,
        })),
        topIndustries,
        topRoads,
      },
      apartments: {
        total: aptTotal,
        nearest: apartments.slice(0, 10),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800', // 1일 캐시, 7일간 백그라운드 갱신
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

// Haversine 거리 계산 (미터)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
