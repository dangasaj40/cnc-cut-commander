const XLSX = require('xlsx');

function findStringInExcel() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
  
  const searchStr = "RD-H15, RD-H3, RL1-HB9";
  
  wb.SheetNames.forEach(sName => {
    const sheet = wb.Sheets[sName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    data.forEach((row, i) => {
      row.forEach((col, j) => {
        if (col && typeof col === 'string' && col.includes(searchStr)) {
          console.log(`Encontrado na aba ${sName}, linha ${i+1}, coluna ${j}`);
          console.log(`Conteúdo completo: ${col}`);
        }
      });
    });
  });
}

findStringInExcel();
