const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');

const CSV_FILE_PATH = 'd:/02_PROJECT/09_jeonju-sangkwon/전북특별자치도 전주시_휴게음식점_20260210.csv';

fs.createReadStream(CSV_FILE_PATH)
  .pipe(iconv.decodeStream('euc-kr')) 
  .pipe(csv())
  .on('data', (data) => {
    console.log("HEADERS:", Object.keys(data));
    console.log("ROW 1:", data);
    process.exit(0);
  });
