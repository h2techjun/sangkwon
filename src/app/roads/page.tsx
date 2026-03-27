'use client';

import { useStores } from '@/components/providers/StoreProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadSummary {
  roadName: string;
  dongName: string;
  storeCount: number;
  topIndustries: { name: string; count: number }[];
  population: number;
  popPerStore: number;
  storeList: { bizesNm: string; indsMclsNm: string; lon: number; lat: number }[];
  centerLon: number;
  centerLat: number;
}

// 인라인 카카오 미니맵 컴포넌트
function RoadMiniMap({ stores, centerLon, centerLat, roadName }: {
  stores: { bizesNm: string; indsMclsNm: string; lon: number; lat: number }[];
  centerLon: number; centerLat: number; roadName: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK instance
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK has no TypeScript definitions
    if (!mapRef.current || !(window as any).kakao?.maps) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK
    const kakao = (window as any).kakao;
    const center = new kakao.maps.LatLng(centerLat, centerLon);
    const map = new kakao.maps.Map(mapRef.current, { center, level: 4 });
    mapInstance.current = map;

    // 마커 + 인포윈도우
    const validStores = stores.filter(s => s.lon && s.lat);
    const bounds = new kakao.maps.LatLngBounds();

    validStores.forEach(s => {
      const position = new kakao.maps.LatLng(s.lat, s.lon);
      bounds.extend(position);

      const marker = new kakao.maps.Marker({ map, position });
      const infoContent = `<div style="padding:4px 8px;font-size:11px;white-space:nowrap;background:#1a1a2e;color:#fff;border:1px solid #6366f1;border-radius:6px;"><b>${s.bizesNm}</b><br/><span style="color:#818cf8">${s.indsMclsNm}</span></div>`;
      const infowindow = new kakao.maps.InfoWindow({ content: infoContent });

      kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
      kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
    });

    if (validStores.length > 1) {
      map.setBounds(bounds, 50);
    }

    // 도로명 오버레이
    const overlay = new kakao.maps.CustomOverlay({
      content: `<div style="background:rgba(99,102,241,0.9);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:bold;box-shadow:0 4px 15px rgba(99,102,241,0.4);">📍 ${roadName} (${validStores.length}개)</div>`,
      position: center,
      yAnchor: 2.5,
    });
    overlay.setMap(map);

    return () => {
      mapInstance.current = null;
    };
  }, [stores, centerLon, centerLat, roadName]);

  return (
    <div ref={mapRef} className="w-full h-[300px] rounded-xl overflow-hidden border border-indigo-500/20" />
  );
}

