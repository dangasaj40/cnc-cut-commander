const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function deepVerify() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  // 1. Ler a nova planilha
  const wb = XLSX.readFile("c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\BASE_BOX_RAKE_G5.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const headerRow = data.findIndex(r => Array.isArray(r) && r.some(c => c && String(c).toUpperCase().includes('PECA')));
  const headers = data[headerRow];
  const pecaIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('PECA'));
  const nestingIdx = headers.findIndex(h => h && String(h).toUpperCase().includes('NESTING'));

  const novaPlanilhaPecas = new Map(); // Nome -> Original
  data.slice(headerRow + 1).forEach(row => {
    const val = row[pecaIdx];
    if (val) {
      const clean = String(val).trim();
      novaPlanilhaPecas.set(clean.toUpperCase(), clean);
    }
  });

  // 2. Buscar peças do banco
  const { data: dbRows } = await supabase.from("controle_nestings").select("peca, nesting");
  const bancoPecas = new Map();
  dbRows?.forEach(r => {
    if (r.peca) {
      const clean = String(r.peca).trim();
      bancoPecas.set(clean.toUpperCase(), clean);
    }
  });

  console.log(`=== ESTATÍSTICAS DE COMPARAÇÃO ===`);
  console.log(`Peças na Planilha: ${novaPlanilhaPecas.size}`);
  console.log(`Peças no Banco: ${bancoPecas.size}`);

  // 3. O que tem no BANCO mas NÃO tem na PLANILHA? (O erro)
  const faltantesNaPlanilha = [];
  for (const [key, original] of bancoPecas) {
    if (!novaPlanilhaPecas.has(key)) {
      faltantesNaPlanilha.push(original);
    }
  }

  // 4. O que tem na PLANILHA mas NÃO tem no BANCO? (As novas)
  const novasNaPlanilha = [];
  for (const [key, original] of novaPlanilhaPecas) {
    if (!bancoPecas.has(key)) {
      novasNaPlanilha.push(original);
    }
  }

  console.log(`\n1. Peças do BANCO que estão FALTANDO na nova PLANILHA: ${faltantesNaPlanilha.length}`);
  if (faltantesNaPlanilha.length > 0) {
    faltantesNaPlanilha.slice(0, 10).forEach(p => console.log(`   - [!] ${p}`));
  } else {
    console.log(`   ✅ Sucesso: Todas as peças do banco foram encontradas na planilha.`);
  }

  console.log(`\n2. Peças NOVAS na PLANILHA (não estão no banco ainda): ${novasNaPlanilha.length}`);
  console.log(`   Amostra de peças novas:`);
  novasNaPlanilha.slice(0, 5).forEach(p => console.log(`   + ${p}`));

  console.log(`\n=== AMOSTRA DE COMPARAÇÃO DIRETA ===`);
  const sampleDB = [...bancoPecas.values()].slice(0, 3);
  const sampleXL = [...novaPlanilhaPecas.values()].slice(0, 3);
  console.log(`Exemplo Banco:`, JSON.stringify(sampleDB));
  console.log(`Exemplo Planilha:`, JSON.stringify(sampleXL));
}

deepVerify();
