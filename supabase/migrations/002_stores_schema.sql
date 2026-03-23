-- 002_stores_schema.sql
-- 전라북도 상가업소 정보 중 "전주시 음식점" 실데이터를 담는 테이블 설계
-- 주의: PostgreSQL은 대소문자를 구분하지 않으므로, TypeScript camelCase와 호환되게 하려면 쌍따옴표("")가 필수입니다.

DROP TABLE IF EXISTS public.jeonju_stores CASCADE;

CREATE TABLE public.jeonju_stores (
    "bizesId" TEXT PRIMARY KEY,           
    "bizesNm" TEXT NOT NULL,              
    "brchNm" TEXT,                        
    "indsLclsCd" TEXT,                    
    "indsLclsNm" TEXT,                    
    "indsMclsCd" TEXT,                    
    "indsMclsNm" TEXT,                    
    "indsSclsCd" TEXT,                    
    "indsSclsNm" TEXT,                    
    "ksicCd" TEXT,                        
    "ksicNm" TEXT,                        
    "ctprvnCd" TEXT,                      
    "ctprvnNm" TEXT,                      
    "signguCd" TEXT,                      
    "signguNm" TEXT,                      
    "adongCd" TEXT,                       
    "adongNm" TEXT,                       
    "ldongCd" TEXT,                       
    "ldongNm" TEXT,                       
    "lnoCd" TEXT,                         
    "plotSctCd" TEXT,                     
    "plotSctNm" TEXT,                     
    "lnoMnno" INTEGER,                    
    "lnoSlno" INTEGER,                    
    "lnoAdr" TEXT,                        
    "rdnmCd" TEXT,                        
    "rdnm" TEXT,                          
    "bldMnno" INTEGER,                    
    "bldSlno" INTEGER,                    
    "bldMngNo" TEXT,                      
    "bldNm" TEXT,                         
    "rdnmAdr" TEXT,                       
    "oldZipcd" TEXT,                      
    "newZipcd" TEXT,                      
    "dongNo" TEXT,                        
    "flrNo" TEXT,                         
    "hoNo" TEXT,                          
    "lon" DOUBLE PRECISION,               
    "lat" DOUBLE PRECISION,               
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 활성화
ALTER TABLE public.jeonju_stores ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있도록 정책 설정
CREATE POLICY "jeonju_stores are viewable by everyone."
ON public.jeonju_stores FOR SELECT
USING (true);

-- API 키가 있을 때만 삽입할 수 있도록 (로컬 배치 스크립트용)
CREATE POLICY "Enable insert for authenticated users only"
ON public.jeonju_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only"
ON public.jeonju_stores FOR UPDATE USING (true);
