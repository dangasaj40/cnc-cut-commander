const XLSX = require('xlsx');

function analyzeBaseG5() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
  const headers = data[headerRow];
  
  const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));
  const pecaIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('PECA'));
  const pesoTotalIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_TOTAL_KG');
  const qtdIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'QTD');
  const pesoUnIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_KG');

  const nestingsCount = {};

  data.slice(headerRow + 1).forEach(row => {
    const nesting = String(row[nestingIdx] || "").trim();
    if (nesting && nesting !== "null") {
      if (!nestingsCount[nesting]) {
        nestingsCount[nesting] = { rows: 0, pieces: [], totalCalculatedWeight: 0 };
      }
      nestingsCount[nesting].rows += 1;
      nestingsCount[nesting].pieces.push({
        peca: row[pecaIdx],
        qtd: row[qtdIdx],
        peso_un: row[pesoUnIdx],
        peso_total_linha: row[pesoTotalIdx]
      });
      nestingsCount[nesting].totalCalculatedWeight += Number(row[pesoTotalIdx]) || 0;
    }
  });

  // Mostrar exemplos de nestings com múltiplas peças
  const multiplePieces = Object.entries(nestingsCount).filter(([k, v]) => v.rows > 1);
  
  console.log(`Total de Nestings Únicos na G5: ${Object.keys(nestingsCount).length}`);
  console.log(`Nestings com mais de uma linha/peça na G5: ${multiplePieces.length}`);
  
  if (multiplePieces.length > 0) {
    console.log("\n=== EXEMPLO DE NESTING COM MÚLTIPLAS PEÇAS ===");
    const [sampleNesting, sampleData] = multiplePieces[0];
    console.log(`Nesting: ${sampleNesting}`);
    sampleData.pieces.forEach(p => {
      console.log(`  - Peça: ${p.peca} | Qtd: ${p.qtd} | Peso Un: ${p.peso_un}kg | Peso Total Linha: ${p.peso_total_linha}kg`);
    });
    console.log(`  => PESO TOTAL SOMADO DO NESTING: ${sampleData.totalCalculatedWeight}kg`);
  }
}

analyzeBaseG5();
