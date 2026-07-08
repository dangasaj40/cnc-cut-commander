const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function importControleDeep() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  try {
    const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
    const sheet = wb.Sheets['CONTROLE_NESTINGS'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }).slice(1);
    
    console.log(`Analisando ${data.length} linhas...`);

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize).map(row => {
        if (!row[10]) return null;

        const tipo = String(row[0] || "");
        const balsaNum = String(row[2] || "");
        // Tenta montar o ID como RAKE-13 ou BOX-15
        const idBalsaFinal = balsaNum.includes("-") ? balsaNum : `${tipo}-${balsaNum}`;

        return {
          id_balsa: idBalsaFinal,
          tipo_balsa: tipo,
          nome_balsa: balsaNum,
          bloco: String(row[8] || ""),
          painel: String(row[9] || ""),
          nesting: String(row[10]),
          peca: String(row[3] || ""),
          descricao: String(row[4] || ""),
          espessura_mm: Number(row[5]) || 0,
          peso_total: Number(row[7]) || 0,
          tempo_corte_total: Number(row[1]) || 0,
          status_processo: "Disponivel"
        };
      }).filter(b => b && b.id_balsa);

      if (batch.length > 0) {
        await supabase.from("controle_nestings").upsert(batch);
      }
    }

    // Depois de importar, rodar a sincronização de status novamente
    console.log("Nestings importados! Sincronizando status...");
    const { data: logs } = await supabase.from("log_retorno").select("nesting, id_balsa");
    if (logs) {
      for (const log of logs) {
        await supabase.from("controle_nestings").update({ status_processo: "Finalizado" })
          .eq("id_balsa", log.id_balsa).eq("nesting", log.nesting);
      }
    }

    console.log("Processo concluído!");
  } catch (e) {
    console.error(e);
  }
}

importControleDeep();
