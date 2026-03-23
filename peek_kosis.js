const fs = require('fs');
const iconv = require('iconv-lite');

const files = [
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_JUNG02_Y_20260323215658.csv',
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_SO01_Y_20260323215723.csv',
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_711005_2024B003_Y_20260323215101.csv',
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_M0105Y_2020_M_20260323215448.csv'
];

files.forEach(f => {
  console.log(`\n\n--- FILE: ${f} ---`);
  const buffer = fs.readFileSync(f);
  try {
    const text = iconv.decode(buffer, 'euc-kr');
    console.log(text.split('\n').slice(0, 3).join('\n'));
  } catch(e) {
    const text2 = iconv.decode(buffer, 'utf-8');
    console.log(text2.split('\n').slice(0, 3).join('\n'));
  }
});
