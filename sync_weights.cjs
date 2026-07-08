const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncWeights() {
  const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
  const workbook = XLSX.readFile(filePath);
  
  // 1. Criar um mapa de pesos da BASE_DADOS
  const baseSheet = workbook.Sheets['BASE_DADOS'];
  const baseData = XLSX.utils.sheet_to_json(baseSheet, { range: 3 });
  const weightMap = {}; // Chave: NESTING|PECA|BLOCO|PAINEL
  
  baseData.forEach(row => {
    const key = `${row['NESTING']}|${row['PECA']}|${row['BLOCO']}|${row['PAINEL']}`;
    weightMap[key] = row['PESO_KG'] || 0;
  });

  console.log(`Mapeados ${Object.keys(weightMap).length} pesos da BASE_DADOS.`);

  // 2. Pegar os itens do controle que estão sem peso
  const { data: controleItems } = await supabase
    .from('controle_nestings')
    .select('id_itemctrl, nesting, peca, bloco, painel')
    .or('peso_total.eq.0,peso_total.is.null');

  if (!controleItems) return;

  console.log(`Encontrados ${controleItems.length} registros no banco para atualizar o peso.`);

  const updates = [];
  controleItems.forEach(item => {
    const key = `${item.nesting}|${item.peca}|${item.bloco}|${item.painel}`;
    if (weightMap[key]) {
      updates.push({
        id_itemctrl: item.id_itemctrl,
        peso_total: weightMap[key]
      });
    }
  });

  console.log(`Iniciando atualização de ${updates.length} pesos...`);

  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    const { error } = await supabase.from('controle_nestings').upsert(chunk, { onConflict: 'id_itemctrl' });
    if (error) console.error("Erro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nSincronização de pesos concluída!");
}

syncWeights();
