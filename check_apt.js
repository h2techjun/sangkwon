require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // 아파트 관련 건물명 검색
  const { data } = await supabase.from('jeonju_stores')
    .select('rdnm, adongNm, bldNm, rdnmAdr')
    .like('bldNm', '%아파트%')
    .limit(20);
  
  console.log('아파트 포함 건물명 샘플:', data?.length, '건');
  data?.slice(0, 10).forEach(d => console.log(`  ${d.adongNm} | ${d.bldNm} | ${d.rdnm}`));

  // 동별 아파트 점포 수
  const { data: all } = await supabase.from('jeonju_stores')
    .select('adongNm, bldNm')
    .like('bldNm', '%아파트%');
  
  const dongApt = {};
  all?.forEach(d => { dongApt[d.adongNm] = (dongApt[d.adongNm] || 0) + 1; });
  const sorted = Object.entries(dongApt).sort((a,b) => b[1] - a[1]);
  console.log('\n동별 아파트 내 점포 수:');
  sorted.forEach(([dong, count]) => console.log(`  ${dong}: ${count}`));

  // 도로별 아파트 점포 수
  const roadApt = {};
  all?.forEach(d => {
    if (!d.adongNm) return;
    roadApt[d.adongNm] = (roadApt[d.adongNm] || 0) + 1;
  });
}
check();
