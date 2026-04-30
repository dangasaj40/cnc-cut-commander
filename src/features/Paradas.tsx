import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { 
  Play, 
  Square, 
  Clock, 
  AlertTriangle, 
  History,
  CheckCircle2,
  Trash2,
  Activity
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface LogParada {
  id: string;
  id_balsa: string;
  maquina: string;
  operador: string;
  motivo: string;
  data_inicio: string;
  data_fim: string | null;
  duracao_minutos: number;
  observacao: string;
  status: string;
}

export default function ParadasPage() {
  const [logs, setLogs] = useState<LogParada[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Parâmetros do sistema
  const [maquinas, setMaquinas] = useState<string[]>([]);
  const [operadores, setOperadores] = useState<string[]>([]);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [balsas, setBalsas] = useState<string[]>([]);

  // Form para nova parada manual
  const [form, setForm] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    horaInicio: "",
    horaFim: "",
    maquina: "",
    operador: "",
    motivo: "",
    id_balsa: "",
    observacao: ""
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchData();
    fetchParams();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("log_paradas")
      .select("*")
      .order("data_inicio", { ascending: false })
      .limit(50);
    
    if (data) {
      setLogs(data as LogParada[]);
    }
    setLoading(false);
  };

  const fetchParams = async () => {
    const { data } = await supabase.from("system_settings").select("key, value");
    if (data) {
      data.forEach(item => {
        if (item.key === "maquinas") setMaquinas(JSON.parse(item.value));
        if (item.key === "operadores") setOperadores(JSON.parse(item.value));
        if (item.key === "motivos_parada") setMotivos(JSON.parse(item.value));
      });
    }
    
    const { data: bData } = await supabase.from("balsas").select("id_balsa").neq("status_balsa", "Concluída");
    if (bData) setBalsas(bData.map(b => b.id_balsa));
  };

  const saveStop = async () => {
    if (!form.maquina || !form.operador || !form.motivo || !form.horaInicio || !form.horaFim) {
      alert("Preencha todos os campos obrigatórios (Máquina, Operador, Motivo e Horários).");
      return;
    }

    setBusy(true);
    try {
      const dataInicio = new Date(`${form.data}T${form.horaInicio}`);
      const dataFim = new Date(`${form.data}T${form.horaFim}`);
      
      let duracao = differenceInMinutes(dataFim, dataInicio);
      if (duracao < 0) duracao += 1440; // Tratar virada de dia

      const { error } = await supabase.from("log_paradas").insert({
        maquina: form.maquina,
        operador: form.operador,
        motivo: form.motivo,
        id_balsa: form.id_balsa || null,
        observacao: form.observacao,
        status: "Finalizada",
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        duracao_minutos: duracao
      });

      if (error) throw error;
      
      alert("Parada registrada com sucesso!");
      setForm(p => ({ ...p, horaInicio: "", horaFim: "", observacao: "" }));
      fetchData();
    } catch (err: any) {
      alert("Erro ao salvar parada: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm("Excluir este registro de parada?")) return;
    await supabase.from("log_paradas").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      <SectionHeader 
        code="PRO-04" 
        title="Gestão de Paradas" 
        subtitle="Lançamento manual de interrupções de máquina"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Formulário de Lançamento */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-card p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <Clock size={14} /> Novo Lançamento
              </h3>
              
              <div className="space-y-3">
                 <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Data da Parada</span>
                    <input type="date" className="field" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                 </label>

                 <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-bold uppercase text-muted-foreground">Início</span>
                       <input 
                         type="time" 
                         className="field h-10 px-3" 
                         value={form.horaInicio} 
                         onChange={e => {
                           const val = e.target.value;
                           setForm(p => ({ ...p, horaInicio: val }));
                         }} 
                       />
                    </label>
                    <label className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-bold uppercase text-muted-foreground">Fim</span>
                       <input 
                         type="time" 
                         className="field h-10 px-3" 
                         value={form.horaFim} 
                         onChange={e => {
                           const val = e.target.value;
                           setForm(p => ({ ...p, horaFim: val }));
                         }} 
                       />
                    </label>
                 </div>

                 <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Máquina</span>
                    <select className="field" value={form.maquina} onChange={e => setForm(p => ({ ...p, maquina: e.target.value }))}>
                       <option value="">Selecione...</option>
                       {maquinas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </label>
                 
                 <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Operador</span>
                    <select className="field" value={form.operador} onChange={e => setForm(p => ({ ...p, operador: e.target.value }))}>
                       <option value="">Selecione...</option>
                       {operadores.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                 </label>

                 <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Motivo</span>
                    <select className="field" value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}>
                       <option value="">Selecione...</option>
                       {motivos.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </label>

                 <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Observação</span>
                    <input 
                     type="text" 
                     className="field" 
                     placeholder="Detalhes..." 
                     value={form.observacao}
                     onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))}
                    />
                 </label>

                 <button 
                   onClick={saveStop}
                   disabled={busy}
                   className="w-full btn-primary py-4 mt-2 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2"
                 >
                    {busy ? "Salvando..." : "Salvar Registro"}
                 </button>
              </div>
           </div>
        </div>

        {/* Histórico de Paradas */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                 <History size={16} className="text-primary" /> Histórico Recente
              </h3>
           </div>

           <div className="space-y-3">
              {loading ? (
                <div className="p-20 flex justify-center"><Activity className="animate-spin text-primary" /></div>
              ) : logs.length === 0 ? (
                <div className="glass-card p-12 text-center text-muted-foreground border-dashed border-2">
                   <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                   <p className="text-[10px] font-black uppercase">Sem paradas registradas</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="glass-card p-4 flex justify-between items-center hover:border-primary/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${log.status === 'Em aberto' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                           <AlertTriangle size={20} />
                        </div>
                        <div>
                           <div className="text-sm font-black text-slate-800">{log.motivo}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">
                              {log.maquina} • {log.operador} • {format(new Date(log.data_inicio), "dd/MM HH:mm")}
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right">
                           <div className="text-sm font-black text-slate-800">
                              {log.status === 'Em aberto' ? '—' : `${log.duracao_minutos} min`}
                           </div>
                           <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${log.status === 'Em aberto' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                              {log.status}
                           </div>
                        </div>
                        <button onClick={() => deleteLog(log.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
