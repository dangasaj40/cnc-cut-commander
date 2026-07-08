const XLSX = require('xlsx');
const { createClient } = require("@supabase/supabase-js");

async function syncAll() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  try {
    const filePath = "c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm";
    const workbook = XLSX.readFile(filePath);
    
    const logSheet = workbook.Sheets['LOG_RETORNO'];
    if (!logSheet) return;
    const logData = XLSX.utils.sheet_to_json(logSheet, { header: 1, defval: null }).slice(1);
    
    const balsaMap = new Map();
    logData.forEach(row => {
      if (row[2]) {
        balsaMap.set(row[2], {
          id_balsa: String(row[2]),
          tipo_balsa: String(row[3] || "RAKE"),
          nome_balsa: String(row[4] || row[2]),
          data_cadastro: new Date().toISOString()
        });
      }
    });

    console.log(`Balsas: ${balsaMap.size}`);
    for (const balsa of balsaMap.values()) {
      await supabase.from("balsas").upsert(balsa, { onConflict: 'id_balsa' });
    }

    const formatTime = (excelTime) => {
      if (typeof excelTime !== 'number') return "00:00";
      const totalSeconds = Math.round(excelTime * 86400);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const logsToInsert = logData.map(row => {
      if (!row[0]) return null;

      let dateISO = new Date().toISOString();
      if (typeof row[1] === 'number') {
         const d = new Date((row[1] - (25567 + 1)) * 86400 * 1000);
         if (!isNaN(d.getTime())) dateISO = d.toISOString();
      }
      
      return {
        data_registro: dateISO,
        id_balsa: String(row[2]),
        tipo_balsa: String(row[3] || ""),
        nome_balsa: String(row[4] || ""),
        maquina: String(row[5] || ""),
        turno: String(row[6] || ""),
        bloco: String(row[7] || ""),
        painel: String(row[8] || ""),
        nesting: String(row[9] || ""),
        pecas_agrupadas: String(row[10] || ""),
        hora_inicio: formatTime(row[11]),
        hora_fim: formatTime(row[12]),
        houve_parada: row[13] ? "Sim" : "Não",
        motivo_parada: String(row[14] || ""),
        status_final: "Finalizado",
        operador: String(row[17] || "N/A"),
        carreira_chapa: String(row[18] || "")
      };
    }).filter(Boolean);

    console.log(`Logs: ${logsToInsert.length}`);
    const batchSize = 100;
    for (let i = 0; i < logsToInsert.length; i += batchSize) {
      await supabase.from("log_retorno").insert(logsToInsert.slice(i, i + batchSize));
    }

    console.log("Sucesso!");

  } catch (e) {
    console.error(e);
  }
}

syncAll();
