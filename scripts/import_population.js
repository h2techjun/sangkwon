require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE = 'd:/02_PROJECT/09_jeonju-sangkwon/전북특별자치도_전주시동별각세별인구_20160725.csv';

async function run() {
  console.log('Reading Population CSV into memory...');
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(iconv.decodeStream('euc-kr'))
      .pipe(csv())
      .on('data', d => rows.push(d))
      .on('end', resolve)
      .on('error', reject);
  });

  // Find max year
  let maxYear = 0;
  for (const r of rows) {
    const yr = parseInt(r['시점']);
    if (yr > maxYear) maxYear = yr;
  }
  console.log('LATEST YEAR IN CSV:', maxYear);

  // Filter for maxYear, 항목 === '인구', and valid 행정동
  const targetRows = rows.filter(r => 
    parseInt(r['시점']) === maxYear && 
    r['항목'] === '인구' && 
    r['행정구역(동읍면)별(4)'] && 
    r['행정구역(동읍면)별(4)'].trim() !== ''
  );

  console.log(`Found ${targetRows.length} Dong records for year ${maxYear}.`);

  console.log('Clearing old population data in Supabase...');
  // Delete all records to start fresh
  if (targetRows.length > 0) {
    await supabase.from('age_groups').delete().neq('id', 0); // safe blanket delete
    await supabase.from('population_data').delete().neq('id', 0);
  }
  
  // Transform and Insert
  for (const r of targetRows) {
    const dongName = r['행정구역(동읍면)별(4)'].trim();
    
    // Sum ages
    const parse = (str) => parseInt(str) || 0;
    
    const ages = {
      '10s': parse(r['10 - 14세']) + parse(r['15 - 19세']),
      '20s': parse(r['20 - 24세']) + parse(r['25 - 29세']),
      '30s': parse(r['30 - 34세']) + parse(r['35 - 39세']),
      '40s': parse(r['40 - 44세']) + parse(r['45 - 49세']),
      '50s': parse(r['50 - 54세']) + parse(r['55 - 59세']),
      '60s+': parse(r['60 - 64세']) + parse(r['65 - 69세']) + parse(r['70 - 74세']) + parse(r['75 - 79세']) + parse(r['80 - 84세']) + parse(r['85 - 89세']) + parse(r['90 - 94세']) + parse(r['95 - 99세']) + parse(r['100-'])
    };
    
    const under10 = parse(r['0 - 4세']) + parse(r['5 - 9세']);
    const totalPop = under10 + Object.values(ages).reduce((a,b)=>a+b, 0);

    // Insert to population_data matching actual remote schema: 'dong_name', 'total_population', 'male', 'female'
    const { data: popData, error: popErr } = await supabase
      .from('population_data')
      .upsert({
        dong_name: dongName,
        total_population: totalPop,
        male: 50.0,    // Mock (not available in this CSV filter)
        female: 50.0
      }, { onConflict: 'dong_name' })
      .select('dong_name')
      .single();

    if (popErr) {
      console.error(`Error inserting population_data for ${dongName}:`, popErr.message);
      continue;
    }

    // Insert into age_groups matching schema: 'dong_name', 'range', 'count'
    const ageRecords = Object.entries(ages).map(([range, count]) => ({
      dong_name: popData.dong_name,
      range: range,
      count: count
    }));

    const { error: ageErr } = await supabase
      .from('age_groups')
      .insert(ageRecords);
      
    if (ageErr) {
      console.error(`Error inserting age_groups for ${dongName}:`, ageErr.message);
    }
  }

  console.log('Population data import completed! Upserted actual Demographics.');
}

run().catch(console.error);
