const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncOperators() {
  const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'CONTROLE_NESTINGS';
  const worksheet = workbook.Sheets[sheetName];

  // Ler a partir da linha 4 (index 3 são os headers)
  const data = XLSX.utils.sheet_to_json(worksheet, { range: 3 });
  
  console.log(`Encontradas ${data.length} linhas na planilha.`);

  const updates = data.filter(row => row['OPERADOR']).map(row => ({
    id_itemctrl: row['ID_ITEMCTRL'],
    operador: row['OPERADOR'],
    status_processo: row['STATUS_PROCESSO'] || 'Disponivel'
  }));

  console.log(`Encontrados ${updates.length} registros com operador para atualizar.`);

  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    const { error } = await supabase.from('controle_nestings').upsert(chunk, { onConflict: 'id_itemctrl' });
    if (error) console.error("Erro no chunk:", error.message);
    else console.log(`Chunk ${i/50 + 1} enviado.`);
  }

  console.log("Sincronização concluída!");
}

syncOperators();
