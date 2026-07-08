const XLSX = require('xlsx');

function showNesting4523() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
  const headers = data[headerRow];
  
  const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));
  const pecaIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('PECA'));
  const qtdIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'QTD');
  const pesoUnIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_KG');

  console.log(`\n=== BUSCA DIRETA PELO NESTING 4523 NA BASE G5 ===\n`);
  
  let pesoTotalDoNesting = 0;

  data.slice(headerRow + 1).forEach(row => {
    const nesting = String(row[nestingIdx] || "").trim();
    if (nesting === "4523") {
      const peca = String(row[pecaIdx] || "").trim();
      const qtd = Number(row[qtdIdx]) || 0;
      const pesoUn = Number(row[pesoUnIdx]) || 0;
      const pesoSomado = qtd * pesoUn;
      
      console.log(`✅ Encontrei a peça: ${peca}`);
      console.log(`   -> Cálculo: ${qtd} unid x ${pesoUn.toFixed(2)} kg = ${pesoSomado.toFixed(2)} kg`);
      
      pesoTotalDoNesting += pesoSomado;
    }
  });

  console.log(`\n⚖️ PESO TOTAL SOMADO PARA O NESTING 4523: ${pesoTotalDoNesting.toFixed(2)} kg\n`);
}

showNesting4523();
