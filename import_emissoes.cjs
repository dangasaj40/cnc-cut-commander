const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function importEmissoes() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");
  const sheet = wb.Sheets["EMISSOES"];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log("Processando aba EMISSOES...");
  
  const toInsert = [];

  // Começa da linha 4 (índice 4 considerando cabeçalho na linha 3)
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue; // Pula vazios

    const status_processo = String(row[14] || "").trim();
    
    // IMPORTANTE: Só precisamos importar para a aba "Baixa de Produção" o que estiver "Em processamento"
    // Se já estiver "Finalizado", já está no LOG_RETORNO.
    if (status_processo !== "Em processamento") continue;

    toInsert.push({
      id_emissao: String(row[0] || "").trim(),
      // data_emissao (Excel serial date)
      data_emissao: row[1] ? new Date((row[1] - (25567 + 2)) * 86400 * 1000).toISOString() : new Date().toISOString(),
      id_balsa: String(row[2] || "").trim(),
      tipo_balsa: String(row[3] || "").trim(),
      nome_balsa: String(row[4] || "").trim(),
      maquina: String(row[5] || "").trim(),
      turno: String(row[6] || "").trim(),
      bloco: String(row[7] || "").trim(),
      painel: String(row[8] || "").trim(),
      nesting: String(row[9] || "").trim(),
      pecas: String(row[10] || "").trim(),
      qtd_pecas: Number(row[11]) || 1,
      espessura: String(row[13] || "").trim(),
      status_processo: status_processo,
      chave_emissao: `${String(row[0] || "").trim()}|${String(row[9] || "").trim()}`
    });
  }

  console.log(`Encontradas ${toInsert.length} emissões 'Em processamento' para importar.`);

  if (toInsert.length > 0) {
    const { error } = await supabase.from("emissoes").upsert(toInsert, { onConflict: "chave_emissao" });
    if (error) {
      console.error("Erro ao importar:", error);
    } else {
      console.log("✅ Importação de EMISSOES concluída!");
    }
  }
}

importEmissoes();
