import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

async function main() {
  try {
    const result = await mammoth.extractRawText({path: "소상공인시장진흥공단_상가(상권)정보_OpenApi 활용가이드.docx"});
    console.log("=== DOCX CONTENT (First 1500 chars) ===");
    console.log(result.value.substring(0, 1500));

    const workbook = xlsx.readFile("소상공인시장진흥공단_상가(상권)정보_업종분류(2302)_및_연계표_v1.xlsx");
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]).slice(0, 100);
    console.log("\n=== EXCEL CONTENT (First 100 rows) ===");
    
    // Find unique LclsCd (대분류) related to 음식 or food
    const foodRows = data.filter(row => 
      JSON.stringify(row).includes('음식') || 
      JSON.stringify(row).includes('식당')
    );
    console.log(JSON.stringify(foodRows.slice(0, 10), null, 2));

  } catch (e) {
    console.error(e);
  }
}
main();
