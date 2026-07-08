const { createClient } = require("@supabase/supabase-js");

async function checkLogData() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from("log_retorno").select("*").limit(5);
  if (data) {
    console.log("EXEMPLO DE LOG NO BANCO:");
    console.log(JSON.stringify(data[0], null, 2));
    
    const totalPeso = data.reduce((acc, l) => acc + (Number(l.peso_total) || 0), 0);
    const totalPecas = data.reduce((acc, l) => acc + (parseInt(l.pecas_agrupadas) || 0), 0);
    
    console.log(`Teste de Soma (5 logs): Peso=${totalPeso}, Peças=${totalPecas}`);
  }
}

checkLogData();
