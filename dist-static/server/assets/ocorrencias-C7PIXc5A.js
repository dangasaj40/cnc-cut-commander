import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { u as useAuth, s as supabase, N as Navigate } from "./router-BQgQf1IX.js";
import { C as CirclePlus, T as TriangleAlert, A as AppShell } from "./AppShell-Bc6DMY07.js";
import { S as SectionHeader } from "./users-BPolboBD.js";
import { C as Clock } from "./clock-Eidam1tY.js";
import { T as Trash2 } from "./trash-2-CjWMuw10.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./createLucideIcon-iTdvThdZ.js";
const TIPOS = ["Falha de máquina", "Erro de corte", "Retrabalho", "Outros"];
function OcorrenciasPage() {
  const { user, isSupervisor, isAdmin } = useAuth();
  const [list, setList] = reactExports.useState([]);
  const [tipo, setTipo] = reactExports.useState(TIPOS[0]);
  const [descricao, setDescricao] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  const load = async () => {
    const { data } = await supabase.from("ocorrencias").select("*").order("data", { ascending: false }).limit(200);
    setList(data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const add = async (e) => {
    e.preventDefault();
    if (!isSupervisor) return;
    setBusy(true);
    await supabase.from("ocorrencias").insert({ tipo, descricao, usuario_id: user?.id });
    setDescricao("");
    setBusy(false);
    load();
  };
  const del = async (id) => {
    if (!confirm("Excluir ocorrência?")) return;
    await supabase.from("ocorrencias").delete().eq("id", id);
    load();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { code: "OCR-01", title: "Ocorrências", subtitle: "Eventos Operacionais" }),
    isSupervisor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 animate-slide-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6 text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { size: 20 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[10px] font-bold uppercase tracking-[0.2em]", children: "Registrar Novo Evento" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: add, className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block px-1", children: "Tipo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: tipo, onChange: (e) => setTipo(e.target.value), className: "field", children: TIPOS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: t }, t)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block px-1", children: "Descrição do Evento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, placeholder: "Descreva o que aconteceu...", className: "field", value: descricao, onChange: (e) => setDescricao(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: busy, className: "btn-primary w-full py-3.5 text-[11px] flex items-center justify-center gap-2", children: busy ? "Salvando..." : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { size: 16 }),
          " Registrar"
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4", children: list.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-card p-12 text-center text-muted-foreground text-xs uppercase tracking-widest", children: "Nenhum evento registrado" }) : list.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-all group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20", children: o.tipo }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 12 }),
            new Date(o.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/90 leading-relaxed", children: o.descricao })
      ] }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => del(o.id), className: "p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 18 }) })
    ] }, o.id)) })
  ] });
}
function Page() {
  const {
    user,
    loading
  } = useAuth();
  if (loading) return null;
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OcorrenciasPage, {}) });
}
export {
  Page as component
};
