import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { u as useAuth, s as supabase, N as Navigate } from "./router-BQgQf1IX.js";
import { A as AppShell } from "./AppShell-Bc6DMY07.js";
import { S as SectionHeader, U as Users } from "./users-BPolboBD.js";
import { c as createLucideIcon } from "./createLucideIcon-iTdvThdZ.js";
import { H as Hash } from "./hash-BcxTKP3U.js";
import { U as UserX } from "./user-x-C3qEA06Z.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$5 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
];
const CircleX = createLucideIcon("circle-x", __iconNode$5);
const __iconNode$4 = [
  ["path", { d: "M16 2v2", key: "scm5qe" }],
  ["path", { d: "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2", key: "1waht3" }],
  ["path", { d: "M8 2v2", key: "pbkmx" }],
  ["circle", { cx: "12", cy: "11", r: "3", key: "itu57m" }],
  ["rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", key: "12vinp" }]
];
const Contact = createLucideIcon("contact", __iconNode$4);
const __iconNode$3 = [
  ["path", { d: "M13 21h8", key: "1jsn5i" }],
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ]
];
const PenLine = createLucideIcon("pen-line", __iconNode$3);
const __iconNode$2 = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "m16 11 2 2 4-4", key: "9rsbq5" }],
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
const UserCheck = createLucideIcon("user-check", __iconNode$1);
const __iconNode = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
  ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }]
];
const UserPlus = createLucideIcon("user-plus", __iconNode);
function OperadoresPage() {
  const { isSupervisor } = useAuth();
  const [list, setList] = reactExports.useState([]);
  const [nome, setNome] = reactExports.useState("");
  const [mat, setMat] = reactExports.useState("");
  const [editingId, setEditingId] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const load = async () => {
    const { data } = await supabase.from("operadores").select("*").order("nome");
    setList(data ?? []);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    if (!isSupervisor) return;
    setBusy(true);
    if (editingId) {
      await supabase.from("operadores").update({ nome, matricula: mat || null }).eq("id", editingId);
    } else {
      await supabase.from("operadores").insert({ nome, matricula: mat || null });
    }
    cancel();
    setBusy(false);
    load();
  };
  const startEdit = (o) => {
    setEditingId(o.id);
    setNome(o.nome);
    setMat(o.matricula || "");
  };
  const cancel = () => {
    setEditingId(null);
    setNome("");
    setMat("");
  };
  const toggle = async (id, ativo) => {
    if (!isSupervisor) return;
    await supabase.from("operadores").update({ ativo: !ativo }).eq("id", id);
    load();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { code: "OPR-01", title: "Equipe", subtitle: "Gerenciamento de Operadores" }),
    isSupervisor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 animate-slide-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6 text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 20 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[10px] font-bold uppercase tracking-[0.2em]", children: editingId ? "Editar Operador" : "Novo Operador" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: save, className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1", children: "Nome Completo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Contact, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground", size: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, className: "field pl-12 w-full", placeholder: "Ex: João Silva", value: nome, onChange: (e) => setNome(e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1", children: "Matrícula / ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Hash, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground", size: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "field pl-12 w-full", placeholder: "Ex: 12345", value: mat, onChange: (e) => setMat(e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2 flex gap-3 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: busy, className: "btn-primary flex-1 py-4 flex items-center justify-center gap-2", children: [
            editingId ? /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 18 }),
            editingId ? "Salvar Alterações" : "Cadastrar Operador"
          ] }),
          editingId && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: cancel, className: "btn-secondary px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 20 }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 border-b border-white/5 flex items-center justify-between bg-white/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 18, className: "text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Colaboradores" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold", children: list.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-white/5", children: list.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground text-xs uppercase tracking-widest", children: "Nenhum operador cadastrado" }) : list.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-10 rounded-xl flex items-center justify-center border ${o.ativo ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-white/5 text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-bold flex items-center gap-2", children: [
              o.nome,
              !o.ativo && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded uppercase", children: "Inativo" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5", children: [
              "ID: ",
              o.matricula || "—"
            ] })
          ] })
        ] }),
        isSupervisor && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => startEdit(o), className: "p-2.5 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-lg border border-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 16 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggle(o.id, o.ativo), className: `p-2.5 rounded-lg border transition-all ${o.ativo ? "text-muted-foreground hover:text-destructive bg-white/5 border-white/5" : "text-primary bg-primary/10 border-primary/20"}`, children: o.ativo ? /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { size: 16 }) })
        ] })
      ] }, o.id)) })
    ] })
  ] });
}
function Page() {
  const {
    user,
    loading
  } = useAuth();
  if (loading) return null;
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OperadoresPage, {}) });
}
export {
  Page as component
};
