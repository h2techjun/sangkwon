-- 003_population_insert_rls.sql
-- population_data와 age_groups 테이블에 대해 데이터 파이프라인(배치 스크립트)이 Insert/Update/Delete 할 수 있도록 권한 부여

-- population_data 권한
CREATE POLICY "Enable insert for population_data" ON public.population_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for population_data" ON public.population_data FOR UPDATE USING (true);
CREATE POLICY "Enable delete for population_data" ON public.population_data FOR DELETE USING (true);

-- age_groups 권한
CREATE POLICY "Enable insert for age_groups" ON public.age_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for age_groups" ON public.age_groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete for age_groups" ON public.age_groups FOR DELETE USING (true);
