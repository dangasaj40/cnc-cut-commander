const { createClient } = require("@supabase/supabase-js");

async function testFetchLikeFrontend() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const selectedEmission = "0416-603-D-BOX-15-001";
  
  console.log(`Buscando exatamente por: "${selectedEmission}"`);

  const { data, error } = await supabase
    .from("emissoes")
    .select("*")
    .eq("id_emissao", selectedEmission)
    .eq("status_processo", "Em processamento");

  if (error) {
    console.error("Erro na busca:", error.message);
    return;
  }

  console.log(`Resultados encontrados: ${data.length}`);
  if (data.length > 0) {
    console.log("Primeiro nesting encontrado:", data[0].nesting);
    console.log("Status do registro:", data[0].status_processo);
  }
}

testFetchLikeFrontend();
