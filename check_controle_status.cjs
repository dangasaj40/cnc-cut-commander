const XLSX = require('xlsx');

function checkControleNestings() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
  const sheet = wb.Sheets["CONTROLE_NESTINGS"];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log("=== COLUNAS CONTROLE_NESTINGS ===");
  data.slice(0, 5).forEach((row, i) => {
    console.log(`Linha ${i+1}:`, row.map(c => c !== null ? String(c).trim() : "").slice(0, 15).join(" | "));
  });

  // Procurar o nesting 3909
  const nesting3909 = data.find(r => r.some(c => String(c).trim() === "3909"));
  if (nesting3909) {
    console.log("\n=== NESTING 3909 (Em processamento) NA PLANILHA ===");
    console.log(nesting3909.map(c => c !== null ? String(c).trim() : "").slice(0, 15).join(" | "));
  }
}

checkControleNestings();
