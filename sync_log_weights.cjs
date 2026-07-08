const { createClient } = require("@supabase/supabase-js");

async function syncLogsWeightFixed() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: ctrl } = await supabase.from("controle_nestings").select("nesting, peso_total");
  const pesoMap = new Map();
  ctrl?.forEach(r => {
    if (r.nesting && r.peso_total > 0) {
      pesoMap.set(String(r.nesting).trim(), r.peso_total);
    }
  });

  const { data: logs } = await supabase.from("log_retorno").select("id_log, nesting, peso_total");
  
  const toUpdate = [];
  logs?.forEach(l => {
    const nestingKey = String(l.nesting).trim();
    const pesoCorreto = pesoMap.get(nestingKey);
    if (pesoCorreto !== undefined) {
      toUpdate.push({ id_log: l.id_log, peso_total: pesoCorreto });
    } else {
      // Tentar pegar do map usando split se houver múltiplos
      const parts = nestingKey.split(',');
      if(parts.length > 0 && pesoMap.has(parts[0].trim())) {
         toUpdate.push({ id_log: l.id_log, peso_total: pesoMap.get(parts[0].trim()) });
      }
    }
  });

  console.log(`Encontrei ${toUpdate.length} logs que batem com os pesos do projeto.`);

  let count = 0;
  const batchSize = 50;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    for (const update of batch) {
      await supabase.from("log_retorno")
        .update({ peso_total: update.peso_total })
        .eq("id_log", update.id_log);
      count++;
    }
    process.stdout.write(`\r✓ ${count}/${toUpdate.length}`);
  }

  console.log(`\n✅ Correção concluída!`);
}

syncLogsWeightFixed();
