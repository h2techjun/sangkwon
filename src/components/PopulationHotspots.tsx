'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Hotspot {
  timeLabel: string;
  timeRange: string;
  icon: string;
  dongName: string;
  roadName: string;
  score: number;
}

export default function PopulationHotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHotspots() {
      try {
        // 최근 3일치 데이터 조회
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('traffic_history')
          .select('dong_name, road_name, hour, score')
          .gte('recorded_at', threeDaysAgo);

        if (error) throw error;

        // 데이터가 아직 없다면 빈 배열 유지 (수집 중 UI 노출)
        if (!data || data.length === 0) {
          setHotspots([]);
          return;
        }

        // 시간대별 필터링
        const getTop = (hours: number[], label: string, icon: string, range: string) => {
          const filtered = data.filter(d => hours.includes(d.hour));
          if (filtered.length === 0) return null;

          const dongScores: Record<string, { total: number, count: number, road: string }> = {};
          
          filtered.forEach(d => {
            if (!dongScores[d.dong_name]) dongScores[d.dong_name] = { total: 0, count: 0, road: d.road_name };
            dongScores[d.dong_name].total += d.score;
            dongScores[d.dong_name].count += 1;
          });

          let topDong = '';
          let topScore = -1;
          let topRoad = '';

          Object.keys(dongScores).forEach(dong => {
            const avg = Math.round(dongScores[dong].total / dongScores[dong].count);
            if (avg > topScore) {
              topScore = avg;
              topDong = dong;
              topRoad = dongScores[dong].road;
            }
          });

          return { timeLabel: label, timeRange: range, icon, dongName: topDong, roadName: topRoad, score: topScore };
        };

        const lunch = getTop([11, 12, 13, 14], '점심 피크', '🍱', '11:00 ~ 14:00');
        const dinner = getTop([18, 19, 20], '저녁 피크', '🍻', '18:00 ~ 20:00');
        const night = getTop([21, 22, 23, 0], '심야 피크', '🌙', '21:00 ~ 24:00');

        const results = [lunch, dinner, night].filter(Boolean) as Hotspot[];
        setHotspots(results);

      } catch (e) {
        console.error("Traffic Hotspot Error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchHotspots();
  }, []);

  if (loading) {
    return (
      <div className="card animate-pulse bg-[var(--card-border)]/10">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-2">
          <span>🔥</span> 로딩 중...
        </h3>
        <div className="h-24 rounded-lg bg-[var(--bg-secondary)] mb-2"></div>
      </div>
    );
  }

  // 데이터가 모이지 않은 최초 배포 시점의 우아한 Fallback UI
  if (hotspots.length === 0) {
    return (
      <div className="card relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center h-full">
          <div className="w-16 h-16 mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center relative">
            <span className="text-2xl animate-spin-slow absolute">⌛</span>
            <span className="relative flex h-full w-full">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
            </span>
          </div>
          <h3 className="text-lg font-bold text-gradient mb-2">시간대별 핫스팟 빅데이터 수집 중...</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            실시간 공공 교통/유동인구망이 활성화되었습니다.<br/>
            매 정각마다 데이터를 축적하여 <strong className="text-indigo-400">점심, 저녁, 심야 피크 상권</strong>을 곧 밝혀냅니다!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">🔥 시간대별 유동인구 핫스팟 TOP 1 (최근 3일)</h3>
        <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-400/10 rounded-full border border-indigo-400/20">
          Live Data Aggregation
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {hotspots.map((spot, idx) => (
          <div key={idx} className="relative p-4 rounded-xl bg-gradient-to-b from-[var(--bg-secondary)] to-transparent border border-[var(--card-border)] hover:border-indigo-500/30 transition-colors group overflow-hidden">
            <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
              {spot.icon}
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{spot.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{spot.timeLabel}</h4>
                  <p className="text-[10px] text-[var(--text-muted)] tracking-wider mt-0.5">{spot.timeRange}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gradient">{spot.dongName}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    {spot.roadName} 일대
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold">
                    SCORE {spot.score}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
