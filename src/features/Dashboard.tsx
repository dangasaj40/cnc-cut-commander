import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { Metric } from "@/components/Metric";
import { startOfDay, startOfWeek, startOfMonth, format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { 
  Trophy, 
  Target, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Package, 
  Weight, 
  Layers 
} from "lucide-react";

type Period = "today" | "week" | "month";

interface Row {
  data: string;
  quantidade: number;
  peso_total: number | null;
  tempo_total_segundos: number | null;
  nesting: string | null;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("today");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = period === "today" ? startOfDay(new Date())
      : period === "week" ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    setLoading(true);
    supabase
      .from("producao")
      .select("data,quantidade,peso_total,tempo_total_segundos,nesting")
      .gte("data", format(since, "yyyy-MM-dd"))
      .then(({ data }) => { setRows((data ?? []) as Row[]); setLoading(false); });
  }, [period]);

  const totals = useMemo(() => {
    const pieces = rows.reduce((s, r) => s + (r.quantidade || 0), 0);
    const kg = rows.reduce((s, r) => s + Number(r.peso_total || 0), 0);
    const nestings = new Set(rows.map((r) => r.nesting).filter(Boolean)).size;
    return { pieces, kg, nestings };
  }, [rows]);

  const chartData = useMemo(() => {
    const days = 7;
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      map[d] = 0;
    }
    rows.forEach((r) => {
      if (map[r.data] !== undefined) map[r.data] += Number(r.peso_total || 0);
    });
    return Object.entries(map).map(([d, kg]) => ({ day: format(new Date(d + "T00:00:00"), "dd/MM"), kg: Math.round(kg) }));
  }, [rows]);
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        code="DSH-01"
        title="Dashboard"
        subtitle="Métricas de Produção"
        right={
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                  period === p ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                }`}
              >
                {p === "today" ? "Hoje" : p === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Metric 
          label="Peças Cortadas" 
          value={loading ? "—" : totals.pieces.toLocaleString("pt-BR")} 
          unit="PCS" 
          icon={<Package size={20} />}
        />
        <Metric 
          label="Massa Total" 
          value={loading ? "—" : totals.kg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} 
          unit="KG" 
          highlight 
          hint={`${(totals.kg / 1000).toFixed(2)} t`}
          icon={<Weight size={20} />}
        />
        <Metric 
          label="Nestings Únicos" 
          value={loading ? "—" : totals.nestings.toString()} 
          unit="UN" 
          icon={<Layers size={20} />}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-primary" size={20} />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">Produção (KG)</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">T-7D → Hoje</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--laser)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--laser)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: "rgba(24, 24, 27, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  cursor={{ fill: "rgba(0, 210, 255, 0.05)" }}
                />
                <Bar dataKey="kg" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-primary" size={20} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Eficiência</h2>
          </div>
          
          <div className="space-y-4 flex-1">
             <SummaryItem icon={<Trophy size={16}/>} label="Total (Toneladas)" value={`${(totals.kg / 1000).toFixed(2)} t`} />
             <SummaryItem icon={<Target size={16}/>} label="Peças Processadas" value={`${totals.pieces} pcs`} />
             <SummaryItem icon={<Layers size={16}/>} label="Nestings Únicos" value={totals.nestings.toString()} />
             <SummaryItem icon={<TrendingUp size={16}/>} label="Lançamentos" value={rows.length.toString()} />
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
             <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-3">
                <div className="size-2 bg-primary rounded-full shadow-[0_0_8px_var(--laser)] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Sistema Sincronizado</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="size-8 bg-white/5 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
      </div>
      <span className="text-xs font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}

export function fmtDuration(sec: number) {
  return "N/A";
}
