require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const CSV_FILE_PATH = 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_M0105Y_2020_M_20260323215448.csv';

async function importKosisPopulation() {
  console.log("Reading 2025.12 KOSIS Population CSV...");
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`File not found: ${CSV_FILE_PATH}`);
    return;
  }

  const popMap = {};

  return new Promise((resolve) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(iconv.decodeStream('euc-kr'))
      .pipe(csv())
      .on('data', (row) => {
        const dong = row['행정동별']?.trim();
        const age = row['연령별']?.trim();
        const valStr = row['2025.12 월'] || '0';
        
        // Skip aggregates for entire city/districts or invalid
        if (!dong || !age || dong === '전주시' || dong.endsWith('구')) return;

        const val = parseInt(valStr.replace(/,/g, ''), 10) || 0;

        if (!popMap[dong]) {
          popMap[dong] = { total: 0, ages: {} };
        }

        if (age === '계') {
          popMap[dong].total = val;
        } else {
          let ageNum = 0;
          if (age.includes('이상')) ageNum = 100;
          else ageNum = parseInt(age.replace('세', ''), 10);

          let group = '100+';
          if (ageNum < 10) group = '0-9';
          else if (ageNum < 20) group = '10-19';
          else if (ageNum < 30) group = '20-29';
          else if (ageNum < 40) group = '30-39';
          else if (ageNum < 50) group = '40-49';
          else if (ageNum < 60) group = '50-59';
          else if (ageNum < 70) group = '60-69';
          else if (ageNum < 80) group = '70-79';
          else if (ageNum < 90) group = '80-89';
          else if (ageNum < 100) group = '90-99';

          popMap[dong].ages[group] = (popMap[dong].ages[group] || 0) + val;
        }
      })
      .on('end', async () => {
        const dongs = Object.keys(popMap);
        console.log(`Parsed ${dongs.length} Dongs from 2025 Data`);

        console.log("Clearing old population data in Supabase...");
        await supabase.from('age_groups').delete().neq('id', 0);
        await supabase.from('population_data').delete().neq('id', 0);

        for (const dong of dongs) {
          const data = popMap[dong];
          if (data.total === 0) continue;

          // Insert into population_data
          const { data: insertedPop, error: popError } = await supabase
            .from('population_data')
            .insert({
              dong_name: dong,
              total_population: data.total,
              male: Math.round(data.total * 0.49), // Mocked ratio since CSV lacked gender
              female: Math.round(data.total * 0.51)
            })
            .select('*')
            .single();

          if (popError) {
             console.error(`Failed to insert ${dong}:`, popError.message);
             continue;
          }

          // Insert age groups
          const ageInserts = Object.keys(data.ages).map(range => ({
            dong_name: dong,
            range: range,
            count: data.ages[range]
          }));

          const { error: ageError } = await supabase.from('age_groups').insert(ageInserts);
          if (ageError) console.error(`Failed to insert ages for ${dong}:`, ageError.message);
        }

        console.log("Population 2025 KOSIS import completed successfully! 🎉");
        resolve();
      });
  });
}

importKosisPopulation();
