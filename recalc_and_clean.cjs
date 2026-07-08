const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function recalculateAndClean() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  // 1. LER PLANILHA E CALCULAR A SOMA EXATA POR NESTING
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
      if (!trueWeightMap.has(nesting)) {
        trueWeightMap.set(nesting, 0);
      }
      trueWeightMap.set(nesting, trueWeightMap.get(nesting) + pesoDaLinha);
    }
  });

  console.log(`Pesos calculados (soma das peças) para ${trueWeightMap.size} nestings únicos.`);

  // 2. BUSCAR TODOS OS REGISTROS DO BANCO
  const { data: dbRows, error } = await supabase.from("controle_nestings").select("*");
  if (error) throw error;

  // 3. IDENTIFICAR DUPLICATAS (Agrupar por Balsa + Nesting)
  const uniqueNestings = new Map();
  const toDelete = [];
  const toUpdate = [];

  dbRows.forEach(row => {
    if (!row.id_balsa || !row.nesting || row.nesting === "null") {
      toDelete.push(row.id_itemctrl); // Lixo
      return;
    }

    const key = `${row.id_balsa}_${row.nesting}`;
    
    if (!uniqueNestings.has(key)) {
      uniqueNestings.set(key, row);
    } else {
      // Já existe! Manter o que tem "Finalizado" ou o ID maior
      const existing = uniqueNestings.get(key);
      if (row.status_processo === "Finalizado" && existing.status_processo !== "Finalizado") {
        toDelete.push(existing.id_itemctrl);
        uniqueNestings.set(key, row);
      } else {
        toDelete.push(row.id_itemctrl);
      }
    }
  });

  console.log(`Encontradas ${toDelete.length} linhas duplicadas/lixo para remover.`);

  // 4. PREPARAR ATUALIZAÇÃO COM O PESO CALCULADO
  uniqueNestings.forEach((row, key) => {
    const calculatedWeight = trueWeightMap.get(String(row.nesting).trim());
    if (calculatedWeight !== undefined) {
      toUpdate.push({
        id_itemctrl: row.id_itemctrl,
        peso_total: calculatedWeight
      });
    }
  });

  // 5. EXECUTAR DELEÇÕES
  if (toDelete.length > 0) {
    console.log(`Removendo duplicatas...`);
    const batchSize = 100;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await supabase.from("controle_nestings").delete().in("id_itemctrl", batch);
    }
  }

  // 6. EXECUTAR ATUALIZAÇÕES DE PESO
  if (toUpdate.length > 0) {
    console.log(`Atualizando peso total exato de ${toUpdate.length} nestings...`);
    let count = 0;
    const batchSize = 50;
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const batch = toUpdate.slice(i, i + batchSize);
      for (const update of batch) {
        await supabase.from("controle_nestings")
          .update({ peso_total: update.peso_total })
          .eq("id_itemctrl", update.id_itemctrl);
        count++;
      }
      process.stdout.write(`\r✓ ${count}/${toUpdate.length}`);
    }
  }

  console.log(`\n✅ Sucesso! O banco agora está limpo de duplicatas e com a soma exata de peso por nesting.`);
}

recalculateAndClean();
