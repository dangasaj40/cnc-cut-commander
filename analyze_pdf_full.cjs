const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function run() {
  const apiKey = "AIzaSyCxoiSjpJwrc4OcJWm_u7bD7v1JQyGWn_I";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const pdfPath = "public/nesting_report.pdf";
  const pdfData = fs.readFileSync(pdfPath);

  // Enviamos o arquivo mas pedimos para ele focar no conteúdo de texto
  const prompt = "Este é um PDF de nesting. Liste todos os números de Nesting (campo CNC) que você encontrar nele. Retorne apenas a lista de números.";

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: pdfData.toString("base64"),
        mimeType: "application/pdf"
      }
    }
  ]);

  console.log(result.response.text());
}

run().catch(console.error);
