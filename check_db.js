require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: pops } = await supabase.from('population_data').select('*');
  console.log('--- Population Data ---');
  console.log(pops.slice(0, 3));
  console.log('Total pop records:', pops.length);
  
  const { data: ages } = await supabase.from('age_groups').select('*');
  console.log('\n--- Age Groups ---');
  console.log(ages.slice(0, 5));
  console.log('Total age records:', ages.length);
}
check();
