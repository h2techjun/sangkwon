require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function matchDongs() {
  const { data: stores } = await supabase.from('jeonju_stores').select('adongNm');
  const storeDongs = [...new Set(stores.map(s => s.adongNm))].filter(Boolean);
  
  const { data: pops } = await supabase.from('population_data').select('dong_name');
  const popDongs = pops.map(p => p.dong_name);

  // Both have it
  const matched = storeDongs.filter(d => popDongs.includes(d));
  // Only in stores
  const missingInPop = storeDongs.filter(d => !popDongs.includes(d));
  // Only in pops
  const missingInStore = popDongs.filter(d => !storeDongs.includes(d));

  console.log('Matched Dongs:', matched.length, 'e.g.', matched.slice(0, 5));
  console.log('Stores Dongs without Population:', missingInPop);
  console.log('Population Dongs without Stores:', missingInStore);
}

matchDongs();
