import React, { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom";
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
  Sun,
  Moon,
  Package,
  Pencil,
  Wrench,
  Settings2,
  Activity,
  History,
  AlertTriangle,
  Sparkles,
  Share2,
  Camera,
  ImagePlus,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

// Carregamento dinâmico da SDK Gemini (igual ao GerenciarCatalogo)
const getGemini = () => import("@google/generative-ai");
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  turno: "D" | "N" | null;
  maquina: "PRENSA" | "DOBRADEIRA" | null;
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
  operador_id: string | null;
  operador_nome: string | null;
  turno: "D" | "N" | null;
  maquina: "PRENSA" | "DOBRADEIRA" | null;
  balsa: string | null;
  data: string;
  observacoes: string | null;
  created_at: string;
}

interface ParadaDobra {
  id: string;
  maquina: "PRENSA" | "DOBRADEIRA";
  operador_id: string | null;
  operador_nome: string;
  motivo: string;
  data_inicio: string;
  data_fim: string | null;
  duracao_minutos: number;
  observacao: string | null;
  status: "Em aberto" | "Finalizada";
  created_at: string;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

const firstOfMonth = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

const lastOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];

const calcPrevMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { inicio: firstOfMonth(d), fim: lastOfMonth(d) };
};

// ─── Machine constants ────────────────────────────────────────────────────────

const MAQUINA = {
  DOBRADEIRA: { label: "Dobradeira", color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)" },
  PRENSA:     { label: "Prensa",     color: "#8b5cf6", bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.35)" },
};

// ─── Turno helpers ────────────────────────────────────────────────────────────

