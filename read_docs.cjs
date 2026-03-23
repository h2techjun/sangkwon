const mammoth = require('mammoth');
const xlsx = require('xlsx');

async function main() {
  try {
    const result = await mammoth.extractRawText({path: "소상공인시장진흥공단_상가(상권)정보_OpenApi 활용가이드.docx"});
    const docText = result.value;
    console.log("=== API URL IN DOCX ===");
    const urlMatches = docText.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) console.log([...new Set(urlMatches)]);

    console.log("\n=== EXCEL INDUSTRY CODES ===");
    const workbook = xlsx.readFile("소상공인시장진흥공단_상가(상권)정보_업종분류(2302)_및_연계표_v1.xlsx");
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // Find unique LclsCd (대분류) related to 음식 or food
    const foodRows = data.filter(row => 
      JSON.stringify(row).includes('음식') || JSON.stringify(row).includes('식당')
    );
    console.log(foodRows.slice(0, 10));

  } catch (e) {
    console.error(e);
  }
}
main();
