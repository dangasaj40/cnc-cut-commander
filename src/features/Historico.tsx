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
  Package,
  X,
  Info,
  Clock,
  Layout,
  Cpu
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

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
  id_emissao?: string;
  bloco?: string;
  painel?: string;
  houve_parada: string;
  carreira_chapa: string;
}

export default function HistoricoPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewLog, setViewLog] = useState<LogEntry | null>(null);
  const pageSize = 100;

  const [filter, setFilter] = useState({
    balsa: "",
    operador: "",
    nesting: "",
    data: ""
  });

  const [extraInfo, setExtraInfo] = useState<{
    pecas_detalhes?: any[];
    data_emissao?: string;
    loading?: boolean;
  } | null>(null);

  // Resetar para a primeira página sempre que um filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [filter.balsa, filter.operador, filter.nesting, filter.data]);

  // Buscar informações extras ao abrir o popup
  useEffect(() => {
    if (viewLog) {
      fetchExtraInfo(viewLog);
    } else {
      setExtraInfo(null);
    }
  }, [viewLog]);

  const fetchExtraInfo = async (log: LogEntry) => {
    setExtraInfo({ loading: true });
    try {
      const pecasNomes = log.pecas_agrupadas.split(",").map(p => p.trim());
      
      // 1. Buscar todas as peças do grupo no Catálogo
      const { data: catData } = await supabase
        .from("catalogo_pecas")
        .select("dimensional, espessura_mm, quantidade_base, peca, peso_kg")
        .in("peca", pecasNomes);

      // 2. Buscar a Data de Emissão
      let emissaoDate = "";
      if (log.id_emissao) {
        const { data: emData } = await supabase
          .from("emissoes")
          .select("created_at")
          .eq("id", log.id_emissao)
          .maybeSingle();
        if (emData) emissaoDate = emData.created_at;
      }

      setExtraInfo({
        pecas_detalhes: catData || [],
        data_emissao: emissaoDate,
        loading: false
      });
    } catch (e) {
      console.error("Erro ao buscar info extra:", e);
      setExtraInfo({ loading: false });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("log_retorno")
      .select("*", { count: 'exact' })
      .order("data_registro", { ascending: false });

    if (filter.balsa) query = query.ilike("id_balsa", `%${filter.balsa}%`);
    if (filter.operador) query = query.ilike("operador", `%${filter.operador}%`);
    if (filter.nesting) query = query.ilike("nesting", `%${filter.nesting}%`);
    if (filter.data) query = query.gte("data_registro", filter.data);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await query.range(from, to);
    
    setLogs(data || []);
    setTotalCount(count || 0);
    setSelectedIds([]);
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const deleteLog = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro permanentemente?")) return;
    setLogs(prev => prev.filter(l => l.id !== id));
    const { error } = await supabase.from("log_retorno").delete().eq("id", id);
    if (error) {
      alert(`Erro ao deletar: ${error.message}`);
      fetchLogs();
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir permanentemente as ${selectedIds.length} ordens selecionadas?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("log_retorno").delete().in("id", selectedIds);
      if (error) throw error;
      
      alert(`${selectedIds.length} registros excluídos com sucesso.`);
      setSelectedIds([]);
      fetchLogs();
    } catch (e: any) {
      alert("Erro na exclusão em massa: " + e.message);
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button 
                onClick={deleteSelected}
                className="btn-secondary bg-red-50 text-red-600 border-red-100 flex items-center gap-2 hover:bg-red-100"
              >
                <Trash2 size={16} /> Excluir {selectedIds.length} Selecionados
              </button>
            )}
            <button 
              onClick={exportCSV}
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download size={16} /> Exportar Excel (CSV)
            </button>
          </div>
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
                     <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          checked={logs.length > 0 && selectedIds.length === logs.length}
                          onChange={toggleSelectAll}
                        />
                     </th>
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
                         <td colSpan={10} className="p-8 bg-white/5"></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                       <td colSpan={10} className="p-20 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                          Nenhum registro encontrado no histórico
                       </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                     <tr 
                       key={log.id} 
                       className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${selectedIds.includes(log.id) ? 'bg-indigo-50/30' : ''}`}
                       onClick={() => {
                         console.log("Clique detectado!", log);
                         setViewLog(log);
                       }}
                     >
                        <td className="p-4" onClick={(e) => { e.stopPropagation(); console.log("Checkbox clicado"); }}>
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                              checked={selectedIds.includes(log.id)}
                              onChange={() => toggleSelect(log.id)}
                            />
                         </td>
                         <td className="p-4">
                             <div className="text-[10px] font-bold text-slate-800">{format(new Date(log.data_registro), "dd/MM/yyyy")}</div>
                             <div className="text-[9px] text-slate-500">{format(new Date(log.data_registro), "HH:mm:ss")}</div>
                         </td>
                         <td className="p-4">
                            <span className="text-xs font-black text-primary">{log.id_balsa}</span>
                         </td>
                         <td className="p-4">
                             <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                               #{log.nesting}
                             </span>
                             <div className="text-[8px] text-slate-600 font-medium uppercase mt-1.5 truncate max-w-[150px]">{log.pecas_agrupadas}</div>
                         </td>
                         <td className="p-4">
                             <span className="text-xs font-black text-slate-800">{log.peso_total?.toFixed(2) || "0.00"} kg</span>
                         </td>
                         <td className="p-4">
                             <span className="text-[10px] font-black uppercase text-slate-900">{log.operador}</span>
                         </td>
                         <td className="p-4">
                             <div className="text-[10px] font-mono font-bold text-slate-800">{log.hora_inicio} ➔ {log.hora_fim}</div>
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

         {/* Controles de Paginação */}
         <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase text-muted-foreground">
               Mostrando {logs.length} de {totalCount} registros
            </div>
            
            <div className="flex items-center gap-1">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1 || loading}
                 className="px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-black uppercase hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  Anterior
               </button>

               <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    // Mostrar páginas próximas à atual
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`size-8 rounded-lg flex items-center justify-center text-[10px] font-black ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
               </div>

               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages || loading}
                 className="px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-black uppercase hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
               >
                  Próxima
               </button>
            </div>
         </div>
      </div>
      {viewLog && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }} onClick={() => setViewLog(null)}>
          <div 
            className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                  <Info size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">Detalhes da Ordem</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Nesting #{viewLog.nesting}</p>
                </div>
              </div>
              <button onClick={() => setViewLog(null)} className="size-10 rounded-2xl hover:bg-slate-200/50 flex items-center justify-center text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
              {/* Coluna 1: Dados de Produção */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Produção Realizada</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Layout size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Bloco / Painel</span>
                      <p className="text-sm font-bold text-slate-800">{viewLog.bloco || "---"} / {viewLog.painel || "---"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Peso Total</span>
                      <p className="text-sm font-bold text-slate-800">{Number(viewLog.peso_total || 0).toFixed(2)} kg</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Operador</span>
                    <p className="text-sm font-bold text-slate-800 uppercase">{viewLog.operador}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ciclo de Produção</span>
                    <p className="text-sm font-bold text-slate-800 font-mono">{viewLog.hora_inicio} ➔ {viewLog.hora_fim}</p>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Detalhamento de Peças (O "Explodido") */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2">Composição do Nesting</h3>
                
                {extraInfo?.loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="size-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultando Catálogo...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {extraInfo?.pecas_detalhes && extraInfo.pecas_detalhes.length > 0 ? (
                      extraInfo.pecas_detalhes.map((p, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group/item">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-slate-800 group-hover/item:text-emerald-700 transition-colors">{p.peca}</span>
                            <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{p.peso_kg?.toFixed(2)} kg</span>
                          </div>
                          <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Layout size={10} /> {p.dimensional}</span>
                            <span className="flex items-center gap-1"><Cpu size={10} /> {p.espessura_mm}mm</span>
                            <span className="flex items-center gap-1"><Package size={10} /> Qtd: {p.quantidade_base}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum detalhe técnico encontrado para as peças deste grupo.</p>
                      </div>
                    )}
                    
                    {extraInfo?.data_emissao && (
                      <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                         <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Data Original de Emissão:</span>
                         <span className="text-[10px] font-bold text-indigo-700">{format(new Date(extraInfo.data_emissao), "dd/MM/yyyy")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setViewLog(null)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Fechar Detalhes
              </button>
              <button 
                onClick={() => {
                  if (confirm("Deseja realmente excluir este registro?")) {
                    deleteLog(viewLog.id);
                    setViewLog(null);
                  }
                }}
                className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[10px] font-black uppercase hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} /> Excluir Registro
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
