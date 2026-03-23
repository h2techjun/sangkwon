require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const res = await fetch(url + '?apikey=' + key, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  
  const swagger = await res.json();
  if (!swagger.definitions) {
     console.error("No definitions found", swagger);
     return;
  }
  
  if (swagger.definitions.population_data) {
     console.log("population_data props:", Object.keys(swagger.definitions.population_data.properties));
  } else {
     console.log("population_data table NOT FOUND in Supabase!");
  }
  
  if (swagger.definitions.age_groups) {
     console.log("age_groups props:", Object.keys(swagger.definitions.age_groups.properties));
  } else {
     console.log("age_groups table NOT FOUND in Supabase!");
  }
}

run().catch(console.error);
