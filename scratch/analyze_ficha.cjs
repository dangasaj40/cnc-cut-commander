const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm';
const workbook = XLSX.readFile(filePath);

if (workbook.SheetNames.includes('FICHA_OPERADOR')) {
  console.log(`\n--- Analisando aba: FICHA_OPERADOR ---`);
  const sheet = workbook.Sheets['FICHA_OPERADOR'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  data.slice(0, 15).forEach((row, i) => {
    console.log(`Linha ${i}:`, row);
  });
}
