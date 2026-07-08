const XLSX = require('xlsx');

function checkTruncated() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
  const sheet = wb.Sheets["EMISSOES"];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log("=== VERIFICANDO TRUNCAMENTO ===");
  data.forEach((row, i) => {
    const id = String(row[0] || "").trim();
    if (id.includes("RAKE-14") && id.startsWith("0427")) {
      console.log(`Linha ${i+1}: ${id} (Tipo Original: ${typeof row[0]}, Valor Bruto: ${row[0]})`);
    }
  });
}

checkTruncated();
