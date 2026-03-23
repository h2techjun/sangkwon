-- 004_traffic_history_schema.sql

CREATE TABLE public.traffic_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dong_name TEXT NOT NULL,
  road_name TEXT NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  score INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정 (모두 허용, 서비스 키 및 어나니머스 크론 잡 가능하도록 설정)
ALTER TABLE public.traffic_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable public read for traffic_history" ON public.traffic_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for traffic_history" ON public.traffic_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for traffic_history" ON public.traffic_history FOR UPDATE USING (true);
CREATE POLICY "Enable delete for traffic_history" ON public.traffic_history FOR DELETE USING (true);
