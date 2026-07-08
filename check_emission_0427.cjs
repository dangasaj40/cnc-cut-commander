const { createClient } = require("@supabase/supabase-js");

async function checkEmission0427() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: em } = await supabase.from("emissoes")
    .select("id_emissao, status_processo")
    .eq("id_emissao", "0427-603-D-RAKE-14-0");

  console.log("=== CHECK EMISSAO 0427... ===");
  console.log(`Encontrados: ${em?.length || 0}`);
  em?.forEach(e => console.log(e));
}

checkEmission0427();
