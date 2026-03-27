'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResult {
  address: string;
  coordinates: { lng: number; lat: number };
  radius: number;
  dong: string;
  population: number;
  score: { total: number; grade: string; store: number; apt: number; pop: number; road: number };
  stores: {
    total: number;
    nearest: { name: string; industry: string; distance: number }[];
    topIndustries: { name: string; count: number }[];
    topRoads: { name: string; count: number }[];
  };
  apartments: {
    total: number;
    nearest: { name: string; address: string; distance: number }[];
  };
}

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(500);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<{ place_name: string; address_name: string; x: string; y: string }[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 카카오 주소 자동완성
  const handleAddressChange = useCallback((val: string) => {
    setAddress(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(val + ' 전주')}&size=5`, {
          headers: { Authorization: `KakaoAK ${await getKakaoKey()}` },
        });
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.documents || []);
        }
      } catch {}
    }, 300);
  }, []);

  // REST 키를 서버에서 가져오는 프록시 (보안상 클라이언트에 노출 방지)
  async function getKakaoKey() {
    // 클라이언트에서는 REST 키 접근 불가 → 서버 프록시 사용
    // 대신 Kakao JS SDK의 geocoder 활용
    return '';
  }

  // 주소를 좌표로 변환 (카카오 JS SDK)
  const geocodeAndAnalyze = useCallback(async (searchAddress: string, lng?: number, lat?: number) => {
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      let finalLng = lng;
      let finalLat = lat;

      // 좌표가 없으면 카카오 Geocoder 사용
      if (!finalLng || !finalLat) {
        const geocoded = await new Promise<{ lng: number; lat: number }>((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK has no TypeScript definitions
          const win = window as any;
          if (!win.kakao?.maps?.services) {
            reject(new Error('카카오맵 SDK를 로드하지 못했습니다'));
            return;
          }
          const geocoder = new win.kakao.maps.services.Geocoder();
          geocoder.addressSearch(searchAddress, (results: { x: string; y: string }[], status: string) => {
            if (status === 'OK' && results.length > 0) {
              resolve({ lng: Number(results[0].x), lat: Number(results[0].y) });
            } else {
              // 주소 검색 실패 시 키워드 검색 시도
              const places = new win.kakao.maps.services.Places();
              places.keywordSearch(searchAddress, (r: { x: string; y: string }[], s: string) => {
                if (s === 'OK' && r.length > 0) {
                  resolve({ lng: Number(r[0].x), lat: Number(r[0].y) });
                } else {
                  reject(new Error('주소를 찾을 수 없습니다'));
                }
              });
            }
          });
        });
        finalLng = geocoded.lng;
        finalLat = geocoded.lat;
      }

      // 분석 API 호출
      const res = await fetch(`/api/analyze?lng=${finalLng}&lat=${finalLat}&radius=${radius}&address=${encodeURIComponent(searchAddress)}`);
      const data = await res.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || '분석 실패');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '분석 중 오류 발생');
    } finally {
      setLoading(false);
    }
  }, [radius]);

  // 카카오맵 SDK 로드
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kakao Maps SDK has no TypeScript definitions
    const win = window as any;
    if (win.kakao?.maps?.services) return;
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`;
    script.onload = () => win.kakao.maps.load(() => {});
    document.head.appendChild(script);
  }, []);

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return { text: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' };
      case 'A': return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]' };
      case 'B': return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', glow: '' };
      case 'C': return { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', glow: '' };
      default: return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', glow: '' };
    }
  };

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      {/* 헤더 */}
      <div className="text-center fade-in">
        <h2 className="text-2xl font-bold mb-1">
          <span className="text-gradient">부동산 매물</span> 상권 분석
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          점포 주소를 입력하면 반경 내 음식점, 아파트, 교통, 인구를 종합 분석합니다.
        </p>
      </div>

      {/* 검색 폼 */}
      <div className="card p-4 sm:p-6 fade-in">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && geocodeAndAnalyze(address)}
              placeholder="주소를 입력하세요 (예: 전주시 덕진구 백제대로 123)"
              className="w-full px-4 py-3 rounded-xl bg-[var(--card-border)]/30 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
            {/* 자동완성 드롭다운 (카카오 JS Geocoder 사용) */}
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="px-4 py-3 rounded-xl bg-[var(--card-border)]/30 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={300}>300m</option>
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
          </select>
          <button
            onClick={() => geocodeAndAnalyze(address)}
            disabled={loading || !address}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '분석 중...' : '🔍 분석'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">⚠️ {error}</p>}
      </div>

      {/* 분석 결과 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* 종합 점수 */}
            {(() => {
              const gc = gradeColor(result.score.grade);
              return (
                <div className={`card p-8 text-center ${gc.glow}`}>
                  <p className="text-xs text-gray-500 mb-2">{result.address || '입력 주소'} · 반경 {result.radius}m</p>
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl text-5xl font-black border-2 mb-4 ${gc.bg} ${gc.text} ${gc.border}`}>
                    {result.score.grade}
                  </div>
                  <p className={`text-4xl font-black ${gc.text}`}>{result.score.total}<span className="text-lg text-gray-400">/100</span></p>
                  <p className="text-sm text-gray-400 mt-1">
                    {result.dong && `📍 ${result.dong}`} {result.population > 0 && `· 👥 ${result.population.toLocaleString()}명`}
                  </p>

                  {/* 점수 분해 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {[
                      { label: '🏪 점포', score: result.score.store, max: 40, color: 'indigo' },
                      { label: '🏢 아파트', score: result.score.apt, max: 30, color: 'sky' },
                      { label: '👥 인구', score: result.score.pop, max: 20, color: 'emerald' },
                      { label: '🛣️ 도로', score: result.score.road, max: 10, color: 'amber' },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <p className="text-[10px] text-gray-500 mb-1">{item.label}</p>
                        <p className={`text-lg font-black text-${item.color}-400`}>{item.score}<span className="text-[10px] text-gray-500">/{item.max}</span></p>
                        <div className="h-1 rounded-full bg-gray-800 mt-1 overflow-hidden">
                          <div className={`h-full rounded-full bg-${item.color}-500`} style={{ width: `${(item.score / item.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 상세 패널 2열 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 근처 음식점 */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded bg-indigo-500"></span>
                  🏪 반경 내 음식점 ({result.stores.total}개)
                </h3>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {result.stores.nearest.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{s.distance}m</span>
                        <span className="text-white">{s.name}</span>
                      </div>
                      <span className="text-indigo-400 text-[10px]">{s.industry}</span>
                    </div>
                  ))}
                  {result.stores.total > 10 && (
                    <p className="text-[10px] text-gray-500 text-center pt-1">+{result.stores.total - 10}개 더</p>
                  )}
                </div>
                {result.stores.topIndustries.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 mb-1.5">업종 분포</p>
                    <div className="flex gap-1 flex-wrap">
                      {result.stores.topIndustries.map(ind => (
                        <span key={ind.name} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                          {ind.name} {ind.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 근처 아파트 */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded bg-sky-500"></span>
                  🏢 인근 아파트 ({result.apartments.total}개)
                </h3>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {result.apartments.nearest.map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{a.distance}m</span>
                        <span className="text-white">{a.name}</span>
                      </div>
                    </div>
                  ))}
                  {result.apartments.nearest.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">반경 내 아파트 없음</p>
                  )}
                </div>
              </div>
            </div>

            {/* 주요 도로 */}
            {result.stores.topRoads.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded bg-amber-500"></span>
                  🛣️ 주변 주요 도로
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {result.stores.topRoads.map((r, i) => (
                    <div key={r.name} className={`px-3 py-2 rounded-lg border ${
                      i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/3 border-white/5'
                    }`}>
                      <span className="text-sm font-bold text-white">{r.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{r.count}개 점포</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 종합 의견 */}
            <div className={`card p-5 border ${
              result.score.grade === 'S' || result.score.grade === 'A' ? 'border-green-500/20' :
              result.score.grade === 'B' ? 'border-amber-500/20' : 'border-red-500/20'
            }`}>
              <h3 className="text-sm font-bold text-white mb-2">📊 종합 의견</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {result.score.grade === 'S' && '🟢 최상급 입지! 점포 밀집도·아파트 배후·인구 모든 지표가 우수합니다. 임대료 대비 수익성 검토 후 적극 고려하세요.'}
                {result.score.grade === 'A' && '🟢 우수한 입지입니다. 대부분의 지표가 양호하며, 특히 배후 수요가 안정적입니다. 차별화된 컨셉으로 승부하세요.'}
                {result.score.grade === 'B' && '🟡 보통 수준의 입지입니다. 일부 지표가 부족하지만, 업종 선택에 따라 성공 가능성이 있습니다.'}
                {result.score.grade === 'C' && '🟠 상권이 약한 편입니다. 유동인구나 배후 수요가 부족할 수 있어 신중한 검토가 필요합니다.'}
                {result.score.grade === 'D' && '🔴 상권 형성이 미약합니다. 이 지역에 음식점 창업은 높은 리스크가 예상됩니다.'}
                {' '}반경 {result.radius}m 내 음식점 {result.stores.total}개, 아파트 {result.apartments.total}개, 
                인구 {result.population.toLocaleString()}명 기준입니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 빈 상태 */}
      {!result && !loading && (
        <div className="text-center py-16 fade-in">
          <p className="text-6xl mb-4">🏠</p>
          <p className="text-gray-400">부동산 매물 주소를 입력하면</p>
          <p className="text-gray-400">주변 상권을 자동으로 분석합니다</p>
          <div className="mt-6 flex flex-col gap-2 text-[10px] text-gray-600 max-w-xs mx-auto">
            <p>💡 예시: &quot;전주시 덕진구 금암동&quot;</p>
            <p>💡 예시: &quot;팔달로 123&quot;</p>
            <p>💡 예시: &quot;에코시티 부영아파트&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
}
