const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
const workbook = XLSX.readFile(filePath);
const sheetName = 'CONTROLE_NESTINGS';
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.log(`Aba ${sheetName} não encontrada!`);
  process.exit(1);
}

const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
console.log('Cabeçalhos encontrados:', headers);

const sample = XLSX.utils.sheet_to_json(worksheet).slice(0, 20);
const operators = sample.map(s => s['OPERADOR'] || s['Operador'] || s['operador']).filter(Boolean);
console.log('Operadores na amostra da planilha:', operators);
