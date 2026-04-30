import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Sparkles,
  X,
  Plus,
  RefreshCw,
  Zap
} from "lucide-react";

function ParameterList({ title, paramKey }: { title: string, paramKey: string }) {
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    supabase.from("system_settings").select("value").eq("key", paramKey).maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try { setItems(JSON.parse(data.value)); } catch(e){}
        }
      });
  }, [paramKey]);

  const saveItems = async (newItems: string[]) => {
    await supabase.from("system_settings").upsert({ 
      key: paramKey, 
      value: JSON.stringify(newItems), 
      updated_at: new Date().toISOString() 
    });
    setItems(newItems);
  };

  const add = () => {
    if (!newItem.trim() || items.includes(newItem.trim())) return;
    saveItems([...items, newItem.trim()]);
    setNewItem("");
  };

  const remove = (idx: number) => {
    const arr = [...items];
    arr.splice(idx, 1);
    saveItems(arr);
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col h-full shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-50 pb-2">{title}</h4>
      <div className="flex flex-wrap gap-2 mb-4 flex-1 content-start">
        {items.length === 0 && <span className="text-xs text-slate-400 italic">Nenhum item...</span>}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
            {item}
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 ml-1 transition-colors">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        <input 
          type="text" 
          className="flex-1 py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400" 
          value={newItem} 
          onChange={e => setNewItem(e.target.value)} 
          placeholder="Novo..." 
          onKeyDown={e => e.key === 'Enter' && add()} 
        />
        <button onClick={add} className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 shadow-md transition-all active:scale-95">
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

type Tab = "usuarios" | "catalogo" | "sistema" | "notificacoes";

export default function SettingsPage() {
  const { isAdmin, loading, signOut } = useAuth();
  
  // Lê a aba da URL se disponível
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab") as Tab;
    return ["usuarios", "catalogo", "sistema", "notificacoes"].includes(t) ? t : "usuarios";
  });
  
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    supabase.from("system_settings").select("value").eq("key", "gemini_api_key").maybeSingle()
      .then(({ data }) => {
        if (data) setApiKey(data.value);
      });
  }, []);

  const saveApiKey = async () => {
    if (!apiKey) {
      await supabase.from("system_settings").delete().eq("key", "gemini_api_key");
      alert("Chave API removida.");
      return;
    }
    const { error } = await supabase.from("system_settings").upsert({ 
      key: "gemini_api_key", 
      value: apiKey,
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      alert("Erro ao salvar a chave: " + error.message);
    } else {
      alert("Chave API salva com sucesso para todos os administradores!");
    }
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
          { id: "catalogo", label: "Nestings", icon: Database },
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
                <h3 className="text-sm font-bold mb-1">Central de Aprovação</h3>
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
                <h3 className="text-sm font-bold mb-1">Gestão de Nestings</h3>
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
             {/* Parâmetros do Negócio (Aba PARAMETROS da Planilha) */}
             <div className="glass-card p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between gap-3 text-primary border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Database size={24} />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest">Parâmetros de Operação</h3>
                      <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Listas de validação do chão de fábrica</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!confirm("Deseja carregar todos os operadores, máquinas e motivos padrão da planilha? Isso irá sobrescrever as listas atuais.")) return;
                      
                      const params = {
                        maquinas: ["CNC 01", "CNC 02", "CNC 03", "CNC 04"],
                        turnos: ["1º TURNO", "2º TURNO", "3º TURNO"],
                        operadores: ["ALBERIS", "ALCIR", "ANDRE", "ANTONIO", "CARLOS", "CLEBIO", "DANILO", "EDNALDO", "EDSON", "ELINALDO", "ERIVALDO", "EVANDRO", "EXPEDITO", "FERNANDO", "GENIVALDO", "GILVAN", "HEVERTON", "JAIRO", "JOAO PAULO", "JOSE", "JULIO", "LEANDRO", "LUCAS", "LUCIANO", "LUIZ", "MANOEL", "MARCIO", "MARCOS", "MAURICIO", "PAULO", "RAFAEL", "REGINALDO", "RICARDO", "ROBERTO", "RODRIGO", "ROGERIO", "RONALDO", "SAMUEL", "SERGIO", "THIAGO", "VALDEMIR", "WAGNER", "WASHINGTON", "WESLEY", "WILLAMS", "WILSON"],
                        motivos_parada: ["AGUARDANDO MATERIAL", "AGUARDANDO PROGRAMAÇÃO", "ALIMENTAÇÃO", "AJUSTE DE MÁQUINA", "LIMPEZA", "MANUTENÇÃO CORRETIVA", "MANUTENÇÃO PREVENTIVA", "OUTROS", "PALESTRA/REUNIÃO", "REPARO DE PEÇA", "SEM OPERADOR", "TROCA DE FERRAMENTA"],
                        tipos_balsa: ["RAKE", "BALSA", "PLANO"]
                      };

                      for (const [key, value] of Object.entries(params)) {
                        await supabase.from("system_settings").upsert({
                          key,
                          value: JSON.stringify(value),
                          updated_at: new Date().toISOString()
                        });
                      }
                      
                      alert("Parâmetros carregados com sucesso! A página será reiniciada.");
                      window.location.reload();
                    }}
                    className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary hover:text-black transition-all shadow-sm"
                  >
                    Importar Padrões da Planilha
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ParameterList title="Máquinas Ativas" paramKey="maquinas" />
                  <ParameterList title="Turnos de Trabalho" paramKey="turnos" />
                  <ParameterList title="Operadores de Máquina" paramKey="operadores" />
                  <ParameterList title="Motivos de Parada" paramKey="motivos_parada" />
                  <ParameterList title="Tipos de Balsa" paramKey="tipos_balsa" />
                </div>
             </div>

             {/* Manutenção de Dados */}
             <div className="glass-card p-6 md:p-8 space-y-6 border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-3 text-amber-500 border-b border-white/5 pb-4">
                  <RefreshCw size={24} />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">Manutenção de Dados</h3>
                    <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Sincronização retroativa de pesos e tempos</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                   <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">
                      Se o seu Dashboard estiver com valores zerados, clique no botão abaixo. O sistema irá buscar os pesos e tempos de corte na **Base Técnica** e preencher os registros antigos que foram criados antes desta funcionalidade.
                   </p>
                   
                   <button 
                    id="btn-sync-data"
                    onClick={async (e) => {
                       const btn = e.currentTarget;
                       btn.disabled = true;
                       const originalText = btn.innerHTML;
                       btn.innerHTML = "Sincronizando... Aguarde";
                       
                       try {
                          // 1. Buscar Nestings da Base
                          const { data: baseItems } = await supabase.from("base_dados").select("nesting, peso_total_kg, tempo_corte_total");
                          if (!baseItems) throw new Error("Base não encontrada");
                          
                          const nestingMap: Record<string, { p: number, t: number }> = {};
                          baseItems.forEach(i => {
                             if (!nestingMap[i.nesting]) nestingMap[i.nesting] = { p: 0, t: Number(i.tempo_corte_total || 0) };
                             nestingMap[i.nesting].p += Number(i.peso_total_kg || 0);
                          });
                          
                          // 2. Sincronizar controle_nestings
                          const { data: controls } = await supabase.from("controle_nestings").select("id, nesting").is("peso_total", null);
                          if (controls) {
                             for (const c of controls) {
                                const d = nestingMap[c.nesting];
                                if (d) await supabase.from("controle_nestings").update({ peso_total: d.p, tempo_corte_total: d.t }).eq("id", c.id);
                             }
                          }
                          
                          // 3. Sincronizar log_retorno
                          const { data: logs } = await supabase.from("log_retorno").select("id, nesting").is("peso_total", null);
                          if (logs) {
                             for (const l of logs) {
                                const d = nestingMap[l.nesting];
                                if (d) await supabase.from("log_retorno").update({ peso_total: d.p, tempo_corte_total: d.t }).eq("id", l.id);
                             }
                          }
                          
                          alert("Dados sincronizados com sucesso! O Dashboard já deve exibir os valores corretos.");
                       } catch (err: any) {
                          alert("Erro na sincronização: " + err.message);
                       } finally {
                          btn.disabled = false;
                          btn.innerHTML = originalText;
                       }
                    }}
                    className="btn-primary bg-amber-500 text-black hover:bg-amber-400 w-fit flex items-center gap-2"
                   >
                      <Zap size={16} /> Sincronizar Pesos e Tempos Agora
                   </button>
                </div>
             </div>

            {/* Configuração da IA */}
            <div className="glass-card p-6 md:p-8 space-y-6 border-primary/20">
              <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                <Sparkles size={24} />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Integração Gemini IA</h3>
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

      <div className="pt-8 border-t border-white/5 mt-4">
        <div className="glass-card p-6 border-destructive/20 bg-destructive/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Encerrar Sessão</h3>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Sair com segurança do painel administrativo
            </p>
          </div>
          <button 
            onClick={() => {
              signOut();
              window.location.href = "/login";
            }} 
            className="btn-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[200px]"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
