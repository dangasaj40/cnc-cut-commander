const { createClient } = require("@supabase/supabase-js");

async function populateParams() {
  const url = "https://avdelysnzatbdmvaemyb.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGVseXNuemF0YmRtdmFlbXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzU2NTQsImV4cCI6MjA5MjU1MTY1NH0.zjsszolVokd89yWAQ3QqC3DzOI1kEZvM74HZx-eV2XA";
  const supabase = createClient(url, key);

  const params = {
    maquinas: ["CNC 01", "CNC 02", "CNC 03", "CNC 04"],
    turnos: ["1º TURNO", "2º TURNO", "3º TURNO"],
    operadores: [
      "ALBERIS", "ALCIR", "ANDRE", "ANTONIO", "CARLOS", "CLEBIO", "DANILO", 
      "EDNALDO", "EDSON", "ELINALDO", "ERIVALDO", "EVANDRO", "EXPEDITO", 
      "FERNANDO", "GENIVALDO", "GILVAN", "HEVERTON", "JAIRO", "JOAO PAULO", 
      "JOSE", "JULIO", "LEANDRO", "LUCAS", "LUCIANO", "LUIZ", "MANOEL", 
      "MARCIO", "MARCOS", "MAURICIO", "PAULO", "RAFAEL", "REGINALDO", 
      "RICARDO", "ROBERTO", "RODRIGO", "ROGERIO", "RONALDO", "SAMUEL", 
      "SERGIO", "THIAGO", "VALDEMIR", "WAGNER", "WASHINGTON", "WESLEY", 
      "WILLAMS", "WILSON"
    ],
    motivos_parada: [
      "AGUARDANDO MATERIAL", "AGUARDANDO PROGRAMAÇÃO", "ALIMENTAÇÃO", 
      "AJUSTE DE MÁQUINA", "LIMPEZA", "MANUTENÇÃO CORRETIVA", 
      "MANUTENÇÃO PREVENTIVA", "OUTROS", "PALESTRA/REUNIÃO", 
      "REPARO DE PEÇA", "SEM OPERADOR", "TROCA DE FERRAMENTA"
    ],
    tipos_balsa: ["RAKE", "BALSA", "PLANO"]
  };

  console.log("Iniciando auto-preenchimento...");

  for (const [key, value] of Object.entries(params)) {
    const { error } = await supabase.from("system_settings").upsert({
      key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString()
    });
    
    if (error) console.error(`Erro ao salvar ${key}:`, error.message);
    else console.log(`✓ ${key} preenchido.`);
  }

  console.log("Pronto! Verifique seu app.");
}

populateParams();
