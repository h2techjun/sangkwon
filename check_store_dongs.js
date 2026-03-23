require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const dongCounts = {};
  let page = 0;
  while (true) {
    const { data } = await supabase.from('jeonju_stores').select('adongNm').range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    data.forEach(d => {
      const nm = d.adongNm || '(null)';
      dongCounts[nm] = (dongCounts[nm] || 0) + 1;
    });
    page++;
  }
  const sorted = Object.entries(dongCounts).sort((a,b) => b[1] - a[1]);
  console.log('Store dong name distribution:');
  sorted.forEach(([name, count]) => console.log(`  ${name}: ${count}`));
  console.log(`Total unique: ${sorted.length}`);
}
check();
