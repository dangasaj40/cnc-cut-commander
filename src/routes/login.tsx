import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { 
  LogIn, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" />;

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError(null);
    const res = await signInWithGoogle();
    if (res?.error) {
      setError(res.error);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-[#09090b] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] size-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="size-20 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30 shadow-[0_0_40px_rgba(251,191,36,0.15)] mb-8">
            <div className="size-5 bg-primary rounded-full shadow-[0_0_20px_var(--laser)] animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">CNC COMMANDER</h1>
          <p className="text-[11px] text-primary uppercase tracking-[0.5em] font-bold">Industrial Control Hub</p>
        </div>

        <div className="glass-card p-10 border-white/5 shadow-2xl text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Autenticação</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
              Utilize sua conta corporativa para acessar o sistema de controle de corte.
            </p>
          </div>

          <div className="py-4">
            <button
              onClick={handleGoogleLogin}
              disabled={busy}
              className="btn-primary w-full py-5 flex items-center justify-center gap-4 group relative overflow-hidden active:scale-95 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              {/* Google "Icon" placeholder using colors */}
              <div className="size-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="size-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>

              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Entrar com Google</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-50" />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 animate-pulse">
              <AlertCircle size={18} className="text-destructive shrink-0" />
              <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">{error}</span>
            </div>
          )}

          <div className="pt-4">
             <div className="flex items-center gap-4 justify-center">
                <div className="h-px bg-white/5 flex-1" />
                <ShieldCheck size={16} className="text-primary/40" />
                <div className="h-px bg-white/5 flex-1" />
             </div>
             <p className="mt-4 text-[9px] text-muted-foreground uppercase tracking-widest">Acesso restrito a usuários autorizados</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold opacity-50">
            &copy; {new Date().getFullYear()} Shipyard Solutions • Industrial Hub
          </p>
        </div>
      </div>
    </div>
  );
}
