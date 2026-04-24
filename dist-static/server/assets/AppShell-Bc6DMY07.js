import { M as useRouter, T as jsxRuntimeExports, Z as Outlet } from "./worker-entry-Be5YVpJa.js";
import { u as useAuth, L as Link } from "./router-BQgQf1IX.js";
import { c as createLucideIcon } from "./createLucideIcon-iTdvThdZ.js";
import { U as Users } from "./users-BPolboBD.js";
function useRouterState(opts) {
  const contextRouter = useRouter({ warn: opts?.router === void 0 });
  const router = opts?.router || contextRouter;
  {
    const state = router.stores.__store.get();
    return opts?.select ? opts.select(state) : state;
  }
}
const __iconNode$5 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 12h8", key: "1wcyev" }],
  ["path", { d: "M12 8v8", key: "napkw2" }]
];
const CirclePlus = createLucideIcon("circle-plus", __iconNode$5);
const __iconNode$4 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }]
];
const History = createLucideIcon("history", __iconNode$4);
const __iconNode$3 = [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
];
const LayoutDashboard = createLucideIcon("layout-dashboard", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
];
const LogOut = createLucideIcon("log-out", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
      key: "1i5ecw"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Settings = createLucideIcon("settings", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode);
const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/producao", label: "Corte", icon: CirclePlus },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/operadores", label: "Equipe", icon: Users },
  { to: "/ocorrencias", label: "Alertas", icon: TriangleAlert }
];
function AppShell({ children }) {
  const { profile, roles, signOut, isAdmin, loading } = useAuth();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh bg-background text-foreground pb-24 md:pb-0 md:pl-20 lg:pl-0 transition-all", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-40 bg-[#09090b] border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-2.5 bg-primary rounded-full shadow-[0_0_10px_var(--laser)] animate-pulse" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-black tracking-tight leading-none text-white", children: "CNC COMMANDER" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-primary uppercase tracking-[0.2em] font-bold mt-1.5 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1 bg-primary rounded-full" }),
            "SISTEMA ATIVO"
          ] })
        ] })
      ] }),
      profile?.ativo && roles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:flex flex-col items-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase", children: profile?.nome || "Operador" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-primary uppercase tracking-widest", children: roles[0] || "Acesso" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: async () => {
              await signOut();
              router.navigate({ to: "/login" });
            },
            className: "p-2.5 bg-white/5 rounded-xl border border-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 18 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "max-w-[1200px] mx-auto p-5 md:p-8 animate-slide-up", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-[60vh] flex flex-col items-center justify-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-primary", children: "Sincronizando..." })
    ] }) : !profile?.ativo || roles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-[70vh] flex flex-col items-center justify-center text-center px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-24 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-[0_0_50px_rgba(251,191,36,0.1)] mb-8 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 48, className: "text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-black tracking-tighter uppercase mb-3", children: "Acesso Pendente" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest leading-relaxed max-w-sm mb-8", children: "Sua conta foi criada com sucesso, mas ainda precisa ser **autorizada por um administrador** antes que você possa visualizar os dados de produção." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-2 bg-primary rounded-full animate-ping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Aguardando aprovação do sistema..." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => signOut(),
          className: "mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 14 }),
            " Sair da conta"
          ]
        }
      )
    ] }) : children ?? /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }),
    profile?.ativo && roles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-50 bg-[#09090b] border-t border-white/10 md:hidden px-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-around py-3", children: [
      NAV.map((n) => {
        const active = path === n.to || n.to !== "/" && path.startsWith(n.to);
        const Icon = n.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: n.to,
            className: `nav-item flex flex-col items-center gap-1.5 min-w-[56px] transition-all ${active ? "text-primary scale-110" : "text-muted-foreground"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 20, strokeWidth: active ? 2.5 : 2 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-bold uppercase tracking-tight", children: n.label }),
              active && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-1 bg-primary rounded-full shadow-[0_0_5px_var(--laser)] mt-0.5" })
            ]
          },
          n.to
        );
      }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/configuracoes",
          className: `nav-item flex flex-col items-center gap-1.5 min-w-[56px] transition-all ${path.startsWith("/configuracoes") ? "text-primary scale-110" : "text-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { size: 20, strokeWidth: path.startsWith("/configuracoes") ? 2.5 : 2 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-bold uppercase tracking-tight", children: "Ajustes" }),
            path.startsWith("/configuracoes") && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-1 bg-primary rounded-full shadow-[0_0_5px_var(--laser)] mt-0.5" })
          ]
        }
      )
    ] }) }),
    profile?.ativo && roles.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "fixed left-0 top-0 bottom-0 w-20 hidden md:flex flex-col items-center py-8 glass border-r border-white/5 z-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-8 flex-1", children: NAV.map((n) => {
        const active = path === n.to || n.to !== "/" && path.startsWith(n.to);
        const Icon = n.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: n.to,
            className: `p-3 rounded-2xl transition-all ${active ? "bg-primary text-black shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-white/5"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 24 })
          },
          n.to
        );
      }) }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/configuracoes", className: `p-3 rounded-2xl transition-all ${path.startsWith("/configuracoes") ? "bg-primary text-black shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-white/5"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { size: 24 }) })
    ] })
  ] });
}
export {
  AppShell as A,
  CirclePlus as C,
  TriangleAlert as T
};