export default function RoadsPage() {
  const { stores, dongSummaries, isLoading } = useStores();
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'stores' | 'popPerStore'>('stores');
  const [mapReady, setMapReady] = useState(false);

  // 카카오맵 SDK 로드
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK
    const win = window as any;
    if (win.kakao?.maps) {
      // SDK가 이미 로드된 경우 - 별도 스크립트 추가 불필요
      const timer = requestAnimationFrame(() => setMapReady(true));
      return () => cancelAnimationFrame(timer);
    }
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`;
    script.onload = () => win.kakao.maps.load(() => setMapReady(true));
    document.head.appendChild(script);
  }, []);

  // 도로별 집계 계산 (좌표 포함)
  const roadSummaries = useMemo(() => {
    const roadMap = new Map<string, { stores: typeof stores; dongName: string }>();

    stores.forEach(s => {
      let roadName = '';
      if (s.rdnm) {
        const parts = s.rdnm.split(' ');
        roadName = parts[parts.length - 1];
      } else if (s.rdnmAdres) {
        const parts = s.rdnmAdres.split(' ');
        const roadIdx = parts.findIndex(p => /[로길]$/.test(p));
        if (roadIdx >= 0) roadName = parts[roadIdx];
      }
      if (!roadName || roadName.length < 2) return;
      const dongName = s.adongNm || s.ldongNm || '';
      if (!roadMap.has(roadName)) roadMap.set(roadName, { stores: [], dongName });
      roadMap.get(roadName)!.stores.push(s);
    });

    const summaries: RoadSummary[] = [];

    roadMap.forEach((data, roadName) => {
      if (data.stores.length < 3) return;

      const indCount: Record<string, number> = {};
      data.stores.forEach(s => { indCount[s.indsMclsNm] = (indCount[s.indsMclsNm] || 0) + 1; });
      const topInd = Object.entries(indCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));

      const dong = dongSummaries.find(d => d.dongName === data.dongName);
      const population = dong?.population || 0;

      // 중심 좌표 계산
      const validCoords = data.stores.filter(s => s.lon && s.lat);
      const centerLon = validCoords.length > 0 ? validCoords.reduce((a, s) => a + s.lon, 0) / validCoords.length : 127.12;
      const centerLat = validCoords.length > 0 ? validCoords.reduce((a, s) => a + s.lat, 0) / validCoords.length : 35.82;

      summaries.push({
        roadName,
        dongName: data.dongName,
        storeCount: data.stores.length,
        topIndustries: topInd,
        population,
        popPerStore: data.stores.length > 0 ? Math.round(population / data.stores.length) : 0,
        storeList: data.stores.map(s => ({ bizesNm: s.bizesNm, indsMclsNm: s.indsMclsNm, lon: s.lon, lat: s.lat })),
        centerLon, centerLat,
      });
    });

    return summaries;
  }, [stores, dongSummaries]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    roadSummaries.forEach(r => r.topIndustries.forEach(i => set.add(i.name)));
    return ['전체', ...Array.from(set).sort()];
  }, [roadSummaries]);

  const filteredRoads = useMemo(() => {
    let result = [...roadSummaries];
    if (filterIndustry !== '전체') {
      result = result.filter(r => r.topIndustries.some(i => i.name === filterIndustry));
    }
    result.sort((a, b) => sortBy === 'stores' ? b.storeCount - a.storeCount : b.popPerStore - a.popPerStore);
    return result;
  }, [roadSummaries, filterIndustry, sortBy]);

  const selectedRoadData = roadSummaries.find(r => r.roadName === selectedRoad);

  if (isLoading) return <LoadingSpinner />;

  const totalRoads = roadSummaries.length;
  const avgStoresPerRoad = totalRoads > 0 ? Math.round(roadSummaries.reduce((a, b) => a + b.storeCount, 0) / totalRoads) : 0;
  const bestOpportunity = [...roadSummaries].sort((a, b) => b.popPerStore - a.popPerStore)[0];
  const hottest = [...roadSummaries].sort((a, b) => b.storeCount - a.storeCount)[0];

  return (
    <div className="space-y-6">
      <div className="fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">도로별</span> 상권 밀집도 & 매출 추정
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          전주시 {totalRoads.toLocaleString()}개 도로의 음식점 분포를 분석합니다. 도로를 클릭하면 🗺️ 지도에서 위치를 확인하세요.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
        <div className="card p-4 border-l-4 border-indigo-500">
          <p className="text-xs text-[var(--text-muted)] mb-1">분석 도로 수</p>
          <p className="text-2xl font-bold text-indigo-400">{totalRoads.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">3개 이상 점포 보유 도로</p>
        </div>
        <div className="card p-4 border-l-4 border-emerald-500">
          <p className="text-xs text-[var(--text-muted)] mb-1">도로당 평균 점포</p>
          <p className="text-2xl font-bold text-emerald-400">{avgStoresPerRoad}개</p>
        </div>
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs text-[var(--text-muted)] mb-1">🔥 가장 핫한 도로</p>
          <p className="text-lg font-bold text-amber-400">{hottest?.roadName || '-'}</p>
          <p className="text-[10px] text-gray-500">{hottest?.storeCount || 0}개 점포 · {hottest?.dongName}</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs text-[var(--text-muted)] mb-1">🌱 최고 기회 도로</p>
          <p className="text-lg font-bold text-green-400">{bestOpportunity?.roadName || '-'}</p>
          <p className="text-[10px] text-gray-500">점포당 {bestOpportunity?.popPerStore || 0}명 배후 · {bestOpportunity?.dongName}</p>
        </div>
      </div>

      {/* 필터 & 정렬 */}
      <div className="flex flex-wrap gap-3 items-center fade-in">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">업종:</span>
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--card-border)]/30 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500">
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">정렬:</span>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button onClick={() => setSortBy('stores')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'stores' ? 'bg-indigo-500 text-white' : 'bg-[var(--card-border)]/30 text-gray-400 hover:text-white'}`}>
              점포 수순
            </button>
            <button onClick={() => setSortBy('popPerStore')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === 'popPerStore' ? 'bg-green-500 text-white' : 'bg-[var(--card-border)]/30 text-gray-400 hover:text-white'}`}>
              기회 점수순
            </button>
          </div>
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filteredRoads.length}개 도로 표시 중</span>
      </div>

      {/* 도로 리스트 */}
      <div className="space-y-2 fade-in">
        {filteredRoads.slice(0, 50).map((road, i) => {
          const maxStores = filteredRoads[0]?.storeCount || 1;
          const barWidth = (road.storeCount / maxStores) * 100;
          const isHot = road.storeCount > avgStoresPerRoad * 2;
          const isOpportunity = road.popPerStore > 50;

          return (
            <motion.div key={road.roadName} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
              <button
                onClick={() => setSelectedRoad(selectedRoad === road.roadName ? null : road.roadName)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRoad === road.roadName
                    ? 'bg-white/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'bg-[var(--card-border)]/10 border-white/5 hover:border-white/15 hover:bg-[var(--card-border)]/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700/50 text-gray-400'}`}>#{i + 1}</span>
                    <div>
                      <span className="font-bold text-white">{road.roadName}</span>
                      <span className="text-xs text-gray-500 ml-2">{road.dongName}</span>
                    </div>
                    {isHot && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">🔥 핫</span>}
                    {isOpportunity && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">🌱 기회</span>}
                    {selectedRoad !== road.roadName && <span className="text-[10px] text-indigo-400">🗺️ 클릭하면 지도 표시</span>}
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${sortBy === 'popPerStore' ? (road.popPerStore > 80 ? 'text-green-400' : road.popPerStore > 30 ? 'text-amber-400' : 'text-red-400') : 'text-indigo-400'}`}>
                      {sortBy === 'popPerStore' ? `${road.popPerStore}명` : `${road.storeCount}개`}
                    </span>
                    <p className="text-[10px] text-gray-500">{sortBy === 'popPerStore' ? `점포 ${road.storeCount}개` : `점포당 ${road.popPerStore}명`}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden mb-2">
                  <motion.div
                    className={`h-full rounded-full ${isOpportunity ? 'bg-gradient-to-r from-green-500 to-emerald-400' : isHot ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-indigo-500 to-purple-400'}`}
                    initial={{ width: 0 }} animate={{ width: `${barWidth}%` }} transition={{ duration: 0.5, delay: i * 0.02 }}
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {road.topIndustries.map(ind => (
                    <span key={ind.name} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{ind.name} {ind.count}</span>
                  ))}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">배후인구 {road.population.toLocaleString()}명</span>
                </div>
              </button>

              {/* 선택 시 지도 + 상세 */}
              <AnimatePresence>
                {selectedRoad === road.roadName && selectedRoadData && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 ml-4 border-l-2 border-indigo-500/30 space-y-3 mt-1">
                      {/* 🗺️ 인라인 지도 */}
                      {mapReady && (
                        <div>
                          <p className="text-xs text-indigo-400 font-semibold mb-2">🗺️ {selectedRoadData.roadName} 점포 위치</p>
                          <RoadMiniMap
                            stores={selectedRoadData.storeList}
                            centerLon={selectedRoadData.centerLon}
                            centerLat={selectedRoadData.centerLat}
                            roadName={selectedRoadData.roadName}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                          <p className="text-[10px] text-gray-400">총 점포</p>
                          <p className="text-lg font-bold text-indigo-400">{selectedRoadData.storeCount}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <p className="text-[10px] text-gray-400">배후 인구</p>
                          <p className="text-lg font-bold text-emerald-400">{selectedRoadData.population.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                          <p className="text-[10px] text-gray-400">점포당 인구</p>
                          <p className="text-lg font-bold text-amber-400">{selectedRoadData.popPerStore}명</p>
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        <p className="text-xs text-gray-400 font-semibold mb-1">📍 이 도로의 점포 목록</p>
                        {selectedRoadData.storeList.slice(0, 15).map((s, j) => (
                          <div key={j} className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-white/5">
                            <span className="text-white">{s.bizesNm}</span>
                            <span className="text-indigo-400">{s.indsMclsNm}</span>
                          </div>
                        ))}
                        {selectedRoadData.storeList.length > 15 && (
                          <p className="text-[10px] text-gray-500 text-center">+{selectedRoadData.storeList.length - 15}개 더</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filteredRoads.length > 50 && (
        <p className="text-xs text-gray-500 text-center">상위 50개 도로만 표시됩니다. 필터를 활용하세요.</p>
      )}
    </div>
  );
}
