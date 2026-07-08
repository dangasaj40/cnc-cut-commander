const { createClient } = require("@supabase/supabase-js");

async function diagnoseImportedEmissoes() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: em } = await supabase.from("emissoes")
    .select("*")
    .eq("status_processo", "Em processamento")
    .limit(3);

  console.log("=== DIAGNÓSTICO DE EMISSÕES IMPORTADAS ===");
  if (!em || em.length === 0) {
    console.log("Nenhuma emissão em processamento encontrada.");
    return;
  }

  em.forEach((e, i) => {
    console.log(`\nExemplo ${i+1}:`);
    console.log(`- ID_EMISSAO: ${e.id_emissao}`);
    console.log(`- NESTING: ${e.nesting}`);
    console.log(`- PECAS: ${e.pecas}`);
    console.log(`- PAINEL: ${e.painel}`);
    console.log(`- BLOCO: ${e.bloco}`);
  });
}

diagnoseImportedEmissoes();
