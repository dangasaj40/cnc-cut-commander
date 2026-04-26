const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function run() {
  const apiKey = "AIzaSyCxoiSjpJwrc4OcJWm_u7bD7v1JQyGWn_I";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const pdfPath = "c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BPR-BPP-BOX-PP-RAKE_INFORMATIVO (1) (1).pdf";
  
  // Como não temos lib de PDF para cortar páginas, vamos tentar enviar o arquivo 
  // mas pedindo especificamente para ele olhar apenas o início.
  const pdfData = fs.readFileSync(pdfPath);

  const prompt = "Diga apenas o número do Nesting (campo CNC) que aparece na PRIMEIRA PÁGINA deste documento. Apenas o número.";

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: pdfData.toString("base64"),
        mimeType: "application/pdf"
      }
    }
  ]);

  console.log("Página 1:", result.response.text().trim());
}

run().catch(console.error);
