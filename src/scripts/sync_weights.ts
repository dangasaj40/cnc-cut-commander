import { supabase } from "../integrations/supabase/client";

async function syncData() {
  console.log("Iniciando sincronização de pesos e tempos...");

  const { data: baseItems } = await supabase.from("base_dados").select("nesting, peso_total_kg, tempo_corte_total");
  
  if (!baseItems) {
    console.error("Não foi possível carregar a base_dados.");
    return;
  }

  const nestingMap: Record<string, { peso: number, tempo: number }> = {};
  baseItems.forEach(item => {
    if (!nestingMap[item.nesting]) {
      nestingMap[item.nesting] = { peso: 0, tempo: Number(item.tempo_corte_total || 0) };
    }
    nestingMap[item.nesting].peso += Number(item.peso_total_kg || 0);
  });

  console.log(`Mapeados ${Object.keys(nestingMap).length} nestings.`);

  const { data: controls } = await supabase.from("controle_nestings").select("id, nesting").is("peso_total", null);
  if (controls) {
    for (const ctrl of controls) {
      const data = nestingMap[ctrl.nesting];
      if (data) await supabase.from("controle_nestings").update({ peso_total: data.peso, tempo_corte_total: data.tempo }).eq("id", ctrl.id);
    }
  }

  const { data: logs } = await supabase.from("log_retorno").select("id, nesting").is("peso_total", null);
  if (logs) {
    for (const log of logs) {
      const data = nestingMap[log.nesting];
      if (data) await supabase.from("log_retorno").update({ peso_total: data.peso, tempo_corte_total: data.tempo }).eq("id", log.id);
    }
  }

  console.log("Sincronização concluída!");
}

syncData();
