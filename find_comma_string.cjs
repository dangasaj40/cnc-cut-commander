const { createClient } = require("@supabase/supabase-js");

async function findCommaString() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: rows } = await supabase
    .from("controle_nestings")
    .select("nesting, peca")
    .ilike("peca", "%RD-H15%");
    
  console.log("=== NA TABELA CONTROLE_NESTINGS ===");
  rows.forEach(r => console.log(`Nesting: ${r.nesting} | Peça: ${r.peca}`));

  const { data: logs } = await supabase
    .from("emissoes")
    .select("nesting, pecas")
    .ilike("pecas", "%RD-H15%");
    
  console.log("\n=== NA TABELA EMISSOES ===");
  logs?.forEach(r => console.log(`Nesting: ${r.nesting} | Peças: ${r.pecas}`));
}

findCommaString();
