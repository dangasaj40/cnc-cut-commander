import React, { useEffect, useMemo, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2, Users, Package, Scale, Calendar, Filter, ArrowLeft, Eye, Activity } from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────
interface DobraRecord {
  id: string;
  data: string;
  peca: string;
  nesting: string | null;
  painel: string | null;
  operador_nome: string | null;
  turno: string | null;
  maquina: string | null;
  balsa: string | null;
  quantidade: number;
  peso_kg: number | null;
  observacoes: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const lastOfMonth = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
};

const COLORS_DAY = "#f97316";
const COLORS_NIGHT = "#818cf8";

// ─── Component ───────────────────────────────────────────────
export default function DobraPublic() {
  // Read filter state from URL search params
  const search = useSearch({ from: "/shared/dobra" }) as Record<string, string>;

  const [filtroInicio, setFiltroInicio] = useState(search.from || firstOfMonth());
  const [filtroFim, setFiltroFim] = useState(search.to || lastOfMonth());
  const [filtroTurno, setFiltroTurno] = useState<"" | "D" | "N">((search.turno as "" | "D" | "N") || "");
  const [maquinaAtiva, setMaquinaAtiva] = useState<"DOBRADEIRA" | "PRENSA">(
    (search.maquina as "DOBRADEIRA" | "PRENSA") || "DOBRADEIRA"
  );
  const [historico, setHistorico] = useState<DobraRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("dobra")
          .select("id, data, peca, nesting, painel, operador_nome, turno, maquina, balsa, quantidade, peso_kg, observacoes")
          .eq("maquina", maquinaAtiva)
          .gte("data", filtroInicio)
          .lte("data", filtroFim)
          .order("data", { ascending: false });
        if (error) throw error;
        setHistorico((data ?? []) as DobraRecord[]);
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filtroInicio, filtroFim, maquinaAtiva]);

  // Update URL params when filters change
  useEffect(() => {
    navigate({
      to: "/shared/dobra",
      search: { from: filtroInicio, to: filtroFim, turno: filtroTurno || undefined, maquina: maquinaAtiva },
      replace: true,
    } as any);
  }, [filtroInicio, filtroFim, filtroTurno, maquinaAtiva]);

  // ── Computed stats ──
  const historicoFiltrado = useMemo(() => {
    if (!filtroTurno) return historico;
    return historico.filter((r) => r.turno === filtroTurno);
  }, [historico, filtroTurno]);

  const stats = useMemo(() => {
    const calc = (records: DobraRecord[]) => {
      let pecas = 0; let pesoKg = 0;
      const ops = new Set<string>();
      records.forEach((r) => {
        pecas += r.quantidade;
        pesoKg += (Number(r.peso_kg) || 0) * r.quantidade;
        if (r.operador_nome) ops.add(r.operador_nome);
      });
      return { pecas, tons: Number((pesoKg / 1000).toFixed(3)), ops: ops.size };
    };
    const total = calc(historicoFiltrado);

    const diaMap: Record<string, number> = {};
    historicoFiltrado.forEach((r) => {
      const t = ((Number(r.peso_kg) || 0) * r.quantidade) / 1000;
      diaMap[r.data] = (diaMap[r.data] || 0) + t;
    });
    const chartDia = Object.entries(diaMap)
      .map(([rawDate, toneladas]) => {
        const parts = rawDate.split("-");
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : rawDate;
        return { rawDate, label, toneladas: Number(toneladas.toFixed(3)) };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    const opMap: Record<string, { D: number; N: number }> = {};
    historico.forEach((r) => {
      const op = r.operador_nome || "Sem Nome";
      if (!opMap[op]) opMap[op] = { D: 0, N: 0 };
      const t = ((Number(r.peso_kg) || 0) * r.quantidade) / 1000;
      if (r.turno === "N") opMap[op].N += t;
      else opMap[op].D += t;
    });
    const chartOp = Object.entries(opMap)
      .map(([fullName, v]) => ({
        name: fullName.split(" ").slice(0, 2).join(" "),
        diurno: Number(v.D.toFixed(3)),
        noturno: Number(v.N.toFixed(3)),
        total: Number((v.D + v.N).toFixed(3)),
      }))
      .sort((a, b) => b.total - a.total);

    const diasAtivos = Object.keys(diaMap).length;
    const mediaTonsDia = diasAtivos > 0 ? total.tons / diasAtivos : 0;

    return { total, chartDia, chartOp, mediaTonsDia, diasAtivos };
  }, [historico, historicoFiltrado]);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#030712]">
      {/* ── Public Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-laser/20 flex items-center justify-center">
              <Activity size={16} className="text-laser" />
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-widest text-white">
                CNC Cut Commander
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Relatório Público — Setor Dobra</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
              <Eye size={10} /> Modo Visualização
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Machine Toggle ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            {(["DOBRADEIRA", "PRENSA"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMaquinaAtiva(m)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  maquinaAtiva === m
                    ? "bg-laser text-black border-laser"
                    : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Acesso somente leitura · sem autenticação</p>
        </div>

        {/* ── Filters ── */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={13} className="text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Filtros</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">De</label>
              <input
                type="date"
                className="field text-xs py-2 bg-white/5 border-white/10 text-white w-full"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Até</label>
              <input
                type="date"
                className="field text-xs py-2 bg-white/5 border-white/10 text-white w-full"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Turno</label>
              <select
                className="field text-xs py-2 bg-[#0f172a] border-white/10 text-white w-full"
                style={{ colorScheme: "dark" }}
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value as "" | "D" | "N")}
              >
                <option value="">Todos</option>
                <option value="D">Diurno (D)</option>
                <option value="N">Noturno (N)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFiltroInicio(firstOfMonth()); setFiltroFim(lastOfMonth()); setFiltroTurno(""); }}
                className="w-full py-2 border border-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Mês atual
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 border-4 border-white/10 border-t-laser rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Package, label: "Peças processadas", value: stats.total.pecas.toLocaleString("pt-BR"), color: "text-laser" },
                { icon: Scale, label: "Total (ton)", value: `${stats.total.tons.toFixed(3)} t`, color: "text-blue-400" },
                { icon: BarChart2, label: "Média ton/dia", value: `${stats.mediaTonsDia.toFixed(3)} t`, color: "text-violet-400" },
                { icon: Users, label: "Operadores ativos", value: stats.total.ops.toString(), color: "text-emerald-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 flex items-center gap-3"
                >
                  <div className={`size-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                    <p className={`text-lg font-black ${color}`}>{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Chart: Toneladas por dia */}
              <div className="glass-card p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                  Toneladas / Dia
                </p>
                {stats.chartDia.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-10">Sem dados no período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.chartDia} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }}
                        labelStyle={{ color: "#94a3b8" }}
                      />
                      <Bar dataKey="toneladas" name="Toneladas" radius={[4, 4, 0, 0]} fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Chart: Produção por operador */}
              <div className="glass-card p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                  Produção por Operador (ton)
                </p>
                {stats.chartOp.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-10">Sem dados no período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.chartOp} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#94a3b8" }} width={80} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, color: "#64748b" }} />
                      <Bar dataKey="diurno" name="Diurno" stackId="a" fill={COLORS_DAY} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="noturno" name="Noturno" stackId="a" fill={COLORS_NIGHT} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── History Table ── */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Histórico de Registros
                </p>
                <span className="text-[9px] text-slate-600">{historicoFiltrado.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02]">
                    <tr>
                      {["Data", "Peça", "Qtd", "Peso", "Operador", "Turno", "Balsa"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-[8px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap first:rounded-l-lg last:rounded-r-lg">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {historicoFiltrado.slice(0, 200).map((r) => {
                      const parts = r.data?.split("-") ?? [];
                      const dataFmt = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : r.data;
                      return (
                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-3 py-2 text-[10px] font-mono text-slate-400 whitespace-nowrap">{dataFmt}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-bold text-white">{r.peca}</span>
                            {r.nesting && <span className="block text-[8px] text-slate-600 font-mono">{r.nesting}</span>}
                          </td>
                          <td className="px-3 py-2 text-[10px] font-bold text-laser">{r.quantidade}</td>
                          <td className="px-3 py-2 text-[10px] font-mono text-slate-400">
                            {r.peso_kg != null ? `${((Number(r.peso_kg) * r.quantidade) / 1000).toFixed(3)} t` : "—"}
                          </td>
                          <td className="px-3 py-2 text-[10px] text-slate-300">{r.operador_nome ?? "—"}</td>
                          <td className="px-3 py-2">
                            {r.turno && (
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold ${r.turno === "D" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                                {r.turno === "D" ? "Diurno" : "Noturno"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[10px] font-mono text-slate-500">{r.balsa ?? "—"}</td>
                        </tr>
                      );
                    })}
                    {historicoFiltrado.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-10 text-center text-xs text-slate-600">Nenhum registro no período selecionado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {historicoFiltrado.length > 200 && (
                  <p className="text-center text-[9px] text-slate-600 mt-3">Exibindo 200 de {historicoFiltrado.length} registros. Use os filtros para refinar.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-4">
          <p className="text-[9px] text-slate-700 uppercase tracking-widest">
            CNC Cut Commander · Relatório gerado em {new Date().toLocaleString("pt-BR")}
          </p>
        </footer>
      </main>
    </div>
  );
}
