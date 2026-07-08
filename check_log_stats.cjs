const { createClient } = require("@supabase/supabase-js");

async function checkLogStats() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: logs } = await supabase.from("log_retorno").select("operador, nesting");
  
  if (logs) {
    const stats = {};
    logs.forEach(l => {
      const op = l.operador || "S/ ID";
      if (!stats[op]) stats[op] = { count: 0, uniqueNestings: new Set() };
      stats[op].count++;
      stats[op].uniqueNestings.add(l.nesting);
    });

    console.log("Estatísticas Reais no Banco:");
    Object.keys(stats).forEach(op => {
      console.log(`Operador: ${op} | Registros: ${stats[op].count} | Nestings Únicos: ${stats[op].uniqueNestings.size}`);
    });
  }
}

checkLogStats();
