const XLSX = require('xlsx');

function showNestingBreakdown() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
  const headers = data[headerRow];
  
  const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));
  const pecaIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('PECA'));
  const qtdIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'QTD');
  const pesoUnIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_KG');

  const nestingsBreakdown = {};

  data.slice(headerRow + 1).forEach(row => {
    const nesting = String(row[nestingIdx] || "").trim();
    const peca = String(row[pecaIdx] || "").trim();
    const qtd = Number(row[qtdIdx]) || 0;
    const pesoUn = Number(row[pesoUnIdx]) || 0;
    
    if (nesting && nesting !== "null" && pesoUn > 0) {
      if (!nestingsBreakdown[nesting]) {
        nestingsBreakdown[nesting] = { 
          pecas: [], 
          pesoTotalCalculado: 0 
        };
      }
      
      const pesoTotalDaPeca = qtd * pesoUn;
      nestingsBreakdown[nesting].pecas.push({
        nome: peca,
        qtd: qtd,
        pesoUnitario: pesoUn,
        pesoSomado: pesoTotalDaPeca
      });
      nestingsBreakdown[nesting].pesoTotalCalculado += pesoTotalDaPeca;
    }
  });

  // Filtrar apenas nestings que tenham mais de uma peça diferente para usarmos como exemplo
  const nestingsComplexos = Object.entries(nestingsBreakdown).filter(([k, v]) => v.pecas.length > 1);

  console.log(`\n=== RELATÓRIO: COMO O PESO SERÁ CALCULADO ===\n`);
  
  // Mostrar 3 exemplos detalhados
  nestingsComplexos.slice(0, 3).forEach(([nesting, dados]) => {
    console.log(`NESTING: [ ${nesting} ]`);
    dados.pecas.forEach(p => {
      console.log(`  └─ Peça: ${p.nome}`);
      console.log(`     Matemática: ${p.qtd} unidade(s) x ${p.pesoUnitario.toFixed(2)} kg = ${p.pesoSomado.toFixed(2)} kg`);
    });
    console.log(`  ===============================================`);
    console.log(`  ⚖️ PESO TOTAL DESTE NESTING: ${dados.pesoTotalCalculado.toFixed(2)} kg\n`);
  });
}

showNestingBreakdown();
