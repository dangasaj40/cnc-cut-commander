const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function diagnose() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm");

  // 1. Valores esperados pela planilha (CAD_BALSA)
  const cadData = XLSX.utils.sheet_to_json(wb.Sheets['CAD_BALSA'], { header: 1 });
  const headerRow = cadData.findIndex(r => r.includes('ID_BALSA'));
  console.log("=== VALORES ESPERADOS (CAD_BALSA) ===");
  cadData.slice(headerRow + 1).forEach(row => {
    if (row[0]) console.log(`${row[0]}: total=${Math.round(row[4])} emitidos=${Math.round(row[5])} finalizados=${Math.round(row[6])} pendentes=${Math.round(row[7])}`);
  });

  // 2. Nestings nos logs por balsa (formato real)
  const logData = XLSX.utils.sheet_to_json(wb.Sheets['LOG_RETORNO'], { header: 1 }).slice(1);
  const logNestings = {};
  logData.forEach(row => {
    if (!row[2]) return;
    if (!logNestings[row[2]]) logNestings[row[2]] = new Set();
    logNestings[row[2]].add(String(row[9])); // nesting
  });

  // 3. Nestings no controle_nestings por balsa (formato no banco)
  const { data: ctrl } = await supabase.from("controle_nestings").select("id_balsa, nesting, status_processo");
  const ctrlNestings = {};
  ctrl?.forEach(r => {
    if (!ctrlNestings[r.id_balsa]) ctrlNestings[r.id_balsa] = new Set();
    ctrlNestings[r.id_balsa].add(r.nesting);
  });

  console.log("\n=== NESTINGS NOS LOGS (planilha) vs CONTROLE (banco) ===");
  for (const balsa of Object.keys(logNestings)) {
    const logSet = logNestings[balsa];
    const ctrlSet = ctrlNestings[balsa] || new Set();
    
    // Nestings que estão no log mas NÃO estão no controle
    const missing = [...logSet].filter(n => !ctrlSet.has(n));
    
    console.log(`\n${balsa}:`);
    console.log(`  Logs (planilha): ${logSet.size} nestings únicos`);
    console.log(`  Controle (banco): ${ctrlSet.size} nestings únicos`);
    console.log(`  Faltando no banco: ${missing.length} → Exemplos: ${missing.slice(0,5).join(', ')}`);
    
    // Amostras para comparar o formato
    const logSample = [...logSet].slice(0, 3);
    const ctrlSample = [...ctrlSet].slice(0, 3);
    console.log(`  Formato Log: ${JSON.stringify(logSample)}`);
    console.log(`  Formato Ctrl: ${JSON.stringify(ctrlSample)}`);
  }
}

diagnose();
