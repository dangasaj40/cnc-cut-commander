const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function syncPesoFromBase() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");

  // Ler BASE_DADOS (cabeçalho na linha 4, dados a partir da linha 5)
  const bdData = XLSX.utils.sheet_to_json(wb.Sheets['BASE_DADOS'], { header: 1, defval: null }).slice(4);

  // Criar mapa: nesting -> soma do PESO_TOTAL_KG (Col 7)
  const pesoMap = {};
  bdData.forEach(row => {
    const nesting = String(row[10] || ""); // NESTING = Col 10
    const pesoTotal = Number(row[7]) || 0; // PESO_TOTAL_KG = Col 7
    if (nesting && nesting !== "null") {
      pesoMap[nesting] = (pesoMap[nesting] || 0) + pesoTotal;
    }
  });

  console.log(`Mapa de pesos: ${Object.keys(pesoMap).length} nestings únicos`);
  console.log(`Exemplo: nesting 4465 = ${pesoMap["4465"]} kg`);

  // Buscar todos os nestings do banco
  const { data: nestings } = await supabase.from("controle_nestings").select("id_itemctrl, nesting, peso_total");
  
  let updated = 0;
  const batchSize = 50;
  const updates = nestings.filter(n => pesoMap[n.nesting] !== undefined);
  
  console.log(`Atualizando ${updates.length} registros com peso real...`);

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    for (const n of batch) {
      await supabase.from("controle_nestings")
        .update({ peso_total: pesoMap[n.nesting] })
        .eq("id_itemctrl", n.id_itemctrl);
      updated++;
    }
    process.stdout.write(`\r✓ ${updated}/${updates.length}`);
  }

  console.log(`\nPesos atualizados! Agora o Dashboard vai mostrar o peso correto por painel.`);
}

syncPesoFromBase();
