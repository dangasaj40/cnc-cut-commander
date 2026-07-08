const { createClient } = require("@supabase/supabase-js");

async function checkWhyZero() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: ctrl } = await supabase.from("controle_nestings").select("nesting, peso_total").limit(5).gt("peso_total", 0);
  console.log("=== CONTROLE (Com peso > 0) ===");
  ctrl?.forEach(r => console.log(`Nesting: '${r.nesting}' | Peso: ${r.peso_total}`));

  const { data: logs } = await supabase.from("log_retorno").select("nesting, peso_total").limit(5);
  console.log("\n=== LOGS ===");
  logs?.forEach(l => console.log(`Nesting: '${l.nesting}'`));
}

checkWhyZero();
