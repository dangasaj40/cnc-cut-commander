const { createClient } = require("@supabase/supabase-js");

async function checkEmissoesSchema() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from("emissoes").select("*").limit(1);
  
  if (error) {
    console.error("Erro ao ler emissoes:", error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log("Colunas encontradas em emissoes:", Object.keys(data[0]).join(", "));
  } else {
    // Se estiver vazio, tentar pegar via RPC ou apenas relatar que não há dados para inferir
    console.log("Tabela emissoes está vazia. Não é possível inferir colunas via select.");
  }
}

checkEmissoesSchema();
