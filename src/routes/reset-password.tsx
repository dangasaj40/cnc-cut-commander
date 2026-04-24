import { createFileRoute, useRouter } from "@tanstack/react-router";
import { FormEvent, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Check if we have a session (Supabase sets it automatically from the hash)
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError("Link de recuperação inválido ou expirado.");
      }
    });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setBusy(true); setError(null); setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Senha atualizada com sucesso! Você será redirecionado para o login.");
    setTimeout(() => {
      router.navigate({ to: "/login" });
    }, 3000);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 border border-laser flex items-center justify-center">
            <div className="size-2.5 bg-laser shadow-[0_0_10px_var(--laser)]" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground tracking-[0.25em] uppercase">Shipyard CNC</div>
            <div className="text-lg font-bold tracking-tight uppercase">Plasma Control</div>
          </div>
        </div>

        <div className="bg-card border border-steel-light p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Nova Senha</h3>
          <p className="text-[11px] text-muted-foreground mb-6">Crie uma nova senha para sua conta.</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nova Senha</span>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="field" 
                placeholder="••••••••" 
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Confirmar Senha</span>
              <input 
                type="password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="field" 
                placeholder="••••••••" 
              />
            </label>

            {error && (
              <div className="text-[11px] uppercase tracking-wider border border-destructive/40 text-destructive px-3 py-2">
                {error}
              </div>
            )}

            {message && (
              <div className="text-[11px] uppercase tracking-wider border border-laser/40 text-laser px-3 py-2">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !!message}
              className="bg-laser text-primary-foreground py-3 font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Salvando..." : "Atualizar Senha"}
            </button>
          </form>
        </div>
      </div>
      <style>{`
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
      `}</style>
    </div>
  );
}
