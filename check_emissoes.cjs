const { createClient } = require("@supabase/supabase-js");

async function checkEmissoes() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: em } = await supabase.from("emissoes").select("status_processo");
  console.log(`Total de registros em emissoes: ${em?.length || 0}`);
  
  if (em && em.length > 0) {
    const processando = em.filter(e => e.status_processo === "Em processamento").length;
    console.log(`Registros Em processamento: ${processando}`);
  }
}

checkEmissoes();
