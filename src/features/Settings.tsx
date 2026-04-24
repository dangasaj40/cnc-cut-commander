import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SectionHeader } from "@/components/SectionHeader";
import UsuariosPage from "./Usuarios";
import { useAuth } from "@/lib/auth";
import { 
  Settings as SettingsIcon, 
  Users, 
  ShieldCheck, 
  Database, 
  Info,
  Bell,
  Lock,
  ArrowRight
} from "lucide-react";

type Tab = "usuarios" | "sistema" | "notificacoes";

export default function SettingsPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("usuarios");

  if (!loading && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6 animate-bounce">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest mb-2">Acesso Restrito</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest max-w-xs">
          Você não tem permissões de administrador para acessar este painel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader 
          code="CFG-01" 
          title="Configurações" 
          subtitle="Painel Administrativo" 
        />
        <Link 
          to="/" 
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowRight className="rotate-180" size={16} />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
        {[
          { id: "usuarios", label: "Usuários & Acesso", icon: Users },
          { id: "sistema", label: "Sistema", icon: Database },
          { id: "notificacoes", label: "Notificações", icon: Bell },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              tab === t.id 
                ? "bg-primary text-black shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {tab === "usuarios" && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl flex gap-4">
              <ShieldCheck className="text-primary shrink-0" size={24} />
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Central de Aprovação</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Gerencie permissões e aprove novos colaboradores. Usuários desativados não podem acessar nenhuma funcionalidade do sistema.
                </p>
              </div>
            </div>
            <UsuariosPage />
          </div>
        )}

        {tab === "sistema" && (
          <div className="glass-card p-8 text-center space-y-4">
             <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Database size={32} />
             </div>
             <h3 className="text-lg font-bold">Informações do Sistema</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-md mx-auto">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Versão</div>
                   <div className="text-sm font-bold">2.1.0-industrial</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Ambiente</div>
                   <div className="text-sm font-bold text-primary">Produção</div>
                </div>
             </div>
          </div>
        )}

        {tab === "notificacoes" && (
          <div className="glass-card p-12 text-center text-muted-foreground">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-widest">Configurações de notificações em breve</p>
          </div>
        )}
      </div>
    </div>
  );
}
