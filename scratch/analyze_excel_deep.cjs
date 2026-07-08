const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm';
const workbook = XLSX.readFile(filePath);

const targetSheets = ['FICHA_OPERADOR', 'CONTROLE_NESTINGS', 'EMISSOES'];
targetSheets.forEach(sheetName => {
  if (workbook.SheetNames.includes(sheetName)) {
    console.log(`\n--- Analisando aba: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Mostra as primeiras 10 linhas para achar os cabeçalhos reais
    data.slice(0, 10).forEach((row, i) => {
      if (row.length > 0) {
        console.log(`Linha ${i}:`, row);
      }
    });
  }
});
