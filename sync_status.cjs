const { createClient } = require("@supabase/supabase-js");

async function syncStatus() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  console.log("Iniciando sincronização de status...");

  // 1. Pegar todos os IDs de nestings que estão nos logs como finalizados
  const { data: logs } = await supabase.from("log_retorno").select("nesting, id_balsa");
  
  if (!logs) return;

  const finishedMap = {}; // balsa -> Set of nestings
  logs.forEach(l => {
    if (!finishedMap[l.id_balsa]) finishedMap[l.id_balsa] = new Set();
    finishedMap[l.id_balsa].add(l.nesting);
  });

  for (const balsaId of Object.keys(finishedMap)) {
    const nestingList = Array.from(finishedMap[balsaId]);
    console.log(`Balsa ${balsaId}: Marcando ${nestingList.length} nestings como Finalizados...`);
    
    const { error } = await supabase
      .from("controle_nestings")
      .update({ status_processo: "Finalizado" })
      .eq("id_balsa", balsaId)
      .in("nesting", nestingList);
      
    if (error) console.error("Erro:", error.message);
  }

  console.log("Status sincronizados! Agora o Dashboard vai brilhar.");
}

syncStatus();
