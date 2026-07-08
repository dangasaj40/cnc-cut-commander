const { createClient } = require("@supabase/supabase-js");

async function findProcessingNestings() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: nestings } = await supabase
    .from("controle_nestings")
    .select("nesting, painel")
    .eq("id_balsa", "BOX-15")
    .eq("status_processo", "Em processamento")
    .limit(5);

  console.log("=== NESTINGS EM PROCESSAMENTO (BOX-15) ===");
  nestings?.forEach(n => console.log(`Nesting: ${n.nesting} | Painel: ${n.painel}`));
}

findProcessingNestings();
