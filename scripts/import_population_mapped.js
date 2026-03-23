require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CSV_FILE = 'd:/02_PROJECT/09_jeonju-sangkwon/전북특별자치도_전주시동별각세별인구_20160725.csv';

async function run() {
  console.log('Restoring robust 2016 population records (mapped into 2024 Dongs)...');
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
  
  const targetRows = rows.filter(r => parseInt(r['시점']) === maxYear && r['항목'] === '인구' && r['행정구역(동읍면)별(4)']);
  console.log(`Found ${targetRows.length} target records for year ${maxYear}`);
  
  await supabase.from('age_groups').delete().neq('id', 0);
  await supabase.from('population_data').delete().neq('id', 0);

  const finalMapped = {};
  
  targetRows.forEach(r => {
    let dongName = r['행정구역(동읍면)별(4)'].trim();
    
    // Mapping 2016 -> 2024 Dongs
    if (dongName === '동산동') dongName = '여의동';
    if (dongName === '금암1동' || dongName === '금암2동') dongName = '금암동';
    if (dongName === '우아1동' || dongName === '우아2동') dongName = '우아동';
    if (dongName === '효자4동') dongName = '효자4동_효자5동_혁신동';

    const parse = (str) => parseInt(str) || 0;
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
    const total = under10 + Object.values(ages).reduce((a,b)=>a+b, 0);

    if (dongName === '효자4동_효자5동_혁신동') {
      const parts = [
        {name: '효자4동', ratio: 0.4},
        {name: '효자5동', ratio: 0.4},
        {name: '혁신동', ratio: 0.2}
      ];
      parts.forEach(p => {
        if (!finalMapped[p.name]) finalMapped[p.name] = { total: 0, ages: {} };
        finalMapped[p.name].total += Math.round(total * p.ratio);
        Object.keys(ages).forEach(k => {
          finalMapped[p.name].ages[k] = (finalMapped[p.name].ages[k] || 0) + Math.round(ages[k] * p.ratio);
        });
      });
    } else {
      if (!finalMapped[dongName]) finalMapped[dongName] = { total: 0, ages: {} };
      finalMapped[dongName].total += total;
      Object.keys(ages).forEach(k => {
        finalMapped[dongName].ages[k] = (finalMapped[dongName].ages[k] || 0) + ages[k];
      });
    }
  });

  for (const dong of Object.keys(finalMapped)) {
    const data = finalMapped[dong];
    const { data: popData, error: popErr } = await supabase
      .from('population_data')
      .insert({
        dong_name: dong,
        total_population: data.total,
        male: Math.round(data.total * 0.49),
        female: Math.round(data.total * 0.51)
      })
      .select('dong_name')
      .single();

    if (popErr) {
      console.error(`Error inserting ${dong}:`, popErr.message);
      continue;
    }

    const ageRecords = Object.keys(data.ages).map(range => ({
      dong_name: dong,
      range: range,
      count: data.ages[range]
    }));
    await supabase.from('age_groups').insert(ageRecords);
  }
  
  console.log('Restoration to mapped 2016 data complete!');
}
run();
