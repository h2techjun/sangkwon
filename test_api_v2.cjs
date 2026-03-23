const http = require('http');

const apiKey = 'e12b55845d01dd9825a943900379cc50e5ab7a6d0aebda196770edea05e49a0f';
const path = `/B553077/api/open/sdsc2/storeListInSigngu?serviceKey=${apiKey}&pageNo=1&numOfRows=10&divId=signguCd&key=45111&indsLclsCd=I2&type=json`;

const req = http.get({
  hostname: 'apis.data.go.kr',
  path: path,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.93'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('RESPONSE:', data.substring(0, 1000)));
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});
