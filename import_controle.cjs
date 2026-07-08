const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function importControle() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  try {
    const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
    const sheet = wb.Sheets['CONTROLE_NESTINGS'];
    if (!sheet) return;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const rows = data.slice(1);
    
    console.log(`Importando ${rows.length} nestings de controle...`);

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(row => {
        if (!row[10] || !row[2]) return null; // Nesting e Balsa obrigatórios

        return {
          id_balsa: String(row[2]),
          tipo_balsa: String(row[0] || ""),
          nome_balsa: String(row[4] || ""),
          bloco: String(row[8] || ""),
          painel: String(row[9] || ""),
          nesting: String(row[10]),
          peca: String(row[3] || ""),
          descricao: String(row[4] || ""),
          espessura_mm: Number(row[5]) || 0,
          peso_total: Number(row[7]) || 0,
          tempo_corte_total: Number(row[1]) || 0,
          status_processo: String(row[13] || "Disponivel")
        };
      }).filter(Boolean);

      if (batch.length > 0) {
        await supabase.from("controle_nestings").upsert(batch);
      }
      if (i % 500 === 0) console.log(`✓ ${i} registros processados...`);
    }

    console.log("Sucesso! As balsas agora estão povoadas.");
  } catch (e) {
    console.error(e);
  }
}

importControle();
