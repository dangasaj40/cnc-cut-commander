const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

function excelTimeToStr(excelTime) {
  if (excelTime === undefined || excelTime === null || excelTime === "") return "";
  const num = Number(excelTime);
  if (isNaN(num)) return excelTime;
  if (num === 0) return "00:00";
  const totalSeconds = Math.round(num * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const displayHours = hours % 24;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

async function reimportGroupedHistory() {
  const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
  const workbook = XLSX.readFile(filePath);
  
  // 1. Mapear pesos da BASE_DADOS para somar depois
  const baseSheet = workbook.Sheets['BASE_DADOS'];
  const baseData = XLSX.utils.sheet_to_json(baseSheet, { range: 3 });
  const weightMap = {}; // Chave: PECA (usando o nome da peça como chave primária de busca)
  
  baseData.forEach(row => {
    const peca = String(row['PECA'] || "").trim().toUpperCase();
    if (peca) weightMap[peca] = row['PESO_KG'] || 0;
  });

  const sheetName = 'CONTROLE_NESTINGS';
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { range: 3 });
  
  console.log(`Lendo ${data.length} linhas para importação AGRUPADA (Estilo Excel)...`);

  const logsToInsert = [];
  data.filter(row => row['OPERADOR']).forEach(row => {
    const rawPeca = String(row['PECA'] || "");
    const pecasList = rawPeca.split(',').map(p => p.trim()).filter(p => p);
    
    // Somar o peso de todas as peças deste nesting
    let nestingWeight = 0;
    pecasList.forEach(p => {
      const pName = p.toUpperCase();
      nestingWeight += (weightMap[pName] || 0);
    });

    logsToInsert.push({
      id_emissao: row['ID_EMISSAO'] ? String(row['ID_EMISSAO']) : `HIST-${row['ID_ITEMCTRL']}`,
      id_balsa: row['ID_BALSA'],
      tipo_balsa: row['TIPO_BALSA'],
      nome_balsa: row['NOME_BALSA'],
      maquina: row['MAQUINA'],
      turno: row['TURNO'],
      bloco: row['BLOCO'],
      painel: row['PAINEL'],
      nesting: row['NESTING'],
      pecas_agrupadas: rawPeca, // MANTÉM AGRUPADO (Igual à planilha)
      peso_total: Number(nestingWeight.toFixed(2)),
      hora_inicio: excelTimeToStr(row['HORA_INICIO']),
      hora_fim: excelTimeToStr(row['HORA_FIM']),
      operador: row['OPERADOR'],
      carreira_chapa: row['CARREIRA_CHAPA'],
      status_final: 'Finalizado',
      data_registro: row['DATA_FINALIZACAO'] ? new Date((row['DATA_FINALIZACAO'] - 25569) * 86400 * 1000).toISOString() : new Date().toISOString()
    });
  });

  console.log(`Limpando histórico e inserindo ${logsToInsert.length} registros agrupados.`);

  const { error: delError } = await supabase.from('log_retorno').delete().neq('id_emissao', 'apagar_tudo_mesmo');
  if (delError) console.error("Erro ao limpar:", delError.message);

  for (let i = 0; i < logsToInsert.length; i += 100) {
    const chunk = logsToInsert.slice(i, i + 100);
    const { error } = await supabase.from('log_retorno').insert(chunk);
    if (error) console.error("\nErro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nRe-importação agrupada concluída!");
}

reimportGroupedHistory();
