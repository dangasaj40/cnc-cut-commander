const { createClient } = require("@supabase/supabase-js");

async function checkSpecificNesting() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: ctrl } = await supabase.from("controle_nestings").select("nesting, peso_total").eq("nesting", "3980");
  console.log("=== CONTROLE NESTING 3980 ===");
  ctrl?.forEach(r => console.log(`Peso: ${r.peso_total}`));
}

checkSpecificNesting();
