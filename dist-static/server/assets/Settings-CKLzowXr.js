import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { s as supabase, u as useAuth, L as Link } from "./router-BQgQf1IX.js";
import { U as Users, S as SectionHeader } from "./users-BPolboBD.js";
import { c as createLucideIcon } from "./createLucideIcon-iTdvThdZ.js";
import { U as UserX } from "./user-x-C3qEA06Z.js";
import { S as ShieldCheck, A as ArrowRight } from "./shield-check-B_YF7MZm.js";
const __iconNode$3 = [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ]
];
const Bell = createLucideIcon("bell", __iconNode$3);
const __iconNode$2 = [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
];
const Database = createLucideIcon("database", __iconNode$2);
const __iconNode$1 = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
];
const Lock = createLucideIcon("lock", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "M12 8v4", key: "1got3b" }],
  ["path", { d: "M12 16h.01", key: "1drbdi" }]
];
const ShieldAlert = createLucideIcon("shield-alert", __iconNode);
function UsuariosPage() {
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,nome,ativo"),
      supabase.from("user_roles").select("user_id, role")
    ]);
    const map = /* @__PURE__ */ new Map();
    (roles ?? []).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    setUsers((profs ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] })));
    setLoading(false);
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const setRole = async (userId, role) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
    load();
  };
  const approve = async (u, role = "viewer") => {
    await Promise.all([
      supabase.from("profiles").update({ ativo: true }).eq("id", u.id),
      supabase.from("user_roles").insert({ user_id: u.id, role })
    ]);
    load();
  };
  const reject = async (id) => {
    if (!confirm("Recusar e excluir esta solicitação?")) return;
    await Promise.all([
      supabase.from("user_roles").delete().eq("user_id", id),
      supabase.from("profiles").delete().eq("id", id)
    ]);
    load();
  };
  const toggleActive = async (u) => {
    await supabase.from("profiles").update({ ativo: !u.ativo }).eq("id", u.id);
    load();
  };
  const pending = users.filter((u) => !u.ativo || u.roles.length === 0);
  const active = users.filter((u) => u.ativo && u.roles.length > 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8", children: [
    pending.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 18 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-[10px] font-bold uppercase tracking-[0.2em]", children: [
          "Aguardando Aprovação (",
          pending.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3", children: pending.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 flex items-center justify-between border-primary/20 bg-primary/5 animate-pulse-subtle", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: u.nome || "Novo Usuário" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5", children: "Solicitou acesso ao sistema" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              onChange: (e) => approve(u, e.target.value),
              className: "field py-2 text-[10px] font-bold uppercase tracking-widest min-w-[140px] border-primary/30",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Aprovar como..." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "viewer", children: "Visualizador" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "supervisor", children: "Supervisor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "Administrador" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => reject(u.id),
              className: "p-3 text-muted-foreground hover:text-destructive bg-white/5 rounded-xl border border-white/10",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { size: 16 })
            }
          )
        ] })
      ] }, u.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 18 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[10px] font-bold uppercase tracking-[0.2em]", children: "Usuários Ativos" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: ["Nome", "Papel de Acesso", "Status", "Ações"].map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/50", children: h }, h)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-white/5", children: active.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-white/[0.02] transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 16 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: u.nome })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: u.roles[0] ?? "viewer",
                onChange: (e) => setRole(u.id, e.target.value),
                className: "field py-2 text-[10px] font-bold uppercase tracking-widest min-w-[140px] border-white/10",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "Administrador" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "supervisor", children: "Supervisor" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "viewer", children: "Visualizador" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20", children: "Ativo" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleActive(u), className: "p-2 text-muted-foreground hover:text-destructive transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { size: 16 }) }) })
          ] }, u.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:hidden divide-y divide-white/5", children: active.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold", children: u.nome }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] text-primary font-black uppercase tracking-widest", children: "Acesso Ativo" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleActive(u), className: "p-2.5 rounded-xl border border-white/5 text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { size: 18 }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: u.roles[0] ?? "viewer",
              onChange: (e) => setRole(u.id, e.target.value),
              className: "field py-4 text-xs font-bold uppercase tracking-widest border-white/10",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "Administrador" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "supervisor", children: "Supervisor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "viewer", children: "Visualizador" })
              ]
            }
          )
        ] }, u.id)) })
      ] })
    ] })
  ] });
}
function SettingsPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = reactExports.useState("usuarios");
  if (!loading && !isAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-[60vh] flex flex-col items-center justify-center text-center p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6 animate-bounce", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { size: 32 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black uppercase tracking-widest mb-2", children: "Acesso Restrito" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest max-w-xs", children: "Você não tem permissões de administrador para acessar este painel." })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SectionHeader,
        {
          code: "CFG-01",
          title: "Configurações",
          subtitle: "Painel Administrativo"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/",
          className: "btn-secondary flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "rotate-180", size: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Voltar" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit", children: [
      { id: "usuarios", label: "Usuários & Acesso", icon: Users },
      { id: "sistema", label: "Sistema", icon: Database },
      { id: "notificacoes", label: "Notificações", icon: Bell }
    ].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setTab(t.id),
        className: `flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tab === t.id ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { size: 16 }),
          t.label
        ]
      },
      t.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
      tab === "usuarios" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-primary/5 border border-primary/10 p-5 rounded-2xl flex gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "text-primary shrink-0", size: 24 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-white mb-1", children: "Central de Aprovação" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground uppercase tracking-widest leading-relaxed", children: "Gerencie permissões e aprove novos colaboradores. Usuários desativados não podem acessar nenhuma funcionalidade do sistema." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(UsuariosPage, {})
      ] }),
      tab === "sistema" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-8 text-center space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 32 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold", children: "Informações do Sistema" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-md mx-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-white/5 rounded-xl border border-white/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] uppercase tracking-widest text-muted-foreground mb-1", children: "Versão" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: "2.1.0-industrial" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-white/5 rounded-xl border border-white/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] uppercase tracking-widest text-muted-foreground mb-1", children: "Ambiente" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold text-primary", children: "Produção" })
          ] })
        ] })
      ] }),
      tab === "notificacoes" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-12 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 48, className: "mx-auto mb-4 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest", children: "Configurações de notificações em breve" })
      ] })
    ] })
  ] });
}
export {
  SettingsPage as S
};
