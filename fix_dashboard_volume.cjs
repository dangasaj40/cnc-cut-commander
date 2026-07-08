const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function syncLogsDirectFromG5() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  // 1. Ler a Planilha G5 (A "Fonte da Verdade")
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
  const headers = data[headerRow];
  const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));
  const qtdIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'QTD');
  const pesoUnIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_KG');

  const trueWeightMap = new Map();

  // 2. Calcular a soma matemática exata (Qtd x Peso Unitário) para CADA nesting
  data.slice(headerRow + 1).forEach(row => {
    const nesting = String(row[nestingIdx] || "").trim();
    const qtd = Number(row[qtdIdx]) || 0;
    const pesoUn = Number(row[pesoUnIdx]) || 0;
    
    if (nesting && nesting !== "null" && pesoUn > 0) {
      const pesoDaLinha = qtd * pesoUn;
      if (!trueWeightMap.has(nesting)) trueWeightMap.set(nesting, 0);
      trueWeightMap.set(nesting, trueWeightMap.get(nesting) + pesoDaLinha);
    }
  });

  console.log(`✓ Pesos calculados da G5 para ${trueWeightMap.size} nestings.`);

  // 3. Buscar TODOS os Logs (Histórico de Produção) - usando paginação manual ou sem limite se forem poucos
  // Como são cerca de 300 logs, não deve bater no limite de 1000
  const { data: logs, error } = await supabase.from("log_retorno").select("id_log, nesting");
  if (error) throw error;

  console.log(`✓ Encontrados ${logs.length} logs no Histórico de Produção.`);

  // 4. Preparar atualização
  const toUpdate = [];
  logs.forEach(l => {
    const nestingKey = String(l.nesting).trim();
    const calculatedWeight = trueWeightMap.get(nestingKey);
    
    if (calculatedWeight !== undefined) {
      toUpdate.push({
        id_log: l.id_log,
        peso_total: calculatedWeight
      });
    }
  });

  console.log(`🔄 Injetando ${toUpdate.length} pesos corretos no Dashboard...`);

  // 5. Executar atualização no banco
  let count = 0;
  const batchSize = 50;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    for (const update of batch) {
      await supabase.from("log_retorno")
        .update({ peso_total: update.peso_total })
        .eq("id_log", update.id_log);
      count++;
    }
    process.stdout.write(`\r✓ ${count}/${toUpdate.length} logs atualizados`);
  }

  console.log(`\n\n✅ Sucesso absoluto! O Volume Total da Dashboard vai funcionar agora.`);
}

syncLogsDirectFromG5();
