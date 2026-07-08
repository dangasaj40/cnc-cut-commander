const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function previewEmissoes() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
  
  if (!wb.SheetNames.includes("EMISSOES")) {
    console.log("Aba EMISSOES não encontrada.");
    return;
  }

  const sheet = wb.Sheets["EMISSOES"];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log("=== PREVIEW DA ABA EMISSOES ===");
  data.slice(0, 5).forEach((row, i) => {
    console.log(`Linha ${i+1}:`, row.map(c => c !== null ? String(c).trim() : "").slice(0, 15).join(" | "));
  });
}

previewEmissoes();
