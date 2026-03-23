require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from('jeonju_stores').select('*').limit(1);
  if (data && data[0]) {
    console.log('Column names:', Object.keys(data[0]));
    console.log('Sample row adong:', data[0]['adongNm'] || data[0]['adong_nm'] || data[0]['adong']);
    console.log('Full sample:', data[0]);
  }
}
check();
