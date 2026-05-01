import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { Metric } from "@/components/Metric";
import { startOfDay, startOfWeek, startOfMonth, format, subDays } from "date-fns";
import { Link } from "@tanstack/react-router";
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { 
  ChevronDown,
  Trophy, 
  Target, 
  Activity, 
  Layers,
  Square,
  Weight,
  Clock,
  Calendar,
  CheckCircle2,
  Package,
  ArrowRight,
  Download,
  Cpu,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type Period = "today" | "week" | "month" | "total";

interface Row {
  data: string;
  quantidade: number;
  peso_total: number | null;
  nesting: string | null;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("total");
  const [balsasData, setBalsasData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayNestings, setDayNestings] = useState<any[]>([]);
  const [nightNestings, setNightNestings] = useState<any[]>([]);
  const [latestNestings, setLatestNestings] = useState<any[]>([]);

  const [selectedBalsaId, setSelectedBalsaId] = useState<string>("");
  const [panelStats, setPanelStats] = useState<any[]>([]);
  const [stopStats, setStopStats] = useState<{totalMin: number, reasons: any[]}>({ totalMin: 0, reasons: [] });

  useEffect(() => {
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    setLoading(true);

    const fetchData = async () => {
      // 1. Buscar todas as balsas para o resumo e o dropdown
      const { data: bData } = await supabase.from("balsas").select("*").order("data_cadastro", { ascending: false });
      if (bData) setBalsasData(bData);

      // 2. Se houver balsa selecionada, buscar detalhes dos painéis
      if (selectedBalsaId) {
        // Tentamos buscar com peso e tempo, se falhar (coluna inexistente), buscamos o básico
        let { data: pData, error: pError } = await supabase
          .from("controle_nestings")
          .select("painel, status_processo, nesting, peso_total, tempo_corte_total")
          .eq("id_balsa", selectedBalsaId);

        if (pError) {
          console.warn("Colunas de peso/tempo não encontradas, usando fallback básico.");
          const { data: fallbackData } = await supabase
            .from("controle_nestings")
            .select("painel, status_processo, nesting")
            .eq("id_balsa", selectedBalsaId);
          pData = fallbackData;
        }
        
        if (pData) {
           const groups: Record<string, any> = {};
           pData.forEach(row => {
              const p = row.painel || "SEM PAINEL";
              if (!groups[p]) groups[p] = { 
                painel: p, 
                total: new Set(), 
                finalizados: new Set(), 
                emitidos: new Set(),
                pesoTotal: 0,
                pesoFinalizado: 0,
                tempoTotal: 0,
                tempoPendente: 0
              };
              
              groups[p].total.add(row.nesting);
              groups[p].pesoTotal += Number(row.peso_total || 0);
              groups[p].tempoTotal += Number(row.tempo_corte_total || 0);

              if (row.status_processo === "Finalizado") {
                groups[p].finalizados.add(row.nesting);
                groups[p].pesoFinalizado += Number(row.peso_total || 0);
              } else {
                groups[p].tempoPendente += Number(row.tempo_corte_total || 0);
              }

              if (row.status_processo === "Em processamento") groups[p].emitidos.add(row.nesting);
           });

           const stats = Object.values(groups).map(g => {
              const total = g.total.size;
              const finalizados = g.finalizados.size;
              const emitidos = g.emitidos.size + finalizados; // No Excel, Processados = Emitidos + Concluídos
              
              return {
                 painel: g.painel,
                 total: total,
                 processados: emitidos, // Equivalente ao Excel
                 concluidos: finalizados,
                 pendentes: total - finalizados,
                 pesoTotal: g.pesoTotal,
                 pesoFinalizado: g.pesoFinalizado,
                 tempoTotal: g.tempoTotal,
                 tempoPendente: g.tempoPendente,
                 percentualProcessado: total > 0 ? (emitidos / total) * 100 : 0,
                 percentualConcluido: total > 0 ? (finalizados / total) * 100 : 0
              };
           });
           setPanelStats(stats);
        }
      }

      // 3. Buscar logs para o período selecionado
      let query = supabase
        .from("log_retorno")
        .select("*")
        .order("data_registro", { ascending: false });

      if (period === "today") {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        query = query.gte("data_registro", `${todayStr}T00:00:00`);
      } else if (period === "week") {
        const weekAgo = subDays(new Date(), 7);
        query = query.gte("data_registro", weekAgo.toISOString());
      } else if (period === "month") {
        const monthAgo = subDays(new Date(), 30);
        query = query.gte("data_registro", monthAgo.toISOString());
      }
      // Se for "total", não aplicamos filtro de data

      const { data: lData } = await query;
      if (lData) setLogs(lData);

      // 4. Buscar dados de Paradas
      const { data: sData } = await supabase
        .from("log_paradas")
        .select("*")
        .order("data_inicio", { ascending: false });
      
      if (sData) {
         const totalMin = sData.reduce((acc, curr) => acc + (curr.duracao_minutos || 0), 0);
         const reasonMap: Record<string, number> = {};
         sData.forEach(s => {
            reasonMap[s.motivo] = (reasonMap[s.motivo] || 0) + (s.duracao_minutos || 0);
         });
         const reasons = Object.entries(reasonMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value);
         
         setStopStats({ totalMin, reasons });
      }
      
      setLoading(false);
    };

    fetchData();
  }, [period, selectedBalsaId]);

  const totals = useMemo(() => {
    const totalNestings = balsasData.reduce((acc, b) => acc + (b.pendentes + b.emitidos + b.finalizados), 0);
    const finalizados = balsasData.reduce((acc, b) => acc + b.finalizados, 0);
    const totalPecas = logs.reduce((acc, l) => {
      if (!l.pecas_agrupadas) return acc + 0;
      // Se for uma lista de nomes (contém vírgula)
      if (typeof l.pecas_agrupadas === 'string' && l.pecas_agrupadas.includes(",")) {
        return acc + l.pecas_agrupadas.split(",").length;
      }
      // Se for apenas um número
      const num = parseInt(l.pecas_agrupadas);
      return acc + (isNaN(num) ? 1 : num);
    }, 0);
    const totalPeso = logs.reduce((acc, l) => acc + (Number(l.peso_total) || 0), 0);
    const efficiency = totalNestings > 0 ? (finalizados / totalNestings) * 100 : 0;

    return { totalNestings, finalizados, totalPecas, totalPeso, efficiency };
  }, [balsasData, logs]);

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
      pieces: getBadge(totals.totalPecas, 50, "ON TRACK"),
      kg: getBadge(totals.totalPeso, 200, "EXCELENTE"),
      nestings: getBadge(totals.totalNestings, 2, "ESTÁVEL")
    };
  }, [totals, loading, period]);

  const exportToPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    
    // 1. Barra de Título Superior
    doc.setFillColor(31, 58, 102); 
    doc.rect(margin, margin, pageWidth - 80, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    const title = selectedBalsaId ? "RELATÓRIO DE PRODUÇÃO POR PAINEL" : "RELATÓRIO CONSOLIDADO DE PRODUÇÃO";
    doc.text(title, (pageWidth - 80) / 2 + 10, margin + 5, { align: 'center' });

    // 2. Logo (Canto Superior Direito)
    try {
      doc.addImage("/logo.jpg", "JPEG", pageWidth - 60, margin, 50, 20);
    } catch(e) {}

    // 3. Grid de Informações
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");

    const drawField = (x: number, y: number, w: number, h: number, label: string, value: string, labelW: number = 30) => {
      doc.setFillColor(31, 58, 102);
      doc.rect(x, y, labelW, h, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(label, x + 2, y + 3.2);
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(100, 100, 100);
      doc.rect(x + labelW, y, w - labelW, h);
      doc.setFont("helvetica", "normal");
      doc.text(String(value || ""), x + labelW + 2, y + 3.2);
      doc.setFont("helvetica", "bold");
    };

    let currentY = 22;
    if (selectedBalsaId) {
       drawField(margin, currentY, 80, 5, "BALSA", selectedBalsaId);
       currentY += 5;
       const balsa = balsasData.find(b => b.id_balsa === selectedBalsaId);
       drawField(margin, currentY, 80, 5, "TIPO / NOME", `${balsa?.tipo_balsa || ""} - ${balsa?.nome_balsa || ""}`);
    } else {
       drawField(margin, currentY, 80, 5, "PERÍODO", period.toUpperCase());
       currentY += 5;
       drawField(margin, currentY, 80, 5, "TOTAL PESO", `${totals.totalPeso.toFixed(1)} kg`);
    }
    
    currentY = 22;
    drawField(margin + 90, currentY, 60, 5, "DATA_RELATORIO", format(new Date(), "dd/MM/yyyy HH:mm"));
    currentY += 5;
    drawField(margin + 90, currentY, 60, 5, "SISTEMA", "CNC CUT COMMANDER");

    // 4. Tabela de Dados
    let tableHead, tableBody, colStyles;
    if (selectedBalsaId) {
      tableHead = [["Painel", "Total Nestings", "Processados", "Concluídos", "Pendentes", "% Concluído", "Peso Total (kg)"]];
      tableBody = panelStats.map(p => [
        p.painel,
        p.total,
        p.processados,
        p.concluidos,
        p.pendentes,
        `${p.percentualConcluido.toFixed(1)}%`,
        Number(p.pesoTotal || 0).toFixed(1)
      ]);
      colStyles = { 0: { cellWidth: 50 }, 5: { halign: 'center' }, 6: { halign: 'right' } };
    } else {
      tableHead = [["Data/Hora", "Balsa", "Nesting", "Máquina", "Operador", "Peso (kg)", "Peças Agrupadas"]];
      tableBody = logs.map(log => [
        format(new Date(log.data_registro), "dd/MM/yyyy HH:mm"),
        log.id_balsa,
        log.nesting,
        log.maquina,
        log.operador,
        Number(log.peso_total || 0).toFixed(1),
        log.pecas_agrupadas
      ]);
      colStyles = { 0: { cellWidth: 35 }, 5: { halign: 'right' }, 6: { cellWidth: 80 } };
    }

    autoTable(doc, {
      startY: 40,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [31, 58, 102],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle'
      },
      columnStyles: colStyles
    });

    doc.save(selectedBalsaId ? `Relatorio_Paineis_${selectedBalsaId}.pdf` : `Relatorio_Consolidado_${format(new Date(), "yyyyMMdd")}.pdf`);
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
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select 
                    className="field pl-9 pr-4 py-2 text-[11px] font-bold bg-slate-50/50 border-slate-200/50 w-full sm:w-32"
                    value={period}
                    onChange={e => setPeriod(e.target.value as any)}
                  >
                    <option value="today">Hoje</option>
                    <option value="week">Semana</option>
                    <option value="month">Mês</option>
                    <option value="total">Acumulado</option>
                  </select>
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <Package size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select 
                    className="field pl-9 pr-4 py-2 text-[11px] font-bold bg-slate-50/50 border-slate-200/50 w-full sm:w-40"
                    value={selectedBalsaId}
                    onChange={e => setSelectedBalsaId(e.target.value)}
                  >
                    <option value="">Todas Balsas</option>
                    {balsasData.map(b => <option key={b.id_balsa} value={b.id_balsa}>{b.id_balsa}</option>)}
                  </select>
                </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToPDF} 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 text-[10px] font-black uppercase rounded-xl hover:shadow-sm transition-all w-full sm:w-auto"
            >
              <Download size={14} className="text-primary" /> Exportar
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <Metric label="Produção Total" value={`${totals.totalPecas}`} icon={<Layers size={14} />} badge="PEÇAS" badgeVariant="success" />
            <Metric label="Volume Total" value={`${(totals.totalPeso / 1000).toFixed(1)}t`} icon={<Weight size={14} />} badge="TONELADAS" badgeVariant="success" />
            <Metric label="Balsas Ativas" value={balsasData.filter(b => b.percentual_concluido < 1 && b.percentual_concluido > 0).length} icon={<Activity size={14} />} badge="PRODUZINDO" badgeVariant="warning" />
            <Metric label="Concluídas" value={balsasData.filter(b => b.percentual_concluido >= 1).length} icon={<CheckCircle2 size={14} />} badge="FINALIZADAS" badgeVariant="success" />
          </motion.section>

          {/* Tabela Resumo por Balsa (Igual Excel) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-0 overflow-hidden mb-6"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Resumo por Balsa</h3>
               <span className="text-[10px] font-bold text-slate-400">ATUALIZADO EM TEMPO REAL</span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[800px]">
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
                       <tr key={b.id_balsa} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                          <td className="p-4 font-black text-slate-800 whitespace-nowrap">{b.id_balsa}</td>
                          <td className="p-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">{b.tipo_balsa}</td>
                          <td className="p-4 text-xs font-bold whitespace-nowrap">{(b.pendentes + b.emitidos + b.finalizados)}</td>
                          <td className="p-4 text-xs font-bold text-primary whitespace-nowrap">{b.emitidos}</td>
                          <td className="p-4 text-xs font-bold text-green-600 whitespace-nowrap">{b.finalizados}</td>
                          <td className="p-4 text-xs font-bold text-slate-400 whitespace-nowrap">{b.pendentes}</td>
                          <td className="p-4 whitespace-nowrap">
                             <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                                   <div className="h-full bg-primary" style={{ width: `${b.percentual_concluido * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-black">{(b.percentual_concluido * 100).toFixed(1)}%</span>
                             </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
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

          {/* Análise de Paradas (Downtime Analysis) */}
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
          >
             <div className="lg:col-span-1">
                <Metric 
                  label="Tempo de Máquina Parada" 
                  value={`${(stopStats.totalMin / 60).toFixed(1)}h`} 
                  icon={<AlertTriangle size={14} />} 
                  badge={stopStats.totalMin > 120 ? "ALERTA" : "NORMAL"} 
                  badgeVariant={stopStats.totalMin > 120 ? "danger" : "neutral"} 
                />
             </div>
             
             <div className="lg:col-span-2 glass-card p-6 min-h-[300px] flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                   <AlertTriangle size={14} className="text-red-500" /> Principais Motivos de Parada (Minutos)
                </h3>
                <div className="flex-1 w-full h-[200px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stopStats.reasons.slice(0, 5)} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} width={120} />
                         <Tooltip cursor={{ fill: '#F8FAFC' }} />
                         <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </motion.section>
        </>
      ) : (
        <>
          {/* Dashboard de Painéis (Estilo Excel AUX_PAINEIS) */}
          <div className="flex flex-col gap-6">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end bg-primary/5 p-6 lg:p-8 rounded-[30px] lg:rounded-[40px] border border-primary/10 gap-6">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Análise Técnica de Fluxo</span>
                   <h2 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tighter">Status de Painéis: <span className="text-primary">{selectedBalsaId}</span></h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 text-left lg:text-right w-full lg:w-auto">
                   <div>
                      <div className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 mb-0.5 lg:mb-1">Total Nestings</div>
                      <div className="text-xl lg:text-2xl font-black text-slate-800">{panelStats.reduce((acc, p) => acc + p.total, 0)}</div>
                   </div>
                   <div>
                      <div className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 mb-0.5 lg:mb-1">Processados</div>
                      <div className="text-xl lg:text-2xl font-black text-indigo-600">{panelStats.reduce((acc, p) => acc + p.processados, 0)}</div>
                   </div>
                   <div>
                      <div className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 mb-0.5 lg:mb-1">Concluídos</div>
                      <div className="text-xl lg:text-2xl font-black text-emerald-600">{panelStats.reduce((acc, p) => acc + p.concluidos, 0)}</div>
                   </div>
                   <div>
                      <div className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 mb-0.5 lg:mb-1">% Global</div>
                      <div className="text-xl lg:text-2xl font-black text-primary">
                         {((panelStats.reduce((acc, p) => acc + p.percentualConcluido, 0)) / (panelStats.length || 1)).toFixed(1)}%
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 1: % Concluído por Painel */}
                <div className="glass-card p-6 min-h-[400px] flex flex-col">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                      <BarChart3 size={14} className="text-emerald-500" /> Progresso de Conclusão (% Finalizado)
                   </h3>
                   <div className="flex-1 w-full" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={panelStats} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis dataKey="painel" type="category" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} width={50} />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} />
                            <Bar dataKey="percentualConcluido" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Gráfico 2: % Processado (Emitido) por Painel */}
                <div className="glass-card p-6 min-h-[400px] flex flex-col">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                      <Download size={14} className="text-indigo-500" /> Status de Emissão (Processados)
                   </h3>
                   <div className="flex-1 w-full" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={panelStats} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis dataKey="painel" type="category" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} width={50} />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} />
                            <Bar dataKey="percentualProcessado" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={16} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
             
             {/* Lista de Painéis (Tabela Estilo AUX_PAINEIS) */}
             <div className="glass-card p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                   <thead>
                      <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                         <th className="p-4">Painel</th>
                         <th className="p-4">Total Nestings</th>
                         <th className="p-4">Processados</th>
                         <th className="p-4">Concluídos</th>
                         <th className="p-4">Pendentes</th>
                         <th className="p-4 text-center">% Concl.</th>
                         <th className="p-4">Status Painel</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {panelStats.map(p => (
                        <tr key={p.painel} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                           <td className="p-4 font-black text-xs text-slate-800 whitespace-nowrap">{p.painel}</td>
                           <td className="p-4 text-xs font-bold text-slate-400 whitespace-nowrap">{p.total}</td>
                           <td className="p-4 text-xs font-bold text-indigo-600 whitespace-nowrap">{p.processados}</td>
                           <td className="p-4 text-xs font-bold text-emerald-600 whitespace-nowrap">{p.concluidos}</td>
                           <td className="p-4 text-xs font-bold text-red-500 whitespace-nowrap">{p.pendentes}</td>
                           <td className="p-4 text-center whitespace-nowrap">
                              <span className="text-[10px] font-black">{(p.percentualConcluido || 0).toFixed(1)}%</span>
                           </td>
                           <td className="p-4 whitespace-nowrap">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                (p.percentualConcluido || 0) >= 100 ? 'bg-green-50 text-green-600 border-green-100' : 
                                (p.percentualConcluido || 0) > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                 {(p.percentualConcluido || 0) >= 100 ? 'CONCLUÍDO' : 
                                  (p.percentualConcluido || 0) > 0 ? 'EM ANDAMENTO' : 'NÃO INICIADO'}
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
