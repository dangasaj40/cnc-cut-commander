const XLSX = require('xlsx');

try {
  const filePath = "c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm";
  const workbook = XLSX.readFile(filePath);
  
  const sheet = workbook.Sheets['BASE_DADOS'];
  if (!sheet) {
      console.log("Aba BASE_DADOS não encontrada.");
  } else {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }); 
    console.log("=== BASE_DADOS ===");
    for (let i = 0; i < Math.min(10, data.length); i++) {
        console.log(`Linha ${i+1}:`, JSON.stringify(data[i]));
    }
    console.log(`Total de linhas em BASE_DADOS: ${data.length}`);
  }
} catch (e) {
  console.error("Erro:", e);
}
