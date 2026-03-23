require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ROADS = [
  { road: '기린대로', dong: '송천1동', type: 'residential' },
  { road: '호남로', dong: '중앙동', type: 'commercial' },
  { road: '홍산로', dong: '효자4동', type: 'commercial' }, // 신시가지 (저녁/심야 핫플)
  { road: '홍산중앙로', dong: '효자4동', type: 'commercial' },
  { road: '백제대로', dong: '서신동', type: 'mixed' }, // 서신동 (점심/저녁 무난)
  { road: '팔달로', dong: '풍남동', type: 'tourism' }, // 한옥마을 (주간 핫플)
  { road: '용머리로', dong: '효자1동', type: 'residential' },
  { road: '장승배기로', dong: '평화1동', type: 'residential' },
  { road: '동부대로', dong: '우아2동', type: 'mixed' },
  { road: '아중로', dong: '인후3동', type: 'dining' }, // 아중리 (저녁 식당 핫플)
  { road: '조경단로', dong: '금암1동', type: 'university' }, // 전북대 앞 (심야 핫플)
];

async function seed() {
  console.log("Seeding Mock Traffic History to Supabase...");
  
  // Clear old history if any
  await supabase.from('traffic_history').delete().neq('dong_name', '0');

  const historyRecords = [];
  const now = new Date();

  // Create data for the last 3 days
  for (let day = 0; day < 3; day++) {
    const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    
    // For each target road, generate lunch, dinner, and night data
    for (const item of TARGET_ROADS) {
      // Lunch (12:00)
      let lunchScore = 40 + Math.random() * 20;
      if (item.type === 'commercial' || item.type === 'tourism') lunchScore += 30; // 핫플 가중치
      
      // Dinner (19:00)
      let dinnerScore = 50 + Math.random() * 20;
      if (item.type === 'dining' || item.type === 'commercial') dinnerScore += 25;
      
      // Night (22:00)
      let nightScore = 30 + Math.random() * 20;
      if (item.dong === '효자4동' || item.dong === '금암1동') nightScore += 40; // 신시가지, 전북대 가중치

      historyRecords.push({
        dong_name: item.dong,
        road_name: item.road,
        hour: 12,
        score: Math.min(100, Math.round(lunchScore)),
        recorded_at: new Date(date.setHours(12, 0, 0, 0)).toISOString()
      });

      historyRecords.push({
        dong_name: item.dong,
        road_name: item.road,
        hour: 19,
        score: Math.min(100, Math.round(dinnerScore)),
        recorded_at: new Date(date.setHours(19, 0, 0, 0)).toISOString()
      });

      historyRecords.push({
        dong_name: item.dong,
        road_name: item.road,
        hour: 22,
        score: Math.min(100, Math.round(nightScore)),
        recorded_at: new Date(date.setHours(22, 0, 0, 0)).toISOString()
      });
    }
  }

  const { error } = await supabase.from('traffic_history').insert(historyRecords);
  if (error) {
    console.error("Failed to seed:", error.message);
  } else {
    console.log(`Successfully seeded ${historyRecords.length} realistic mockup records!`);
  }
}

seed();
