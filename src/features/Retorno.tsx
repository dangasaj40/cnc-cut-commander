import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { 
  CheckCircle2, 
  Search, 
  User, 
  Clock, 
  AlertCircle,
  Hash,
  Activity,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PendingNesting {
  nesting: string;
  pecas: string;
  id_balsa: string;
  tipo_balsa: string;
  nome_balsa: string;
  maquina: string;
  turno: string;
  bloco: string;
  painel: string;
  peso_total: number;
  // Campos locais para cada card
  horaInicio: string;
  horaFim: string;
  houveParada: string;
  motivoParada: string;
  obs: string;
}

export default function RetornoPage() {
  const [balsas, setBalsas] = useState<any[]>([]);
  const [selectedBalsa, setSelectedBalsa] = useState("");
  const [allPendingEmissions, setAllPendingEmissions] = useState<any[]>([]);
  const [pendingEmissions, setPendingEmissions] = useState<string[]>([]);
  const [selectedEmission, setSelectedEmission] = useState("");
  const [emissionInfo, setEmissionInfo] = useState<any>(null);
  
  const [nestings, setNestings] = useState<PendingNesting[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [motivosParada, setMotivosParada] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [balsaStats, setBalsaStats] = useState({ total: 0, concluidos: 0, pendentes: 0 });

  // Form states globais para o operador
  const [form, setForm] = useState({
    operador: "",
    carreiraChapa: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedEmission) {
      fetchEmissionData();
    } else {
      setNestings([]);
      setEmissionInfo(null);
    }
  }, [selectedEmission]);

  const fetchInitialData = async () => {
    // 1. Buscar todas as emissões pendentes com suas balsas
    const { data: emData } = await supabase
      .from("emissoes")
      .select("id_emissao, id_balsa")
      .eq("status_processo", "Em processamento");
    
    if (emData) {
      setAllPendingEmissions(emData);
      const uniqueBalsas = Array.from(new Set(emData.map(e => e.id_balsa)));
      setBalsas(uniqueBalsas);
    }

    // 2. Buscar configurações de sistema
    const { data: sData } = await supabase.from("system_settings").select("key, value");
    if (sData) {
      sData.forEach(item => {
        if (item.key === "operadores") setOperadores(JSON.parse(item.value));
        if (item.key === "motivos_parada") setMotivosParada(JSON.parse(item.value));
      });
    }
  };

  // Efeito para filtrar emissões quando a balsa mudar
  useEffect(() => {
    if (selectedBalsa) {
      const filtered = allPendingEmissions
        .filter(e => e.id_balsa === selectedBalsa)
        .map(e => e.id_emissao);
      setPendingEmissions(Array.from(new Set(filtered)));
      fetchBalsaStats(selectedBalsa);
    } else {
      const allIds = Array.from(new Set(allPendingEmissions.map(e => e.id_emissao)));
      setPendingEmissions(allIds);
      setBalsaStats({ total: 0, concluidos: 0, pendentes: 0 });
    }
    setSelectedEmission("");
  }, [selectedBalsa, allPendingEmissions]);

  const fetchBalsaStats = async (balsaId: string) => {
    const { data } = await supabase
      .from("controle_nestings")
      .select("status_processo")
      .eq("id_balsa", balsaId);
    
    if (data) {
      const total = data.length;
      const concluidos = data.filter(d => d.status_processo === "Finalizado").length;
      setBalsaStats({
        total,
        concluidos,
        pendentes: total - concluidos
      });
    }
  };

  const fetchEmissionData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("emissoes")
      .select("*")
      .eq("id_emissao", selectedEmission)
      .eq("status_processo", "Em processamento");

    if (error) {
      alert("Erro ao carregar dados: " + error.message);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setEmissionInfo(data[0]);
      setNestings(data.map(d => ({
        nesting: d.nesting,
        pecas: d.pecas || "Sem descrição de peças",
        id_balsa: d.id_balsa,
        tipo_balsa: d.tipo_balsa,
        nome_balsa: d.nome_balsa,
        maquina: d.maquina,
        turno: d.turno,
        bloco: d.bloco,
        painel: d.painel,
        peso_total: d.peso_total || 0,
        horaInicio: "",
        horaFim: "",
        houveParada: "Não",
        motivoParada: "",
        obs: ""
      })));
    } else {
      setNestings([]);
    }
    setLoading(false);
  };

  const handleFinish = async (nesting: string) => {
    const item = nestings.find(n => n.nesting === nesting);
    if (!item) return;

    if (!form.operador || !item.horaInicio || !item.horaFim || !form.carreiraChapa) {
      alert("Preencha Operador, Horários e Carreira Chapa para este card.");
      return;
    }

    setIsFinishing(true);
    try {
      // 1. Gravar no LOG_RETORNO
      const { error: logError } = await supabase.from("log_retorno").insert({
        id_emissao: selectedEmission,
        id_balsa: item.id_balsa,
        tipo_balsa: item.tipo_balsa,
        nome_balsa: item.nome_balsa,
        maquina: item.maquina,
        turno: item.turno,
        bloco: item.bloco,
        painel: item.painel,
        nesting: item.nesting,
        pecas_agrupadas: item.pecas,
        peso_total: item.peso_total,
        hora_inicio: item.horaInicio,
        hora_fim: item.horaFim,
        houve_parada: item.houveParada,
        motivo_parada: item.motivoParada,
        obs: item.obs,
        operador: form.operador,
        carreira_chapa: form.carreiraChapa,
        status_final: "Finalizado"
      });

      if (logError) throw logError;

      // 2. Atualizar CONTROLE_NESTINGS
      const { error: ctrlError } = await supabase
        .from("controle_nestings")
        .update({
          status_processo: "Finalizado",
          data_finalizacao: new Date().toISOString(),
          houve_parada: item.houveParada,
          motivo_parada: item.motivoParada,
          observacao: item.obs,
          operador: form.operador,
          carreira_chapa: form.carreiraChapa
        })
        .eq("id_emissao", selectedEmission)
        .eq("nesting", item.nesting);

      if (ctrlError) throw ctrlError;

      // 3. Atualizar EMISSOES
      const { error: emError } = await supabase
        .from("emissoes")
        .update({ status_processo: "Finalizado" })
        .eq("id_emissao", selectedEmission)
        .eq("nesting", item.nesting);

      if (emError) throw emError;

      // 4. Atualizar Totais na Balsa
      const { data: balsaCounts } = await supabase
        .from("controle_nestings")
        .select("status_processo, nesting")
        .eq("id_balsa", item.id_balsa);

      if (balsaCounts) {
        const uniqueAll = new Set(balsaCounts.map(c => c.nesting)).size;
        const finalizados = new Set(balsaCounts.filter(c => c.status_processo === "Finalizado").map(c => c.nesting)).size;
        const emitidos = new Set(balsaCounts.filter(c => c.status_processo === "Em processamento").map(c => c.nesting)).size;
        const pendentes = new Set(balsaCounts.filter(c => c.status_processo === "Disponivel").map(c => c.nesting)).size;

        await supabase
          .from("balsas")
          .update({
            finalizados,
            emitidos,
            pendentes,
            percentual_concluido: uniqueAll > 0 ? finalizados / uniqueAll : 0,
            status_balsa: finalizados === uniqueAll ? "Concluída" : "Em andamento"
          })
          .eq("id_balsa", item.id_balsa);
      }

      alert(`Nesting ${nesting} finalizado!`);
      fetchEmissionData(); // Recarregar para remover o card finalizado
    } catch (e: any) {
      alert("Erro ao finalizar retorno: " + e.message);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleCancelEmission = async () => {
    if (!selectedEmission) return;
    
    const confirmCancel = window.confirm(`Tem certeza que deseja CANCELAR a emissão ${selectedEmission}? Todos os nestings vinculados voltarão para o estado 'Disponível'.`);
    
    if (!confirmCancel) return;

    setLoading(true);
    try {
      // 1. Atualizar emissoes para 'Cancelado'
      const { error: emError } = await supabase
        .from("emissoes")
        .update({ status_processo: "Cancelado" })
        .eq("id_emissao", selectedEmission);

      if (emError) throw emError;

      // 1.5 Deletar logs de retorno associados (para limpar o ranking)
      const { error: logDeleteError } = await supabase
        .from("log_retorno")
        .delete()
        .eq("id_emissao", selectedEmission);
      
      if (logDeleteError) throw logDeleteError;

      // 2. Voltar nestings para 'Disponivel'
      const { error: ctrlError } = await supabase
        .from("controle_nestings")
        .update({ 
          status_processo: "Disponivel",
          id_emissao: null,
          maquina: null,
          turno: null,
          data_emissao: null
        })
        .eq("id_emissao", selectedEmission);

      if (ctrlError) throw ctrlError;

      // 3. Atualizar totais da balsa
      const firstItem = nestings[0];
      if (firstItem) {
        const { data: balsaCounts } = await supabase
          .from("controle_nestings")
          .select("status_processo, nesting")
          .eq("id_balsa", firstItem.id_balsa);

        if (balsaCounts) {
          const uniqueAll = new Set(balsaCounts.map(c => c.nesting)).size;
          const finalizados = new Set(balsaCounts.filter(c => c.status_processo === "Finalizado").map(c => c.nesting)).size;
          const emitidos = new Set(balsaCounts.filter(c => c.status_processo === "Em processamento").map(c => c.nesting)).size;
          const pendentes = new Set(balsaCounts.filter(c => c.status_processo === "Disponivel").map(c => c.nesting)).size;

          await supabase
            .from("balsas")
            .update({
              finalizados,
              emitidos,
              pendentes,
              percentual_concluido: uniqueAll > 0 ? finalizados / uniqueAll : 0,
              status_balsa: finalizados === uniqueAll ? "Concluída" : "Em andamento"
            })
            .eq("id_balsa", firstItem.id_balsa);
        }
      }

      alert("Emissão cancelada com sucesso! Os nestings já estão disponíveis para nova emissão.");
      setSelectedEmission("");
      fetchInitialData();
    } catch (e: any) {
      alert("Erro ao cancelar emissão: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader 
        code="PRO-03" 
        title="Baixa de Produção" 
        subtitle="Apontamento de corte e retorno do chão de fábrica"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel Lateral */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-card p-6 space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <Activity size={14} /> Filtragem de Balsa
              </h3>

              <label className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold uppercase text-muted-foreground">Selecionar Balsa</span>
                 <select 
                   className="field border-primary/20 bg-primary/5 text-primary font-black"
                   value={selectedBalsa}
                   onChange={e => setSelectedBalsa(e.target.value)}
                 >
                   <option value="">Todas as Balsas</option>
                   {balsas.map(id => <option key={id} value={id}>{id}</option>)}
                 </select>
              </label>

              {selectedBalsa && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Progresso Balsa</span>
                    <span className="text-[10px] font-black text-slate-800">{balsaStats.concluidos} / {balsaStats.total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${(balsaStats.concluidos / (balsaStats.total || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 text-center uppercase">Faltam {balsaStats.pendentes} nestings</p>
                </div>
              )}

              <div className="h-px bg-slate-100 my-2" />

              <label className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold uppercase text-muted-foreground">ID Emissão Específica</span>
                 <select 
                   className="field"
                   value={selectedEmission}
                   onChange={e => setSelectedEmission(e.target.value)}
                 >
                   <option value="">Selecione a Ordem...</option>
                   {pendingEmissions.map(id => <option key={id} value={id}>{id}</option>)}
                 </select>
              </label>

              {emissionInfo && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/5">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Balsa</span>
                        <span className="text-xs font-black">{emissionInfo.id_balsa}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Máquina</span>
                        <span className="text-xs font-black text-primary">{emissionInfo.maquina}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Turno</span>
                        <span className="text-xs font-black">{emissionInfo.turno}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCancelEmission}
                    className="w-full py-2 px-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={14} /> Cancelar Toda a Ordem
                  </button>
                </div>
              )}
           </div>

           <div className="glass-card p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <User size={14} /> Dados do Operador
              </h3>
              
              <label className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold uppercase text-muted-foreground">Operador</span>
                 <select 
                   className="field"
                   value={form.operador}
                   onChange={e => setForm(p => ({ ...p, operador: e.target.value }))}
                 >
                   <option value="">Selecione...</option>
                   {operadores.map(op => <option key={op} value={op}>{op}</option>)}
                 </select>
              </label>

              <label className="flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold uppercase text-muted-foreground">Carreira Chapa</span>
                 <input 
                   type="text" 
                   className="field text-primary font-mono"
                   placeholder="Ex: 2777669"
                   value={form.carreiraChapa}
                   onChange={e => setForm(p => ({ ...p, carreiraChapa: e.target.value }))}
                 />
              </label>
           </div>
        </div>

        {/* Lista de Cards Individuais */}
        <div className="lg:col-span-3 space-y-6">
           <AnimatePresence mode="wait">
              {loading ? (
                <div key="loading" className="glass-card p-20 flex items-center justify-center">
                   <div className="animate-spin text-primary"><Activity size={40} /></div>
                </div>
              ) : nestings.length === 0 ? (
                <div key="empty" className="glass-card p-20 text-center text-muted-foreground border-dashed border-2">
                   <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
                   <p className="uppercase text-[10px] font-black tracking-widest">Nenhuma baixa pendente para esta emissão</p>
                </div>
              ) : (
                <div key="list" className="space-y-4">
                   {nestings.map(n => (
                     <motion.div 
                       layout
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       key={n.nesting} 
                       className="glass-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                     >
                        <div className="md:col-span-3">
                           <div className="text-[9px] uppercase font-bold text-muted-foreground mb-2">Nesting</div>
                           {/* NOVO FORMATO DO NÚMERO DO NESTING */}
                           <div className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-lg text-lg font-black border border-primary/30">
                              {n.nesting}
                           </div>
                           <div className="text-[10px] text-muted-foreground font-bold uppercase mt-2">{n.bloco} | {n.painel}</div>
                        </div>

                        <div className="md:col-span-4">
                           <div className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Peças no Nesting</div>
                           <div className="text-[10px] leading-relaxed text-muted-foreground line-clamp-3 bg-white/5 p-2 rounded-lg border border-white/5">
                              {n.pecas}
                           </div>
                        </div>

                        <div className="md:col-span-5 grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className="flex flex-col gap-1">
                                 <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock size={8} /> Início</span>
                                 <input 
                                   type="time" 
                                   className="field py-1 h-8 text-xs" 
                                   value={n.horaInicio}
                                   onChange={e => {
                                      const val = e.target.value;
                                      setNestings(prev => prev.map(x => x.nesting === n.nesting ? { ...x, horaInicio: val } : x));
                                   }}
                                 />
                              </label>
                              <label className="flex flex-col gap-1">
                                 <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock size={8} /> Fim</span>
                                 <input 
                                   type="time" 
                                   className="field py-1 h-8 text-xs" 
                                   value={n.horaFim}
                                   onChange={e => {
                                      const val = e.target.value;
                                      setNestings(prev => prev.map(x => x.nesting === n.nesting ? { ...x, horaFim: val } : x));
                                   }}
                                 />
                              </label>
                           </div>

                           <div className="flex flex-col justify-end gap-3">
                              <label className="flex flex-col gap-1">
                                 <span className="text-[9px] uppercase font-bold text-muted-foreground">Parada?</span>
                                 <select 
                                   className="field py-1 h-8 text-xs"
                                   value={n.houveParada}
                                   onChange={e => {
                                      const val = e.target.value;
                                      setNestings(prev => prev.map(x => x.nesting === n.nesting ? { ...x, houveParada: val } : x));
                                   }}
                                 >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                 </select>
                              </label>
                              <button 
                                onClick={() => handleFinish(n.nesting)}
                                disabled={isFinishing}
                                className="btn-primary py-1 h-8 text-[10px] flex items-center justify-center gap-2 uppercase tracking-tighter"
                              >
                                 {isFinishing ? "..." : <><CheckCircle2 size={12} /> Finalizar</>}
                              </button>
                           </div>
                        </div>

                        {n.houveParada === "Sim" && (
                           <div className="col-span-full pt-4 mt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <label className="flex flex-col gap-1.5">
                                 <span className="text-[9px] uppercase font-bold text-muted-foreground">Motivo</span>
                                 <select 
                                   className="field py-1 text-xs h-8"
                                   value={n.motivoParada}
                                   onChange={e => {
                                       const val = e.target.value;
                                       setNestings(prev => prev.map(x => x.nesting === n.nesting ? { ...x, motivoParada: val } : x));
                                   }}
                                 >
                                    <option value="">Selecione...</option>
                                    {motivosParada.map(m => <option key={m} value={m}>{m}</option>)}
                                 </select>
                              </label>
                              <label className="flex flex-col gap-1.5">
                                 <span className="text-[9px] uppercase font-bold text-muted-foreground">Observações</span>
                                 <input 
                                   type="text" 
                                   className="field py-1 text-xs h-8" 
                                   placeholder="Detalhes..."
                                   value={n.obs}
                                   onChange={e => {
                                       const val = e.target.value;
                                       setNestings(prev => prev.map(x => x.nesting === n.nesting ? { ...x, obs: val } : x));
                                   }}
                                 />
                              </label>
                           </div>
                        )}
                     </motion.div>
                   ))}
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
