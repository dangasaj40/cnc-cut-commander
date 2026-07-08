const { createClient } = require("@supabase/supabase-js");

async function checkNestingRows() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const { data: rows } = await supabase
    .from("controle_nestings")
    .select("*")
    .eq("nesting", "3123");
    
  console.log(`Linhas para o nesting 3123 no banco: ${rows.length}`);
  rows.forEach(r => console.log(`- ID: ${r.id_itemctrl} | Peça: ${r.peca} | Peso_Total: ${r.peso_total}`));
}

checkNestingRows();
