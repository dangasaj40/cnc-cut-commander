const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncWeightsFromFile() {
  console.log("Iniciando sincronização de pesos do Histórico via Arquivo G5...");

  // 1. Ler o arquivo G5 para criar o mapa de pesos
  const filePath = path.join(__dirname, 'BASE_BOX_RAKE_G5.xlsx');
  const workbook = XLSX.readFile(filePath);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  
  const weightMap = {};
  data.forEach(row => {
    if (row['PECA']) {
      weightMap[String(row['PECA']).trim()] = parseFloat(row['PESO_KG']) || 0;
    }
  });

  console.log(`Mapeados ${Object.keys(weightMap).length} pesos do arquivo G5.`);

  // 2. Pegar os registros do histórico
  const { data: historyLogs } = await supabase
    .from('log_retorno')
    .select('id, pecas_agrupadas');

  if (!historyLogs) {
    console.error("Não foi possível carregar os logs do histórico.");
    return;
  }

  const updates = [];
  historyLogs.forEach(log => {
    const pecaName = String(log.pecas_agrupadas || "").trim();
    if (weightMap[pecaName]) {
      updates.push({
        id: log.id,
        peso_total: weightMap[pecaName]
      });
    }
  });

  console.log(`Atualizando ${updates.length} registros com pesos reais...`);

  // 3. Atualizar em massa
  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    const { error } = await supabase.from('log_retorno').upsert(chunk);
    if (error) console.error("\nErro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nPesos do histórico sincronizados com sucesso via arquivo G5!");
}

syncWeightsFromFile();