const TURNO = {
  D: { label: "Diurno", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  N: { label: "Noturno", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
};


function TurnoBadge({ turno, size = "sm" }: { turno: "D" | "N" | null; size?: "xs" | "sm" }) {
  if (!turno) return <span className="text-muted-foreground">—</span>;
  const t = TURNO[turno];
  const cls = size === "xs"
    ? "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black"
    : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black";
  return (
    <span className={cls} style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
      {turno === "D" ? <Sun size={size === "xs" ? 9 : 11} /> : <Moon size={size === "xs" ? 9 : 11} />}
      {t.label}
    </span>
  );
}

const normalizeCode = (str: string) => 
  str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp: number[][] = [];
  const alen = a.length;
  const blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (let i = 0; i <= alen; i++) tmp[i] = [i];
  for (let j = 0; j <= blen; j++) tmp[0][j] = j;
  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      tmp[i][j] = a.charAt(i - 1) === b.charAt(j - 1)
        ? tmp[i - 1][j - 1]
        : Math.min(tmp[i - 1][j - 1] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j] + 1);
    }
  }
  return tmp[alen][blen];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DobraPage() {
  const { user, isAdmin, isSupervisor } = useAuth();

  // ── Máquina ativa ──
  const [maquinaAtiva, setMaquinaAtiva] = useState<"PRENSA" | "DOBRADEIRA">("DOBRADEIRA");

  // ── Form state ──
  const [pecaQuery, setPecaQuery] = useState("");
  const [pecaSuggestions, setPecaSuggestions] = useState<CatalogoPeca[]>([]);
  const [selectedPeca, setSelectedPeca] = useState<CatalogoPeca | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pecaInputRef = useRef<HTMLInputElement>(null);

  const [operadores, setOperadores] = useState<OpDobra[]>([]); // type OpDobra is declared above
  type OpDobra = Operador;
  const [operadorId, setOperadorId] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [balsaTipo, setBalsaTipo] = useState<"RAKE" | "BOX" | "S/TAG">("RAKE");
  const [balsaNumero, setBalsaNumero] = useState("");
  const [data, setData] = useState(today());
  const [observacoes, setObservacoes] = useState("");

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // ── Edit Modal state ──
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DobraRecord | null>(null);
  const [editPecaQuery, setEditPecaQuery] = useState("");
  const [editPecaSuggestions, setEditPecaSuggestions] = useState<CatalogoPeca[]>([]);
  const [editSelectedPeca, setEditSelectedPeca] = useState<CatalogoPeca | null>(null);
  const [editShowSuggestions, setEditShowSuggestions] = useState(false);
  const [editOperadorId, setEditOperadorId] = useState("");
  const [editQuantidade, setEditQuantidade] = useState(1);
  const [editBalsaTipo, setEditBalsaTipo] = useState<"RAKE" | "BOX" | "S/TAG">("RAKE");
  const [editBalsaNumero, setEditBalsaNumero] = useState("");
  const [editData, setEditData] = useState("");
  const [editObservacoes, setEditObservacoes] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const editSearchRef = useRef<HTMLDivElement>(null);
  const editPecaInputRef = useRef<HTMLInputElement>(null);

  // ── Filter state — default: mês atual ──
  const [filtroInicio, setFiltroInicio] = useState(firstOfMonth);
  const [filtroFim, setFiltroFim] = useState(lastOfMonth);
  const [filtroTurno, setFiltroTurno] = useState<"" | "D" | "N">("");

  // ── Data ──
  const [historico, setHistorico] = useState<DobraRecord[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  // ── Downtime/Paradas state ──
  const [paradas, setParadas] = useState<ParadaDobra[]>([]);
  const [loadingParadas, setLoadingParadas] = useState(false);
  const [activeStop, setActiveStop] = useState<ParadaDobra | null>(null);
  const [motivosParada, setMotivosParada] = useState<string[]>([]);
  
  // Parada inline form
  const [opParadaId, setOpParadaId] = useState("");
  const [motivoParada, setMotivoParada] = useState("");
  const [obsParada, setObsParada] = useState("");
  const [busyParada, setBusyParada] = useState(false);

  // Parada manual form
  const [manualParadaOpen, setManualParadaOpen] = useState(false);
  const [manData, setManData] = useState(today());
  const [manHoraInicio, setManHoraInicio] = useState("");
  const [manHoraFim, setManHoraFim] = useState("");
  const [manOpId, setManOpId] = useState("");
  const [manMotivo, setManMotivo] = useState("");
  const [manObs, setManObs] = useState("");
  const [busyManParada, setBusyManParada] = useState(false);

  // ── AI Bulk Import state ──
  interface AiBulkRow {
    id: string; // key temporário
    peca: string;
    quantidade: number;
    nesting: string | null;
    painel: string | null;
    dimensional: string | null;
    espessura_mm: string | null;
    peso_kg: number | null;
    catalogMatch: boolean;
    balsaTipo: "RAKE" | "BOX" | "S/TAG";
    balsaNumero: string;
    aiOperadorNome: string | null;
    aiData: string | null;
    rowData: string;  // data individual por linha (ISO YYYY-MM-DD)
    rowOperadorId: string; // operador individual por linha (ID)
  }
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const aiFileRef = useRef<HTMLInputElement>(null);
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
  const [aiImageB64, setAiImageB64] = useState<string | null>(null);
  const [aiImageMime, setAiImageMime] = useState<string>("image/jpeg");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiStep, setAiStep] = useState<"upload" | "reviewing">("upload");
  const [aiRows, setAiRows] = useState<AiBulkRow[]>([]);
  const [dbCatalog, setDbCatalog] = useState<any[]>([]);
  const [aiActiveEditIdx, setAiActiveEditIdx] = useState<number | null>(null);
  const [aiEditQuery, setAiEditQuery] = useState<string>("");
  const [aiBulkOperadorId, setAiBulkOperadorId] = useState("");
  const [aiBulkData, setAiBulkData] = useState(today());
  const [aiBulkBusy, setAiBulkBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [historicoView, setHistoricoView] = useState<"registros" | "resumo">("registros");

  // ─────────────────────────────────────────────
  // Computed: filtered records + stats
  // ─────────────────────────────────────────────

  const historicoFiltrado = useMemo(() => {
    if (!filtroTurno) return historico;
    return historico.filter((r) => r.turno === filtroTurno);
  }, [historico, filtroTurno]);

  const stats = useMemo(() => {
    const calc = (records: DobraRecord[]) => {
      let pecas = 0;
      let pesoKg = 0;
      const ops = new Set<string>();
      records.forEach((r) => {
        pecas += r.quantidade;
        pesoKg += (Number(r.peso_kg) || 0) * r.quantidade;
        if (r.operador_nome) ops.add(r.operador_nome);
      });
      return { pecas, tons: Number((pesoKg / 1000).toFixed(3)), ops: ops.size };
    };

    const total = calc(historicoFiltrado);
    const statD = calc(historico.filter((r) => r.turno === "D"));
    const statN = calc(historico.filter((r) => r.turno === "N"));

    // Chart 1: Volume por dia (toneladas) — usa registros filtrados por turno
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

    // Chart 2: Produção por operador — sempre usa historico completo (data) para mostrar D e N
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
        fullName,
        diurno: Number(v.D.toFixed(3)),
        noturno: Number(v.N.toFixed(3)),
        total: Number((v.D + v.N).toFixed(3)),
      }))
      .sort((a, b) => b.total - a.total);

    // Chart 3: Peças por Balsa
    const balsaMap: Record<string, number> = {};
    historicoFiltrado.forEach((r) => {
      if (!r.balsa) return;
      balsaMap[r.balsa] = (balsaMap[r.balsa] || 0) + r.quantidade;
    });
    const chartBalsa = Object.entries(balsaMap)
      .map(([balsa, qtd]) => ({ balsa, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 15); // máx 15 balsas

    const diasAtivos = Object.keys(diaMap).length;
    const mediaTonsDia = diasAtivos > 0 ? total.tons / diasAtivos : 0;

    return { total, statD, statN, chartDia, chartOp, chartBalsa, mediaTonsDia, diasAtivos };
  }, [historico, historicoFiltrado]);

  // Resumo agrupado por peça (para a view de "Resumo por Peça")
  const resumoPecas = useMemo(() => {
    const map: Record<string, { quantidade: number; pesoTotal: number }> = {};
    historicoFiltrado.forEach((r) => {
      if (!map[r.peca]) map[r.peca] = { quantidade: 0, pesoTotal: 0 };
      map[r.peca].quantidade += r.quantidade;
      map[r.peca].pesoTotal += (Number(r.peso_kg) || 0) * r.quantidade;
    });
    return Object.entries(map)
      .map(([peca, v]) => ({ peca, ...v }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [historicoFiltrado]);

  // Datas que têm parada registrada para a máquina ativa (para pontos vermelhos no gráfico)
  const datasComParada = useMemo(() => {
    const set = new Set<string>();
    paradas
      .filter((p) => p.maquina === maquinaAtiva)
      .forEach((p) => {
        set.add(p.data_inicio.split("T")[0]);
      });
    return set;
  }, [paradas, maquinaAtiva]);

  // Sugestões do catálogo em tempo real para edição na tabela de revisão da IA
  const aiSuggestions = useMemo(() => {
    if (aiActiveEditIdx === null || !aiEditQuery || aiEditQuery.length < 2) return [];
    const queryNorm = normalizeCode(aiEditQuery);
    return dbCatalog
      .filter((item) => (item.normalizedPeca || "").includes(queryNorm))
      .slice(0, 5);
  }, [aiActiveEditIdx, aiEditQuery, dbCatalog]);

  // ─────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────

  // Click-outside handlers for both searches
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
      if (editSearchRef.current && !editSearchRef.current.contains(e.target as Node))
        setEditShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    loadOperadores();
    setOperadorId(""); // reset operador ao trocar de máquina
    loadParadas();
    fetchMotivos();
  }, [maquinaAtiva]);

  useEffect(() => {
    loadHistorico();
    loadParadas();
  }, [filtroInicio, filtroFim, maquinaAtiva]);

  // Carrega catálogo ao abrir importador por IA
  useEffect(() => {
    if (aiImportOpen && dbCatalog.length === 0) {
      supabase
        .from("catalogo_pecas")
        .select("peca, nesting, painel, dimensional, espessura_mm, peso_kg")
        .in("tipo_balsa", ["BOX", "RAKE", "BOX/RAKE", "RAKE/BOX"])
        .then(({ data }) => {
          if (data) {
            const enriched = data.map(item => ({
              ...item,
              normalizedPeca: normalizeCode(item.peca)
            }));
            setDbCatalog(enriched);
          }
        });
    }
  }, [aiImportOpen]);

  const findBestCatalogMatch = (ocrPeca: string, catalogList = dbCatalog) => {
    if (!ocrPeca || catalogList.length === 0) return null;
    const normOcr = normalizeCode(ocrPeca);
    if (!normOcr) return null;

    let bestMatch = null;
    let minDistance = 999;
    
    for (const item of catalogList) {
      const normDb = item.normalizedPeca || normalizeCode(item.peca);
      if (normDb === normOcr) {
        return item;
      }

      const dist = getLevenshteinDistance(normOcr, normDb);
      const threshold = Math.max(2, Math.floor(normDb.length * 0.35));
      if (dist < minDistance && dist <= threshold) {
        minDistance = dist;
        bestMatch = item;
      }
    }
    return bestMatch;
  };

  const handleAiRowPecaChange = (idx: number, newVal: string) => {
    // Busca rápida: apenas correspondência exata para não travar a digitação
    const normNewVal = normalizeCode(newVal);
    const cat = dbCatalog.find(item => (item.normalizedPeca || "") === normNewVal) || null;
    
    setAiRows(rows => rows.map((r, i) => {
      if (i === idx) {
        return {
          ...r,
          peca: newVal,
          nesting: cat?.nesting ?? null,
          painel: cat?.painel ?? r.painel,
          dimensional: cat?.dimensional ?? null,
          espessura_mm: cat?.espessura_mm ?? null,
          peso_kg: cat ? Number(cat.peso_kg) : null,
          catalogMatch: !!cat
        };
      }
      return r;
    }));
  };

  // Busca dinâmica de peças — Insert
  useEffect(() => {
    if (!pecaQuery || pecaQuery.length < 2) {
      setPecaSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: results } = await supabase
        .from("catalogo_pecas")
        .select("id, peca, nesting, painel, dimensional, espessura_mm, peso_kg")
        .in("tipo_balsa", ["BOX", "RAKE", "BOX/RAKE", "RAKE/BOX"])
        .ilike("peca", `%${pecaQuery}%`)
        .limit(10);
      setPecaSuggestions((results ?? []) as CatalogoPeca[]);
      setShowSuggestions(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [pecaQuery]);

  // Busca dinâmica de peças — Edit
  useEffect(() => {
    if (!editPecaQuery || editPecaQuery.length < 2 || editSelectedPeca?.peca === editPecaQuery) {
      setEditPecaSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: results } = await supabase
        .from("catalogo_pecas")
        .select("id, peca, nesting, painel, dimensional, espessura_mm, peso_kg")
        .in("tipo_balsa", ["BOX", "RAKE", "BOX/RAKE", "RAKE/BOX"])
        .ilike("peca", `%${editPecaQuery}%`)
        .limit(10);
      setEditPecaSuggestions((results ?? []) as CatalogoPeca[]);
      setEditShowSuggestions(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [editPecaQuery, editSelectedPeca]);

  // ─────────────────────────────────────────────
  // Data loaders
  // ─────────────────────────────────────────────

  const loadOperadores = async () => {
    const { data: ops } = await supabase
      .from("operadores_dobra")
      .select("id, nome, turno, maquina")
      .eq("ativo", true)
      .eq("maquina", maquinaAtiva)
      .order("turno")
      .order("nome");
    setOperadores((ops ?? []) as Operador[]);
  };

  const loadHistorico = async () => {
    setLoadingHist(true);
    let query = supabase
      .from("dobra")
      .select("*")
      .eq("maquina", maquinaAtiva)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });
    if (filtroInicio) query = query.gte("data", filtroInicio);
    if (filtroFim) query = query.lte("data", filtroFim);
    const { data: hist } = await query;
    setHistorico((hist ?? []) as DobraRecord[]);
    setLoadingHist(false);
  };

  const fetchMotivos = async () => {
    try {
      const { data } = await supabase.from("system_settings").select("value").eq("key", "motivos_parada").maybeSingle();
      if (data?.value) {
        setMotivosParada(JSON.parse(data.value));
      } else {
        setMotivosParada([
          "MANUTENÇÃO PREVENTIVA",
          "MANUTENÇÃO CORRETIVA",
          "AJUSTE DE MÁQUINA",
          "AGUARDANDO MATERIAL",
          "SEM OPERADOR",
          "LIMPEZA",
          "OUTROS"
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadParadas = async () => {
    setLoadingParadas(true);
    try {
      // 1. Carrega parada em aberto para a máquina selecionada
      const { data: active } = await supabase
        .from("paradas_dobra")
        .select("*")
        .eq("maquina", maquinaAtiva)
        .eq("status", "Em aberto")
        .maybeSingle();
      
      setActiveStop(active as ParadaDobra | null);

      // 2. Carrega histórico de paradas no período
      let query = supabase
        .from("paradas_dobra")
        .select("*")
        .eq("maquina", maquinaAtiva)
        .order("data_inicio", { ascending: false });

      if (filtroInicio) {
        // Converte data simples yyyy-MM-dd para timestamp do início do dia
        query = query.gte("data_inicio", `${filtroInicio}T00:00:00Z`);
      }
      if (filtroFim) {
        // Converte data simples yyyy-MM-dd para timestamp do fim do dia
        query = query.lte("data_inicio", `${filtroFim}T23:59:59Z`);
      }

      const { data: list } = await query;
      setParadas((list ?? []) as ParadaDobra[]);
    } catch (err) {
      console.error("Erro ao carregar paradas:", err);
    } finally {
      setLoadingParadas(false);
    }
  };

  const startParada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opParadaId || !motivoParada) {
      alert("Selecione o operador e o motivo da parada.");
      return;
    }
    setBusyParada(true);
    try {
      const op = operadores.find(o => o.id === opParadaId);
      const { error } = await supabase.from("paradas_dobra").insert({
        maquina: maquinaAtiva,
        operador_id: opParadaId,
        operador_nome: op?.nome ?? "Sem nome",
        motivo: motivoParada,
        status: "Em aberto",
        data_inicio: new Date().toISOString(),
        observacao: obsParada.trim() || null,
        criado_por: user?.id
      });
      if (error) throw error;
      
      setOpParadaId("");
      setMotivoParada("");
      setObsParada("");
      await loadParadas();
    } catch (err: any) {
      alert("Erro ao iniciar parada: " + err.message);
    } finally {
      setBusyParada(false);
    }
  };

  const finishParada = async (id: string) => {
    setBusyParada(true);
    try {
      // Carrega o registro para calcular a duração
      const { data: record } = await supabase
        .from("paradas_dobra")
        .select("data_inicio")
        .eq("id", id)
        .single();
      
      if (!record) return;

      const dataFim = new Date();
      const diffMs = dataFim.getTime() - new Date(record.data_inicio).getTime();
      const duracaoMinutos = Math.max(1, Math.round(diffMs / (1000 * 60)));

      const { error } = await supabase
        .from("paradas_dobra")
        .update({
          status: "Finalizada",
          data_fim: dataFim.toISOString(),
          duracao_minutos: duracaoMinutos,
          observacao: obsParada.trim() ? obsParada.trim() : undefined
        })
        .eq("id", id);
      
      if (error) throw error;
      
      setObsParada("");
      await loadParadas();
    } catch (err: any) {
      alert("Erro ao finalizar parada: " + err.message);
    } finally {
      setBusyParada(false);
    }
  };

  const saveManualParada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manOpId || !manMotivo || !manHoraInicio || !manHoraFim) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    setBusyManParada(true);
    try {
      const dataInicio = new Date(`${manData}T${manHoraInicio}:00`);
      const dataFim = new Date(`${manData}T${manHoraFim}:00`);
      
      let diffMs = dataFim.getTime() - dataInicio.getTime();
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // virada de dia

      const duracaoMinutos = Math.round(diffMs / (1000 * 60));
      const op = operadores.find(o => o.id === manOpId);

      const { error } = await supabase.from("paradas_dobra").insert({
        maquina: maquinaAtiva,
        operador_id: manOpId,
        operador_nome: op?.nome ?? "Sem nome",
        motivo: manMotivo,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        duracao_minutos: duracaoMinutos,
        observacao: manObs.trim() || null,
        status: "Finalizada",
        criado_por: user?.id
      });

      if (error) throw error;
      
      setManOpId("");
      setManMotivo("");
      setManHoraInicio("");
      setManHoraFim("");
      setManObs("");
      setManualParadaOpen(false);
      await loadParadas();
    } catch (err: any) {
      alert("Erro ao registrar parada manual: " + err.message);
    } finally {
      setBusyManParada(false);
    }
  };

  const deleteParada = async (id: string) => {
    if (!isAdmin && !isSupervisor) {
      alert("Apenas administradores ou supervisores podem excluir paradas.");
      return;
    }
    if (!confirm("Excluir este registro de parada?")) return;

    try {
      const { error } = await supabase.from("paradas_dobra").delete().eq("id", id);
      if (error) throw error;
      await loadParadas();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // ─────────────────────────────────────────────
  // AI Bulk Import handlers
  // ─────────────────────────────────────────────

  const handleShare = () => {
    const base = window.location.origin;
    const params = new URLSearchParams({
      from: filtroInicio,
      to: filtroFim,
      maquina: maquinaAtiva,
      ...(filtroTurno ? { turno: filtroTurno } : {}),
    });
    const url = `${base}/shared/dobra?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  const handleAiImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiImageMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAiPreviewUrl(dataUrl);
      setAiImageB64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const processImageWithAI = async () => {
    if (!aiImageB64) return;
    setAiProcessing(true);
    try {
      const { data: keyData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "gemini_api_key")
        .maybeSingle();
      const apiKey =
        keyData?.value ||
        localStorage.getItem("gemini_api_key") ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Chave API Gemini não configurada. Vá em Configurações → Sistema.");

      const { GoogleGenerativeAI } = await getGemini();
      const genAI = new GoogleGenerativeAI(apiKey.trim());

      let modelsToTry = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
        if (res.ok) {
          const json = await res.json();
          const availableModels = json.models || [];
          const genModels = availableModels.filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent') &&
            !m.name.includes('nano') &&
            !m.name.includes('experimental')
          );
          const preferred = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-2.5-pro"];
          const availableNames = genModels.map((m: any) => m.name.replace('models/', ''));
          const discoveredPreferred = preferred.filter(p => availableNames.includes(p));
          const others = availableNames.filter(name => !discoveredPreferred.includes(name));
          modelsToTry = [...discoveredPreferred, ...others];
          console.log("[AI OCR] Modelos autodescobertos na rota Dobra:", modelsToTry);
        }
      } catch (e) {
        console.error("[AI OCR] Falha na autodescoberta de modelos", e);
      }

      const prompt = `Você é um especialista em OCR de documentos industriais escritos à mão em português brasileiro.

Esta imagem é uma FOLHA DE CONTROLE DE DOBRA (dobradeira de chapas) preenchida manualmente por operadores de fábrica.
A foto pode estar levemente inclinada ou girada — ignore a orientação e leia o conteúdo normalmente.

ESTRUTURA DA TABELA (colunas da esquerda para direita):
1. PAINEL — identificador do painel (ex: "BOX12", "RK10", "BOX19", "RK17"). Pode estar vazio.
2. PEÇA — código/nome da peça (ex: "RD HB 8B", "RL1 HB2AC", "BCB1RL1HB1AB"). CAMPO OBRIGATÓRIO.
3. DOBRAR — coluna de confirmação. Nesta fábrica é marcado como "OK", "Ok", "ok", "V", "✓", "√". Linhas SEM marcação foram canceladas — IGNORE essas linhas.
4. DATA — data no formato DD/MM ou DD/MM/AA (ex: "24/02", "24/02/26").
5. ASSINATURA OPERADOR — nome cursivo do operador (ex: "Andreza", "Anderson", "Osvaldo").

REGRAS OBRIGATÓRIAS:
1. Cada linha preenchida na tabela com marcação em DOBRAR representa 1 (UMA) linha no JSON.
2. NUNCA some ou agrupe peças iguais. Se a mesma peça aparecer várias vezes em linhas separadas na imagem, retorne itens SEPARADOS no JSON para cada linha física, mantendo exatamente a ordem sequencial em que aparecem de cima para baixo.
3. Cada objeto deve ter a quantidade padrão de 1 no campo "quantidade".
4. Leia TODOS os códigos de peça exatamente como escritos (ex: "BPRRFA85HB4", "RFRO-RFA94HB55C").
5. Não tente corrigir ou normalizar os códigos de peça — copie-os literalmente.
6. Se PAINEL estiver em branco/vazio para uma linha, use null ou string vazia.
7. A data costuma ser a mesma em toda a folha — se não conseguir ler uma data específica, use a data mais comum da folha.
8. O nome do operador costuma ser o mesmo em toda a folha (assinatura cursiva).

RETORNE APENAS um array JSON puro, sem markdown, sem explicações, sem texto antes ou depois.
Formato de cada objeto:
{"peca": "RD HB 8B", "painel": "BOX12", "quantidade": 1, "data": "24/02/26", "operador": "Andreza"}

IMPORTANTE: Se houver qualquer dúvida na leitura, faça sua melhor estimativa — NUNCA retorne array vazio se houver linhas com marcação OK visíveis na imagem.
Se realmente não encontrar nada, retorne: []`;

      let parsed: { peca: string; painel?: string; quantidade: number; data?: string; operador?: string }[] = [];
      const errors: string[] = [];
      for (const modelName of modelsToTry) {
        try {
          console.log(`[AI OCR] Tentando modelo: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: aiImageB64, mimeType: aiImageMime } },
          ]);
          const rawText = result.response.text();
          console.log(`[AI OCR] Resposta bruta do ${modelName}:`, rawText);
          
          if (!rawText || rawText.trim() === "") {
            console.warn(`[AI OCR] Resposta vazia do modelo ${modelName}`);
            continue;
          }

          // Tenta extrair JSON mesmo que venha com texto ao redor
          const text = rawText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
          
          // Busca o primeiro array JSON no texto
          const match = text.match(/\[[\s\S]*\]/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            parsed = JSON.parse(text);
          }
          console.log(`[AI OCR] Sucesso no parsing com ${modelName}:`, parsed);
          if (parsed && parsed.length > 0) break;
        } catch (err: any) {
          console.warn(`Modelo ${modelName} falhou:`, err.message);
          errors.push(`${modelName}: ${err.message}`);
          if (err.message?.includes("API_KEY_INVALID")) throw new Error("Chave API inválida.");
        }
      }

      if (!parsed || parsed.length === 0) {
        if (errors.length > 0) {
          alert(`Houve erro na comunicação com a API do Gemini:\n\n${errors.join("\n")}\n\nVerifique se a chave de API nas Configurações do Sistema está correta.`);
        } else {
          alert("A IA não encontrou peças legíveis na imagem. Verifique se a coluna DOBRAR tem marcações 'OK' visíveis e tente novamente com melhor iluminação.");
        }
        return;
      }

      // Carrega todo o catálogo em memória para correspondência inteligente se ainda não carregado
      let currentCatalog = dbCatalog;
      if (currentCatalog.length === 0) {
        const { data: catalogItems } = await supabase
          .from("catalogo_pecas")
          .select("peca, nesting, painel, dimensional, espessura_mm, peso_kg")
          .in("tipo_balsa", ["BOX", "RAKE", "BOX/RAKE", "RAKE/BOX"]);
        currentCatalog = (catalogItems || []).map((item: any) => ({
          ...item,
          normalizedPeca: normalizeCode(item.peca)
        }));
        setDbCatalog(currentCatalog);
      }

      // Enriquece cada linha buscando no catálogo em memória com correspondência inteligente
      const enriched: AiBulkRow[] = parsed.map((item, i) => {
        const cat = findBestCatalogMatch(item.peca, currentCatalog);
        const painelLido = item.painel?.trim() ?? "";
        
        let detectedBalsaTipo: "RAKE" | "BOX" | "S/TAG" = "RAKE";
        let detectedBalsaNumero = painelLido;

        const painelUpper = painelLido.toUpperCase();
        if (painelUpper.includes("BOX") || painelUpper.startsWith("B")) {
          detectedBalsaTipo = "BOX";
          const numMatch = painelLido.match(/\d+/);
          detectedBalsaNumero = numMatch ? numMatch[0] : painelLido.replace(/BOX/gi, "").trim();
        } else if (painelUpper.includes("RAKE") || painelUpper.includes("RK") || painelUpper.startsWith("R")) {
          detectedBalsaTipo = "RAKE";
          const numMatch = painelLido.match(/\d+/);
          detectedBalsaNumero = numMatch ? numMatch[0] : painelLido.replace(/(RAKE|RK)/gi, "").trim();
        } else if (
          painelUpper.includes("S/TAG") || 
          painelUpper.includes("STAG") || 
          painelUpper.includes("SEM TAG") || 
          painelUpper.includes("S/T") ||
          !painelLido
        ) {
          detectedBalsaTipo = "S/TAG";
          detectedBalsaNumero = "";
        } else {
          // Fallback: se tiver apenas número, ou se começar com número
          const numMatch = painelLido.match(/\d+/);
          if (numMatch) {
            detectedBalsaNumero = numMatch[0];
          }
        }

        // Tenta encontrar correspondência de operador para cada linha
        const rowOpNome = item.operador?.trim()?.toUpperCase() ?? "";
        let matchedOpId = "";
        if (rowOpNome) {
          const opMatch = operadores.find((o) =>
            o.nome.toUpperCase().includes(rowOpNome) || rowOpNome.includes(o.nome.toUpperCase().split(" ")[0])
          );
          if (opMatch) matchedOpId = opMatch.id;
        }

        return {
          id: `row-${i}-${Date.now()}`,
          peca: cat?.peca ?? item.peca.trim(),
          quantidade: item.quantidade ?? 1,
          nesting: cat?.nesting ?? null,
          painel: cat?.painel ?? painelLido ?? null,
          dimensional: cat?.dimensional ?? null,
          espessura_mm: cat?.espessura_mm ?? null,
          peso_kg: cat ? Number(cat.peso_kg) : null,
          catalogMatch: !!cat,
          balsaTipo: detectedBalsaTipo,
          balsaNumero: detectedBalsaNumero,
          aiOperadorNome: item.operador?.trim() ?? null,
          aiData: item.data?.trim() ?? null,
          rowData: today(), // será preenchido abaixo com a data extraída pela IA
          rowOperadorId: matchedOpId,
        };
      });

      // Converte a data extraída pela IA (DD/MM ou DD/MM/AA) para ISO por linha
      const parseAiDate = (aiDate: string | null): string => {
        if (!aiDate) return today();
        const parts = aiDate.split("/");
        if (parts.length >= 2) {
          const dd = parts[0].padStart(2, "0");
          const mm = parts[1].padStart(2, "0");
          const year = parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : String(new Date().getFullYear());
          const iso = `${year}-${mm}-${dd}`;
          if (!isNaN(Date.parse(iso))) return iso;
        }
        return today();
      };

      const enrichedWithDates = enriched.map(row => ({
        ...row,
        rowData: parseAiDate(row.aiData),
      }));

      setAiRows(enrichedWithDates);

      // Pré-preenche a data global se a IA conseguiu extrair (converte "01/07" → "2026-07-01")
      const firstData = enriched[0]?.aiData;
      if (firstData) {
        const [dd, mm] = firstData.split("/");
        if (dd && mm) {
          const year = new Date().getFullYear();
          const iso = `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
          setAiBulkData(iso);
        }
      }

      // Tenta pré-selecionar o operador se o nome extraído bater com algum cadastrado
      const firstOpNome = enriched[0]?.aiOperadorNome?.toUpperCase();
      if (firstOpNome) {
        const opMatch = operadores.find((o) =>
          o.nome.toUpperCase().includes(firstOpNome) || firstOpNome.includes(o.nome.toUpperCase().split(" ")[0])
        );
        if (opMatch) setAiBulkOperadorId(opMatch.id);
      }
      setAiStep("reviewing");
    } catch (err: any) {
      alert("Erro na IA: " + err.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const saveBulkRows = async () => {
    // Valida se todas as linhas têm um operador definido (seja individual ou global)
    const hasMissingOperator = aiRows.some(r => !r.rowOperadorId && !aiBulkOperadorId);
    if (hasMissingOperator) {
      alert("Selecione o operador responsável para todas as peças.");
      return;
    }
    if (aiRows.length === 0) return;
    setAiBulkBusy(true);
    try {
      const payload = aiRows.map((r) => {
        const rowOpId = r.rowOperadorId || aiBulkOperadorId;
        const op = operadores.find((o) => o.id === rowOpId);
        return {
          peca: r.peca,
          nesting: r.nesting,
          painel: r.painel,
          dimensional: r.dimensional,
          espessura_mm: r.espessura_mm,
          peso_kg: r.peso_kg,
          quantidade: r.quantidade,
          operador_id: rowOpId,
          operador_nome: op?.nome ?? null,
          turno: op?.turno ?? null,
          maquina: maquinaAtiva,
          balsa: r.balsaTipo === "S/TAG" ? "S/TAG" : (r.balsaNumero.trim() ? `${r.balsaTipo}-${r.balsaNumero.trim()}` : null),
          data: r.rowData || aiBulkData,
          observacoes: "Importado via IA",
          criado_por: user?.id,
        };
      });

      const { error } = await supabase.from("dobra").insert(payload);
      if (error) throw error;

      // Reset modal
      setAiImportOpen(false);
      setAiStep("upload");
      setAiRows([]);
      setAiImageB64(null);
      setAiPreviewUrl(null);
      setAiBulkOperadorId("");
      loadHistorico();
      alert(`✅ ${payload.length} peça(s) registrada(s) com sucesso!`);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setAiBulkBusy(false);
    }
  };

  // ─────────────────────────────────────────────
  // Peca handlers
  // ─────────────────────────────────────────────

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
  // Period shortcuts
  // ─────────────────────────────────────────────

  const applyMesAtual = () => {
    setFiltroInicio(firstOfMonth());
    setFiltroFim(lastOfMonth());
  };

  const applyMesAnterior = () => {
    const { inicio, fim } = calcPrevMonth();
    setFiltroInicio(inicio);
    setFiltroFim(fim);
  };

  const applyHoje = () => {
    const t = today();
    setFiltroInicio(t);
    setFiltroFim(t);
  };

  // ─────────────────────────────────────────────
  // Save / Update / Delete
  // ─────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!selectedPeca)
      return setFeedback({ type: "err", msg: "Selecione uma peça da lista do catálogo." });
    if (!operadorId)
      return setFeedback({ type: "err", msg: "Selecione o operador responsável." });
    if (quantidade < 1)
      return setFeedback({ type: "err", msg: "A quantidade deve ser maior que zero." });

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
      turno: op?.turno ?? null,
      maquina: maquinaAtiva,
      balsa: balsaTipo === "S/TAG" ? "S/TAG" : (balsaNumero.trim() ? `${balsaTipo}-${balsaNumero.trim()}` : null),
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
      setBalsaNumero("");
      loadHistorico();
      setTimeout(() => pecaInputRef.current?.focus(), 50);
    }
  };

  const startEdit = (r: DobraRecord) => {
    setEditRecord(r);
    setEditSelectedPeca({
      id: "",
      peca: r.peca,
      nesting: r.nesting,
      painel: r.painel,
      dimensional: r.dimensional,
      espessura_mm: r.espessura_mm,
      peso_kg: r.peso_kg,
    });
    setEditPecaQuery(r.peca);
    setEditOperadorId(r.operador_id || "");
    setEditQuantidade(r.quantidade);
    setEditData(r.data);
    setEditObservacoes(r.observacoes || "");

    if (r.balsa === "S/TAG") {
      setEditBalsaTipo("S/TAG");
      setEditBalsaNumero("");
    } else if (r.balsa?.startsWith("RAKE-")) {
      setEditBalsaTipo("RAKE");
      setEditBalsaNumero(r.balsa.substring(5));
    } else if (r.balsa?.startsWith("BOX-")) {
      setEditBalsaTipo("BOX");
      setEditBalsaNumero(r.balsa.substring(4));
    } else {
      setEditBalsaTipo("RAKE");
      setEditBalsaNumero("");
    }

    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditRecord(null);
    setEditFeedback(null);
    setEditPecaQuery("");
    setEditSelectedPeca(null);
    setEditPecaSuggestions([]);
  };

  const selectEditPeca = (p: CatalogoPeca) => {
    setEditSelectedPeca(p);
    setEditPecaQuery(p.peca);
    setEditShowSuggestions(false);
    setEditPecaSuggestions([]);
  };

  const clearEditPeca = () => {
    setEditSelectedPeca(null);
    setEditPecaQuery("");
    setEditPecaSuggestions([]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFeedback(null);
    if (!editSelectedPeca)
      return setEditFeedback({ type: "err", msg: "Selecione uma peça da lista do catálogo." });
    if (!editOperadorId)
      return setEditFeedback({ type: "err", msg: "Selecione o operador responsável." });
    if (editQuantidade < 1)
      return setEditFeedback({ type: "err", msg: "A quantidade deve ser maior que zero." });

    setEditBusy(true);
    const op = operadores.find((o) => o.id === editOperadorId);

    const { error } = await supabase
      .from("dobra")
      .update({
        peca: editSelectedPeca.peca,
        nesting: editSelectedPeca.nesting,
        painel: editSelectedPeca.painel,
        dimensional: editSelectedPeca.dimensional,
        espessura_mm: editSelectedPeca.espessura_mm,
        peso_kg: editSelectedPeca.peso_kg,
        quantidade: editQuantidade,
        operador_id: editOperadorId,
        operador_nome: op?.nome ?? null,
        turno: op?.turno ?? null,
        maquina: maquinaAtiva,
        balsa: editBalsaTipo === "S/TAG" ? "S/TAG" : (editBalsaNumero.trim() ? `${editBalsaTipo}-${editBalsaNumero.trim()}` : null),
        data: editData,
        observacoes: editObservacoes.trim() || null,
      })
      .eq("id", editRecord?.id);

    setEditBusy(false);

    if (error) {
      setEditFeedback({ type: "err", msg: "Erro ao atualizar: " + error.message });
    } else {
      closeEditModal();
      loadHistorico();
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin && !isSupervisor) return alert("Apenas administradores ou supervisores podem excluir registros.");
    if (!confirm("Excluir este registro de dobra?")) return;
    await supabase.from("dobra").delete().eq("id", id);
    loadHistorico();
  };

  // ── Operator groups for select ──
  const opsDiurno = operadores.filter((o) => o.turno === "D");
  const opsNoturno = operadores.filter((o) => o.turno === "N");
  const opsSemTurno = operadores.filter((o) => !o.turno);

  // ── Label do período selecionado ──
  const periodoLabel = useMemo(() => {
    if (!filtroInicio && !filtroFim) return "Todos os registros";
    if (filtroInicio === filtroFim)
      return new Date(filtroInicio + "T12:00:00").toLocaleDateString("pt-BR");
    const ini = new Date(filtroInicio + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short",
    });
    const fim = new Date(filtroFim + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    });
    return `${ini} – ${fim}`;
  }, [filtroInicio, filtroFim]);

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

      {/* ── TOGGLE DE MÁQUINA ── */}
      <div className="glass-card p-2 flex gap-2">
        <button
          type="button"
          onClick={() => setMaquinaAtiva("DOBRADEIRA")}
          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200"
          style={maquinaAtiva === "DOBRADEIRA"
            ? { background: MAQUINA.DOBRADEIRA.bg, color: MAQUINA.DOBRADEIRA.color, border: `1.5px solid ${MAQUINA.DOBRADEIRA.border}`, boxShadow: `0 0 16px ${MAQUINA.DOBRADEIRA.bg}` }
            : { background: "transparent", color: "#64748b", border: "1.5px solid transparent" }
          }
        >
          <Settings2 size={16} />
          Dobradeira
        </button>
        <button
          type="button"
          onClick={() => setMaquinaAtiva("PRENSA")}
          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200"
          style={maquinaAtiva === "PRENSA"
            ? { background: MAQUINA.PRENSA.bg, color: MAQUINA.PRENSA.color, border: `1.5px solid ${MAQUINA.PRENSA.border}`, boxShadow: `0 0 16px ${MAQUINA.PRENSA.bg}` }
            : { background: "transparent", color: "#64748b", border: "1.5px solid transparent" }
          }
        >
          <Wrench size={16} />
          Prensa
        </button>
      </div>

      {/* ── BOTÃO COMPARTILHAR ── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleShare}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
            shareCopied
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
          }`}
        >
          <Share2 size={13} />
          {shareCopied ? "Link copiado!" : "Compartilhar Relatório"}
        </button>
      </div>
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
                  <div className="text-xs">
                    {selectedPeca.espessura_mm ? `${selectedPeca.espessura_mm}mm` : "—"} / {selectedPeca.peso_kg ? `${selectedPeca.peso_kg}kg` : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Operador — agrupado por turno */}
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

                {opsDiurno.length > 0 && (
                  <optgroup label="☀️ Diurno">
                    {opsDiurno.map((op) => (
                      <option key={op.id} value={op.id}>{op.nome}</option>
                    ))}
                  </optgroup>
                )}

                {opsNoturno.length > 0 && (
                  <optgroup label="🌙 Noturno">
                    {opsNoturno.map((op) => (
                      <option key={op.id} value={op.id}>{op.nome}</option>
                    ))}
                  </optgroup>
                )}

                {opsSemTurno.length > 0 && (
                  <optgroup label="Sem turno definido">
                    {opsSemTurno.map((op) => (
                      <option key={op.id} value={op.id}>{op.nome}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Preview do turno do operador selecionado */}
            {operadorId && (() => {
              const op = operadores.find(o => o.id === operadorId);
              if (!op?.turno) return null;
              return (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Turno do operador:</span>
                  <TurnoBadge turno={op.turno} size="xs" />
                </div>
              );
            })()}
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

          {/* Balsa (Rake/Box/S/TAG + Numero manual) */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Package size={11} className="text-amber-400" /> Balsa (Modelo / Nº)
            </label>
            <div className="flex gap-2">
              <div className="relative w-28 shrink-0">
                <select
                  className="field appearance-none pr-8 text-xs py-2.5 bg-[#1E293B] text-white border-white/10"
                  style={{ colorScheme: 'dark' }}
                  value={balsaTipo}
                  onChange={(e) => {
                    const val = e.target.value as "RAKE" | "BOX" | "S/TAG";
                    setBalsaTipo(val);
                    if (val === "S/TAG") setBalsaNumero("");
                  }}
                >
                  <option value="RAKE" style={{ background: '#1E293B', color: '#fff' }}>RAKE</option>
                  <option value="BOX" style={{ background: '#1E293B', color: '#fff' }}>BOX</option>
                  <option value="S/TAG" style={{ background: '#1E293B', color: '#fff' }}>S/TAG</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <input
                type="text"
                className="field text-xs py-2.5 disabled:opacity-50 disabled:bg-slate-100/50 dark:disabled:bg-white/[0.03]"
                placeholder={balsaTipo === "S/TAG" ? "Sem número" : "Número (Ex: 13)"}
                value={balsaTipo === "S/TAG" ? "" : balsaNumero}
                onChange={(e) => setBalsaNumero(e.target.value)}
                disabled={balsaTipo === "S/TAG"}
              />
            </div>
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
          <div className="space-y-1.5 md:col-span-2">
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

        {feedback && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-bold ${
            feedback.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {feedback.type === "ok"
              ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
              : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            {feedback.msg}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy || !selectedPeca}
            className="btn-primary flex-1 py-4 flex items-center justify-center gap-3 text-sm font-bold disabled:opacity-50"
          >
            {busy ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><PlusCircle size={18} /> Registrar Dobra</>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setAiImportOpen(true); setAiStep("upload"); }}
            className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-400 hover:text-violet-300 text-xs font-bold uppercase tracking-widest transition-all"
            title="Importar peças em lote via foto com IA"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">IA Foto</span>
          </button>
        </div>
      </form>

      {/* ── SEÇÃO DE HISTÓRICO DE PARADAS ── */}
      <div className="glass-card p-6 flex flex-col justify-between min-h-[300px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-3 text-slate-700">
              <History size={16} />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">Histórico de Paradas ({MAQUINA[maquinaAtiva].label})</h3>
            </div>
            <button
              type="button"
              onClick={() => setManualParadaOpen(true)}
              className="text-[9px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-1"
            >
              <PlusCircle size={12} /> Lançar Parada Manual
            </button>
          </div>

          {loadingParadas ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
              <div className="size-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-xs uppercase tracking-widest font-bold">Carregando...</span>
            </div>
          ) : paradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Activity size={24} className="opacity-20 mb-2" />
              <span className="text-xs font-bold uppercase tracking-widest">Sem paradas registradas</span>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 text-left">
              {paradas.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{p.motivo}</span>
                      {p.status === "Em aberto" ? (
                        <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-[8px] font-bold uppercase">Em aberto</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded-full text-[8px] font-mono text-slate-700">{p.duracao_minutos} min</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-600 font-medium">
                      {p.operador_nome} · {new Date(p.data_inicio).toLocaleDateString("pt-BR")} às {new Date(p.data_inicio).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {p.observacao && <p className="text-[9px] text-slate-500 italic truncate max-w-[280px]">"{p.observacao}"</p>}
                  </div>

                  {(isAdmin || isSupervisor) && (
                    <button
                      onClick={() => deleteParada(p.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-auto"
                      title="Excluir Parada"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL PARADA MANUAL (PORTAL) ── */}
      {manualParadaOpen && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setManualParadaOpen(false); }}
        >
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <PlusCircle size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest">Lançar Parada Manual</h3>
              </div>
              <button
                onClick={() => setManualParadaOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveManualParada} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Data</label>
                <input
                  type="date"
                  className="field text-xs py-2 bg-slate-900 border-white/10 text-white"
                  value={manData}
                  onChange={(e) => setManData(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Hora Início</label>
                  <input
                    type="time"
                    className="field text-xs py-2 bg-slate-900 border-white/10 text-white"
                    value={manHoraInicio}
                    onChange={(e) => setManHoraInicio(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Hora Fim</label>
                  <input
                    type="time"
                    className="field text-xs py-2 bg-slate-900 border-white/10 text-white"
                    value={manHoraFim}
                    onChange={(e) => setManHoraFim(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Operador</label>
                <select
                  className="field text-xs py-2 bg-slate-900 border-white/10 text-white"
                  style={{ colorScheme: 'dark' }}
                  value={manOpId}
                  onChange={(e) => setManOpId(e.target.value)}
                  required
                >
                  <option value="" style={{ background: '#1E293B' }}>Selecionar...</option>
                  {operadores.map((o) => (
                    <option key={o.id} value={o.id} style={{ background: '#1E293B' }}>{o.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Motivo</label>
                <select
                  className="field text-xs py-2 bg-slate-900 border-white/10 text-white"
                  style={{ colorScheme: 'dark' }}
                  value={manMotivo}
                  onChange={(e) => setManMotivo(e.target.value)}
                  required
                >
                  <option value="" style={{ background: '#1E293B' }}>Selecionar...</option>
                  {motivosParada.map((m) => (
                    <option key={m} value={m} style={{ background: '#1E293B' }}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Observações / Detalhes</label>
                <textarea
                  className="field text-xs py-2 bg-slate-900 border-white/10 text-white h-20 resize-none rounded-xl"
                  placeholder="Descreva detalhes adicionais..."
                  value={manObs}
                  onChange={(e) => setManObs(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setManualParadaOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busyManParada}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                >
                  {busyManParada ? (
                    <div className="size-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    "Registrar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── FILTROS E ANÁLISE ── */}
      <div className="space-y-6">

        {/* Barra de filtros */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Lado esq: label do período + atalhos */}
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Período de Análise</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{periodoLabel}</p>
              </div>
              {/* Atalhos rápidos */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={applyHoje}
                  className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border transition-all border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={applyMesAtual}
                  className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border transition-all border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100"
                >
                  Mês Atual
                </button>
                <button
                  type="button"
                  onClick={applyMesAnterior}
                  className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border transition-all border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
                >
                  Mês Anterior
                </button>
              </div>
            </div>

            {/* Lado dir: inputs de data + filtro de turno */}
            <div className="flex items-end gap-4 flex-wrap">
              {/* Datas */}
              <div className="flex items-end gap-2">
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

              {/* Filtro de turno */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Turno</span>
                <div className="flex items-center rounded-xl overflow-hidden border border-slate-200">
                  {(["", "D", "N"] as const).map((t) => {
                    const active = filtroTurno === t;
                    const label = t === "" ? "Todos" : t === "D" ? "Diurno" : "Noturno";
                    const Icon = t === "D" ? Sun : t === "N" ? Moon : null;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFiltroTurno(t)}
                        className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all"
                        style={
                          active
                            ? t === ""
                              ? { background: "#1E293B", color: "#fff" }
                              : t === "D"
                              ? { background: TURNO.D.bg, color: TURNO.D.color, borderLeft: `1px solid ${TURNO.D.border}`, borderRight: `1px solid ${TURNO.D.border}` }
                              : { background: TURNO.N.bg, color: TURNO.N.color }
                            : { background: "transparent", color: "#64748b" }
                        }
                      >
                        {Icon && <Icon size={10} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPIs ── */}
        {/* Linha 1: KPIs totais (filtrados pelo turno selecionado) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Volume Dobrado</span>
              <div className="text-2xl font-black text-slate-900">{stats.total.tons.toFixed(3)}t</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">
                {filtroTurno ? TURNO[filtroTurno].label : "Todos os turnos"}
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Weight size={20} />
            </div>
          </div>

          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Média por Dia</span>
              <div className="text-2xl font-black text-slate-900">{stats.mediaTonsDia.toFixed(3)}t</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">
                Em {stats.diasAtivos} dia{stats.diasAtivos !== 1 ? "s" : ""} ativo{stats.diasAtivos !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Peças Processadas</span>
              <div className="text-2xl font-black text-slate-900">{stats.total.pecas} un</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">
                {filtroTurno ? TURNO[filtroTurno].label : "Todos os turnos"}
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-450 text-amber-400">
              <Layers size={20} />
            </div>
          </div>

          <div className="glass-card p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Operadores Ativos</span>
              <div className="text-2xl font-black text-slate-900">{stats.total.ops}</div>
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">No período</span>
            </div>
            <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <User size={20} />
            </div>
          </div>
        </div>

        {/* Linha 2: Comparativo Diurno vs Noturno (só aparece quando "Todos" está selecionado) */}
        {!filtroTurno && (
          <div className="grid grid-cols-2 gap-4">
            {/* Diurno */}
            <div
              className="glass-card p-5 flex items-center justify-between"
              style={{ borderLeft: `3px solid ${TURNO.D.color}` }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sun size={14} style={{ color: TURNO.D.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TURNO.D.color }}>
                    Diurno
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900">{stats.statD.tons.toFixed(3)}t</div>
                <div className="text-[9px] text-slate-500">{stats.statD.pecas} peças</div>
              </div>
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{ background: TURNO.D.bg, border: `1px solid ${TURNO.D.border}` }}
              >
                <Sun size={18} style={{ color: TURNO.D.color }} />
              </div>
            </div>

            {/* Noturno */}
            <div
              className="glass-card p-5 flex items-center justify-between"
              style={{ borderLeft: `3px solid ${TURNO.N.color}` }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Moon size={14} style={{ color: TURNO.N.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TURNO.N.color }}>
                    Noturno
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900">{stats.statN.tons.toFixed(3)}t</div>
                <div className="text-[9px] text-slate-500">{stats.statN.pecas} peças</div>
              </div>
              <div
                className="size-10 rounded-xl flex items-center justify-center"
                style={{ background: TURNO.N.bg, border: `1px solid ${TURNO.N.border}` }}
              >
                <Moon size={18} style={{ color: TURNO.N.color }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Gráficos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Gráfico 1: Volume por Dia */}
          <div className="glass-card p-6 min-h-[350px] flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-500" />
              Volume Dobrado por Dia (t)
              {filtroTurno && <TurnoBadge turno={filtroTurno} size="xs" />}
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
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#475569" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#475569" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                      labelStyle={{ fontSize: 10, fontWeight: "bold", color: "#0f172a" }}
                      itemStyle={{ fontSize: 10, color: "#d97706" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="toneladas"
                      stroke="#d97706"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTons)"
                      name="Toneladas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico 2: Produção por Operador (separado por turno) */}
          <div className="glass-card p-6 min-h-[350px] flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-1 flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-500" />
              Produção por Operador (t)
            </h3>
            <div className="flex items-center gap-3 mb-5 mt-1">
              {(filtroTurno === "" || filtroTurno === "D") && (
                <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: TURNO.D.color }}>
                  <span className="size-2 rounded-full inline-block" style={{ background: TURNO.D.color }} />
                  Diurno
                </span>
              )}
              {(filtroTurno === "" || filtroTurno === "N") && (
                <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: TURNO.N.color }}>
                  <span className="size-2 rounded-full inline-block" style={{ background: TURNO.N.color }} />
                  Noturno
                </span>
              )}
            </div>
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
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                      labelStyle={{ fontSize: 10, fontWeight: "bold", color: "#0f172a" }}
                      itemStyle={{ fontSize: 10 }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(3)} t`,
                        name === "diurno" ? "☀️ Diurno" : "🌙 Noturno",
                      ]}
                    />
                    {(filtroTurno === "" || filtroTurno === "D") && (
                      <Bar
                        dataKey="diurno"
                        fill={TURNO.D.color}
                        radius={filtroTurno === "D" ? [4, 4, 0, 0] : [2, 2, 0, 0]}
                        name="diurno"
                        barSize={filtroTurno ? 30 : 18}
                        stackId={filtroTurno ? undefined : "a"}
                      />
                    )}
                    {(filtroTurno === "" || filtroTurno === "N") && (
                      <Bar
                        dataKey="noturno"
                        fill={TURNO.N.color}
                        radius={[4, 4, 0, 0]}
                        name="noturno"
                        barSize={filtroTurno ? 30 : 18}
                        stackId={filtroTurno ? undefined : "a"}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico 3: Peças por Balsa */}
          <div className="glass-card p-6 min-h-[350px] flex flex-col lg:col-span-2 xl:col-span-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
              <Package size={16} className="text-amber-500" />
              Peças por Balsa
              {filtroTurno && <TurnoBadge turno={filtroTurno} size="xs" />}
            </h3>
            <div className="flex-1 w-full" style={{ height: "240px" }}>
              {stats.chartBalsa.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase font-bold tracking-widest">
                  Sem dados de balsa no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.chartBalsa}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#475569" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="balsa"
                      width={72}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#475569", fontFamily: "monospace" }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px" }}
                      labelStyle={{ fontSize: 10, fontWeight: "bold", color: "#0f172a" }}
                      itemStyle={{ fontSize: 10, color: "#d97706" }}
                      formatter={(value: number) => [`${value} peça${value !== 1 ? "s" : ""}`, "Quantidade"]}
                    />
                    <Bar
                      dataKey="qtd"
                      fill="#d97706"
                      radius={[0, 4, 4, 0]}
                      name="Peças"
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTÓRICO ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 flex-wrap">
          <Layers size={16} className="text-amber-400" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">Histórico de Dobras</h2>
          {/* Badge da máquina ativa */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{ background: MAQUINA[maquinaAtiva].bg, color: MAQUINA[maquinaAtiva].color, border: `1px solid ${MAQUINA[maquinaAtiva].border}` }}
          >
            {maquinaAtiva === "PRENSA" ? <Wrench size={9} /> : <Settings2 size={9} />}
            {MAQUINA[maquinaAtiva].label}
          </span>
          {filtroTurno && <TurnoBadge turno={filtroTurno} size="xs" />}

          {/* Toggle: Registros vs Resumo por Peça */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-4">
            <button
              type="button"
              onClick={() => setHistoricoView("registros")}
              className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                historicoView === "registros"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Registros
            </button>
            <button
              type="button"
              onClick={() => setHistoricoView("resumo")}
              className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                historicoView === "resumo"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Resumo por Peça
            </button>
          </div>

          <span className="ml-auto text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            {historicoView === "registros"
              ? `${historicoFiltrado.length} registro${historicoFiltrado.length !== 1 ? "s" : ""}`
              : `${resumoPecas.length} peça${resumoPecas.length !== 1 ? "s" : ""} distinta${resumoPecas.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loadingHist ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <div className="size-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-widest font-bold">Carregando...</span>
          </div>
        ) : historicoFiltrado.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Hammer size={32} className="opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold">Nenhum registro no período</p>
          </div>
        ) : (
          <>
            {historicoView === "registros" ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Data", "Turno", "Peça", "Balsa", "Dim. / Esp.", "Peso (kg)", "Qtd", "Operador", "Obs.", ""].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historicoFiltrado.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                            {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-5 py-3.5">
                            <TurnoBadge turno={r.turno} size="xs" />
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold text-slate-900">{r.peca}</span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono">
                            {r.balsa ? (
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700">
                                {r.balsa}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-[10px] font-mono text-slate-600 whitespace-nowrap">
                            <div className="text-slate-700">{r.dimensional || "—"}</div>
                            {r.espessura_mm ? <div className="text-slate-500">{r.espessura_mm}mm</div> : ""}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-700">
                            {r.peso_kg ? Number(r.peso_kg).toFixed(2) : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-500/20">
                              {r.quantidade}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{r.operador_nome || "—"}</td>
                          <td className="px-5 py-3.5 text-[10px] text-slate-500 max-w-[140px] truncate">
                            {r.observacoes || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {(isAdmin || isSupervisor) && (
                                <button
                                  onClick={() => startEdit(r)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                  title="Editar Registro"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                              {(isAdmin || isSupervisor) && (
                                <button
                                  onClick={() => handleDelete(r.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                  title="Excluir Registro"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {historicoFiltrado.map((r) => (
                    <div key={r.id} className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{r.peca}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")} · {r.operador_nome || "—"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <TurnoBadge turno={r.turno} size="xs" />
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            {r.quantidade} un
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[9px] text-slate-600">
                        {r.balsa && <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200 font-bold font-mono">Balsa: {r.balsa}</span>}
                        {r.nesting && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">Nesting: {r.nesting}</span>}
                        {r.painel && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">Painel: {r.painel}</span>}
                        {r.espessura_mm && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{r.espessura_mm}mm</span>}
                        {r.peso_kg && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{r.peso_kg}kg</span>}
                      </div>
                      {r.observacoes && <p className="text-[10px] text-slate-500 italic">{r.observacoes}</p>}

                      {(isAdmin || isSupervisor) && (
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => startEdit(r)}
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-600 transition-colors"
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Resumo por Peça - Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Peça", "Quantidade Total (un)", "Peso Total (t)", "Peso Unitário Médio (kg)"].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resumoPecas.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{r.peca}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-500/20">
                              {r.quantidade} un
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-800">
                            {(r.pesoTotal / 1000).toFixed(3)} t
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-slate-600">
                            {r.quantidade > 0 ? (r.pesoTotal / r.quantidade).toFixed(2) : "—"} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumo por Peça - Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {resumoPecas.map((r, idx) => (
                    <div key={idx} className="p-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{r.peca}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Peso Unitário: {r.quantidade > 0 ? (r.pesoTotal / r.quantidade).toFixed(2) : "—"} kg
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          {r.quantidade} un
                        </span>
                        <span className="text-xs font-mono text-slate-800 font-bold">
                          {(r.pesoTotal / 1000).toFixed(3)} t
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {editModalOpen && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative flex flex-col gap-6 text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3 text-amber-400">
                <Hammer size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Editar Registro de Dobra</h3>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Busca de Peça */}
                <div className="md:col-span-2 space-y-1.5" ref={editSearchRef}>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Search size={11} className="text-amber-400" /> Buscar Peça no Catálogo
                  </label>
                  <div className="relative">
                    <input
                      ref={editPecaInputRef}
                      type="text"
                      className="field pl-10 pr-10 bg-slate-900 border-white/10 text-white"
                      placeholder="Digite o código ou nome da peça..."
                      value={editPecaQuery}
                      onChange={(e) => {
                        setEditPecaQuery(e.target.value);
                        if (editSelectedPeca) setEditSelectedPeca(null);
                      }}
                      onFocus={() => editPecaSuggestions.length > 0 && setEditShowSuggestions(true)}
                      autoComplete="off"
                    />
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    {editPecaQuery && (
                      <button
                        type="button"
                        onClick={clearEditPeca}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}

                    {editShowSuggestions && editPecaSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        {editPecaSuggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectEditPeca(p)}
                            className="w-full text-left px-4 py-3 hover:bg-white/[0.06] transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="text-sm font-bold text-white">{p.peca}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex gap-3">
                              {p.nesting && <span>Nesting: {p.nesting}</span>}
                              {p.painel && <span>Painel: {p.painel}</span>}
                              {p.espessura_mm && <span>{p.espessura_mm}mm</span>}
                              {p.peso_kg && <span>{p.peso_kg} kg</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {editSelectedPeca && (
                    <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-[8px] font-bold text-amber-400 uppercase tracking-widest mb-1">Peça</div>
                        <div className="text-xs font-black">{editSelectedPeca.peca}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nesting</div>
                        <div className="text-xs font-mono">{editSelectedPeca.nesting || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dimensional</div>
                        <div className="text-xs font-mono">{editSelectedPeca.dimensional || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Espessura / Peso</div>
                        <div className="text-xs">
                          {editSelectedPeca.espessura_mm ? `${editSelectedPeca.espessura_mm}mm` : "—"} / {editSelectedPeca.peso_kg ? `${editSelectedPeca.peso_kg}kg` : "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operador */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <User size={11} className="text-amber-400" /> Operador Responsável
                  </label>
                  <div className="relative">
                    <select
                      className="field appearance-none pr-10 bg-slate-900 border-white/10 text-white"
                      value={editOperadorId}
                      onChange={(e) => setEditOperadorId(e.target.value)}
                      required
                    >
                      <option value="" className="bg-slate-900">Selecione o operador...</option>
                      {opsDiurno.length > 0 && (
                        <optgroup label="☀️ Diurno" className="bg-slate-900 text-slate-300">
                          {opsDiurno.map((op) => (
                            <option key={op.id} value={op.id} className="bg-slate-900 text-white">{op.nome}</option>
                          ))}
                        </optgroup>
                      )}
                      {opsNoturno.length > 0 && (
                        <optgroup label="🌙 Noturno" className="bg-slate-900 text-slate-300">
                          {opsNoturno.map((op) => (
                            <option key={op.id} value={op.id} className="bg-slate-900 text-white">{op.nome}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Quantidade */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Hash size={11} className="text-amber-400" /> Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="field bg-slate-900 border-white/10 text-white"
                    value={editQuantidade}
                    onChange={(e) => setEditQuantidade(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Balsa */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Package size={11} className="text-amber-400" /> Balsa (Modelo / Nº)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-28 shrink-0">
                      <select
                        className="field appearance-none pr-8 text-xs py-2.5 bg-slate-900 border-white/10 text-white"
                        style={{ colorScheme: 'dark' }}
                        value={editBalsaTipo}
                        onChange={(e) => {
                          const val = e.target.value as "RAKE" | "BOX" | "S/TAG";
                          setEditBalsaTipo(val);
                          if (val === "S/TAG") setEditBalsaNumero("");
                        }}
                      >
                        <option value="RAKE" style={{ background: '#0f172a', color: '#fff' }}>RAKE</option>
                        <option value="BOX" style={{ background: '#0f172a', color: '#fff' }}>BOX</option>
                        <option value="S/TAG" style={{ background: '#0f172a', color: '#fff' }}>S/TAG</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <input
                      type="text"
                      className="field text-xs py-2.5 bg-slate-900 border-white/10 text-white disabled:opacity-50 disabled:bg-slate-900/50"
                      placeholder={editBalsaTipo === "S/TAG" ? "Sem número" : "Número"}
                      value={editBalsaTipo === "S/TAG" ? "" : editBalsaNumero}
                      onChange={(e) => setEditBalsaNumero(e.target.value)}
                      disabled={editBalsaTipo === "S/TAG"}
                    />
                  </div>
                </div>

                {/* Data */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Calendar size={11} className="text-amber-400" /> Data
                  </label>
                  <input
                    type="date"
                    className="field bg-slate-900 border-white/10 text-white"
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                    required
                  />
                </div>

                {/* Observações */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Observações (opcional)
                  </label>
                  <input
                    type="text"
                    className="field bg-slate-900 border-white/10 text-white"
                    value={editObservacoes}
                    onChange={(e) => setEditObservacoes(e.target.value)}
                  />
                </div>
              </div>

              {editFeedback && (
                <div className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-bold ${
                  editFeedback.type === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {editFeedback.type === "ok" ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                  {editFeedback.msg}
                </div>
              )}

              {/* Form buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors w-1/3 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editBusy || !editSelectedPeca}
                  className="btn-primary flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black border-amber-600 text-xs uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {editBusy ? (
                    <div className="size-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin mx-auto" />
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL IA: UPLOAD (PASSO 1) ── */}
      {aiImportOpen && aiStep === "upload" && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3"
          onClick={(e) => { if (e.target === e.currentTarget) { setAiImportOpen(false); } }}
        >
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Importar Peças via Foto</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Passo 1 — Selecionar Imagem</p>
                </div>
              </div>
              <button onClick={() => { setAiImportOpen(false); setAiRows([]); setAiPreviewUrl(null); setAiImageB64(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Tire uma foto da <strong className="text-white">lista impressa de peças processadas</strong> (planilha, romaneio, folha de nesting). O Gemini Vision irá identificar os códigos e quantidades automaticamente.
              </p>

              {/* Drop zone / preview */}
              <div
                onClick={() => aiFileRef.current?.click()}
                className="relative border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl transition-colors cursor-pointer overflow-hidden"
                style={{ minHeight: 200 }}
              >
                {aiPreviewUrl ? (
                  <img src={aiPreviewUrl} alt="Preview" className="w-full object-contain max-h-72 rounded-2xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                    <Camera size={40} className="opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">Clique para selecionar ou fotografar</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest">JPG, PNG, WEBP — até 20 MB</p>
                  </div>
                )}
              </div>

              <input
                ref={aiFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleAiImagePick}
              />

              {aiPreviewUrl && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setAiPreviewUrl(null); setAiImageB64(null); }}
                    className="px-4 py-2.5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                  >
                    Trocar Imagem
                  </button>
                  <button
                    type="button"
                    onClick={processImageWithAI}
                    disabled={aiProcessing}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {aiProcessing ? (
                      <>
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analisando com Gemini...
                      </>
                    ) : (
                      <><Sparkles size={14} /> Analisar com IA</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── TELA CHEIA: REVISAR EXTRAÇÃO DA IA (PASSO 2) ── */}
      {aiStep === "reviewing" && aiRows.length > 0 && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9998] bg-[#0a0f1a] flex flex-col">

          {/* Top Bar */}
          <div className="shrink-0 border-b border-white/5 bg-[#0f172a] px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            {/* Title + stats */}
            <div className="flex items-center gap-3">
              <div className="size-8 md:size-9 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-black uppercase tracking-widest text-white">Revisar Extração</h2>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {aiRows.length} peça(s) ·
                  <span className="text-emerald-400 ml-1">{aiRows.filter(r => r.catalogMatch).length} com catálogo</span>
                  {aiRows.some(r => !r.catalogMatch) && (
                    <span className="text-amber-400 ml-1">· {aiRows.filter(r => !r.catalogMatch).length} sem match</span>
                  )}
                </p>
              </div>
            </div>

            {/* Operator selector — full width on mobile */}
            <div className="flex items-center gap-2 md:ml-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap shrink-0">Operador *</label>
              <select
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl text-xs py-2 px-3 text-white focus:outline-none focus:border-violet-500/50"
                style={{ colorScheme: 'dark' }}
                value={aiBulkOperadorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setAiBulkOperadorId(val);
                  setAiRows(rows => rows.map(r => ({ ...r, rowOperadorId: val })));
                }}
                required
              >
                <option value="" style={{ background: '#0f172a' }}>Selecionar...</option>
                {operadores.map((o) => (
                  <option key={o.id} value={o.id} style={{ background: '#0f172a' }}>{o.nome}</option>
                ))}
              </select>
            </div>

            {/* Action buttons — 3 cols on mobile, inline on desktop */}
            <div className="grid grid-cols-3 md:flex md:flex-row md:ml-auto gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => { setAiStep("upload"); setAiRows([]); setAiImportOpen(true); }}
                className="col-span-1 px-3 md:px-4 py-2 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors text-center"
              >
                ← Foto
              </button>
              <button
                type="button"
                onClick={() => { setAiStep("upload"); setAiRows([]); setAiPreviewUrl(null); setAiImageB64(null); }}
                className="col-span-1 px-3 md:px-4 py-2 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveBulkRows}
                disabled={aiBulkBusy || aiRows.length === 0 || !aiBulkOperadorId}
                className="col-span-1 px-3 md:px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black rounded-xl text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1 md:gap-2"
              >
                {aiBulkBusy ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ImagePlus size={13} /> Salvar {aiRows.length}</>
                )}
              </button>
            </div>
          </div>

          {/* Content: full-screen table */}
          <div className="flex-1 overflow-auto p-3 md:p-6">
            <div className="rounded-2xl border border-white/5 overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-white/[0.03] sticky top-0">
                  <tr>
                    {["#", "Peça / Nesting", "Qtd", "Data", "Operador", "Peso (kg)", "Balsa", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-[8px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {aiRows.map((row, idx) => (
                    <tr key={row.id} className={`group hover:bg-white/[0.02] transition-colors ${!row.catalogMatch ? "bg-amber-500/[0.03]" : ""}`}>
                      {/* # */}
                      <td className="px-4 py-3 text-[10px] text-slate-600 font-mono">{idx + 1}</td>

                      {/* Peça editável com autocomplete */}
                      <td className="px-4 py-3 relative overflow-visible">
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50 font-bold"
                            value={aiActiveEditIdx === idx ? aiEditQuery : row.peca}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAiEditQuery(val);
                              handleAiRowPecaChange(idx, val);
                            }}
                            onFocus={() => {
                              setAiActiveEditIdx(idx);
                              setAiEditQuery(row.peca);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setAiActiveEditIdx(null);
                              }, 250);
                            }}
                            placeholder="Nome da Peça"
                            autoComplete="off"
                          />
                          {aiActiveEditIdx === idx && aiSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 z-[99999] mt-1 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl overflow-hidden w-[280px]">
                              {aiSuggestions.map((p) => (
                                <button
                                  key={p.id || p.peca}
                                  type="button"
                                  onMouseDown={() => {
                                    setAiRows(rows => rows.map((r, i) => {
                                      if (i === idx) {
                                        return {
                                          ...r,
                                          peca: p.peca,
                                          nesting: p.nesting ?? null,
                                          painel: p.painel ?? r.painel,
                                          dimensional: p.dimensional ?? null,
                                          espessura_mm: p.espessura_mm ?? null,
                                          peso_kg: p.peso_kg ? Number(p.peso_kg) : null,
                                          catalogMatch: true
                                        };
                                      }
                                      return r;
                                    }));
                                    setAiActiveEditIdx(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors border-b border-white/5 last:border-0"
                                >
                                  <div className="text-xs font-bold text-white">{p.peca}</div>
                                  <div className="text-[9px] text-slate-400 mt-0.5">
                                    {p.nesting && `CNC: ${p.nesting}`}{p.peso_kg && ` · ${p.peso_kg} kg`}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {row.nesting && <div className="text-[8px] text-slate-500 font-mono mt-1 ml-1">{row.nesting}</div>}
                      </td>

                      {/* Quantidade */}
                      <td className="px-4 py-3">
                        <input
                          type="number" min={1}
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-violet-500/50"
                          value={row.quantidade}
                          onChange={(e) => setAiRows(rows => rows.map((r, i) =>
                            i === idx ? { ...r, quantidade: Math.max(1, Number(e.target.value)) } : r
                          ))}
                        />
                      </td>

                      {/* Data individual */}
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white focus:outline-none focus:border-violet-500/50"
                          style={{ colorScheme: 'dark' }}
                          value={row.rowData}
                          onChange={(e) => setAiRows(rows => rows.map((r, i) =>
                            i === idx ? { ...r, rowData: e.target.value } : r
                          ))}
                        />
                      </td>

                      {/* Operador individual */}
                      <td className="px-4 py-3">
                        <select
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white focus:outline-none focus:border-violet-500/50"
                          style={{ colorScheme: 'dark' }}
                          value={row.rowOperadorId || ""}
                          onChange={(e) => setAiRows(rows => rows.map((r, i) =>
                            i === idx ? { ...r, rowOperadorId: e.target.value } : r
                          ))}
                        >
                          <option value="" style={{ background: '#0f172a' }}>Selecionar...</option>
                          {operadores.map((o) => (
                            <option key={o.id} value={o.id} style={{ background: '#0f172a' }}>{o.nome}</option>
                          ))}
                        </select>
                      </td>

                      {/* Peso */}
                      <td className="px-4 py-3 text-[10px] font-mono text-slate-400">
                        {row.peso_kg != null ? `${row.peso_kg} kg` : <span className="text-amber-500/70">—</span>}
                      </td>

                      {/* Balsa */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white focus:outline-none"
                            style={{ colorScheme: 'dark' }}
                            value={row.balsaTipo}
                            onChange={(e) => setAiRows(rows => rows.map((r, i) =>
                              i === idx ? { ...r, balsaTipo: e.target.value as any } : r
                            ))}
                          >
                            <option value="RAKE">RAKE</option>
                            <option value="BOX">BOX</option>
                            <option value="S/TAG">S/TAG</option>
                          </select>
                          {row.balsaTipo !== "S/TAG" && (
                            <input
                              type="text"
                              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white focus:outline-none"
                              placeholder="Nº"
                              value={row.balsaNumero}
                              onChange={(e) => setAiRows(rows => rows.map((r, i) =>
                                i === idx ? { ...r, balsaNumero: e.target.value } : r
                              ))}
                            />
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {row.catalogMatch ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold">
                            <CheckCircle2 size={9} /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold">
                            <AlertTriangle size={9} /> Sem match
                          </span>
                        )}
                      </td>

                      {/* Remover */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setAiRows(rows => rows.filter((_, i) => i !== idx))}
                          className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
                          title="Remover linha"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
}
