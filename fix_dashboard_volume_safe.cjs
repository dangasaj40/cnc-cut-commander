const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function syncLogsDirectFromG5Safe() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  try {
    const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
    const headers = data[headerRow];
    const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));
    const qtdIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'QTD');
    const pesoUnIdx = headers.findIndex(h => h && String(h).toUpperCase() === 'PESO_KG');

    const trueWeightMap = new Map();

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

    const { data: logs, error } = await supabase.from("log_retorno").select("id, nesting");
    if (error) {
       console.error("Erro ao buscar log_retorno:", error);
       return;
    }

    const toUpdate = [];
    logs.forEach(l => {
      const nestingKey = String(l.nesting).trim();
      const calculatedWeight = trueWeightMap.get(nestingKey);
      
      if (calculatedWeight !== undefined) {
        toUpdate.push({
          id: l.id,
          peso_total: calculatedWeight
        });
      }
    });

    console.log(`🔄 Injetando ${toUpdate.length} pesos corretos no Dashboard...`);

    let count = 0;
    const batchSize = 50;
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = toUpdate.slice(i, i + batchSize);
      for (const update of batch) {
        await supabase.from("log_retorno")
          .update({ peso_total: update.peso_total })
          .eq("id", update.id);
        count++;
      }
      process.stdout.write(`\r✓ ${count}/${toUpdate.length} logs atualizados`);
    }

    console.log(`\n\n✅ Sucesso absoluto! O Volume Total da Dashboard vai funcionar agora.`);
  } catch (e) {
    console.error("Exceção:", e.message);
  }
}

syncLogsDirectFromG5Safe();
