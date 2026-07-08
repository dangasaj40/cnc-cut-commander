const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function fixMissingNestings() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");

  // Mapa completo do CONTROLE_NESTINGS da planilha: nesting -> dados
  const ctrlSheet = wb.Sheets['CONTROLE_NESTINGS'];
  const ctrlData = XLSX.utils.sheet_to_json(ctrlSheet, { header: 1, defval: null }).slice(1);
  
  // Usar o mapeamento correto descoberto anteriormente (Col 1 = id_balsa, Col 6 = nesting)
  const nestingMasterMap = {};
  ctrlData.forEach(row => {
    const nesting = String(row[6] || "");
    if (nesting && nesting !== "null") {
      nestingMasterMap[nesting] = {
        id_balsa: String(row[1] || ""),
        tipo_balsa: String(row[2] || ""),
        nome_balsa: String(row[3] || ""),
        bloco: String(row[4] || ""),
        painel: String(row[5] || ""),
        nesting: nesting,
        peca: String(row[7] || ""),
        espessura_mm: Number(row[9]) || 0,
        peso_total: Number(row[19]) || 0,
        tempo_corte_total: Number(row[11]) || 0,
        status_processo: String(row[12] || "Disponivel")
      };
    }
  });
  
  console.log(`Mapa mestre: ${Object.keys(nestingMasterMap).length} nestings únicos da planilha`);

  // Agora buscar os logs da planilha para descobrir os nestings finalizados
  const logData = XLSX.utils.sheet_to_json(wb.Sheets['LOG_RETORNO'], { header: 1, defval: null }).slice(1);
  
  // Para cada log, garantir que o nesting existe no banco com o status correto
  const toUpsert = [];
  logData.forEach(row => {
    const balsaId = String(row[2] || "");
    const nestingId = String(row[9] || "");
    if (!balsaId || !nestingId || nestingId === "null") return;

    // Pegar dados do mapa mestre ou criar entrada mínima
    const masterData = nestingMasterMap[nestingId];
    toUpsert.push({
      id_balsa: balsaId,
      tipo_balsa: masterData?.tipo_balsa || String(row[3] || ""),
      nome_balsa: masterData?.nome_balsa || String(row[4] || ""),
      bloco: masterData?.bloco || String(row[7] || ""),
      painel: masterData?.painel || String(row[8] || ""),
      nesting: nestingId,
      peca: masterData?.peca || "",
      espessura_mm: masterData?.espessura_mm || 0,
      peso_total: masterData?.peso_total || 0,
      tempo_corte_total: masterData?.tempo_corte_total || 0,
      status_processo: "Finalizado"  // Se está no log, foi finalizado
    });
  });

  console.log(`Inserindo/atualizando ${toUpsert.length} nestings dos logs...`);

  const batchSize = 100;
  for (let i = 0; i < toUpsert.length; i += batchSize) {
    const batch = toUpsert.slice(i, i + batchSize);
    const { error } = await supabase.from("controle_nestings").upsert(batch);
    if (error) console.error(`Erro lote ${i}:`, error.message);
    else process.stdout.write(`\r✓ ${i + batch.length}/${toUpsert.length}`);
  }

  console.log("\nRecalculando stats...");
  
  // Recalcular stats de cada balsa
  const { data: balsas } = await supabase.from("balsas").select("id_balsa");
  for (const b of balsas) {
    const { data: nestings } = await supabase
      .from("controle_nestings")
      .select("status_processo, nesting")
      .eq("id_balsa", b.id_balsa);

    if (nestings && nestings.length > 0) {
      const uniqueAll  = new Set(nestings.map(n => n.nesting)).size;
      const finalizados = new Set(nestings.filter(n => n.status_processo === "Finalizado").map(n => n.nesting)).size;
      const emitidos    = new Set(nestings.filter(n => n.status_processo === "Em processamento").map(n => n.nesting)).size;
      const pendentes   = new Set(nestings.filter(n => n.status_processo === "Disponivel").map(n => n.nesting)).size;

      await supabase.from("balsas").update({
        total_nestings: uniqueAll,
        finalizados,
        emitidos,
        pendentes,
        percentual_concluido: uniqueAll > 0 ? (finalizados / uniqueAll) : 0
      }).eq("id_balsa", b.id_balsa);

      console.log(`${b.id_balsa}: total=${uniqueAll} fin=${finalizados} emit=${emitidos} pend=${pendentes}`);
    }
  }

  console.log("\nConcluído!");
}

fixMissingNestings();
