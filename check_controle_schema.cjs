const { createClient } = require("@supabase/supabase-js");

async function checkControleSchema() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: cols } = await supabase.rpc("get_columns", { table_name: "controle_nestings" });
  
  if (!cols) {
    // Se a RPC não existir, tentamos pegar um registro
    const { data } = await supabase.from("controle_nestings").select("*").limit(1);
    if (data && data[0]) {
       console.log("Colunas em controle_nestings:", Object.keys(data[0]).join(", "));
    }
  } else {
    console.log("Colunas encontradas:", cols.map(c => c.column_name).join(", "));
  }
}

checkControleSchema();
