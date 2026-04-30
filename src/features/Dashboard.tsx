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
  Download
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
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayNestings, setDayNestings] = useState<any[]>([]);
  const [nightNestings, setNightNestings] = useState<any[]>([]);
  const [latestNestings, setLatestNestings] = useState<any[]>([]);

  useEffect(() => {
    const since = period === "today" ? startOfDay(new Date())
      : period === "week" ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    setLoading(true);
    supabase
      .from("producao")
      .select("data,quantidade,peso_total,nesting")
      .gte("data", format(since, "yyyy-MM-dd"))
      .then(({ data }) => { setRows((data ?? []) as Row[]); setLoading(false); });
  }, [period]);

  useEffect(() => {
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const week = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const month = format(startOfMonth(new Date()), "yyyy-MM-dd");

    // Estatísticas e lista de nestings por turno hoje
    supabase
      .from("producao")
      .select("data,hora_inicio,nesting,versao,data_importacao")
      .gte("data", today)
      .then(({ data }) => {
        const d = data || [];
        
        const day: any[] = [];
        const night: any[] = [];
        
        // Filtra únicos por turno
        d.forEach(r => {
          if (!r.nesting || !r.hora_inicio) return;
          
          // Extrai a hora do timestamp (ex: 2024-04-26T14:30:00)
          const timePart = r.hora_inicio.includes("T") ? r.hora_inicio.split("T")[1] : r.hora_inicio;
          const h = parseInt(timePart.split(":")[0]);
          const isDay = h >= 7 && h < 18;
          
          if (isDay) {
            if (!day.find(item => item.nesting === r.nesting)) day.push({ ...r, hora: timePart });
          } else {
            if (!night.find(item => item.nesting === r.nesting)) night.push({ ...r, hora: timePart });
          }
        });

        setDayNestings(day);
        setNightNestings(night);
      });

    // Últimos nestings carregados no Catálogo
    supabase
      .from("catalogo_pecas")
      .select("nesting,versao,data_importacao")
      .order("data_importacao", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const d = data || [];
        // Filtra únicos pelo nome do nesting
        const unique = d.reduce((acc: any[], current) => {
          if (!acc.find(item => item.nesting === current.nesting)) {
            acc.push(current);
          }
          return acc;
        }, []);
        setLatestNestings(unique.slice(0, 6));
      });
  }, []);

  const totals = useMemo(() => {
    const pieces = rows.reduce((s, r) => s + (r.quantidade || 0), 0);
    const kg = rows.reduce((s, r) => s + Number(r.peso_total || 0), 0);
    const nestings = new Set(rows.map((r) => r.nesting).filter(Boolean)).size;
    return { pieces, kg, nestings };
  }, [rows]);

  const chartData = useMemo(() => {
    const days = 7;
    const map: Record<string, { kg: number, pieces: number, nestings: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      map[d] = { kg: 0, pieces: 0, nestings: 0 };
    }
    rows.forEach((r) => {
      if (map[r.data]) {
        map[r.data].kg += Number(r.peso_total || 0);
        map[r.data].pieces += Number(r.quantidade || 0);
        map[r.data].nestings += r.nesting ? 1 : 0;
      }
    });
    return Object.entries(map).map(([d, data]) => ({ 
      day: format(new Date(d + "T00:00:00"), "dd/MM"), 
      kg: Math.round(data.kg),
      pieces: data.pieces,
      nestings: data.nestings
    }));
  }, [rows]);

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
        title="Análise de Produção"
        right={
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel} 
              className="flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] text-xs font-bold uppercase rounded-full hover:bg-[#E2E8F0] transition-colors"
            >
              <Download size={14} /> Exportar Excel
            </motion.button>
            <div className="flex gap-1">
              {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={period === p ? { background: "#4F46E5", color: "#FFFFFF" } : {}}
                className={`px-4 py-2 text-xs font-semibold capitalize rounded-full transition-all ${
                  period === p ? "shadow-md" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                }`}
              >
                {p === "today" ? "Hoje" : p === "week" ? "Semana" : "Mês"}
              </button>
            ))}
            </div>
          </div>
        }
      />

      {/* Top 3 Large Cards */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Metric 
          label="Peças Cortadas" 
          value={loading ? "—" : totals.pieces} 
          icon={<Square size={14} className="text-[#94A3B8]" />}
          badge={badges.pieces.text}
          badgeVariant={badges.pieces.variant}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPieces" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="pieces" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPieces)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Metric>

        <Metric 
          label="Produção" 
          value={loading ? "—" : Math.round(totals.kg)} 
          unit="KG"
          hint={loading ? "" : `${(totals.kg / 1000).toFixed(2)} Toneladas`}
          icon={<Square size={14} className="text-[#94A3B8]" />}
          badge={badges.kg.text}
          badgeVariant={badges.kg.variant}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A3E635" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#A3E635" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="kg" stroke="#A3E635" strokeWidth={3} fillOpacity={1} fill="url(#colorKg)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Metric>

        <Metric 
          label="Planos (Nestings)" 
          value={loading ? "—" : totals.nestings} 
          icon={<Square size={14} className="text-[#94A3B8]" />}
          badge={badges.nestings.text}
          badgeVariant={badges.nestings.variant}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <Bar dataKey="nestings" fill="#4F46E5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="pieces" fill="#A3E635" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Metric>
      </motion.section>

      {/* Bottom Row - Novos Cards */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        
        {/* Turno do Dia */}
        <NestingListCard 
          title="Turno do Dia" 
          nestings={dayNestings} 
          icon={<Layers size={16} className="text-[#4F46E5]" />}
          delay="100ms"
        />

        {/* Turno da Noite */}
        <NestingListCard 
          title="Turno da Noite" 
          nestings={nightNestings} 
          icon={<Clock size={16} className="text-[#A3E635]" />}
          delay="200ms"
        />

        {/* Últimos Lançamentos (Catálogo) */}
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="glass-card p-0 overflow-hidden flex flex-col"
        >
          <div className="p-6 pb-3 border-b border-[#E2E8F0]">
            <span className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
               <Package size={16} className="text-[#94A3B8]" /> Últimos Nestings Carregados
            </span>
          </div>
          
          <div className="divide-y divide-[#F1F5F9] max-h-[220px] overflow-y-auto custom-scrollbar">
            {latestNestings.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#94A3B8]">Nenhum nesting carregado.</div>
            ) : (
              latestNestings.map((n, i) => (
                <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
                      <Layers size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">{n.nesting}</div>
                      <div className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> {n.data_importacao ? format(new Date(n.data_importacao), "dd/MM/yy") : "--/--"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-[#E0E7FF] text-[#4F46E5] text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
                      V{n.versao || 1}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link 
            to="/configuracoes" 
            search={{ tab: "catalogo" }}
            className="p-3 bg-[#F1F5F9] border-t border-[#E2E8F0] text-center hover:bg-slate-200 transition-colors cursor-pointer block"
          >
             <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest flex items-center justify-center gap-2">
                Ver Todos no Catálogo <ArrowRight size={12} />
             </span>
          </Link>
        </motion.div>
      </motion.section>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-[#84CC16]" : "text-[#0F172A]"}`}>
        {value}
      </span>
    </div>
  );
}

function NestingListCard({ title, nestings, icon, delay }: { title: string, nestings: any[], icon: React.ReactNode, delay: string }) {
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="glass-card p-0 flex flex-col min-h-[220px] overflow-hidden"
    >
      <div className="p-6 pb-3 border-b border-[#E2E8F0]">
        <span className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
           {icon} {title}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto max-h-[200px] custom-scrollbar p-2">
         {nestings.length === 0 ? (
           <div className="p-8 text-center text-xs text-[#94A3B8] uppercase tracking-widest font-bold opacity-50">Sem registros neste turno</div>
         ) : (
           <div className="flex flex-col gap-1">
             {nestings.map((n, i) => (
               <div key={i} className="flex items-center justify-between p-3 px-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#0F172A] tracking-tight">{n.nesting}</span>
                      <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2">
                         {n.data_importacao && (
                           <span className="flex items-center gap-1">
                             <Calendar size={10} /> {format(new Date(n.data_importacao), "dd/MM/yy")}
                           </span>
                         )}
                         {n.hora && (
                           <span className="flex items-center gap-1 border-l border-slate-200 pl-2">
                             <Clock size={10} /> {n.hora.substring(0,5)}
                           </span>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  {n.versao && (
                    <div className="bg-[#E0E7FF] text-[#4F46E5] text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
                      V{n.versao}
                    </div>
                  )}
               </div>
             ))}
           </div>
         )}
      </div>
      <div className="p-3 bg-[#F1F5F9] border-t border-[#E2E8F0] text-center">
         <span className="text-[10px] font-black text-primary uppercase tracking-widest">Total: {nestings.length} Nestings</span>
      </div>
    </motion.div>
  );
}
