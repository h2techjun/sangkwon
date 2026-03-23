const https = require('https');

async function testApi() {
  const apiKey = 'e12b55845d01dd9825a943900379cc50e5ab7a6d0aebda196770edea05e49a0f';
  // Use decoding key if it is url encoded, though looks like a hex string. Let's try raw.
  const url = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInSigngu?serviceKey=${apiKey}&pageNo=1&numOfRows=10&divId=signguCd&key=45111&indsLclsCd=I2&type=json`;
  
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
       console.log('HTTP Error:', res.status, res.statusText);
    }
    const text = await res.text();
    console.log('--- RESPONSE HEAD ---');
    console.log(text.substring(0, 1000));
  } catch (err) {
    console.error('FETCH ERROR:', err);
  }
}
testApi();
