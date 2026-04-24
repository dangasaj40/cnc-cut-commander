import { M as useRouter, r as reactExports, T as jsxRuntimeExports } from "./worker-entry-Be5YVpJa.js";
import { s as supabase } from "./router-BQgQf1IX.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [message, setMessage] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    supabase.auth.getSession().then(({
      data
    }) => {
      if (!data.session) {
        setError("Link de recuperação inválido ou expirado.");
      }
    });
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const {
      error: error2
    } = await supabase.auth.updateUser({
      password
    });
    setBusy(false);
    if (error2) {
      setError(error2.message);
      return;
    }
    setMessage("Senha atualizada com sucesso! Você será redirecionado para o login.");
    setTimeout(() => {
      router.navigate({
        to: "/login"
      });
    }, 3e3);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-dvh flex items-center justify-center bg-background px-4 py-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 border border-laser flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-2.5 bg-laser shadow-[0_0_10px_var(--laser)]" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground tracking-[0.25em] uppercase", children: "Shipyard CNC" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold tracking-tight uppercase", children: "Plasma Control" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-steel-light p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold uppercase tracking-wider mb-2", children: "Nova Senha" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mb-6", children: "Crie uma nova senha para sua conta." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Nova Senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "field", placeholder: "••••••••" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Confirmar Senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "field", placeholder: "••••••••" })
          ] }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wider border border-destructive/40 text-destructive px-3 py-2", children: error }),
          message && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-wider border border-laser/40 text-laser px-3 py-2", children: message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: busy || !!message, className: "bg-laser text-primary-foreground py-3 font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50", children: busy ? "Salvando..." : "Atualizar Senha" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .field {
          width: 100%;
          background: var(--input);
          border: 1px solid var(--border);
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          color: var(--foreground);
          font-family: var(--font-mono);
          outline: none;
        }
        .field:focus { border-color: var(--laser); box-shadow: 0 0 0 1px var(--laser); }
      ` })
  ] });
}
export {
  ResetPasswordPage as component
};
