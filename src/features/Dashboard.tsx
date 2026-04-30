import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { Metric } from "@/components/Metric";
import { startOfDay, startOfWeek, startOfMonth, format, subDays } from "date-fns";
import { Link } from "@tanstack/react-router";
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area
} from "recharts";
import { 
  ChevronDown,
  Trophy, 
  Target, 
  Activity, 
  Layers,
  Square,
  Clock,
  Calendar,
  CheckCircle2,
  Package,
  ArrowRight,
  Download,
  Cpu
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

type Period = "today" | "week" | "month";

interface Row {
  data: string;
  quantidade: number;
  peso_total: number | null;
  nesting: string | null;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("today");
  const [balsasData, setBalsasData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayNestings, setDayNestings] = useState<any[]>([]);
  const [nightNestings, setNightNestings] = useState<any[]>([]);
  const [latestNestings, setLatestNestings] = useState<any[]>([]);

  const [selectedBalsaId, setSelectedBalsaId] = useState<string>("");
  const [panelStats, setPanelStats] = useState<any[]>([]);

  useEffect(() => {
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    setLoading(true);

    const fetchData = async () => {
      // 1. Buscar todas as balsas para o resumo e o dropdown
      const { data: bData } = await supabase.from("balsas").select("*").order("data_cadastro", { ascending: false });
      if (bData) setBalsasData(bData);

      // 2. Se houver balsa selecionada, buscar detalhes dos painéis
      if (selectedBalsaId) {
        const { data: pData } = await supabase
          .from("controle_nestings")
          .select("painel, status_processo, nesting")
          .eq("id_balsa", selectedBalsaId);
        
        if (pData) {
           // Agrupar por Painel
           const groups: Record<string, any> = {};
           pData.forEach(row => {
              const p = row.painel || "SEM PAINEL";
              if (!groups[p]) groups[p] = { painel: p, total: new Set(), finalizados: new Set(), emitidos: new Set() };
              groups[p].total.add(row.nesting);
              if (row.status_processo === "Finalizado") groups[p].finalizados.add(row.nesting);
              if (row.status_processo === "Em processamento") groups[p].emitidos.add(row.nesting);
           });

           const stats = Object.values(groups).map(g => ({
              painel: g.painel,
              total: g.total.size,
              finalizados: g.finalizados.size,
              pendentes: g.total.size - g.finalizados.size,
              percentual: g.total.size > 0 ? (g.finalizados.size / g.total.size) * 100 : 0
           }));
           setPanelStats(stats);
        }
      }

      // 3. Buscar logs recentes
      const { data: lData } = await supabase
        .from("log_retorno")
        .select("*")
        .order("data_registro", { ascending: false })
        .limit(50);
      if (lData) setLogs(lData);
      
      setLoading(false);
    };

    fetchData();
  }, [period, selectedBalsaId]);

  const totals = useMemo(() => {
    const total = balsasData.reduce((acc, b) => acc + (b.pendentes + b.emitidos + b.finalizados), 0);
    const finalizados = balsasData.reduce((acc, b) => acc + b.finalizados, 0);
    const emitidos = balsasData.reduce((acc, b) => acc + b.emitidos, 0);
    const efficiency = total > 0 ? (finalizados / total) * 100 : 0;

    return { total, finalizados, emitidos, efficiency };
  }, [balsasData]);

  const chartData = useMemo(() => {
    const days = 7;
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd/MM");
      map[d] = 0;
    }

    logs.forEach(log => {
      const d = format(new Date(log.data_registro), "dd/MM");
      if (map[d] !== undefined) map[d]++;
    });

    return Object.entries(map).map(([day, count]) => ({ day, count }));
  }, [logs]);

  const badges = useMemo(() => {
    if (loading) return { pieces: { text: "...", variant: "neutral" as const }, kg: { text: "...", variant: "neutral" as const }, nestings: { text: "...", variant: "neutral" as const } };
    
    const targetMultiplier = period === "today" ? 1 : period === "week" ? 7 : 30;
    
    const getBadge = (value: number, targetDaily: number, defaultText: string) => {
      const target = targetDaily * targetMultiplier;
      if (value === 0) return { text: "SEM DADOS", variant: "neutral" as const };
      if (value < target * 0.5) return { text: "ALERTA", variant: "danger" as const };
      if (value < target * 0.8) return { text: "ATENÇÃO", variant: "warning" as const };
      if (value >= target * 1.2) return { text: "EXCELENTE", variant: "success" as const };
      return { text: defaultText, variant: "success" as const };
    };

    return {
      pieces: getBadge(totals.pieces, 50, "ON TRACK"),
      kg: getBadge(totals.kg, 200, "EXCELENTE"),
      nestings: getBadge(totals.nestings, 2, "ESTÁVEL")
    };
  }, [totals, loading, period]);

  const exportToExcel = () => {
    if (rows.length === 0) {
      alert("Nenhum dado de produção encontrado para este período.");
      return;
    }
    const dataToExport = rows.map(r => ({
      "Data": new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR"),
      "Nesting": r.nesting || "N/A",
      "Qtd Peças": r.quantidade || 0,
      "Peso Total (kg)": r.peso_total || 0
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [{wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produção");
    const fileName = `Relatorio_Producao_${period}_${format(new Date(), "yyyyMMdd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        code="DSH-01"
        title="Dashboard de Produção"
        right={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-slate-400">Análise Específica:</span>
               <select 
                 className="field py-1.5 px-4 text-xs font-bold"
                 value={selectedBalsaId}
                 onChange={e => setSelectedBalsaId(e.target.value)}
               >
                 <option value="">Visão Geral (Todas)</option>
                 {balsasData.map(b => <option key={b.id_balsa} value={b.id_balsa}>{b.id_balsa}</option>)}
               </select>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase rounded-full hover:bg-slate-200 transition-colors"
            >
              <Download size={14} /> Exportar
            </motion.button>
          </div>
        }
      />

      {!selectedBalsaId ? (
        <>
          {/* Visão Geral - KPIs das Balsas */}
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Metric label="Total de Balsas" value={balsasData.length} icon={<Package size={14} />} badge="CADASTRADAS" badgeVariant="neutral" />
            <Metric label="Em Andamento" value={balsasData.filter(b => b.percentual_concluido < 1 && b.percentual_concluido > 0).length} icon={<Activity size={14} />} badge="PRODUZINDO" badgeVariant="warning" />
            <Metric label="Concluídas" value={balsasData.filter(b => b.percentual_concluido >= 1).length} icon={<CheckCircle2 size={14} />} badge="FINALIZADAS" badgeVariant="success" />
          </motion.section>

          {/* Tabela Resumo por Balsa (Igual Excel) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-0 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Resumo por Balsa</h3>
               <span className="text-[10px] font-bold text-slate-400">ATUALIZADO EM TEMPO REAL</span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="p-4">ID Balsa</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Total Nestings</th>
                        <th className="p-4">Emitidos</th>
                        <th className="p-4">Finalizados</th>
                        <th className="p-4">Pendentes</th>
                        <th className="p-4">% Concluído</th>
                        <th className="p-4">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {balsasData.map(b => (
                       <tr key={b.id_balsa} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-black text-slate-800">{b.id_balsa}</td>
                          <td className="p-4 text-xs font-bold text-slate-500 uppercase">{b.tipo_balsa}</td>
                          <td className="p-4 text-xs font-bold">{(b.pendentes + b.emitidos + b.finalizados)}</td>
                          <td className="p-4 text-xs font-bold text-primary">{b.emitidos}</td>
                          <td className="p-4 text-xs font-bold text-green-600">{b.finalizados}</td>
                          <td className="p-4 text-xs font-bold text-slate-400">{b.pendentes}</td>
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                                   <div className="h-full bg-primary" style={{ width: `${b.percentual_concluido * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-black">{(b.percentual_concluido * 100).toFixed(1)}%</span>
                             </div>
                          </td>
                          <td className="p-4">
                             <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${
                               b.percentual_concluido >= 1 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-primary/5 text-primary border-primary/10'
                             }`}>
                                {b.percentual_concluido >= 1 ? 'Concluída' : 'Em andamento'}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Dashboard de Painéis (Igual Excel após selecionar Balsa) */}
          <div className="flex flex-col gap-6">
             <div className="flex justify-between items-end bg-primary/5 p-8 rounded-[40px] border border-primary/10">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Análise Detalhada</span>
                   <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Dashboard de Painéis: <span className="text-primary">{selectedBalsaId}</span></h2>
                </div>
                <div className="grid grid-cols-4 gap-8 text-right">
                   <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Painéis</div>
                      <div className="text-2xl font-black text-slate-800">{panelStats.length}</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Em Andamento</div>
                      <div className="text-2xl font-black text-slate-800">{panelStats.filter(p => p.percentual < 100 && p.percentual > 0).length}</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Concluídos</div>
                      <div className="text-2xl font-black text-green-600">{panelStats.filter(p => p.percentual >= 100).length}</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1">% Global</div>
                      <div className="text-2xl font-black text-primary">
                         {(panelStats.reduce((acc, p) => acc + p.percentual, 0) / (panelStats.length || 1)).toFixed(1)}%
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 1: % Concluído por Painel */}
                <div className="glass-card p-6 min-h-[400px] flex flex-col">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                      <Activity size={14} className="text-primary" /> % Concluído por Painel
                   </h3>
                   <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={panelStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis dataKey="painel" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} width={100} />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} />
                            <Bar dataKey="percentual" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Gráfico 2: Pendentes por Painel */}
                <div className="glass-card p-6 min-h-[400px] flex flex-col">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                      <Layers size={14} className="text-red-500" /> Nestings Pendentes por Painel
                   </h3>
                   <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={panelStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="painel" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} width={100} />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} />
                            <Bar dataKey="pendentes" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
             
             {/* Lista de Painéis (Tabela) */}
             <div className="glass-card p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                         <th className="p-4">Painel</th>
                         <th className="p-4">Total Nestings</th>
                         <th className="p-4">Concluídos</th>
                         <th className="p-4">Pendentes</th>
                         <th className="p-4">% Conclusão</th>
                         <th className="p-4">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {panelStats.map(p => (
                        <tr key={p.painel} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4 font-black text-xs text-slate-800">{p.painel}</td>
                           <td className="p-4 text-xs font-bold">{p.total}</td>
                           <td className="p-4 text-xs font-bold text-green-600">{p.finalizados}</td>
                           <td className="p-4 text-xs font-bold text-red-400">{p.pendentes}</td>
                           <td className="p-4">
                              <span className="text-[10px] font-black">{p.percentual.toFixed(1)}%</span>
                           </td>
                           <td className="p-4">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                p.percentual >= 100 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                 {p.percentual >= 100 ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {/* Gráfico de Produção por Máquina */}
      {!selectedBalsaId && (
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 glass-card p-6 min-h-[350px] flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                   <Cpu size={16} className="text-primary" /> Produção por Máquina (Últimos 30 dias)
                </h3>
             </div>
             <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={Object.entries(logs.reduce((acc: any, curr) => {
                      acc[curr.maquina] = (acc[curr.maquina] || 0) + 1;
                      return acc;
                   }, {})).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="glass-card p-0 overflow-hidden flex flex-col">
             <div className="p-6 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                   <Clock size={16} className="text-primary" /> Atividade Recente
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto max-h-[140px] custom-scrollbar">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="size-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-[10px]">
                           {log.maquina.substring(0,1)}
                        </div>
                        <div>
                           <div className="text-xs font-black text-slate-800">{log.nesting}</div>
                           <div className="text-[8px] font-black text-slate-400 uppercase">{log.operador} • {format(new Date(log.data_registro), "HH:mm")}</div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             
             {/* Restaurando o Status das Balsas aqui dentro ou logo abaixo */}
             <div className="p-6 pt-4 border-t border-slate-100 flex-1 flex flex-col gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                   <Activity size={14} className="text-primary" /> Balsas em Andamento
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                   {balsasData.filter(b => b.percentual_concluido < 1 && b.percentual_concluido > 0).map((b, i) => (
                     <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-600">{b.id_balsa}</span>
                           <span className="text-[9px] font-black text-primary">{(b.percentual_concluido * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${b.percentual_concluido * 100}%` }} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
