require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // 1) Store dong names
  const storeDongs = new Set();
  let from = 0;
  while (true) {
    const { data } = await supabase.from('jeonju_stores').select('adong_nm').range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach(d => { if (d.adong_nm) storeDongs.add(d.adong_nm); });
    from += 1000;
  }
  
  // 2) Population dong names
  const { data: popData } = await supabase.from('population_data').select('dong_name, total_population');
  const popDongs = new Set(popData?.map(p => p.dong_name) || []);
  
  console.log('=== Store Dongs ===');
  console.log([...storeDongs].sort().join(', '));
  console.log(`Total: ${storeDongs.size}`);
  
  console.log('\n=== Population Dongs ===');
  popData?.forEach(p => console.log(`  ${p.dong_name}: ${p.total_population}`));
  console.log(`Total: ${popDongs.size}`);
  
  console.log('\n=== In Stores but NOT in Population ===');
  [...storeDongs].sort().forEach(d => {
    if (!popDongs.has(d)) console.log(`  ❌ ${d}`);
  });
  
  console.log('\n=== In Population but NOT in Stores ===');
  [...popDongs].sort().forEach(d => {
    if (!storeDongs.has(d)) console.log(`  ⚠️ ${d}`);
  });
}
check();
