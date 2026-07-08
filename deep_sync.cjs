const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepSync() {
  const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'CONTROLE_NESTINGS';
  const worksheet = workbook.Sheets[sheetName];

  // Headers estão na linha 4 (index 3)
  const data = XLSX.utils.sheet_to_json(worksheet, { range: 3 });
  
  console.log(`Analisando ${data.length} linhas da planilha...`);

  const updates = data.map(row => ({
    id_itemctrl: row['ID_ITEMCTRL'],
    nesting: row['NESTING'],
    bloco: row['BLOCO'],
    painel: row['PAINEL'],
    operador: row['OPERADOR'] || null,
    status_processo: row['OPERADOR'] ? 'Finalizado' : (row['STATUS_PROCESSO'] || 'Disponivel'),
    peso_total: row['PESO_TOTAL'] || 0
  })).filter(u => u.id_itemctrl);

  console.log(`Preparando atualização de ${updates.length} registros.`);

  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    const { error } = await supabase.from('controle_nestings').upsert(chunk, { onConflict: 'id_itemctrl' });
    if (error) console.error("Erro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nSincronização profunda concluída com sucesso!");
}

deepSync();
