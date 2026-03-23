-- 005_business_stats_schema.sql
-- 동별 × 업종별 사업체 수 / 종사자 수 (KOSIS 2023 데이터)

CREATE TABLE IF NOT EXISTS business_stats (
  id SERIAL PRIMARY KEY,
  dong_name TEXT NOT NULL,
  industry TEXT NOT NULL,         -- 업종 (e.g. '숙박 및 음식점업(55~56)')
  sub_industry TEXT,              -- 소분류 (e.g. '한식 음식점업')
  business_count INT DEFAULT 0,   -- 사업체 수
  employee_count INT DEFAULT 0,   -- 종사자 수
  year INT DEFAULT 2023,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_business_stats_dong ON business_stats (dong_name);
CREATE INDEX IF NOT EXISTS idx_business_stats_industry ON business_stats (industry);

-- RLS
ALTER TABLE business_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON business_stats FOR SELECT USING (true);
