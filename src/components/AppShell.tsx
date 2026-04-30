import { useEffect } from "react";
import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ReactNode } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Users, 
  Library, 
  LogOut,
  Settings,
  ShieldAlert,
  Cpu,
  Package,
  AlertTriangle,
  Trophy,
  ScrollText
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "supervisor", "viewer"] },
  { to: "/balsas", label: "Balsas", icon: Package, roles: ["admin", "supervisor"] },
  { to: "/emissao", label: "Emissão", icon: PlusCircle, roles: ["admin", "supervisor"] },
  { to: "/retorno", label: "Baixa de Produção", icon: History, roles: ["admin", "supervisor", "viewer"] },
  { to: "/paradas", label: "Paradas", icon: AlertTriangle, roles: ["admin", "supervisor", "viewer"] },
  { to: "/operadores", label: "Operadores", icon: Trophy, roles: ["admin", "supervisor", "viewer"] },
  { to: "/historico", label: "Histórico", icon: ScrollText, roles: ["admin", "supervisor", "viewer"] },
  { to: "/catalogo", label: "Nestings", icon: Library, roles: ["admin", "supervisor", "viewer"] },
] as const;

export function AppShell({ children }: { children?: ReactNode }) {
  const { profile, roles, signOut, isAdmin, loading } = useAuth();
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Robô de Auto-Preenchimento Silencioso
  useEffect(() => {
    const runSetup = async () => {
      // 1. Verificar Operadores (Lista Antiga vs Nova)
      const { data: opData } = await supabase.from("system_settings").select("value").eq("key", "operadores").maybeSingle();
      const currentOps = opData?.value ? JSON.parse(opData.value) : [];
      
      if (currentOps.length === 0 || currentOps.includes("ALBERIS")) {
        console.log("Atualizando parâmetros...");
        const params = {
          maquinas: ["606", "605", "603"],
          turnos: ["D", "N"],
          operadores: ["MÁRCIO REBOUÇAS", "IVANILTON", "MARCOS", "ALBERT ASTEN", "JAILSON", "RICARDO"],
          motivos_parada: ["TROCA DE CONSUMIVEL", "MANUTENCAO", "FALTA DE CHAPA", "AJUSTE", "PROGRAMACAO", "OUTROS"],
          tipos_balsa: ["RAKE", "BOX", "BALSA"]
        };

        for (const [key, value] of Object.entries(params)) {
          await supabase.from("system_settings").upsert({
            key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
          });
        }
      }

      // 2. Garantir Criação de Balsas Históricas (Usa flag para rodar apenas uma vez)
      if (!localStorage.getItem("balsas_sync_done")) {
        console.log("Sincronizando balsas históricas...");
        const historicalBalsas = [
          { id_balsa: "RAKE-13", tipo_balsa: "RAKE", nome_balsa: "13" },
          { id_balsa: "BOX-15", tipo_balsa: "BOX", nome_balsa: "15" },
          { id_balsa: "BOX-16", tipo_balsa: "BOX", nome_balsa: "16" },
          { id_balsa: "RAKE-14", tipo_balsa: "RAKE", nome_balsa: "14" }
        ];

        for (const b of historicalBalsas) {
          await supabase.from("balsas").upsert(b, { onConflict: 'id_balsa' });
        }
        localStorage.setItem("balsas_sync_done", "true");
        console.log("Balsas históricas prontas!");
      }
    };
    runSetup();
  }, []);

  return (
    <div className="min-h-dvh bg-[#F1F5F9] text-[#0F172A] flex flex-col">

      {/* ─── BODY (Sidebar + Content) ─── */}
      <div className="flex flex-1 overflow-hidden bg-[#F1F5F9]">

        {/* ─── SIDEBAR DESKTOP ─── */}
        {profile?.ativo && roles.length > 0 && (
          <aside
            style={{ background: "#1E293B", borderRight: "none", width: "240px" }}
            className="hidden md:flex flex-col shrink-0 py-6 px-4"
          >
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-2 mb-8">
              <div
                style={{ background: "rgba(163,230,53,0.15)", border: "1px solid rgba(163,230,53,0.3)" }}
                className="size-8 rounded-lg flex items-center justify-center"
              >
                <Cpu size={16} className="text-[#A3E635]" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">CNC SaaS</h1>
              </div>
            </div>
            {/* Nav Links */}
            <div className="flex flex-col gap-0.5 flex-1">
              {/* Section label */}
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 px-3 py-2 mt-1">
                Navegação
              </p>

              {NAV.filter(n => n.roles.some(r => roles.includes(r as any))).map((n) => {
                const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    style={active ? {
                      background: "rgba(163,230,53,0.15)",
                      color: "#A3E635",
                    } : {}}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active ? "shadow-sm" : "text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#A3E635]" : ""} />
                    <span>{n.label}</span>
                  </Link>
                );
              })}

              {isAdmin && (
                <>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 px-3 py-2 mt-4">
                    Sistema
                  </p>
                  <Link
                    to="/configuracoes"
                    style={path.startsWith("/configuracoes") ? {
                      background: "rgba(163,230,53,0.15)",
                      color: "#A3E635",
                    } : {}}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      path.startsWith("/configuracoes") ? "shadow-sm" : "text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/[0.05]"
                    }`}
                  >
                    <Settings size={18} strokeWidth={path.startsWith("/configuracoes") ? 2.5 : 2} className={path.startsWith("/configuracoes") ? "text-[#A3E635]" : ""} />
                    <span>Ajustes</span>
                  </Link>
                </>
              )}
            </div>

            {/* Footer sidebar */}
            <div className="pt-4 mt-4 flex items-center justify-between px-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">{profile?.nome || "Operador"}</span>
                <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">{roles[0] || "Acesso"}</span>
              </div>
              <button
                onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
                className="p-2 rounded-lg text-[#A1A1AA] hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </aside>
        )}

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-[1100px] mx-auto px-5 py-6 animate-slide-up">
            {loading ? (
              <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div style={{ borderColor: "#1E2D45", borderTopColor: "#2563EB" }}
                     className="size-8 border-2 rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Carregando...
                </span>
              </div>
            ) : (!profile || profile.ativo !== true || roles.length === 0) ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
                <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)" }}
                     className="size-20 rounded-lg flex items-center justify-center mb-6">
                  <ShieldAlert size={40} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">Acesso Pendente</h2>
                <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                  Sua conta foi criada, mas ainda precisa ser autorizada por um administrador antes de visualizar os dados de produção.
                </p>
                <div style={{ background: "#111927", border: "1px solid #1E2D45" }}
                     className="px-4 py-3 rounded flex items-center gap-3 mb-8">
                  <div className="size-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Aguardando aprovação do sistema
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <LogOut size={14} /> Sair da conta
                </button>
              </div>
            ) : (
              children ?? <Outlet />
            )}
          </div>
        </main>
      </div>

      {/* ─── BOTTOM NAV MOBILE ─── */}
      {profile?.ativo && roles.length > 0 && (
        <nav
          style={{ background: "#1E293B", borderTop: "1px solid #334155" }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.15)]"
        >
          <div className="flex items-center justify-around py-2">
            {NAV.filter(n => n.roles.some(r => roles.includes(r as any))).map((n) => {
              const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex flex-col items-center gap-1 min-w-[52px] py-1.5 transition-all"
                  style={{ color: active ? "#A3E635" : "#94A3B8" }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#A3E635]" : ""} />
                  <span className="text-[9px] font-semibold tracking-tight">{n.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/configuracoes"
                className="flex flex-col items-center gap-1 min-w-[52px] py-1.5 transition-all"
                style={{ color: path.startsWith("/configuracoes") ? "#A3E635" : "#94A3B8" }}
              >
                <Settings size={20} strokeWidth={path.startsWith("/configuracoes") ? 2.5 : 2} className={path.startsWith("/configuracoes") ? "text-[#A3E635]" : ""} />
                <span className="text-[9px] font-semibold tracking-tight">Ajustes</span>
              </Link>
            )}
            <button
              onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
              className="flex flex-col items-center gap-1 min-w-[52px] py-1.5 transition-all text-[#94A3B8] hover:text-red-400"
            >
              <LogOut size={20} strokeWidth={2} />
              <span className="text-[9px] font-semibold tracking-tight">Sair</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
