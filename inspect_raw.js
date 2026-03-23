const fs = require('fs');
const iconv = require('iconv-lite');
const buffer = fs.readFileSync('c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_M0105Y_2020_M_20260323215448.csv');
const text = iconv.decode(buffer, 'euc-kr');
console.log(text.split('\n').slice(0, 5).join('\n'));
