import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/lib/auth";
import { 
  AlertTriangle, 
  PlusCircle, 
  Trash2, 
  Clock, 
  Tag, 
  MessageSquare,
  ChevronRight
} from "lucide-react";

interface Oc { id: string; tipo: string; descricao: string; data: string; usuario_id: string | null; }
const TIPOS = ["Falha de máquina", "Erro de corte", "Retrabalho", "Outros"];

export default function OcorrenciasPage() {
  const { user, isSupervisor, isAdmin } = useAuth();
  const [list, setList] = useState<Oc[]>([]);
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [descricao, setDescricao] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("ocorrencias").select("*").order("data", { ascending: false }).limit(200);
    setList((data ?? []) as Oc[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupervisor) return;
    setBusy(true);
    await supabase.from("ocorrencias").insert({ tipo, descricao, usuario_id: user?.id });
    setDescricao(""); setBusy(false); load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir ocorrência?")) return;
    await supabase.from("ocorrencias").delete().eq("id", id);
    load();
  };
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <SectionHeader code="OCR-01" title="Ocorrências" subtitle="Eventos Operacionais" />

      {isSupervisor && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6 text-primary">
            <PlusCircle size={20} />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Registrar Novo Evento</h2>
          </div>
          
          <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block px-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="field">
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block px-1">Descrição do Evento</label>
              <input required placeholder="Descreva o que aconteceu..." className="field" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button disabled={busy} className="btn-primary w-full py-3.5 text-[11px] flex items-center justify-center gap-2">
                {busy ? "Salvando..." : <><PlusCircle size={16}/> Registrar</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {list.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground text-xs uppercase tracking-widest">Nenhum evento registrado</div>
        ) : (
          list.map((o) => (
            <div key={o.id} className="glass-card p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-all group">
              <div className="size-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                <AlertTriangle size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">{o.tipo}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                    <Clock size={12} />
                    {new Date(o.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">{o.descricao}</p>
              </div>

              {isAdmin && (
                <button onClick={() => del(o.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
