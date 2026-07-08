import { createClient } from "@supabase/supabase-js";

async function populateParams() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_KEY!;
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

  console.log("Iniciando auto-preenchimento de parâmetros...");

  for (const [key, value] of Object.entries(params)) {
    const { error } = await supabase.from("system_settings").upsert({
      key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString()
    });
    
    if (error) console.error(`Erro ao salvar ${key}:`, error.message);
    else console.log(`✓ ${key} preenchido com ${value.length} itens.`);
  }

  console.log("Processo concluído!");
}

populateParams();
