const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');

const CSV_FILE_PATH = 'c:\\Users\\gagum\\Downloads\\소상공인시장진흥공단_상가(상권)정보_20251231\\711_DT_M0105Y_2020_M_20260323215448.csv';

const stream = fs.createReadStream(CSV_FILE_PATH)
  .pipe(iconv.decodeStream('euc-kr'))
  .pipe(csv());

let count = 0;
stream.on('headers', (headers) => {
  console.log('Headers:', headers);
});

stream.on('data', (row) => {
  if (count < 5) {
    console.log('Row:', row);
    count++;
  } else {
    stream.destroy();
  }
});
