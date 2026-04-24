import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { u as useAuth, s as supabase, N as Navigate } from "./router-BQgQf1IX.js";
import { A as AppShell } from "./AppShell-Bc6DMY07.js";
import { S as SectionHeader } from "./users-BPolboBD.js";
import { L as Layers, P as Package, W as Weight } from "./weight-D4n6Q6Vd.js";
import { c as createLucideIcon } from "./createLucideIcon-iTdvThdZ.js";
import { H as Hash } from "./hash-BcxTKP3U.js";
import { U as User, C as Calendar, F as FileText } from "./user-c1Vud5Cl.js";
import { C as Clock } from "./clock-Eidam1tY.js";
import { C as CircleAlert } from "./circle-alert-C8G-aT2S.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const CircleCheck = createLucideIcon("circle-check", __iconNode);
const empty = {
  peca: "",
  nesting: "",
  painel: "",
  balsa: "",
  balsa_numero: "",
  operador_id: "",
  quantidade: 1,
  peso_unitario: "",
  observacoes: "",
  avulsa: false,
  data: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
  hora: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
};
function ProducaoPage() {
  const { user, isSupervisor } = useAuth();
  const [operadores, setOperadores] = reactExports.useState([]);
  const [form, setForm] = reactExports.useState(empty);
  const [busy, setBusy] = reactExports.useState(false);
  const [msg, setMsg] = reactExports.useState(null);
  const [last, setLast] = reactExports.useState(null);
  const [nestings, setNestings] = reactExports.useState([]);
  const [pecasNoNesting, setPecasNoNesting] = reactExports.useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = reactExports.useState(false);
  reactExports.useEffect(() => {
    supabase.from("operadores").select("id,nome").eq("ativo", true).order("nome").then(({ data }) => setOperadores(data ?? []));
    supabase.from("catalogo_pecas").select("nesting").then(({ data }) => {
      const unique = Array.from(new Set((data ?? []).map((d) => d.nesting))).sort();
      setNestings(unique);
    });
  }, []);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onNestingChange = async (nestingVal) => {
    if (!nestingVal) {
      setForm(empty);
      setPecasNoNesting([]);
      return;
    }
    setLoadingCatalogo(true);
    const { data } = await supabase.from("catalogo_pecas").select("*").eq("nesting", nestingVal);
    const items = data ?? [];
    setPecasNoNesting(items);
    if (items.length > 0) {
      if (!form.avulsa) {
        const totalPeso = items.reduce((acc, curr) => acc + (curr.peso_kg || 0), 0);
        const totalQtd = items.reduce((acc, curr) => acc + (curr.quantidade_base || 0), 0);
        const agrupado = {};
        items.forEach((i) => {
          agrupado[i.peca] = (agrupado[i.peca] || 0) + (i.quantidade_base || 0);
        });
        const listaPecas = Object.entries(agrupado).map(([nome, qtd]) => `${nome} (x${qtd})`).join(" / ");
        setForm((f) => ({
          ...f,
          nesting: nestingVal,
          painel: items[0].painel || "",
          peca: listaPecas,
          balsa: items[0].tipo_balsa || "",
          quantidade: totalQtd,
          peso_unitario: String(totalPeso / (totalQtd || 1))
        }));
      } else {
        setForm((f) => ({
          ...f,
          nesting: nestingVal,
          balsa: items[0].tipo_balsa || "",
          peca: "",
          // Usuário vai selecionar
          quantidade: 1,
          peso_unitario: "0"
        }));
      }
    }
    setLoadingCatalogo(false);
  };
  const onPecaIndividualChange = (pecaNome) => {
    const item = pecasNoNesting.find((p) => p.peca === pecaNome);
    if (item) {
      setForm((f) => ({
        ...f,
        peca: item.peca,
        quantidade: item.quantidade_base || 1,
        peso_unitario: String((item.peso_kg || 0) / (item.quantidade_base || 1))
      }));
    } else {
      update("peca", pecaNome);
    }
  };
  const pesoUnit = parseFloat(form.peso_unitario) || 0;
  const pesoTotal = pesoUnit * form.quantidade;
  const submit = async (e) => {
    e.preventDefault();
    if (!isSupervisor) {
      setMsg("Sem permissão para registrar.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const payload = {
      peca: form.peca,
      nesting: form.nesting || null,
      painel: form.painel || null,
      balsa: `${form.balsa} ${form.balsa_numero}`.trim() || null,
      operador_id: form.operador_id || null,
      quantidade: form.quantidade,
      peso_unitario: pesoUnit || null,
      peso_total: pesoTotal || null,
      data: form.data,
      hora_inicio: `${form.data}T${form.hora}:00`,
      observacoes: form.observacoes || null,
      avulsa: form.avulsa,
      criado_por: user?.id,
      atualizado_por: user?.id
    };
    const { error } = await supabase.from("producao").insert(payload);
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Lançamento registrado.");
    setLast(form);
    setForm(empty);
  };
  const repeatLast = () => {
    if (last) setForm({ ...last });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionHeader,
      {
        code: "PRD-01",
        title: "Registro de Corte",
        subtitle: "Novo lançamento",
        right: last && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: repeatLast, className: "btn-secondary flex items-center gap-2", children: "↻ Repetir Anterior" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.avulsa, id: "avulsa", onChange: (e) => {
            setForm(empty);
            setPecasNoNesting([]);
            update("avulsa", e.target.checked);
          }, className: "accent-primary size-5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "avulsa", className: "text-xs font-bold uppercase tracking-widest cursor-pointer select-none text-primary", children: "Corte de Peça Individual / Ajuste" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nesting", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "field", value: form.nesting, onChange: (e) => onNestingChange(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Selecionar Nesting —" }),
            nestings.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: n, children: n }, n))
          ] }) }),
          form.avulsa && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Peça *", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { required: true, className: "field", value: form.peca, onChange: (e) => onPecaIndividualChange(e.target.value), disabled: !form.nesting, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: form.nesting ? "— Selecionar Peça —" : "Aguardando Nesting" }),
            pecasNoNesting.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.peca, children: p.peca }, p.id)),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "OUTRA", children: "-- Outra (Manual) --" })
          ] }) }),
          form.peca === "OUTRA" && form.avulsa && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nome da Peça (Manual)", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, className: "field", value: form.peca === "OUTRA" ? "" : form.peca, onChange: (e) => update("peca", e.target.value) }) }),
          !form.avulsa && form.nesting && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-primary/5 border border-primary/10 p-5 rounded-2xl flex gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "text-primary shrink-0", size: 20 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold text-primary uppercase tracking-widest mb-1", children: "Resumo do Plano" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium leading-relaxed", children: form.peca })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Balsa", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "field", value: form.balsa, onChange: (e) => update("balsa", e.target.value), readOnly: !form.avulsa }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nº Balsa", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "field", placeholder: "Ex: 10", value: form.balsa_numero, onChange: (e) => update("balsa_numero", e.target.value) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Operador", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { required: true, className: "field", value: form.operador_id, onChange: (e) => update("operador_id", e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Selecionar —" }),
            operadores.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o.id, children: o.nome }, o.id))
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Data", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", required: true, className: "field", value: form.data, onChange: (e) => update("data", e.target.value) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Hora", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "time", required: true, className: "field", value: form.hora, onChange: (e) => update("hora", e.target.value) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Quantidade", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, className: "field", value: form.quantidade, onChange: (e) => update("quantidade", parseInt(e.target.value) || 1), readOnly: !form.avulsa }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Peso Unitário", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Weight, { size: 16 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.01", className: "field", value: form.peso_unitario, onChange: (e) => update("peso_unitario", e.target.value), readOnly: !form.avulsa }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-primary/5 p-4 flex justify-between items-center border-white/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Peso Total Estimado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-black tracking-tight text-primary tabular-nums", children: [
              pesoTotal.toFixed(2),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold ml-1", children: "KG" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Observações", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16 }), className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 2, className: "field", value: form.observacoes, onChange: (e) => update("observacoes", e.target.value), placeholder: "Notas adicionais..." }) })
        ] })
      ] }),
      msg && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-5 rounded-2xl flex items-center gap-3 animate-slide-up border ${msg.includes("registrad") ? "bg-primary/10 border-primary/20 text-primary" : "bg-destructive/10 border-destructive/20 text-destructive"}`, children: [
        msg.includes("registrad") ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 20 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 20 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest", children: msg })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "submit",
          disabled: busy || !isSupervisor || loadingCatalogo,
          className: "btn-primary w-full py-5 text-sm flex items-center justify-center gap-3 group",
          children: busy ? "Processando..." : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "Confirmar Registro de Corte",
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 20, className: "group-hover:translate-x-1 transition-transform" })
          ] })
        }
      ),
      !isSupervisor && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground text-center uppercase tracking-[0.2em]", children: "Acesso restrito a Supervisores" })
    ] })
  ] });
}
function Field({ label, icon, children, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex flex-col gap-2 ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 px-1", children: [
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProducaoPage, {}) });
}
export {
  Page as component
};
