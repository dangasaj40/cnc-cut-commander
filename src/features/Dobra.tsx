import React, { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/lib/auth";
import {
  Hammer,
  Search,
  PlusCircle,
  Trash2,
  User,
  Hash,
  Calendar,
  Weight,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  Layers,
  TrendingUp,
  BarChart3,
  Activity
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area
} from "recharts";

interface CatalogoPeca {
  id: string;
  peca: string;
  nesting: string | null;
  painel: string | null;
  dimensional: string | null;
  espessura_mm: string | null;
  peso_kg: number | null;
}

interface Operador {
  id: string;
  nome: string;
}

interface DobraRecord {
  id: string;
  peca: string;
  nesting: string | null;
  painel: string | null;
  dimensional: string | null;
  espessura_mm: string | null;
  peso_kg: number | null;
  quantidade: number;
  operador_nome: string | null;
  data: string;
  observacoes: string | null;
  created_at: string;
}

const today = () => new Date().toISOString().split("T")[0];

export default function DobraPage() {
  const { user, isSupervisor, isAdmin } = useAuth();

  // ── Formulário ──
  const [pecaQuery, setPecaQuery] = useState("");
  const [pecaSuggestions, setPecaSuggestions] = useState<CatalogoPeca[]>([]);
  const [selectedPeca, setSelectedPeca] = useState<CatalogoPeca | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pecaInputRef = useRef<HTMLInputElement>(null);

  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [operadorId, setOperadorId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [data, setData] = useState(today());
  const [observacoes, setObservacoes] = useState("");

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // ── Histórico e Filtros ──
  const [filtroInicio, setFiltroInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Padrão: Últimos 30 dias
    return d.toISOString().split("T")[0];
  });
  const [filtroFim, setFiltroFim] = useState(today());
  const [historico, setHistorico] = useState<DobraRecord[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  // ── Cálculo do Dashboard de Dobra ──
  const stats = useMemo(() => {
    let pecas = 0;
    let pesoKg = 0;
    const ops = new Set<string>();

    historico.forEach((r) => {
      pecas += r.quantidade;
      pesoKg += (Number(r.peso_kg) || 0) * r.quantidade;
      if (r.operador_nome) ops.add(r.operador_nome);
    });

    // Agrupamento por dia (Toneladas)
    const diaMap: Record<string, number> = {};
    historico.forEach((r) => {
      const dStr = r.data;
      const toneladas = ((Number(r.peso_kg) || 0) * r.quantidade) / 1000;
      diaMap[dStr] = (diaMap[dStr] || 0) + toneladas;
    });

    const chartDia = Object.entries(diaMap)
      .map(([rawDate, toneladas]) => {
        const parts = rawDate.split("-");
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : rawDate;
        return { rawDate, label, toneladas: Number(toneladas.toFixed(3)) };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    // Agrupamento por operador (Toneladas)
    const opMap: Record<string, number> = {};
    historico.forEach((r) => {
      const op = r.operador_nome || "Sem Nome";
      const toneladas = ((Number(r.peso_kg) || 0) * r.quantidade) / 1000;
      opMap[op] = (opMap[op] || 0) + toneladas;
    });

    const chartOp = Object.entries(opMap)
      .map(([name, toneladas]) => ({
        name,
        toneladas: Number(toneladas.toFixed(3)),
      }))
      .sort((a, b) => b.toneladas - a.toneladas);

    return {
      totalPecas: pecas,
      totalTons: Number((pesoKg / 1000).toFixed(3)),
      totalOps: ops.size,
      chartDia,
      chartOp,
    };
  }, [historico]);

  // ─────────────────────────────────────────────
  // Fechar sugestões ao clicar fora
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─────────────────────────────────────────────
  // Carregar operadores e histórico
  // ─────────────────────────────────────────────
  useEffect(() => {
    loadOperadores();
  }, []);

  useEffect(() => {
    loadHistorico();
  }, [filtroInicio, filtroFim]);

  const loadOperadores = async () => {
    const { data: ops } = await supabase
      .from("operadores_dobra")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");
    setOperadores((ops ?? []) as Operador[]);
  };

  const loadHistorico = async () => {
    setLoadingHist(true);
    let query = supabase
      .from("dobra")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (filtroInicio) {
      query = query.gte("data", filtroInicio);
    }
    if (filtroFim) {
      query = query.lte("data", filtroFim);
    }

    const { data: hist } = await query;
    setHistorico((hist ?? []) as DobraRecord[]);
    setLoadingHist(false);
  };

  // ─────────────────────────────────────────────
  // Busca dinâmica de peças no catálogo
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!pecaQuery || pecaQuery.length < 2) {
      setPecaSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: results } = await supabase
        .from("catalogo_pecas")
        .select("id, peca, nesting, painel, dimensional, espessura_mm, peso_kg")
        .ilike("peca", `%${pecaQuery}%`)
        .limit(10);
      setPecaSuggestions((results ?? []) as CatalogoPeca[]);
      setShowSuggestions(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [pecaQuery]);

  const selectPeca = (p: CatalogoPeca) => {
    setSelectedPeca(p);
    setPecaQuery(p.peca);
    setShowSuggestions(false);
    setPecaSuggestions([]);
  };

  const clearPeca = () => {
    setSelectedPeca(null);
    setPecaQuery("");
    setPecaSuggestions([]);
  };

  // ─────────────────────────────────────────────
  // Salvar registro de dobra
  // ─────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedPeca) {
      setFeedback({ type: "err", msg: "Selecione uma peça da lista do catálogo." });
      return;
    }
    if (!operadorId) {
      setFeedback({ type: "err", msg: "Selecione o operador responsável." });
      return;
    }
    if (quantidade < 1) {
      setFeedback({ type: "err", msg: "A quantidade deve ser maior que zero." });
      return;
    }

    setBusy(true);
    const op = operadores.find((o) => o.id === operadorId);

    const { error } = await supabase.from("dobra").insert({
      peca: selectedPeca.peca,
      nesting: selectedPeca.nesting,
      painel: selectedPeca.painel,
      dimensional: selectedPeca.dimensional,
      espessura_mm: selectedPeca.espessura_mm,
      peso_kg: selectedPeca.peso_kg,
      quantidade,
      operador_id: operadorId,
      operador_nome: op?.nome ?? null,
      data,
      observacoes: observacoes.trim() || null,
      criado_por: user?.id,
    });

    setBusy(false);

    if (error) {
      setFeedback({ type: "err", msg: "Erro ao salvar: " + error.message });
    } else {
      setFeedback({ type: "ok", msg: `Peça "${selectedPeca.peca}" registrada com sucesso!` });
      clearPeca();
      setQuantidade(1);
      loadHistorico();
      // Foca automaticamente no campo de busca para o próximo registro
      setTimeout(() => {
        pecaInputRef.current?.focus();
      }, 50);
    }
  };

  // ─────────────────────────────────────────────
  // Excluir registro
  // ─────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert("Apenas administradores podem excluir registros.");
      return;
    }
    if (!confirm("Excluir este registro de dobra?")) return;
    await supabase.from("dobra").delete().eq("id", id);
    loadHistorico();
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        code="DOB-01"
        title="Dobra de Chapas"
        subtitle="Registro de peças dobradas pelo setor de dobra"
      />

      {/* ── FORMULÁRIO ── */}
      <form onSubmit={handleSave} className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-3 text-amber-400 mb-2">
          <Hammer size={18} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Registrar Peça Dobrada
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Busca de Peça */}
          <div className="md:col-span-2 space-y-1.5" ref={searchRef}>
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Search size={11} className="text-amber-400" /> Buscar Peça no Catálogo
            </label>
            <div className="relative">
              <input
                ref={pecaInputRef}
                type="text"
                className="field pl-10 pr-10"
                placeholder="Digite o código ou nome da peça (mín. 2 caracteres)..."
                value={pecaQuery}
                onChange={(e) => {
                  setPecaQuery(e.target.value);
                  if (selectedPeca) setSelectedPeca(null);
                }}
                onFocus={() => pecaSuggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              {pecaQuery && (
                <button
                  type="button"
                  onClick={clearPeca}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}

              {/* Dropdown de sugestões */}
              {showSuggestions && pecaSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {pecaSuggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPeca(p)}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.06] transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="text-sm font-bold text-white">{p.peca}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-3">
                        {p.nesting && <span>Nesting: {p.nesting}</span>}
                        {p.painel && <span>Painel: {p.painel}</span>}
                        {p.espessura_mm && <span>{p.espessura_mm}mm</span>}
                        {p.peso_kg && <span>{p.peso_kg} kg</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && pecaQuery.length >= 2 && pecaSuggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl px-4 py-3">
                  <span className="text-xs text-muted-foreground">Nenhuma peça encontrada no catálogo.</span>
                </div>
              )}
            </div>

            {/* Card de pré-visualização da peça selecionada */}
            {selectedPeca && (
              <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-[8px] font-bold text-amber-400 uppercase tracking-widest mb-1">Peça</div>
                  <div className="text-xs font-black">{selectedPeca.peca}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Nesting</div>
                  <div className="text-xs font-mono">{selectedPeca.nesting || "—"}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Dimensional</div>
                  <div className="text-xs font-mono">{selectedPeca.dimensional || "—"}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Espessura / Peso</div>
                  <div className="text-xs">{selectedPeca.espessura_mm ? `${selectedPeca.espessura_mm}mm` : "—"} / {selectedPeca.peso_kg ? `${selectedPeca.peso_kg}kg` : "—"}</div>
                </div>
              </div>
            )}
          </div>

          {/* Operador */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <User size={11} className="text-amber-400" /> Operador Responsável
            </label>
            <div className="relative">
              <select
                className="field appearance-none pr-10"
                value={operadorId}
                onChange={(e) => setOperadorId(e.target.value)}
                required
              >
                <option value="">Selecione o operador...</option>
                {operadores.map((op) => (
                  <option key={op.id} value={op.id}>{op.nome}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Hash size={11} className="text-amber-400" /> Quantidade Dobrada
            </label>
            <input
              type="number"
              min={1}
              className="field"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              required
            />
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar size={11} className="text-amber-400" /> Data
            </label>
            <input
              type="date"
              className="field"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Observações (opcional)
            </label>
            <input
              type="text"
              className="field"
              placeholder="Anotações ou detalhes..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-bold ${
            feedback.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {feedback.type === "ok" ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            {feedback.msg}
          </div>
        )}

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={busy || !selectedPeca}
          className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-sm font-bold disabled:opacity-50"
        >
          {busy ? (
            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><PlusCircle size={18} /> Registrar Dobra</>
          )}
        </button>
      </form>

      {/* ── FILTROS E DASHBOARD ── */}
      <div className="space-y-6">
        {/* Filtro por data */}
        <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Período de Análise</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Filtre as dobras por data e visualize os gráficos</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Início</span>
              <input
                type="date"
                className="field py-2 px-3 text-xs w-36 text-slate-900 bg-white"
                value={filtroInicio}
                onChange={(e) => setFiltroInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Fim</span>
              <input
                type="date"
                className="field py-2 px-3 text-xs w-36 text-slate-900 bg-white"
                value={filtroFim}
                onChange={(e) => setFiltroFim(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Métricas Principais (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Volume Dobrado</span>
              <div className="text-2xl font-black text-slate-900">{stats.totalTons.toFixed(3)}t</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Toneladas acumuladas</span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Weight size={20} />
            </div>
          </div>

          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Peças Processadas</span>
              <div className="text-2xl font-black text-slate-900">{stats.totalPecas} un</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Quantidade de peças</span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers size={20} />
            </div>
          </div>

          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Operadores Ativos</span>
              <div className="text-2xl font-black text-slate-900">{stats.totalOps}</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">No setor de dobra</span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <User size={20} />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Volume Dobrado por Dia */}
          <div className="glass-card p-6 min-h-[350px] flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-500" /> Histórico de Dobras por Dia (t)
            </h3>
            <div className="flex-1 w-full" style={{ height: "240px" }}>
              {stats.chartDia.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase font-bold tracking-widest">
                  Sem dados no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#475569" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#475569" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", color: "#000" }}
                      labelStyle={{ fontSize: 10, fontWeight: "bold", color: "#0f172a" }}
                      itemStyle={{ fontSize: 10, color: "#d97706" }}
                    />
                    <Area type="monotone" dataKey="toneladas" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorTons)" name="Toneladas" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico 2: Desempenho por Operador */}
          <div className="glass-card p-6 min-h-[350px] flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-500" /> Produção por Operador (t)
            </h3>
            <div className="flex-1 w-full" style={{ height: "240px" }}>
              {stats.chartOp.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase font-bold tracking-widest">
                  Sem dados no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartOp} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#475569" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#475569" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", color: "#000" }}
                      labelStyle={{ fontSize: 10, fontWeight: "bold", color: "#0f172a" }}
                      itemStyle={{ fontSize: 10, color: "#d97706" }}
                    />
                    <Bar dataKey="toneladas" fill="#d97706" radius={[4, 4, 0, 0]} name="Toneladas" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTÓRICO ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <Layers size={16} className="text-amber-400" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Histórico de Dobras</h2>
          <span className="ml-auto text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            {historico.length} registro{historico.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loadingHist ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="size-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-widest font-bold">Carregando...</span>
          </div>
        ) : historico.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Hammer size={32} className="opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold">Nenhum registro ainda</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    {["Data", "Peça", "Nesting / Painel", "Dim. / Esp.", "Peso (kg)", "Qtd", "Operador", "Obs.", ""].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historico.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold">{r.peca}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] text-muted-foreground">
                        <div>{r.nesting || "—"}</div>
                        <div className="text-[9px]">{r.painel || ""}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                        {r.dimensional || "—"}<br />
                        {r.espessura_mm ? `${r.espessura_mm}mm` : ""}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono">
                        {r.peso_kg ? Number(r.peso_kg).toFixed(2) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {r.quantidade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium">{r.operador_nome || "—"}</td>
                      <td className="px-5 py-3.5 text-[10px] text-muted-foreground max-w-[140px] truncate">{r.observacoes || "—"}</td>
                      <td className="px-5 py-3.5">
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {historico.map((r) => (
                <div key={r.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{r.peca}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")} · {r.operador_nome || "—"}
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {r.quantidade} un
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground">
                    {r.nesting && <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">Nesting: {r.nesting}</span>}
                    {r.painel && <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">Painel: {r.painel}</span>}
                    {r.espessura_mm && <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">{r.espessura_mm}mm</span>}
                    {r.peso_kg && <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10">{r.peso_kg}kg</span>}
                  </div>
                  {r.observacoes && (
                    <p className="text-[10px] text-muted-foreground italic">{r.observacoes}</p>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
