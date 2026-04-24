import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { u as useAuth, s as supabase, N as Navigate } from "./router-BQgQf1IX.js";
import { A as AppShell } from "./AppShell-Bc6DMY07.js";
import { S as SectionHeader } from "./users-BPolboBD.js";
import { c as createLucideIcon } from "./createLucideIcon-iTdvThdZ.js";
import { C as Calendar, U as User, F as FileText } from "./user-c1Vud5Cl.js";
import { H as Hash } from "./hash-BcxTKP3U.js";
import { T as Trash2 } from "./trash-2-CjWMuw10.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
      key: "sc7q7i"
    }
  ]
];
const Funnel = createLucideIcon("funnel", __iconNode$1);
const __iconNode = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
];
const Search = createLucideIcon("search", __iconNode);
function HistoricoPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filters, setFilters] = reactExports.useState({ from: "", to: "", operador: "", balsa: "", nesting: "" });
  const load = async () => {
    setLoading(true);
    let q = supabase.from("producao").select("*, operador:operadores(nome)").order("data", { ascending: false }).order("created_at", { ascending: false }).limit(500);
    if (filters.from) q = q.gte("data", filters.from);
    if (filters.to) q = q.lte("data", filters.to);
    if (filters.balsa) q = q.ilike("balsa", `%${filters.balsa}%`);
    if (filters.nesting) q = q.ilike("nesting", `%${filters.nesting}%`);
    const { data } = await q;
    let r = data ?? [];
    if (filters.operador) {
      r = r.filter((x) => x.operador?.nome.toLowerCase().includes(filters.operador.toLowerCase()));
    }
    setRows(r);
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const totals = reactExports.useMemo(() => ({
    pcs: rows.reduce((s, r) => s + r.quantidade, 0),
    kg: rows.reduce((s, r) => s + Number(r.peso_total || 0), 0)
  }), [rows]);
  const del = async (id) => {
    if (!confirm("Excluir este lançamento?")) return;
    await supabase.from("producao").delete().eq("id", id);
    load();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeader,
      {
        code: "HST-01",
        title: "Histórico",
        subtitle: `${rows.length} registros • ${totals.pcs} pcs • ${totals.kg.toFixed(0)} kg`
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4 text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { size: 16 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[10px] font-bold uppercase tracking-[0.2em]", children: "Filtros de Busca" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterField, { label: "De", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", className: "field", value: filters.from, onChange: (e) => setFilters({ ...filters, from: e.target.value }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterField, { label: "Até", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", className: "field", value: filters.to, onChange: (e) => setFilters({ ...filters, to: e.target.value }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterField, { label: "Operador", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 14 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "field", placeholder: "Nome...", value: filters.operador, onChange: (e) => setFilters({ ...filters, operador: e.target.value }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterField, { label: "Balsa", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { size: 14 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "field", placeholder: "Ex: RAKE...", value: filters.balsa, onChange: (e) => setFilters({ ...filters, balsa: e.target.value }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilterField, { label: "Nesting", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { size: 14 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "field", placeholder: "Ex: 4465...", value: filters.nesting, onChange: (e) => setFilters({ ...filters, nesting: e.target.value }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: load, className: "btn-primary w-full py-3 text-[10px] flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14 }),
          " Aplicar Filtros"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center py-12 gap-3 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Sincronizando..." })
    ] }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-card p-12 text-center text-muted-foreground uppercase tracking-widest text-xs", children: "Nenhum registro encontrado" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden lg:block glass-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: ["Data", "Peça", "Nesting", "Balsa", "Operador", "Qtd", "Peso", ""].map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: h }, h)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-white/5", children: rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-white/[0.02] transition-colors group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-xs font-mono", children: r.data }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold", children: r.peca }),
            r.avulsa && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] text-primary uppercase font-black tracking-tighter", children: "● Avulsa" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-xs text-muted-foreground", children: r.nesting || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-xs font-medium text-primary/80", children: r.balsa || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-xs", children: r.operador?.nome || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-xs font-bold tabular-nums", children: r.quantidade }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-4 text-xs font-black tabular-nums", children: [
            Number(r.peso_total || 0).toFixed(1),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground ml-0.5", children: "KG" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-4 text-right", children: isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => del(r.id), className: "p-2 text-muted-foreground hover:text-destructive transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 }) }) })
        ] }, r.id)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:hidden flex flex-col gap-4", children: rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-5 space-y-4 relative overflow-hidden", children: [
        r.avulsa && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 bg-primary/20 text-primary text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest", children: "Peça Individual" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono text-muted-foreground mb-1", children: [
              r.data,
              " • ",
              r.nesting || "S/N"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold leading-snug", children: r.peca })
          ] }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => del(r.id), className: "p-2 -mt-2 -mr-2 text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 pt-4 border-t border-white/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-widest text-white/60", children: "Operador" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: r.operador?.nome || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-widest text-white/60", children: "Balsa" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: r.balsa || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-widest text-white/60", children: "Quantidade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-black tabular-nums", children: [
              r.quantidade,
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-normal text-white/40 ml-1", children: "PCS" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-widest text-white/60", children: "Peso Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-black tabular-nums text-primary", children: [
              Number(r.peso_total || 0).toFixed(1),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-normal text-white/40 ml-1", children: "KG" })
            ] })
          ] })
        ] }),
        r.observacoes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/5 p-3 rounded-xl flex gap-3 items-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "text-muted-foreground shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground leading-relaxed italic", children: r.observacoes })
        ] })
      ] }, r.id)) })
    ] }) })
  ] });
}
function FilterField({ label, icon, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 px-1", children: [
      icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: icon }),
      label
    ] }),
    children
  ] });
}
function Page() {
  const {
    user,
    loading
  } = useAuth();
  if (loading) return null;
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HistoricoPage, {}) });
}
export {
  Page as component
};
