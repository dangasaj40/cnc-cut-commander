const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function importMasterWeights() {
  const filePath = path.join(__dirname, 'BASE_BOX_RAKE_G5.xlsx');
  const workbook = XLSX.readFile(filePath);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  
  console.log(`Lendo ${data.length} registros do arquivo G5...`);

  const payload = data.map(row => ({
    nesting: String(row['NESTING'] || ""),
    peca: String(row['PECA'] || ""),
    peso_kg: parseFloat(row['PESO_KG']) || 0,
    espessura_mm: String(row['ESPESSURA_MM'] || ""),
    tipo_balsa: String(row['TIPO_BALSA'] || ""),
    bloco: String(row['BLOCO'] || ""),
    painel: String(row['PAINEL'] || ""),
    quantidade_base: parseInt(row['QTD']) || 1,
    dimensional: String(row['DIMENSIONAL'] || ""),
    data_importacao: new Date().toISOString(),
    versao: 1
  }));

  console.log(`Limpando catálogo antigo e inserindo ${payload.length} novos registros...`);

  // Limpar catálogo anterior para evitar duplicatas (opcional, conforme lógica do app)
  await supabase.from('catalogo_pecas').delete().neq('nesting', 'limpar_tudo');

  for (let i = 0; i < payload.length; i += 100) {
    const chunk = payload.slice(i, i + 100);
    const { error } = await supabase.from('catalogo_pecas').insert(chunk);
    if (error) console.error("\nErro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nCatálogo de Pesos Mestre importado com sucesso!");
}

importMasterWeights();
