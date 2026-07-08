const XLSX = require('xlsx');

function analyzeDashboardTab() {
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
  
  if (!wb.SheetNames.includes("DASHBOARD")) {
    console.log("A aba DASHBOARD não foi encontrada.");
    return;
  }

  const sheet = wb.Sheets["DASHBOARD"];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log("=== ABA DASHBOARD ===");
  // Imprimir as primeiras 20 linhas para entender a estrutura
  data.slice(0, 20).forEach((row, i) => {
    // Filtrar colunas vazias para não poluir
    const vis = row.map(c => c !== null ? String(c).trim() : "").filter(c => c !== "");
    if (vis.length > 0) {
      console.log(`Linha ${i+1}: ${vis.join(" | ")}`);
    }
  });

  // Procurar por "Pendente"
  data.forEach((row, i) => {
    row.forEach((col, j) => {
      if (col && typeof col === 'string' && col.toUpperCase().includes("PENDENTE")) {
        console.log(`\nEncontrado 'Pendente' na linha ${i+1}, coluna ${j+1}: ${col}`);
        // Mostrar valores abaixo dele
        for (let k = 1; k <= 3; k++) {
           if (data[i+k]) {
             console.log(`  Abaixo (+${k}): ${data[i+k][j]}`);
           }
        }
      }
    });
  });
}

analyzeDashboardTab();
