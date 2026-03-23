import { NextResponse } from 'next/server';
import { fetchStoresFromApi } from '@/lib/api-client';
import { MOCK_STORES } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  try {
    if (useMock) {
      return NextResponse.json({
        success: true,
        data: MOCK_STORES,
        message: 'Loaded from mock data',
      });
    }

    let stores = await fetchStoresFromApi();
    
    // API 장애 또는 키 문제로 데이터가 비어있을 경우 자체 구축한 Supabase DB 활용
    if (!stores || stores.length === 0) {
      console.log('Public API returned empty. Falling back to Supabase DB (jeonju_stores)...');
      
      let allDbStores: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: dbStores, error } = await supabase
          .from('jeonju_stores')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);
          
        if (error) {
          console.error("Supabase fetch error:", error);
          break;
        }
        
        if (dbStores && dbStores.length > 0) {
          allDbStores.push(...dbStores);
          if (dbStores.length < pageSize) break;
          page++;
        } else {
          break;
        }
      }
        
      if (allDbStores.length > 0) {
        stores = allDbStores;
        return NextResponse.json({
          success: true,
          data: stores,
          message: `Loaded ${stores.length} stores from Supabase DB`,
        });
      }
    }

    if (!stores || stores.length === 0) {
       throw new Error('No data from both Public API and Supabase');
    }

    return NextResponse.json({
      success: true,
      data: stores,
      message: `Loaded ${stores.length} stores from public API`,
    });
  } catch (error: any) {
    console.error('API Route Error:', error);
    
    // 최종 폴백: 최악의 상황엔 무조건 MOCK 데이터라도 반환
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch stores',
        data: MOCK_STORES, 
        message: 'Error occurred, falling back to mock data',
      },
      { status: 200 } // Error Status 500 대신 200으로 처리해 프론트엔드가 Graceful Fallback 가능토록 변경
    );
  }
}
