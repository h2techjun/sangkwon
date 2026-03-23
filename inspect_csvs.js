const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');

const files = [
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_JUNG02_Y_20260323215658.csv',
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_21403_SAUP10_SO01_Y_20260323215723.csv',
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_711005_2024B003_Y_20260323215101.csv',
  'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_M0105Y_2020_M_20260323215448.csv'
];

async function inspect(filePath) {
  return new Promise((resolve) => {
    console.log(`\n=== Inspecting: ${filePath.split('\\').pop()} ===`);
    let rowCount = 0;
    fs.createReadStream(filePath)
      .pipe(iconv.decodeStream('euc-kr')) // Try EUC-KR first
      .pipe(csv())
      .on('data', (data) => {
        if (rowCount === 0) {
          console.log("Headers:", Object.keys(data));
          console.log("Row 1:", data);
        }
        rowCount++;
      })
      .on('end', () => {
        console.log(`Total rows: ${rowCount}`);
        resolve();
      })
      .on('error', (err) => {
        console.error("Error reading file:", err);
        resolve();
      });
  });
}

async function run() {
  for (const file of files) {
    if (fs.existsSync(file)) {
      await inspect(file);
    } else {
      console.log(`\nFile not found: ${file}`);
    }
  }
}

run();
