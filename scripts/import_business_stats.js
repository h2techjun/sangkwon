require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const JUNG02_CSV = 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_JUNG02_Y_20260323215658.csv';
const SO01_CSV = 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_SO01_Y_20260323215723.csv';

// 전주시/완산구/덕진구 등 상위 집계는 제외
const SKIP_NAMES = new Set(['전주시', '완산구', '덕진구']);

async function parseCSV(filePath, encoding = 'euc-kr') {
  const rows = [];
  await new Promise((res, rej) => {
    fs.createReadStream(filePath)
      .pipe(iconv.decodeStream(encoding))
      .pipe(csv())
      .on('data', d => rows.push(d))
      .on('end', res)
      .on('error', rej);
  });
  return rows;
}

async function importJung02() {
  console.log('=== Importing JUNG02 (중분류) ===');
  const rows = await parseCSV(JUNG02_CSV);
  
  // 구조: 행정구역별(읍면동), 표준산업분류별(10차, 중분류), 사업체구분별, 항목, 단위, 2023 년
  const records = [];
  
  rows.forEach(r => {
    const dong = r['행정구역별(읍면동)']?.trim();
    const industry = r['표준산업분류별(10차, 중분류)']?.trim();
    const bizType = r['사업체구분별']?.trim();
    const item = r['항목']?.trim();
    const valStr = r['2023 년'] || '0';
    
    if (!dong || SKIP_NAMES.has(dong)) return;
    if (bizType !== '전체') return; // 전체 사업체만 집계
    if (!industry || industry === '전체산업') return;
    
    const val = parseInt(valStr.replace(/,/g, ''), 10) || 0;
    
    // 같은 dong+industry의 사업체수/종사자수를 하나의 레코드로 합침
    const key = `${dong}|${industry}`;
    let existing = records.find(r => r.key === key);
    if (!existing) {
      existing = { key, dong_name: dong, industry, business_count: 0, employee_count: 0 };
      records.push(existing);
    }
    
    if (item === '사업체수') existing.business_count = val;
    if (item === '종사자수') existing.employee_count = val;
  });

  // 음식점업 관련만 필터링
  const foodRecords = records.filter(r => 
    r.industry.includes('음식') || r.industry.includes('숙박')
  );
  
  console.log(`  음식점 관련 레코드: ${foodRecords.length}개`);
  
  // DB 삽입
  for (const r of foodRecords) {
    const { error } = await supabase.from('business_stats').insert({
      dong_name: r.dong_name,
      industry: r.industry,
      sub_industry: null,
      business_count: r.business_count,
      employee_count: r.employee_count,
      year: 2023
    });
    if (error) console.error(`  ❌ ${r.dong_name}/${r.industry}: ${error.message}`);
  }
  
  console.log(`  ✅ ${foodRecords.length}건 삽입 완료`);
  return foodRecords;
}

async function importSO01() {
  console.log('\n=== Importing SO01 (소분류) ===');
  const rows = await parseCSV(SO01_CSV);
  
  // 구조: 산업소분류별, 행정구역별(읍면동), 항목, 단위, 2023 년
  const records = [];
  
  rows.forEach(r => {
    const industry = r['산업소분류별']?.trim();
    const dong = r['행정구역별(읍면동)']?.trim();
    const item = r['항목']?.trim();
    const valStr = r['2023 년'] || '0';
    
    if (!dong || SKIP_NAMES.has(dong)) return;
    if (!industry || industry === '전체산업') return;
    
    const val = parseInt(valStr.replace(/,/g, ''), 10) || 0;
    
    const key = `${dong}|${industry}`;
    let existing = records.find(r => r.key === key);
    if (!existing) {
      existing = { key, dong_name: dong, industry, business_count: 0, employee_count: 0 };
      records.push(existing);
    }
    
    if (item === '사업체수') existing.business_count = val;
    if (item === '종사자수') existing.employee_count = val;
  });

  // 음식점업 소분류만
  const foodRecords = records.filter(r => 
    r.industry.includes('음식') || r.industry.includes('주점') || r.industry.includes('커피')
  );
  
  console.log(`  음식점 소분류 레코드: ${foodRecords.length}개`);
  
  for (const r of foodRecords) {
    const { error } = await supabase.from('business_stats').insert({
      dong_name: r.dong_name,
      industry: '숙박 및 음식점업',
      sub_industry: r.industry,
      business_count: r.business_count,
      employee_count: r.employee_count,
      year: 2023
    });
    if (error) console.error(`  ❌ ${r.dong_name}/${r.industry}: ${error.message}`);
  }
  
  console.log(`  ✅ ${foodRecords.length}건 삽입 완료`);
}

async function run() {
  console.log('Clearing old business_stats...');
  await supabase.from('business_stats').delete().neq('id', 0);
  
  await importJung02();
  await importSO01();
  
  // 검증
  const { count } = await supabase.from('business_stats').select('*', { count: 'exact', head: true });
  console.log(`\n🎉 Total business_stats records: ${count}`);
}

run();
