import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { u as useAuth, N as Navigate } from "./router-BQgQf1IX.js";
import { A as ArrowRight, S as ShieldCheck } from "./shield-check-B_YF7MZm.js";
import { C as CircleAlert } from "./circle-alert-C8G-aT2S.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./createLucideIcon-iTdvThdZ.js";
function LoginPage() {
  const {
    user,
    signInWithGoogle,
    loading
  } = useAuth();
  const [error, setError] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  if (!loading && user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/" });
  const handleGoogleLogin = async () => {
    setBusy(true);
    setError(null);
    const res = await signInWithGoogle();
    if (res?.error) {
      setError(res.error);
    }
    setBusy(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh flex items-center justify-center p-6 bg-[#09090b] relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[-10%] left-[-10%] size-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-[-10%] right-[-10%] size-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md animate-slide-up relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center mb-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-20 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(251,191,36,0.15)] mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-5 bg-primary rounded-full shadow-[0_0_20px_var(--laser)] animate-pulse" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-black tracking-tighter text-white uppercase mb-2", children: "CNC COMMANDER" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-primary uppercase tracking-[0.5em] font-bold", children: "Industrial Control Hub" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-10 border-white/5 shadow-2xl text-center space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white uppercase tracking-tight", children: "Autenticação" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed", children: "Utilize sua conta corporativa para acessar o sistema de controle de corte." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleGoogleLogin, disabled: busy, className: "btn-primary w-full py-5 flex items-center justify-center gap-4 group relative overflow-hidden active:scale-95 transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-6 bg-white rounded-lg flex items-center justify-center shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", className: "size-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-black uppercase tracking-[0.2em]", children: "Entrar com Google" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 18, className: "group-hover:translate-x-1 transition-transform opacity-50" })
        ] }) }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 18, className: "text-destructive shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-destructive uppercase tracking-wider", children: error })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 justify-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-white/5 flex-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 16, className: "text-primary/40" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-white/5 flex-1" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-[9px] text-muted-foreground uppercase tracking-widest", children: "Acesso restrito a usuários autorizados" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-50", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Shipyard Solutions • Industrial Hub"
      ] }) })
    ] })
  ] });
}
export {
  LoginPage as component
};
