-- 1. Population Data Table
CREATE TABLE public.population_data (
    id SERIAL PRIMARY KEY,
    dong_name TEXT NOT NULL UNIQUE,
    total_population INTEGER NOT NULL,
    male INTEGER NOT NULL,
    female INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Age Groups Table
CREATE TABLE public.age_groups (
    id SERIAL PRIMARY KEY,
    dong_name TEXT NOT NULL REFERENCES public.population_data(dong_name) ON DELETE CASCADE,
    range TEXT NOT NULL, -- e.g., "0-9", "10-19"
    count INTEGER NOT NULL,
    UNIQUE(dong_name, range)
);

-- 3. Sales Trends Table
CREATE TABLE public.sales_trends (
    id SERIAL PRIMARY KEY,
    period TEXT NOT NULL UNIQUE, -- e.g., "2025-Q1"
    total_sales BIGINT NOT NULL,
    avg_sales_per_store INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.population_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_trends ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Anonymous users can read)
CREATE POLICY "Allow public read access on population_data" ON public.population_data FOR SELECT USING (true);
CREATE POLICY "Allow public read access on age_groups" ON public.age_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sales_trends" ON public.sales_trends FOR SELECT USING (true);
