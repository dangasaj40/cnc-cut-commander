const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = "https://avdelysnzatbdmvaemyb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk3NTY1NCwiZXhwIjoyMDkyNTUxNjU0fQ.AsoWcjD0WzZiEgPaKQtgVzdpN7K5oPB7ZA4P6YUWdAY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importData() {
  const filePath = path.join(__dirname, 'BASE_BOX_RAKE_G5.xlsx');
  const workbook = XLSX.readFile(filePath);
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  console.log(`Lendo ${data.length} linhas do Excel...`);

  // Limpar catálogo atual antes de importar
  console.log('Limpando catálogo existente...');
  const { error: deleteError } = await supabase.from('catalogo_pecas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Erro ao limpar catálogo:', deleteError);
    return;
  }

  // Transformar dados sem agrupar
  const records = data.map(row => ({
    tipo_balsa: row['TIPO_BALSA'] || null,
    quantidade_base: parseInt(row['QTD']) || null,
    peca: String(row['PECA']),
    dimensional: row['DIMENSIONAL'] || null,
    espessura_mm: String(row['ESPESSURA_MM'] || ''),
    peso_kg: parseFloat(row['PESO_TOTAL_KG']) || null, // Usamos o peso total da linha
    bloco: row['BLOCO'] || null,
    painel: row['PAINEL'] || null,
    nesting: String(row['NESTING'] || 'S/N')
  }));

  console.log(`Preparando para importar ${records.length} peças individuais.`);

  // Inserir em lotes de 200
  for (let i = 0; i < records.length; i += 200) {
    const batch = records.slice(i, i + 200);
    const { error } = await supabase.from('catalogo_pecas').insert(batch);
    if (error) {
      console.error('Erro ao inserir lote:', error);
      return;
    }
    console.log(`Inserido lote ${Math.floor(i / 200) + 1}...`);
  }

  console.log('Importação concluída com sucesso!');
}

importData();
