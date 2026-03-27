import { NextResponse } from 'next/server';

// 카카오 로컬 API - 키워드 검색으로 주변 아파트 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lng = searchParams.get('lng');
  const lat = searchParams.get('lat');
  const radius = searchParams.get('radius') || '1000'; // 기본 1km

  if (!lng || !lat) {
    return NextResponse.json({ success: false, error: 'lng, lat required' });
  }

  const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
  if (!KAKAO_KEY) {
    return NextResponse.json({ success: false, error: 'KAKAO_REST_API_KEY not set', data: [] });
  }

  try {
    // 키워드 검색으로 '아파트' 조회 (반경 내)
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=아파트&x=${lng}&y=${lat}&radius=${radius}&size=15&sort=distance`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Kakao keyword search failed:', res.status, errText);
      return NextResponse.json({ success: false, error: `Kakao API error: ${res.status}`, data: [], total: 0 });
    }

    const json = await res.json();
    
    // 아파트만 필터링 (카테고리에 '아파트' 포함하는 것)
    const apartments = (json.documents || [])
      .filter((doc: { place_name?: string; category_name?: string }) => {
        const name = doc.place_name || '';
        const cat = doc.category_name || '';
        return name.includes('아파트') || cat.includes('아파트');
      })
      .map((doc: { place_name?: string; address_name?: string; distance?: string; x?: string; y?: string; category_name?: string }) => ({
        name: doc.place_name,
        address: doc.address_name,
        distance: Number(doc.distance),
        lng: Number(doc.x),
        lat: Number(doc.y),
        category: doc.category_name,
      }));

    return NextResponse.json({
      success: true,
      data: apartments,
      total: json.meta?.total_count || apartments.length,
    });
  } catch (err: unknown) {
    console.error('Apartment search error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message, data: [], total: 0 });
  }
}
