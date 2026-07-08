const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm';
const workbook = XLSX.readFile(filePath);

console.log('Abas encontradas:', workbook.SheetNames);

// Vamos olhar a aba que provavelmente gera a emissão ou o log
const targetSheets = ['EMISSAO', 'LOG_RETORNO', 'Controle'];
targetSheets.forEach(sheetName => {
  if (workbook.SheetNames.includes(sheetName)) {
    console.log(`\n--- Analisando aba: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length > 0) {
      console.log('Cabeçalhos encontrados:', data[0]);
      console.log('Exemplo de linha 1:', data[1]);
    }
  }
});
