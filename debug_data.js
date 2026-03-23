require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("=== CHECKING jeonju_stores ===");
  const { data: stores, error: err1 } = await supabase.from('jeonju_stores').select('bizesNm, adongNm, ldongNm').limit(10);
  console.log(stores);
  
  console.log("\n=== CHECKING population_data ===");
  const { data: pops, error: err2 } = await supabase.from('population_data').select('*').limit(10);
  console.log(pops);

  console.log("\n=== UNIQUE DONGS IN STORES ===");
  // We can't do distinct easily without RPC, let's just fetch 1000 and map
  const { data: s1000 } = await supabase.from('jeonju_stores').select('adongNm').limit(1000);
  const dongs = [...new Set(s1000.map(s => s.adongNm))].filter(Boolean);
  console.log(dongs.slice(0, 20)); // show first 20
}

checkData();
