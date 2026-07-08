const XLSX = require('xlsx');

function analyzeCommas() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
  const headers = data[headerRow];
  
  const pecaIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('PECA'));
  const pesoUnIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_KG');
  const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));

  const commaPieces = [];

  data.slice(headerRow + 1).forEach(row => {
    const peca = String(row[pecaIdx] || "").trim();
    if (peca.includes(',')) {
      commaPieces.push({
        nesting: row[nestingIdx],
        peca: peca,
        pesoUn: row[pesoUnIdx]
      });
    }
  });

  console.log(`Encontradas ${commaPieces.length} linhas onde o nome da PEÇA contém vírgulas na planilha G5.`);
  console.log("\n=== EXEMPLOS DE PEÇAS COM VÍRGULAS ===");
  commaPieces.slice(0, 10).forEach(p => {
    console.log(`Nesting: ${p.nesting} | Peça: "${p.peca}" | Peso: ${p.pesoUn}kg`);
  });
}

analyzeCommas();
