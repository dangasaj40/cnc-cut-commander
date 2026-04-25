import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SectionHeader } from "@/components/SectionHeader";
import UsuariosPage from "./Usuarios";
import GerenciarCatalogo from "./GerenciarCatalogo";
import { useAuth } from "@/lib/auth";
import { 
  Settings as SettingsIcon, 
  Users, 
  ShieldCheck, 
  Database, 
  Info,
  Bell,
  Lock,
  ArrowRight,
  Sparkles
} from "lucide-react";

type Tab = "usuarios" | "catalogo" | "sistema" | "notificacoes";

export default function SettingsPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("usuarios");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [manualModel, setManualModel] = useState("gemini-2.0-flash-lite");

  const saveApiKey = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    alert("Chave API salva com sucesso!");
  };

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
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit overflow-x-auto max-w-full">
        {[
          { id: "usuarios", label: "Usuários", icon: Users },
          { id: "catalogo", label: "Catálogo", icon: Database },
          { id: "sistema", label: "Sistema", icon: Info },
          { id: "notificacoes", label: "Alertas", icon: Bell },
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

        {tab === "catalogo" && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl flex gap-4">
              <Database className="text-primary shrink-0" size={24} />
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Gerenciamento de Nestings</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Adicione, edite ou remova planos de corte do catálogo técnico. Estas informações alimentam o registro de produção e o catálogo de consulta.
                </p>
              </div>
            </div>
            <GerenciarCatalogo />
          </div>
        )}

        {tab === "sistema" && (
          <div className="space-y-6">
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

            {/* Configuração da IA */}
            <div className="glass-card p-6 md:p-8 space-y-6 border-primary/20">
              <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                <Sparkles size={24} />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Integração Gemini IA</h3>
                  <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Configurações de inteligência artificial</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Chave de API (Google AI Studio)</span>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input 
                      type="password" 
                      className="field flex-1" 
                      placeholder="Cole sua API Key aqui..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button onClick={saveApiKey} className="btn-primary py-3.5 px-8 text-[10px] whitespace-nowrap">
                      Salvar Chave
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-2 pt-4 border-t border-white/5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Testar Modelo Específico</span>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input 
                      type="text" 
                      className="field flex-1" 
                      placeholder="Ex: gemini-2.0-flash-lite"
                      value={manualModel}
                      onChange={(e) => setManualModel(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (!apiKey) return alert("Insira uma chave primeiro.");
                        try {
                          const { GoogleGenerativeAI } = await import("@google/generative-ai");
                          const genAI = new GoogleGenerativeAI(apiKey);
                          const model = genAI.getGenerativeModel({ model: manualModel });
                          const result = await model.generateContent("Oi");
                          alert("Sucesso com " + manualModel + "! Resposta: " + result.response.text());
                        } catch (e: any) {
                          alert("Falha com " + manualModel + ": " + e.message);
                        }
                      }} 
                      className="bg-white/5 hover:bg-white/10 text-white py-3.5 px-6 rounded-xl text-[10px] font-bold uppercase border border-white/10 whitespace-nowrap"
                    >
                      Testar Modelo
                    </button>
                  </div>
                </label>

                <div className="flex justify-end">
                   <button 
                    onClick={async () => {
                      if (!apiKey) return alert("Insira a chave primeiro.");
                      try {
                        // Usando fetch direto para a API de listagem para garantir que vemos tudo
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
                        const data = await res.json();
                        if (data.error) throw new Error(data.error.message);
                        const names = data.models.map((m: any) => m.name.replace("models/", "")).join("\n");
                        alert("Modelos disponíveis para sua chave:\n\n" + names);
                      } catch (e: any) {
                        alert("Erro ao listar: " + e.message);
                      }
                    }}
                    className="text-[9px] text-muted-foreground hover:text-primary uppercase font-bold tracking-widest underline underline-offset-4"
                   >
                     Não sabe qual modelo usar? Listar Modelos Disponíveis
                   </button>
                </div>
                <div className="bg-primary/5 p-4 rounded-xl flex gap-3 items-start border border-primary/10">
                  <Info size={18} className="text-primary shrink-0" />
                  <p className="text-[10px] text-primary/80 leading-relaxed uppercase font-bold italic">
                    A chave de API é usada para habilitar o assistente de importação inteligente no catálogo de nestings.
                  </p>
                </div>
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
