import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { ReactNode } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Users, 
  AlertTriangle, 
  UserCircle,
  LogOut,
  Settings,
  ShieldAlert
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/producao", label: "Corte", icon: PlusCircle },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/operadores", label: "Equipe", icon: Users },
  { to: "/ocorrencias", label: "Alertas", icon: AlertTriangle },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const { profile, roles, signOut, isAdmin, loading } = useAuth();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background text-foreground pb-24 md:pb-0 md:pl-20 lg:pl-0 transition-all">
      {/* Header Mobile / Top Bar Desktop */}
      <header className="sticky top-0 z-40 bg-[#09090b] border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div className="size-2.5 bg-primary rounded-full shadow-[0_0_10px_var(--laser)] animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-white">CNC COMMANDER</h1>
            <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold mt-1.5 flex items-center gap-1.5">
              <span className="size-1 bg-primary rounded-full" />
              SISTEMA ATIVO
            </p>
          </div>
        </div>

        {profile?.ativo && roles.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] font-bold uppercase">{profile?.nome || "Operador"}</span>
              <span className="text-[9px] text-primary uppercase tracking-widest">{roles[0] || "Acesso"}</span>
            </div>
            <button 
              onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
              className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto p-5 md:p-8 animate-slide-up">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
             <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Sincronizando...</span>
          </div>
        ) : !profile?.ativo || roles.length === 0 ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
            <div className="size-24 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-[0_0_50px_rgba(251,191,36,0.1)] mb-8 animate-pulse">
              <ShieldAlert size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-3">Acesso Pendente</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed max-w-sm mb-8">
              Sua conta foi criada com sucesso, mas ainda precisa ser **autorizada por um administrador** antes que você possa visualizar os dados de produção.
            </p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="size-2 bg-primary rounded-full animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando aprovação do sistema...</span>
            </div>
            <button 
              onClick={() => signOut()}
              className="mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <LogOut size={14} /> Sair da conta
            </button>
          </div>
        ) : (
          children ?? <Outlet />
        )}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {profile?.ativo && roles.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b] border-t border-white/10 md:hidden px-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around py-3">
            {NAV.map((n) => {
              const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`nav-item flex flex-col items-center gap-1.5 min-w-[56px] transition-all ${
                    active ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[8px] font-bold uppercase tracking-tight">{n.label}</span>
                  {active && <div className="size-1 bg-primary rounded-full shadow-[0_0_5px_var(--laser)] mt-0.5" />}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/configuracoes"
                className={`nav-item flex flex-col items-center gap-1.5 min-w-[56px] transition-all ${
                  path.startsWith("/configuracoes") ? "text-primary scale-110" : "text-muted-foreground"
                }`}
              >
                <Settings size={20} strokeWidth={path.startsWith("/configuracoes") ? 2.5 : 2} />
                <span className="text-[8px] font-bold uppercase tracking-tight">Ajustes</span>
                {path.startsWith("/configuracoes") && <div className="size-1 bg-primary rounded-full shadow-[0_0_5px_var(--laser)] mt-0.5" />}
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* Side Navigation (Desktop Only) */}
      {profile?.ativo && roles.length > 0 && (
        <nav className="fixed left-0 top-0 bottom-0 w-20 hidden md:flex flex-col items-center py-8 glass border-r border-white/5 z-50">
           <div className="flex flex-col gap-8 flex-1">
            {NAV.map((n) => {
              const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`p-3 rounded-2xl transition-all ${
                    active ? "bg-primary text-black shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon size={24} />
                </Link>
              );
            })}
           </div>
           {isAdmin && (
             <Link to="/configuracoes" className={`p-3 rounded-2xl transition-all ${path.startsWith("/configuracoes") ? "bg-primary text-black shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-white/5"}`}>
                <Settings size={24} />
             </Link>
           )}
        </nav>
      )}
    </div>
  );
}
