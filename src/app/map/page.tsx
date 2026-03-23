'use client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useEffect, useRef, useState } from 'react';
import { JEONJU_CENTER } from '@/lib/mock-data';
import { useStores } from '@/components/providers/StoreProvider';
import PopulationHotspots from '@/components/PopulationHotspots';

// 카카오맵 타입 선언
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (container: HTMLElement, options: unknown) => unknown;
        Marker: new (options: unknown) => { setMap: (map: unknown) => void };
        InfoWindow: new (options: unknown) => { open: (map: unknown, marker: unknown) => void; close: () => void };
        MarkerClusterer: new (options: unknown) => { addMarkers: (markers: unknown[]) => void };
        event: { addListener: (target: unknown, type: string, handler: () => void) => void };
      };
    };
  }
}

export default function MapPage() {
  const { stores: MOCK_STORES, dongSummaries: MOCK_DONG_SUMMARIES, isLoading } = useStores();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedDong, setSelectedDong] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'hotspots'>('map');
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  // 카카오맵 SDK가 없을 때 fallback 렌더링
  const renderFallbackMap = () => {
    // 동별 음식점 수 기준 히트맵 테이블
    const sortedDongs = [...MOCK_DONG_SUMMARIES].sort((a, b) => b.restaurantCount - a.restaurantCount);

    return (
      <div className="space-y-6">
        <div className="card pulse-glow text-center py-8">
          <p className="text-4xl mb-3">🗺️</p>
          <h3 className="text-lg font-bold text-gradient mb-2">카카오맵 API 키가 필요합니다</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            .env.local의 NEXT_PUBLIC_KAKAO_MAP_KEY에 유효한 키를 설정하면<br/>
            실제 지도가 표시됩니다. 지금은 테이블 형태로 데이터를 보여드릴게요.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
            <code>NEXT_PUBLIC_KAKAO_MAP_KEY=your_key_here</code>
          </div>
        </div>

        {/* 동별 음식점 분포 테이블 (히트맵 대체) */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">📍 행정동별 음식점 분포</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedDongs.map((dong, i) => {
              const maxCount = sortedDongs[0].restaurantCount;
              const intensity = dong.restaurantCount / maxCount;
              const borderColor = intensity > 0.7 ? 'border-red-500' : intensity > 0.4 ? 'border-amber-500' : 'border-emerald-500';
              const dotColor = intensity > 0.7 ? 'bg-red-500' : intensity > 0.4 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <button
                  key={dong.dongName}
                  onClick={() => setSelectedDong(dong.dongName === selectedDong ? null : dong.dongName)}
                  className={`p-3 rounded-xl border-l-4 text-left transition-all ${borderColor} ${
                    selectedDong === dong.dongName
                      ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md'
                      : 'bg-[var(--card-border)]/20 hover:bg-[var(--card-border)]/40 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-muted)]">#{i + 1}</span>
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${dotColor}`} />
                  </div>
                  <p className="text-sm font-semibold text-white">{dong.dongName}</p>
                  <p className="text-xs text-indigo-300 font-bold">{dong.restaurantCount}개</p>
                  <p className="text-[10px] text-gray-400">인구 {dong.population.toLocaleString()}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 동 상세 */}
        {selectedDong && (() => {
          const dong = MOCK_DONG_SUMMARIES.find((d) => d.dongName === selectedDong);
          const stores = MOCK_STORES.filter((s) => s.adongNm === selectedDong);

          if (!dong) return null;

          return (
            <div className="card fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  📍 {selectedDong} <span className="text-sm text-[var(--text-muted)] font-normal">상세 정보</span>
                </h3>
                <button
                  onClick={() => setSelectedDong(null)}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--card-border)] text-[var(--text-secondary)] hover:bg-indigo-500/20"
                >
                  닫기
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs text-[var(--text-muted)]">총 음식점</p>
                  <p className="text-xl font-bold text-indigo-400">{dong.restaurantCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-[var(--text-muted)]">인구</p>
                  <p className="text-xl font-bold text-emerald-400">{dong.population.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-[var(--text-muted)]">점포당 배후인구</p>
                  <p className="text-xl font-bold text-amber-400">{dong.competitionIndex.toLocaleString()}명</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-[var(--text-muted)]">1위 업종</p>
                  <p className="text-xl font-bold text-purple-400">{dong.topIndustries[0]?.name || '-'}</p>
                </div>
              </div>

              {/* 해당 동의 음식점 목록 */}
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {stores.slice(0, 20).map((store) => (
                  <div key={store.bizesId} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--card-border)]/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{store.bizesNm}</p>
                      <p className="text-xs text-[var(--text-muted)]">{store.rdnmAdres}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {store.indsMclsNm}
                    </span>
                  </div>
                ))}
                {stores.length > 20 && (
                  <p className="text-xs text-[var(--text-muted)] text-center pt-2">
                    +{stores.length - 20}개 더 있음
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  useEffect(() => {
    // 카카오맵 SDK 로드 시도
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!kakaoKey || kakaoKey === 'DEMO_KEY') {
      setIsMapLoaded(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsMapLoaded(true);
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || isLoading) return;

    const { kakao } = window;
    const center = new kakao.maps.LatLng(JEONJU_CENTER.lat, JEONJU_CENTER.lng);
    const map = new kakao.maps.Map(mapRef.current, {
      center,
      level: 7,
    });

    // 마커 생성 (1만 개 전체를 클러스터링으로 렌더링)
    const markers = MOCK_STORES.map((store) => {
      const position = new kakao.maps.LatLng(store.lat, store.lon);
      const marker = new kakao.maps.Marker({ position });

      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:12px;background:#1a1d27;color:#e8eaed;border:1px solid #2a2e3a;border-radius:8px;min-width:150px;">
          <b>${store.bizesNm}</b><br/>
          <span style="color:#8b8fa3;">${store.indsMclsNm} · ${store.adongNm || store.ldongNm}</span>
        </div>`,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    // 클러스터러 (라이브러리 로드되었을 때만)
    if (kakao.maps.MarkerClusterer) {
      new kakao.maps.MarkerClusterer({
        map,
        markers,
        gridSize: 40,
        averageCenter: true,
        minLevel: 4,
        styles: [
          {
            width: '32px', height: '32px',
            background: 'rgba(99, 102, 241, 0.85)', 
            border: '2px solid rgba(167, 139, 250, 0.8)',
            borderRadius: '50%',
            color: '#ffffff', textAlign: 'center', fontWeight: 'bold',
            lineHeight: '28px', fontSize: '12px',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
        },
        {
          width: '42px', height: '42px',
          background: 'rgba(139, 92, 246, 0.85)',
          border: '2px solid rgba(196, 181, 253, 0.8)', 
          borderRadius: '50%',
          color: '#ffffff', textAlign: 'center', fontWeight: 'bold',
          lineHeight: '38px', fontSize: '14px',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
        },
        {
          width: '52px', height: '52px',
          background: 'rgba(236, 72, 153, 0.85)',
          border: '2px solid rgba(249, 168, 212, 0.8)',
          borderRadius: '50%',
          color: '#ffffff', textAlign: 'center', fontWeight: 'bold',
          lineHeight: '48px', fontSize: '15px',
          boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)'
        }
      ]
      });
    } else {
      // clusterer 라이브러리 미로드 시 마커 직접 표시
      markers.forEach(m => m.setMap(map));
    }
  }, [isMapLoaded, isLoading, MOCK_STORES]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">위치 기반</span> 상권 · 유동인구 분석
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          점포 분포와 실시간 유동인구 핫스팟을 지도 기반으로 탐색하세요.
        </p>
      </div>

      {/* 뷰 모드 토글 (애플 스타일) */}
      <div className="flex justify-center mb-6 fade-in">
        <div className="p-1 rounded-2xl bg-[var(--card-border)]/30 backdrop-blur-xl border border-white/5 flex flex-col sm:flex-row gap-1 shadow-inner w-full sm:w-auto">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 w-full sm:w-auto ${
              viewMode === 'map' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📍 음식점 상권 분포 지도
          </button>
          <button
            onClick={() => setViewMode('hotspots')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 w-full sm:w-auto ${
              viewMode === 'hotspots' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🔥 시간대별 유동인구 핫스팟
          </button>
        </div>
      </div>

      {viewMode === 'hotspots' ? (
        <div className="fade-in">
           <PopulationHotspots />
        </div>
      ) : (
        isMapLoaded ? (
          <div className="card p-0 overflow-hidden border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ height: '600px' }}>
            <div ref={mapRef} className="w-full h-full" />
          </div>
        ) : (
          renderFallbackMap()
        )
      )}
    </div>
  );
}
