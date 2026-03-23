const mammoth = require('mammoth');
async function parse() {
    try {
        const result = await mammoth.extractRawText({ path: "d:/02_PROJECT/09_jeonju-sangkwon/src/app/IROS_SS_ID_DV_0501_OpenAPI활용가이드_전주시버스정보시스템_소통정보서비스__v1.1.docx" });
        const text = result.value;
        const startIndex = text.indexOf('도로별 현황 상세 정보');
        if (startIndex === -1) {
            console.log("Keyword not found.");
        } else {
            console.log(text.substring(startIndex + 1500, startIndex + 3500));
        }
    } catch (e) {
        console.error(e);
    }
}
parse();
