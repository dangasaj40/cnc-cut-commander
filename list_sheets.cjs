const XLSX = require('xlsx');
const workbook = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
console.log("Abas:", workbook.SheetNames);
