require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const iconv = require('iconv-lite');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = 'C:/Users/gagum/Downloads/소상공인시장진흥공단_상가(상권)정보_20251231/소상공인시장진흥공단_상가(상권)정보_전북_202512.csv';

async function importStores() {
  console.log('Starting Supabase jeonju_stores import from Excel CSV...');
  const batchSize = 1000;
  let batch = [];
  let totalRows = 0;
  let successInserted = 0;

  const flushBatch = async (currentBatch) => {
    try {
        const { error } = await supabase.from('jeonju_stores').upsert(currentBatch, { onConflict: 'bizesId' });
        if (error) {
            console.error('Error inserting batch!', error.message);
        } else {
            successInserted += currentBatch.length;
            console.log(`Successfully inserted / upserted batch of ${currentBatch.length}. Total inserted: ${successInserted}`);
        }
    } catch (err) {
        console.error('Fatal batch exception:', err);
    }
  };

  const stream = fs.createReadStream(CSV_FILE_PATH)
    .pipe(iconv.decodeStream('euc-kr')) // 공공데이터포털 CSV는 대부분 EUC-KR입니다.
    .pipe(csv());

  for await (const row of stream) {
    // 1. 전주시 여부 확인
    const signguNm = row['시군구명'];
    if (!signguNm || !signguNm.startsWith('전주시')) continue;

    // 2. 음식점 여부 확인 (코드 I2 또는 상권업종대분류명에 '음식' 포함)
    const lclsCd = row['상권업종대분류코드'];
    const lclsNm = row['상권업종대분류명'] || '';
    if (lclsCd !== 'I2' && lclsCd !== 'Q' && !lclsNm.includes('음식')) continue;

    const storeObj = {
      bizesId: row['상가업소번호'],
      bizesNm: row['상호명'],
      brchNm: row['지점명'],
      indsLclsCd: row['상권업종대분류코드'],
      indsLclsNm: row['상권업종대분류명'],
      indsMclsCd: row['상권업종중분류코드'],
      indsMclsNm: row['상권업종중분류명'],
      indsSclsCd: row['상권업종소분류코드'],
      indsSclsNm: row['상권업종소분류명'],
      ksicCd: row['표준산업분류코드'],
      ksicNm: row['표준산업분류명'],
      ctprvnCd: row['시도코드'],
      ctprvnNm: row['시도명'],
      signguCd: row['시군구코드'],
      signguNm: row['시군구명'],
      adongCd: row['행정동코드'],
      adongNm: row['행정동명'],
      ldongCd: row['법정동코드'],
      ldongNm: row['법정동명'],
      lnoCd: row['지번코드'],
      plotSctCd: row['대지구분코드'],
      plotSctNm: row['대지구분명'],
      lnoMnno: parseInt(row['지번본번지']) || null,
      lnoSlno: parseInt(row['지번부번지']) || null,
      lnoAdr: row['지번주소'],
      rdnmCd: row['도로명코드'],
      rdnm: row['도로명'],
      bldMnno: parseInt(row['건물본번지']) || null,
      bldSlno: parseInt(row['건물부번지']) || null,
      bldMngNo: row['건물관리번호'],
      bldNm: row['건물명'],
      rdnmAdr: row['도로명주소'],
      oldZipcd: row['구우편번호'],
      newZipcd: row['신우편번호'],
      dongNo: row['동정보'],
      flrNo: row['층정보'],
      hoNo: row['호정보'],
      lon: parseFloat(row['경도']) || null,
      lat: parseFloat(row['위도']) || null
    };

    batch.push(storeObj);
    totalRows++;

    if (batch.length >= batchSize) {
      await flushBatch(batch);
      batch = []; // Reset batch
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await flushBatch(batch);
  }
  
  console.log(`\nImport Process Completed! Processed ${totalRows} stores in Jeonju matching Food industry. Success: ${successInserted}`);
  process.exit(0);
}

importStores().catch(console.error);
