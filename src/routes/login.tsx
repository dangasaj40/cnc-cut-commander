import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, AlertCircle, Cpu, ArrowRight, Mail, Lock, User, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        if (!nome.trim()) {
          setError("O nome é obrigatório.");
          setBusy(false);
          return;
        }
        const res = await signUp(email, password, nome);
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess("Solicitação de cadastro enviada com sucesso! Aguarde a aprovação do administrador.");
          setEmail("");
          setPassword("");
          setNome("");
          setIsSignUp(false);
        }
      } else {
        const res = await signIn(email, password);
        if (res?.error) {
          if (res.error.includes("Invalid login credentials")) {
            setError("E-mail ou senha incorretos.");
          } else if (res.error.includes("Email not confirmed")) {
            setError("E-mail ainda não confirmado. Verifique sua caixa de entrada.");
          } else {
            setError(res.error);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F1F5F9] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] size-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[500px] bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden relative z-10 animate-scale-in">
        
        {/* ─── LEFT PANEL — Branding ─── */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <Cpu size={20} className="text-primary" />
            </div>
            <span className="text-xs font-black text-white tracking-[0.2em] uppercase">CNC Commander</span>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <div className="size-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Sistema de Alta Performance</span>
            </div>
            
            <h2 className="text-4xl font-black text-white leading-tight mb-6">
              Gestão Inteligente<br />
              <span className="text-primary">de Produção Industrial</span>
            </h2>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Plataforma centralizada para otimização de planos de corte, rastreio de peças e controle total da sua operação CNC.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/5">
             <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">
               © {new Date().getFullYear()} Solução para Indústria 4.0
             </p>
          </div>
        </div>

        {/* ─── RIGHT PANEL — Login Form ─── */}
        <div className="flex flex-col items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-sm">
            
            {/* Mobile Header */}
            <div className="lg:hidden flex flex-col items-center mb-12 text-center">
               <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                  <Cpu size={32} className="text-primary" />
               </div>
               <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">CNC Commander</h1>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                {isSignUp ? "Criar Conta" : "Bem-vindo"}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {isSignUp ? "Solicite acesso ao sistema informando seus dados." : "Acesse sua conta para gerenciar a produção."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome Completo</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required={isSignUp}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 group flex items-center justify-center gap-4 bg-primary text-white p-4 rounded-2xl font-bold text-sm shadow-md hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {busy ? (
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isSignUp ? "Solicitar Acesso" : "Entrar"}</span>
                )}
                {!busy && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-shake">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-bold leading-relaxed">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-600 font-bold leading-relaxed">{success}</p>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {isSignUp ? "Já possui uma conta? Faça login" : "Não tem uma conta? Solicite acesso"}
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
               <div className="flex items-center gap-2 text-[#94A3B8]">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conexão Segura</span>
               </div>
               <p className="text-[10px] text-[#94A3B8] text-center uppercase tracking-widest leading-relaxed max-w-[240px]">
                 Este é um terminal de acesso restrito a colaboradores autorizados.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
