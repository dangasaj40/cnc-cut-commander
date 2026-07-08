const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function explodeAndFixWeights() {
  console.log("Iniciando 'Explosão' de registros agrupados e correção de pesos...");

  // 1. Mapa de Pesos (do arquivo G5)
  const workbook = XLSX.readFile(path.join(__dirname, 'BASE_BOX_RAKE_G5.xlsx'));
  const masterData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  const weightMap = {};
  masterData.forEach(row => {
    if (row['PECA']) weightMap[String(row['PECA']).trim().toUpperCase()] = parseFloat(row['PESO_KG']) || 0;
  });

  // 2. Pegar logs que contêm vírgulas nas peças (agrupados)
  const { data: groupedLogs } = await supabase
    .from('log_retorno')
    .select('*')
    .like('pecas_agrupadas', '%,%');

  if (!groupedLogs || groupedLogs.length === 0) {
    console.log("Nenhum registro agrupado encontrado para explodir.");
    return;
  }

  console.log(`Encontrados ${groupedLogs.length} registros agrupados (ex: Nesting 4826).`);

  const newLogs = [];
  const idsToDelete = [];

  groupedLogs.forEach(log => {
    idsToDelete.push(log.id);
    const pecas = log.pecas_agrupadas.split(',').map(p => p.trim()).filter(p => p);
    
    pecas.forEach((pecaName, index) => {
      const normalizedName = pecaName.toUpperCase();
      const peso = weightMap[normalizedName] || 0;
      
      const { id, ...logWithoutId } = log;
      newLogs.push({
        ...logWithoutId,
        id_emissao: `${log.id_emissao}-${index}`, // Diferenciar IDs de emissão
        pecas_agrupadas: pecaName,
        peso_total: peso
      });
    });
  });

  console.log(`Explodindo ${groupedLogs.length} registros em ${newLogs.length} registros individuais...`);

  // 3. Deletar os agrupados
  await supabase.from('log_retorno').delete().in('id', idsToDelete);

  // 4. Inserir os individuais
  for (let i = 0; i < newLogs.length; i += 100) {
    const chunk = newLogs.slice(i, i + 100);
    const { error } = await supabase.from('log_retorno').insert(chunk);
    if (error) console.error("\nErro ao inserir individual:", error.message);
    else process.stdout.write(".");
  }

  console.log("\n'Explosão' concluída! Nesting 4826 e outros agora estão individualizados e pesados.");
}

explodeAndFixWeights();
