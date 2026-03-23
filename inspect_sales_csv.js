const fs = require('fs');
const iconv = require('iconv-lite');

const files = [
  { name: 'SAUP10_JUNG02 (사업체 중분류)', path: 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_JUNG02_Y_20260323215658.csv' },
  { name: 'SAUP10_SO01 (사업체 소분류)', path: 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_SO01_Y_20260323215723.csv' },
];

files.forEach(f => {
  console.log(`\n=== ${f.name} ===`);
  const buffer = fs.readFileSync(f.path);
  const text = iconv.decode(buffer, 'euc-kr');
  const lines = text.split('\n');
  // Show header + first 10 lines
  lines.slice(0, 12).forEach((line, i) => console.log(`  [${i}] ${line.trim()}`));
  
  // Search for 음식 or 한식
  const foodLines = lines.filter(l => l.includes('음식') || l.includes('한식'));
  console.log(`  ... 음식 관련 라인 수: ${foodLines.length}`);
  if (foodLines.length > 0) {
    console.log(`  예시: ${foodLines[0].trim().substring(0, 200)}`);
  }
  
  // Search for dong-level data
  const dongLines = lines.filter(l => l.includes('중앙동') || l.includes('풍남동') || l.includes('효자'));
  console.log(`  ... 동별 데이터 라인 수: ${dongLines.length}`);
  if (dongLines.length > 0) {
    console.log(`  예시: ${dongLines[0].trim().substring(0, 200)}`);
  }
});
