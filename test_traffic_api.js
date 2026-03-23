require('dotenv').config({ path: '.env.local' });
const { parseStringPromise } = require('xml2js');

async function test() {
  const TRAFFIC_API_KEY = process.env.DATA_GO_KR_API_KEY || process.env.NEXT_PUBLIC_DATA_GO_KR_API_KEY;
  const TRAFFIC_URL = 'http://openapi.jeonju.go.kr/jeonjubus/openApi/traffic/traffic_detail_common.do';
  const road = '팔달로';

  const fetchUrl = `${TRAFFIC_URL}?ServiceKey=${TRAFFIC_API_KEY}&loadResult=${encodeURIComponent(road)}`;
  console.log("Fetching:", fetchUrl);

  try {
    const response = await fetch(fetchUrl);
    const xml = await response.text();
    console.log("Raw XML:", xml.substring(0, 500)); 
    
    const result = await parseStringPromise(xml, { explicitArray: false });
    console.log("Parsed JSON:", JSON.stringify(result, null, 2));

  } catch (e) {
    console.error("Error:", e);
  }
}

test();
