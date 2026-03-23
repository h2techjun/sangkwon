require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CSV_FILE = 'd:/02_PROJECT/09_jeonju-sangkwon/전북특별자치도_전주시동별각세별인구_20160725.csv';

// ┌──────────────────────────────────────────────────────────────────┐
// │ Store DB에서 실제로 사용하는 행정동 이름 (from check_store_dongs) │
// │ 이 목록에 맞춰서 population 데이터를 정확히 매핑해야 함          │
// └──────────────────────────────────────────────────────────────────┘
// 효자5동: 953, 송천1동: 625, 서신동: 617, 중앙동: 588, 덕진동: 511,
// 중화산2동: 511, 풍남동: 487, 금암동: 479, 효자4동: 441, 우아2동: 441,
// 평화2동: 409, 여의동: 406, 인후3동: 399, 송천2동: 360, 삼천3동: 276,
// 혁신동: 259, 우아1동: 247, 삼천2동: 229, 중화산1동: 225, 노송동: 218,
// 효자2동: 178, 인후1동: 163, 인후2동: 162, 호성동: 160, 효자3동: 151,
// 진북동: 144, 평화1동: 122, 팔복동: 109, 조촌동: 109, 삼천1동: 105,
// 효자1동: 90, 동서학동: 89, 서서학동: 58, 완산동: 32, 금암2동: 3, 금암1동: 1

async function run() {
  console.log('=== Final Population Import (Aligned to Store Dong Names) ===');
  const rows = [];
  await new Promise((res, rej) => {
    fs.createReadStream(CSV_FILE)
      .pipe(iconv.decodeStream('euc-kr'))
      .pipe(csv())
      .on('data', d => rows.push(d))
      .on('end', res)
      .on('error', rej);
  });

  let maxYear = 0;
  for (const r of rows) {
    const yr = parseInt(r['시점']);
    if (yr > maxYear) maxYear = yr;
  }
  
  const targetRows = rows.filter(r =>
    parseInt(r['시점']) === maxYear && r['항목'] === '인구' && r['행정구역(동읍면)별(4)']?.trim()
  );
  console.log(`Found ${targetRows.length} records for year ${maxYear}`);

  // Step 1: Clear old data
  await supabase.from('age_groups').delete().neq('id', 0);
  await supabase.from('population_data').delete().neq('id', 0);

  const parse = (s) => parseInt(s) || 0;
  const finalMap = {};

  const addToDong = (dongName, total, ages) => {
    if (!finalMap[dongName]) finalMap[dongName] = { total: 0, ages: {} };
    finalMap[dongName].total += total;
    Object.keys(ages).forEach(k => {
      finalMap[dongName].ages[k] = (finalMap[dongName].ages[k] || 0) + ages[k];
    });
  };

  targetRows.forEach(r => {
    let dongName = r['행정구역(동읍면)별(4)'].trim();

    const under10 = parse(r['0 - 4세']) + parse(r['5 - 9세']);
    const ages = {
      '10-19': parse(r['10 - 14세']) + parse(r['15 - 19세']),
      '20-29': parse(r['20 - 24세']) + parse(r['25 - 29세']),
      '30-39': parse(r['30 - 34세']) + parse(r['35 - 39세']),
      '40-49': parse(r['40 - 44세']) + parse(r['45 - 49세']),
      '50-59': parse(r['50 - 54세']) + parse(r['55 - 59세']),
      '60-69': parse(r['60 - 64세']) + parse(r['65 - 69세']),
      '70-79': parse(r['70 - 74세']) + parse(r['75 - 79세']),
      '80+': parse(r['80 - 84세']) + parse(r['85 - 89세']) + parse(r['90 - 94세']) + parse(r['95 - 99세']) + parse(r['100-'])
    };
    const total = under10 + Object.values(ages).reduce((a, b) => a + b, 0);

    // ┌─────────────────────────────────────────────────────────────┐
    // │ Mapping Rules (2016 CSV → 2024 Store DB)                   │
    // │ Rule: Only map when the CSV dong name does NOT exist       │
    // │       in the Store DB's adongNm set.                       │
    // └─────────────────────────────────────────────────────────────┘

    if (dongName === '동산동') {
      // 동산동 → 여의동 (완전 개칭)
      addToDong('여의동', total, ages);
    } else if (dongName === '효자4동') {
      // 효자4동 → 효자4동(40%) + 효자5동(40%) + 혁신동(20%) (분동)
      const splitAges = (ratio) => {
        const a = {};
        Object.keys(ages).forEach(k => a[k] = Math.round(ages[k] * ratio));
        return a;
      };
      addToDong('효자4동', Math.round(total * 0.4), splitAges(0.4));
      addToDong('효자5동', Math.round(total * 0.4), splitAges(0.4));
      addToDong('혁신동', Math.round(total * 0.2), splitAges(0.2));
    } else {
      // 우아1동, 우아2동, 금암1동, 금암2동 등 → 그대로 유지 (Store DB가 이 이름 사용)
      addToDong(dongName, total, ages);
    }
  });

  // Step 2: Merge 금암1동+금암2동 population INTO 금암동 
  // (Store DB has 금암동:479, 금암1동:1, 금암2동:3 - negligible split stores)
  if (finalMap['금암1동'] && finalMap['금암2동']) {
    if (!finalMap['금암동']) finalMap['금암동'] = { total: 0, ages: {} };
    ['금암1동', '금암2동'].forEach(src => {
      finalMap['금암동'].total += finalMap[src].total;
      Object.keys(finalMap[src].ages).forEach(k => {
        finalMap['금암동'].ages[k] = (finalMap['금암동'].ages[k] || 0) + finalMap[src].ages[k];
      });
      delete finalMap[src];
    });
    console.log('  Merged 금암1동+금암2동 → 금암동');
  }

  console.log(`Inserting ${Object.keys(finalMap).length} Dong population records...`);

  let successCount = 0;
  for (const dong of Object.keys(finalMap)) {
    const data = finalMap[dong];
    if (data.total === 0) continue;

    const { error: popErr } = await supabase
      .from('population_data')
      .insert({
        dong_name: dong,
        total_population: data.total,
        male: Math.round(data.total * 0.49),
        female: Math.round(data.total * 0.51)
      });

    if (popErr) {
      console.error(`  ❌ ${dong}: ${popErr.message}`);
      continue;
    }

    const ageRecords = Object.keys(data.ages).map(range => ({
      dong_name: dong,
      range,
      count: data.ages[range]
    }));
    await supabase.from('age_groups').insert(ageRecords);
    successCount++;
    console.log(`  ✅ ${dong}: pop=${data.total.toLocaleString()}`);
  }

  console.log(`\n🎉 Import complete! ${successCount} Dongs inserted.`);
}
run();
