const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncHistoryWeights() {
  console.log("Iniciando sincronização de pesos do Histórico via Catálogo...");

  // 1. Pegar todos os pesos mestre do catálogo
  const { data: masterWeights } = await supabase
    .from('catalogo_pecas')
    .select('peca, peso_kg');

  if (!masterWeights) {
    console.error("Não foi possível carregar o catálogo de peças.");
    return;
  }

  // Criar um mapa de consulta rápida: Peça -> Peso
  const weightMap = {};
  masterWeights.forEach(mw => {
    if (mw.peca) weightMap[mw.peca] = mw.peso_kg;
  });

  console.log(`Mapeadas ${Object.keys(weightMap).length} peças únicas no catálogo.`);

  // 2. Pegar os registros do histórico que estão com peso zerado ou nulo
  const { data: historyLogs } = await supabase
    .from('log_retorno')
    .select('id, pecas_agrupadas');

  if (!historyLogs) {
    console.error("Não foi possível carregar os logs do histórico.");
    return;
  }

  console.log(`Analisando ${historyLogs.length} registros no histórico para atualização.`);

  const updates = [];
  historyLogs.forEach(log => {
    // No histórico individual, o nome da peça está na coluna pecas_agrupadas
    const pecaName = log.pecas_agrupadas;
    if (weightMap[pecaName]) {
      updates.push({
        id: log.id,
        peso_total: weightMap[pecaName]
      });
    }
  });

  console.log(`Preparando para atualizar ${updates.length} pesos no histórico.`);

  // 3. Atualizar em massa
  for (let i = 0; i < updates.length; i += 100) {
    const chunk = updates.slice(i, i + 100);
    const { error } = await supabase.from('log_retorno').upsert(chunk);
    if (error) console.error("\nErro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nPesos do histórico sincronizados com sucesso!");
}

syncHistoryWeights();
