import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/lib/auth";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Edit3, 
  Save, 
  XCircle,
  Hash,
  Contact
} from "lucide-react";

interface Op { id: string; nome: string; matricula: string | null; ativo: boolean; }

export default function OperadoresPage() {
  const { isSupervisor } = useAuth();
  const [list, setList] = useState<Op[]>([]);
  const [nome, setNome] = useState("");
  const [mat, setMat] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("operadores").select("*").order("nome");
    setList((data ?? []) as Op[]);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupervisor) return;
    setBusy(true);
    
    if (editingId) {
      await supabase.from("operadores").update({ nome, matricula: mat || null }).eq("id", editingId);
    } else {
      await supabase.from("operadores").insert({ nome, matricula: mat || null });
    }
    
    cancel();
    setBusy(false);
    load();
  };

  const startEdit = (o: Op) => {
    setEditingId(o.id);
    setNome(o.nome);
    setMat(o.matricula || "");
  };

  const cancel = () => {
    setEditingId(null);
    setNome("");
    setMat("");
  };

  const toggle = async (id: string, ativo: boolean) => {
    if (!isSupervisor) return;
    await supabase.from("operadores").update({ ativo: !ativo }).eq("id", id);
    load();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <SectionHeader code="OPR-01" title="Equipe" subtitle="Gerenciamento de Operadores" />

      {isSupervisor && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6 text-primary">
            <UserPlus size={20} />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">{editingId ? "Editar Operador" : "Novo Operador"}</h2>
          </div>
          
          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Nome Completo</span>
              <div className="relative">
                <Contact className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input required className="field pl-12 w-full" placeholder="Ex: João Silva" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Matrícula / ID</span>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input className="field pl-12 w-full" placeholder="Ex: 12345" value={mat} onChange={(e) => setMat(e.target.value)} />
              </div>
            </label>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button disabled={busy} className="btn-primary flex-1 py-4 flex items-center justify-center gap-2">
                {editingId ? <Save size={18} /> : <UserPlus size={18} />}
                {editingId ? "Salvar Alterações" : "Cadastrar Operador"}
              </button>
              {editingId && (
                <button type="button" onClick={cancel} className="btn-secondary px-6">
                  <XCircle size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Colaboradores</span>
          </div>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{list.length}</span>
        </div>

        <div className="divide-y divide-white/5">
          {list.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs uppercase tracking-widest">Nenhum operador cadastrado</div>
          ) : (
            list.map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-xl flex items-center justify-center border ${o.ativo ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-white/5 text-muted-foreground"}`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      {o.nome}
                      {!o.ativo && <span className="text-[8px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded uppercase">Inativo</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">ID: {o.matricula || "—"}</div>
                  </div>
                </div>

                {isSupervisor && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(o)} className="p-2.5 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-lg border border-white/5">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => toggle(o.id, o.ativo)} className={`p-2.5 rounded-lg border transition-all ${o.ativo ? "text-muted-foreground hover:text-destructive bg-white/5 border-white/5" : "text-primary bg-primary/10 border-primary/20"}`}>
                      {o.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
