const { createClient } = require("@supabase/supabase-js");

async function checkLinkage() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  console.log("=== CHECKING DASHBOARD LINKAGE ===");
  
  // 1. Ver quantos registros temos no LOG_RETORNO
  const { count: logCount } = await supabase.from("log_retorno").select("*", { count: 'exact', head: true });
  console.log(`Total de Logs de Produção: ${logCount}`);

  // 2. Ver status únicos no Controle_Nestings
  const { data: statusData } = await supabase.from("controle_nestings").select("status_processo");
  const statuses = [...new Set(statusData?.map(s => s.status_processo))];
  console.log(`Status encontrados no Controle: ${statuses.join(", ")}`);

  // 3. Ver se os IDs de Balsa batem
  const { data: balsaData } = await supabase.from("balsas").select("id_balsa");
  const balsaIds = balsaData?.map(b => b.id_balsa) || [];
  
  const { data: logBalsas } = await supabase.from("log_retorno").select("id_balsa").limit(10);
  console.log(`Balsas Cadastradas: ${balsaIds.join(", ")}`);
  console.log(`Exemplo de Balsa nos Logs: ${logBalsas?.map(l => l.id_balsa).join(", ")}`);
}

checkLinkage();
