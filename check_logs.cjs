const { createClient } = require("@supabase/supabase-js");

async function checkLogRetorno() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: logs } = await supabase
    .from("log_retorno")
    .select("peso_total, nesting")
    .limit(10);
    
  console.log("=== AMOSTRA DE LOG_RETORNO ===");
  logs.forEach(l => console.log(`Nesting: ${l.nesting} | peso_total: ${l.peso_total}`));
}

checkLogRetorno();
