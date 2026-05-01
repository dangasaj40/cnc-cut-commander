import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { Metric } from "@/components/Metric";
import { 
  Trophy, 
  Users, 
  Target, 
  Activity, 
  Clock, 
  TrendingUp,
  Award,
  Filter,
  BarChart as BarIcon
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  Cell, Legend
} from "recharts";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { motion } from "framer-motion";

interface OperatorStat {
  nome: string;
  totalPecas: number;
  totalPeso: number;
  totalNestings: number;
  eficiencia: number; // Peças por hora (estimado)
}

export default function RankingOperadores() {
  const [stats, setStats] = useState<OperatorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 90), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    
    // Buscar do log_retorno (fonte correta: registros de baixa de produção finalizados pelo operador)
    const { data: logs, error } = await supabase
      .from("log_retorno")
      .select("operador, nesting, peso_total, pecas_agrupadas, data_registro")
      .not("operador", "is", null)
      .gte("data_registro", `${dateRange.start}T00:00:00`)
      .lte("data_registro", `${dateRange.end}T23:59:59`);

    if (error) console.error("Erro ao buscar operadores:", error);

    if (logs) {
      const map: Record<string, { nome: string, totalPecas: number, totalPeso: number, uniqueNestings: Set<string> }> = {};
      
      logs.forEach(log => {
        const op = log.operador?.trim();
        if (!op) return;
        
        if (!map[op]) {
          map[op] = { nome: op, totalPecas: 0, totalPeso: 0, uniqueNestings: new Set() };
        }

        // Contar peças corretamente: pecas_agrupadas pode ser "PEÇA1,PEÇA2,..." ou um número
        if (log.pecas_agrupadas) {
          if (typeof log.pecas_agrupadas === "string" && log.pecas_agrupadas.includes(",")) {
            map[op].totalPecas += log.pecas_agrupadas.split(",").length;
          } else {
            const num = parseInt(log.pecas_agrupadas);
            map[op].totalPecas += isNaN(num) ? 1 : num;
          }
        } else {
          map[op].totalPecas += 1;
        }
        
        if (log.nesting) map[op].uniqueNestings.add(log.nesting);
        map[op].totalPeso += Number(log.peso_total || 0); 
      });

      const result = Object.values(map).map(item => ({
        nome: item.nome,
        totalPecas: item.totalPecas,
        totalPeso: item.totalPeso,
        totalNestings: item.uniqueNestings.size,
        eficiencia: 0
      })).sort((a, b) => b.totalPecas - a.totalPecas);
      
      setStats(result);
    }
    setLoading(false);
  };

  const colors = ["#4F46E5", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF"];

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
        code="OPR-02" 
        title="Ranking de Operadores" 
        subtitle="Análise de produtividade e metas individuais"
        right={
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
             <Filter size={14} className="text-muted-foreground ml-2" />
             <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase text-slate-800 focus:ring-0"
              value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
             />
             <span className="text-[10px] font-black text-slate-400">ATÉ</span>
             <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase text-slate-800 focus:ring-0"
              value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
             />
          </div>
        }
      />

      {/* Podium / Top 3 */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {stats.slice(0, 3).map((op, i) => (
          <motion.div 
            key={op.nome}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 }}}
            className={`glass-card p-8 flex flex-col items-center text-center relative overflow-hidden ${i === 0 ? 'border-primary/30 bg-primary/5' : ''}`}
          >
            {i === 0 && <Award className="absolute -top-2 -right-2 size-20 text-primary opacity-10" />}
            <div className={`size-16 rounded-3xl flex items-center justify-center mb-4 ${i === 0 ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-100 text-slate-400'}`}>
              {i === 0 ? <Trophy size={32} /> : <Users size={32} />}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{i + 1}º COLOCADO</div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter truncate w-full px-4">{op.nome}</h3>
            
            <div className="grid grid-cols-2 gap-4 mt-6 w-full pt-6 border-t border-slate-100">
               <div>
                  <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Peças</div>
                  <div className="text-lg font-black text-slate-800">{op.totalPecas}</div>
               </div>
               <div>
                  <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Nestings</div>
                  <div className="text-lg font-black text-slate-800">{op.totalNestings}</div>
               </div>
            </div>
          </motion.div>
        ))}
        {stats.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center glass-card border-dashed">
             <p className="text-xs font-bold text-muted-foreground uppercase">Nenhum dado de produção no período selecionado</p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ranking de Peças */}
        <div className="glass-card p-6 min-h-[400px] flex flex-col">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <BarIcon size={14} className="text-primary" /> Volume de Peças por Operador
           </h3>
           <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#F8FAFC' }}
                    />
                    <Bar dataKey="totalPecas" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40}>
                       {stats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Tabela de Detalhes */}
        <div className="glass-card p-0 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                 <TrendingUp size={14} className="text-primary" /> Performance Detalhada
              </h3>
           </div>
           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                       <th className="p-4">Operador</th>
                       <th className="p-4">Peças</th>
                       <th className="p-4">Nestings</th>
                       <th className="p-4">Peso Total</th>
                       <th className="p-4">Média/Nest.</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {stats.map((op, i) => (
                      <tr key={op.nome} className="hover:bg-slate-50 transition-colors">
                         <td className="p-4">
                            <div className="flex items-center gap-3">
                               <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                  {op.nome.substring(0, 2).toUpperCase()}
                               </div>
                               <span className="text-xs font-black text-slate-800 uppercase">{op.nome}</span>
                            </div>
                         </td>
                         <td className="p-4 text-xs font-bold text-slate-600">{op.totalPecas}</td>
                         <td className="p-4 text-xs font-bold text-slate-600">{op.totalNestings}</td>
                         <td className="p-4 text-xs font-bold text-primary">{op.totalPeso.toLocaleString()} kg</td>
                         <td className="p-4">
                            <span className="text-[10px] font-black text-slate-500">{(op.totalPecas / (op.totalNestings || 1)).toFixed(1)}</span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
