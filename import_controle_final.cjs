const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function importControleFinal() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  try {
    const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
    const sheet = wb.Sheets['CONTROLE_NESTINGS'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }).slice(1);
    
    console.log(`Importando ${data.length} registros com novo mapeamento...`);

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize).map(row => {
        if (!row[1] || !row[6]) return null; 

        return {
          id_balsa: String(row[1]),
          tipo_balsa: String(row[2] || ""),
          nome_balsa: String(row[3] || ""),
          bloco: String(row[4] || ""),
          painel: String(row[5] || ""),
          nesting: String(row[6]),
          peca: String(row[7] || ""),
          descricao: String(row[8] || ""),
          espessura_mm: Number(row[9]) || 0,
          peso_total: Number(row[19]) || 0, // Peso total na col 19
          tempo_corte_total: Number(row[11]) || 0,
          status_processo: String(row[12] || "Disponivel")
        };
      }).filter(Boolean);

      if (batch.length > 0) {
        await supabase.from("controle_nestings").upsert(batch);
      }
    }

    console.log("Sucesso! Agora sim os dados estão no lugar certo.");
  } catch (e) {
    console.error(e);
  }
}

importControleFinal();
