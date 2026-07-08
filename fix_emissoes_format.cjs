const { createClient } = require("@supabase/supabase-js");

async function fixEmissoesFormatting() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  // 1. Buscar todas as emissões
  const { data: em } = await supabase.from("emissoes").select("id, id_emissao, status_processo");
  
  if (!em) return;

  console.log(`Analisando ${em.length} registros para correção...`);

  let corrected = 0;
  for (const e of em) {
    const cleanId = String(e.id_emissao).trim();
    // Forçar o status exatamente como "Em processamento" (com E maiúsculo e minúsculas)
    let cleanStatus = String(e.status_processo).trim();
    if (cleanStatus.toLowerCase() === "em processamento") {
      cleanStatus = "Em processamento";
    }

    if (cleanId !== e.id_emissao || cleanStatus !== e.status_processo) {
      await supabase.from("emissoes")
        .update({ id_emissao: cleanId, status_processo: cleanStatus })
        .eq("id", e.id);
      corrected++;
    }
  }

  console.log(`✅ Sucesso! ${corrected} registros foram corrigidos e limpos.`);
}

fixEmissoesFormatting();
