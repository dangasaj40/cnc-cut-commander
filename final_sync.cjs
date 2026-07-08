const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalDeepSync() {
  const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
  const workbook = XLSX.readFile(filePath);
  
  // 1. Pegar pesos da BASE_DADOS
  const baseData = XLSX.utils.sheet_to_json(workbook.Sheets['BASE_DADOS'], { range: 3 });
  const weightMap = {};
  baseData.forEach(r => {
    const key = `${r['NESTING']}|${r['PECA']}|${r['BLOCO']}|${r['PAINEL']}`;
    weightMap[key] = r['PESO_KG'] || 0;
  });

  // 2. Pegar dados do CONTROLE_NESTINGS
  const controlData = XLSX.utils.sheet_to_json(workbook.Sheets['CONTROLE_NESTINGS'], { range: 3 });
  
  const updates = controlData.map(row => {
    const key = `${row['NESTING']}|${row['PECA']}|${row['BLOCO']}|${row['PAINEL']}`;
    return {
      id_itemctrl: row['ID_ITEMCTRL'],
      nesting: row['NESTING'],
      peca: row['PECA'], // Agora incluído!
      bloco: row['BLOCO'],
      painel: row['PAINEL'],
      operador: row['OPERADOR'] || null,
      status_processo: row['OPERADOR'] ? 'Finalizado' : (row['STATUS_PROCESSO'] || 'Disponivel'),
      peso_total: weightMap[key] || 0 // Peso direto da balsa de dados
    };
  }).filter(u => u.id_itemctrl);

  console.log(`Sincronizando ${updates.length} registros com peças e pesos...`);

  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    const { error } = await supabase.from('controle_nestings').upsert(chunk, { onConflict: 'id_itemctrl' });
    if (error) console.error("\nErro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nRanking atualizado com sucesso!");
}

finalDeepSync();
