const { createClient } = require("@supabase/supabase-js");

async function checkExact() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: em } = await supabase.from("emissoes")
    .select("id_emissao")
    .eq("status_processo", "Em processamento")
    .ilike("id_emissao", "%RAKE-14%");

  const ids = Array.from(new Set(em?.map(e => e.id_emissao) || []));
  console.log("=== IDS UNICOS RAKE-14 EM PROCESSAMENTO ===");
  ids.forEach(i => console.log(i));
}

checkExact();
