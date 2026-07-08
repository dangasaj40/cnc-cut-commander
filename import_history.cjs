const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://avdelysnzatbdmvaemyb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
const supabase = createClient(supabaseUrl, supabaseKey);

async function importToHistory() {
  const filePath = path.join(__dirname, 'Planilha Controle de Corte v0.2.xlsm');
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'CONTROLE_NESTINGS';
  const worksheet = workbook.Sheets[sheetName];

  // Headers na linha 4 (index 3)
  const data = XLSX.utils.sheet_to_json(worksheet, { range: 3 });
  
  console.log(`Analisando ${data.length} linhas da balsa...`);

  // Agrupar peças por ID_EMISSAO + NESTING para criar um registro único por nesting no histórico
  const historyMap = {};

  data.forEach(row => {
    // Só importa se tiver operador (indica que foi produzido)
    if (!row['OPERADOR']) return;

    const key = `${row['ID_EMISSAO']}|${row['NESTING']}`;
    
    if (!historyMap[key]) {
      historyMap[key] = {
        id_emissao: row['ID_EMISSAO'] || `HIST-${row['DATA_FINALIZACAO'] || 'SEM-DATA'}`,
        id_balsa: row['ID_BALSA'],
        tipo_balsa: row['TIPO_BALSA'],
        nome_balsa: row['NOME_BALSA'],
        maquina: row['MAQUINA'],
        turno: row['TURNO'],
        bloco: row['BLOCO'],
        painel: row['PAINEL'],
        nesting: row['NESTING'],
        pecas_agrupadas: [],
        peso_total: 0,
        hora_inicio: row['HORA_INICIO'],
        hora_fim: row['HORA_FIM'],
        operador: row['OPERADOR'],
        carreira_chapa: row['CARREIRA_CHAPA'],
        status_final: 'Finalizado',
        data_registro: row['DATA_FINALIZACAO'] ? new Date((row['DATA_FINALIZACAO'] - 25569) * 86400 * 1000).toISOString() : new Date().toISOString()
      };
    }

    // Adicionar peça à lista
    if (row['PECA']) {
      historyMap[key].pecas_agrupadas.push(row['PECA']);
    }
    
    // Somar peso (se houver na planilha ou BASE_DADOS, aqui usaremos o que tiver no mapeamento anterior ou 0)
    // Nota: Como o peso vem da BASE_DADOS, vamos deixar para o Ranking calcular, mas aqui guardamos se houver
    historyMap[key].peso_total += Number(row['PESO_TOTAL'] || 0);
  });

  const logsToInsert = Object.values(historyMap).map(log => ({
    ...log,
    pecas_agrupadas: log.pecas_agrupadas.join(", ")
  }));

  console.log(`Preparando para inserir ${logsToInsert.length} registros no Histórico de Produção.`);

  // Limpar histórico antigo de teste se desejar (opcional, aqui apenas inserimos)
  for (let i = 0; i < logsToInsert.length; i += 100) {
    const chunk = logsToInsert.slice(i, i + 100);
    const { error } = await supabase.from('log_retorno').insert(chunk);
    if (error) console.error("\nErro no chunk:", error.message);
    else process.stdout.write(".");
  }

  console.log("\nImportação para o Histórico concluída!");
}

importToHistory();
