const { createClient } = require("@supabase/supabase-js");

async function updateBalsaStats() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: balsas } = await supabase.from("balsas").select("id_balsa");
  
  for (const b of balsas) {
    const { data: nestings } = await supabase
      .from("controle_nestings")
      .select("status_processo, nesting")
      .eq("id_balsa", b.id_balsa);

    if (nestings && nestings.length > 0) {
      const uniqueAll   = new Set(nestings.map(n => n.nesting)).size;
      const finalizados = new Set(nestings.filter(n => n.status_processo === "Finalizado").map(n => n.nesting)).size;
      const emitidos    = new Set(nestings.filter(n => n.status_processo === "Em processamento").map(n => n.nesting)).size;
      // Fórmula CORRETA da planilha: Pendentes = Total - Finalizados
      // (Emitidos ainda contam como pendentes até serem finalizados)
      const pendentes   = uniqueAll - finalizados;

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
  console.log("Stats atualizados!");
}

updateBalsaStats();
