const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');

const popFile = 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_M0105Y_2020_M_20260323215448.csv';

const dongs = new Set();
const ages = new Set();

fs.createReadStream(popFile)
  .pipe(iconv.decodeStream('euc-kr'))
  .pipe(csv())
  .on('data', (row) => {
    dongs.add(row['행정동별']);
    ages.add(row['연령별']);
  })
  .on('end', () => {
    console.log("Unique Dongs (2025):", Array.from(dongs).filter(d => d !== '전주시' && d !== '완산구' && d !== '덕진구').slice(0, 30));
    console.log("Total unique Dongs:", dongs.size);
    console.log("\nUnique Ages:", Array.from(ages).slice(0, 15));
  });
