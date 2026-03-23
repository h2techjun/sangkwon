const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');

const CSV_FILE_PATH = 'C:/Users/gagum/Downloads/소상공인시장진흥공단_상가(상권)정보_20251231/소상공인시장진흥공단_상가(상권)정보_전북_202512.csv';

const results = [];
fs.createReadStream(CSV_FILE_PATH)
//   .pipe(iconv.decodeStream('euc-kr')) // Maybe it's UTF-8 now! Let's just pipe without it first or log raw buffer
  .pipe(csv())
  .on('data', (data) => {
    results.push(data);
    if (results.length === 1) {
      console.log("HEADERS (UTF-8):", Object.keys(data));
      process.exit(0);
    }
  });
