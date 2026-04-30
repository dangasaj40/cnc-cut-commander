import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  Filter,
  CheckCircle2,
  Trash2,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface LogEntry {
  id: string;
  data_registro: string;
  id_balsa: string;
  nesting: string;
  pecas_agrupadas: string;
  peso_total: number; // Novo
  maquina: string;
  turno: string;
  operador: string;
  hora_inicio: string;
  hora_fim: string;
  houve_parada: string;
  carreira_chapa: string;
}

export default function HistoricoPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    balsa: "",
    operador: "",
    nesting: "", // Novo
    data: ""
  });

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from("log_retorno").select("*").order("data_registro", { ascending: false });

    if (filter.balsa) query = query.ilike("id_balsa", `%${filter.balsa}%`);
    if (filter.operador) query = query.ilike("operador", `%${filter.operador}%`);
    if (filter.nesting) query = query.ilike("nesting", `%${filter.nesting}%`);
    if (filter.data) query = query.gte("data_registro", filter.data);

    const { data } = await query.limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  const deleteLog = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro permanentemente?")) return;
    
    // Remove da tela na hora (UI Otimista)
    setLogs(prev => prev.filter(l => l.id !== id));
    
    const { error, status } = await supabase.from("log_retorno").delete().eq("id", id);
    
    if (error) {
      alert(`Erro no Banco (${status}): ${error.message}`);
      fetchLogs(); // Recarrega para mostrar que não foi apagado
    } else {
      console.log("Registro deletado com sucesso do banco.");
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Data", "Balsa", "Nesting", "Pecas", "Peso (kg)", "Maquina", "Turno", "Operador", "Inicio", "Fim", "Parada", "Carreira"];
    const rows = logs.map(l => [
      format(new Date(l.data_registro), "dd/MM/yyyy HH:mm"),
      l.id_balsa,
      l.nesting,
      l.pecas_agrupadas.replace(/,/g, ";"),
      l.peso_total || 0,
      l.maquina,
      l.turno,
      l.operador,
      l.hora_inicio,
      l.hora_fim,
      l.houve_parada,
      l.carreira_chapa
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_producao_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader 
        code="HIS-01" 
        title="Histórico de Produção" 
        subtitle="Auditoria completa e exportação de dados"
        right={
          <button 
            onClick={exportCSV}
            className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download size={16} /> Exportar Excel (CSV)
          </button>
        }
      />

      {/* Filtros */}
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
         <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><Package size={10} /> Balsa</span>
            <input 
              type="text" 
              className="field py-2" 
              placeholder="Ex: BAL-01"
              value={filter.balsa}
              onChange={e => setFilter(p => ({ ...p, balsa: e.target.value }))}
            />
         </label>
         <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><Search size={10} /> Nº Nesting</span>
            <input 
              type="text" 
              className="field py-2" 
              placeholder="Ex: 4465"
              value={filter.nesting}
              onChange={e => setFilter(p => ({ ...p, nesting: e.target.value }))}
            />
         </label>
         <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><User size={10} /> Operador</span>
            <input 
              type="text" 
              className="field py-2" 
              placeholder="Nome do operador..."
              value={filter.operador}
              onChange={e => setFilter(p => ({ ...p, operador: e.target.value }))}
            />
         </label>
         <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><Calendar size={10} /> A partir de</span>
            <input 
              type="date" 
              className="field py-2" 
              value={filter.data}
              onChange={e => setFilter(p => ({ ...p, data: e.target.value }))}
            />
         </label>
         <button className="btn-secondary h-11 flex items-center justify-center gap-2">
            <Search size={16} /> Filtrar
         </button>
      </div>

      {/* Tabela de Resultados */}
      <div className="glass-card p-0 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                     <th className="p-4">Data/Hora</th>
                     <th className="p-4">Balsa</th>
                     <th className="p-4">Nesting</th>
                     <th className="p-4">Peso (kg)</th>
                     <th className="p-4">Operador</th>
                     <th className="p-4">Tempo</th>
                     <th className="p-4 text-center">Parada?</th>
                     <th className="p-4">Carreira</th>
                     <th className="p-4 text-center">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan={7} className="p-8 bg-white/5"></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="p-20 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                          Nenhum registro encontrado no histórico
                       </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                         <td className="p-4">
                            <div className="text-[10px] font-bold text-white">{format(new Date(log.data_registro), "dd/MM/yyyy")}</div>
                            <div className="text-[9px] text-muted-foreground">{format(new Date(log.data_registro), "HH:mm:ss")}</div>
                         </td>
                         <td className="p-4">
                            <span className="text-xs font-black text-primary">{log.id_balsa}</span>
                         </td>
                         <td className="p-4">
                            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                               #{log.nesting}
                            </span>
                            <div className="text-[8px] text-muted-foreground uppercase mt-1.5 truncate max-w-[150px]">{log.pecas_agrupadas}</div>
                         </td>
                         <td className="p-4">
                            <span className="text-xs font-black text-white">{log.peso_total?.toFixed(2) || "0.00"} kg</span>
                         </td>
                         <td className="p-4">
                            <span className="text-[10px] font-bold uppercase text-slate-300">{log.operador}</span>
                         </td>
                         <td className="p-4">
                            <div className="text-[10px] font-mono text-white">{log.hora_inicio} ➔ {log.hora_fim}</div>
                         </td>
                         <td className="p-4">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${log.houve_parada === 'Sim' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                               {log.houve_parada}
                            </span>
                         </td>
                         <td className="p-4 text-xs font-mono text-primary">{log.carreira_chapa}</td>
                         <td className="p-4 text-center">
                            <button 
                               onClick={() => deleteLog(log.id)}
                               className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                               title="Excluir Registro"
                             >
                                <Trash2 size={14} />
                             </button>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
