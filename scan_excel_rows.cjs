const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
const workbook = XLSX.readFile(filePath);
const sheetName = 'CONTROLE_NESTINGS';
const worksheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 0; i < Math.min(20, rows.length); i++) {
  console.log(`Linha ${i}:`, rows[i]);
}
