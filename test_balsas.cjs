const { createClient } = require("@supabase/supabase-js");

async function checkBalsas() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from("balsas").select("id_balsa");
  if (error) console.error("Erro ao ler balsas:", error.message);
  else console.log("Balsas no banco:", data.map(b => b.id_balsa));

  // Tentar criar uma balsa de teste
  const { error: insError } = await supabase.from("balsas").upsert({
    id_balsa: "TESTE-RLS",
    tipo_balsa: "RAKE",
    nome_balsa: "TESTE"
  });
  
  if (insError) console.error("ERRO DE PERMISSÃO (RLS):", insError.message);
  else console.log("Permissão OK! Consegui criar balsa de teste.");
}

checkBalsas();
