import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal
} from "lucide-react";

type Role = "admin" | "supervisor" | "viewer";
interface Profile { id: string; nome: string; ativo: boolean; }
interface UserRow extends Profile { roles: Role[]; }

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,nome,ativo"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, Role[]>();
    (roles ?? []).forEach((r: { user_id: string; role: Role }) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role); map.set(r.user_id, arr);
    });
    setUsers((profs ?? []).map((p: Profile) => ({ ...p, roles: map.get(p.id) ?? [] })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: Role) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
    load();
  };

  const approve = async (u: UserRow, role: Role = "viewer") => {
    await Promise.all([
      supabase.from("profiles").update({ ativo: true }).eq("id", u.id),
      supabase.from("user_roles").insert({ user_id: u.id, role })
    ]);
    load();
  };

  const reject = async (id: string) => {
    if (!confirm("Recusar e excluir esta solicitação?")) return;
    await Promise.all([
      supabase.from("user_roles").delete().eq("user_id", id),
      supabase.from("profiles").delete().eq("id", id)
    ]);
    load();
  };

  const toggleActive = async (u: UserRow) => {
    await supabase.from("profiles").update({ ativo: !u.ativo }).eq("id", u.id);
    load();
  };

  const pending = users.filter(u => !u.ativo || u.roles.length === 0);
  const active = users.filter(u => u.ativo && u.roles.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Pending Approval */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldAlert size={18} />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Aguardando Aprovação ({pending.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {pending.map((u) => (
              <div key={u.id} className="glass-card p-4 flex items-center justify-between border-primary/20 bg-primary/5 animate-pulse-subtle">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <UserX size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{u.nome || "Novo Usuário"}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Solicitou acesso ao sistema</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                   <select 
                     onChange={(e) => approve(u, e.target.value as Role)}
                     className="field py-2 text-[10px] font-bold uppercase tracking-widest min-w-[140px] border-primary/30"
                   >
                     <option value="">Aprovar como...</option>
                     <option value="viewer">Visualizador</option>
                     <option value="supervisor">Supervisor</option>
                     <option value="admin">Administrador</option>
                   </select>
                   <button 
                     onClick={() => reject(u.id)}
                     className="p-3 text-muted-foreground hover:text-destructive bg-white/5 rounded-xl border border-white/10"
                   >
                     <UserX size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck size={18} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Usuários Ativos</h2>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr>
                  {["Nome", "Papel de Acesso", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {active.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground">
                          <Users size={16} />
                        </div>
                        <span className="text-sm font-bold">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.roles[0] ?? "viewer"}
                        onChange={(e) => setRole(u.id, e.target.value as Role)}
                        className="field py-2 text-[10px] font-bold uppercase tracking-widest min-w-[140px] border-white/10"
                      >
                        <option value="admin">Administrador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                        Ativo
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(u)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <UserX size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-white/5">
            {active.map((u) => (
              <div key={u.id} className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{u.nome}</h3>
                      <div className="text-[8px] text-primary font-black uppercase tracking-widest">Acesso Ativo</div>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(u)} className="p-2.5 rounded-xl border border-white/5 text-muted-foreground hover:text-destructive">
                    <UserX size={18} />
                  </button>
                </div>
                <select
                  value={u.roles[0] ?? "viewer"}
                  onChange={(e) => setRole(u.id, e.target.value as Role)}
                  className="field py-4 text-xs font-bold uppercase tracking-widest border-white/10"
                >
                  <option value="admin">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
