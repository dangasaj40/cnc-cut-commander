const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const apiKey = "AIzaSyCxoiSjpJwrc4OcJWm_u7bD7v1JQyGWn_I";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const result = await model.generateContent("Oi, responda apenas OK.");
  console.log(result.response.text());
}

run().catch(console.error);
