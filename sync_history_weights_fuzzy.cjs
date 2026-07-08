const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncWeightsFuzzy() {
  console.log("Iniciando sincronização inteligente de pesos...");

  // 1. Ler o arquivo G5 (nossa fonte de verdade)
  const filePath = path.join(__dirname, 'BASE_BOX_RAKE_G5.xlsx');
  const workbook = XLSX.readFile(filePath);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  
  const weightMap = {};
  data.forEach(row => {
    if (row['PECA']) {
      // Normalizar o nome da peça (remover espaços e colocar em maiúsculo)
      const name = String(row['PECA']).trim().toUpperCase();
      weightMap[name] = parseFloat(row['PESO_KG']) || 0;
    }
  });

  console.log(`Mapeados ${Object.keys(weightMap).length} pesos únicos.`);

  // 2. Pegar os logs com peso 0
  const { data: historyLogs } = await supabase
    .from('log_retorno')
    .select('id, pecas_agrupadas')
    .or('peso_total.eq.0,peso_total.is.null');

  if (!historyLogs || historyLogs.length === 0) {
    console.log("Não há registros zerados para atualizar.");
    return;
  }

  console.log(`Tentando recuperar pesos para ${historyLogs.length} registros...`);

  const updates = [];
  historyLogs.forEach(log => {
    const rawName = String(log.pecas_agrupadas || "");
    const normalizedName = rawName.trim().toUpperCase();
    
    if (weightMap[normalizedName]) {
      updates.push({
        id: log.id,
        peso_total: weightMap[normalizedName]
      });
    }
  });

  console.log(`Encontrados pesos para ${updates.length} registros.`);

  if (updates.length > 0) {
    for (let i = 0; i < updates.length; i += 100) {
      const chunk = updates.slice(i, i + 100);
      const { error } = await supabase.from('log_retorno').upsert(chunk);
      if (error) console.error("\nErro no envio:", error.message);
      else process.stdout.write(".");
    }
    console.log("\nAtualização concluída!");
  } else {
    console.log("Nenhum peso correspondente encontrado no arquivo G5.");
  }
}

syncWeightsFuzzy();
