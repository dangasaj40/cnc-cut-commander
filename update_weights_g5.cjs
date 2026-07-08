const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function updateWeightsFromG5() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  try {
    // 1. Ler a nova planilha G5
    const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Localizar cabeçalhos
    const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
    const headers = data[headerRow];
    const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));
    const pesoIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('PESO_TOTAL_KG'));

    // Criar mapa: Nesting -> Peso
    const pesoMap = new Map();
    data.slice(headerRow + 1).forEach(row => {
      const nesting = String(row[nestingIdx] || "").trim();
      const peso = Number(row[pesoIdx]) || 0;
      if (nesting && peso > 0) {
        pesoMap.set(nesting, peso);
      }
    });

    console.log(`Mapa de pesos criado: ${pesoMap.size} nestings identificados na planilha G5.`);

    // 2. Buscar nestings do banco que precisam de atualização
    const { data: dbRows, error } = await supabase.from("controle_nestings").select("id_itemctrl, nesting");
    if (error) throw error;

    console.log(`Iniciando atualização de ${dbRows.length} registros no banco...`);

    let updatedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < dbRows.length; i += batchSize) {
      const batch = dbRows.slice(i, i + batchSize);
      
      // Processar o lote
      for (const row of batch) {
        const pesoNovo = pesoMap.get(String(row.nesting).trim());
        if (pesoNovo !== undefined) {
          const { error: updateError } = await supabase
            .from("controle_nestings")
            .update({ peso_total: pesoNovo })
            .eq("id_itemctrl", row.id_itemctrl);
          
          if (!updateError) updatedCount++;
        }
      }
      process.stdout.write(`\rProgresso: ${i + batch.length}/${dbRows.length} - Atualizados: ${updatedCount}`);
    }

    console.log(`\n\n✅ Atualização concluída com sucesso!`);
    console.log(`Total de registros processados: ${dbRows.length}`);
    console.log(`Total de pesos atualizados: ${updatedCount}`);

  } catch (err) {
    console.error("\n❌ Erro durante a atualização:", err.message);
  }
}

updateWeightsFromG5();
