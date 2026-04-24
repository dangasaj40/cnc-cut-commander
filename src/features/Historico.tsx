import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/lib/auth";
import { 
  Search, 
  Calendar, 
  User, 
  Hash, 
  Weight, 
  FileText, 
  Filter,
  Trash2,
  ChevronRight
} from "lucide-react";

interface Row {
  id: string;
  peca: string;
  nesting: string | null;
  painel: string | null;
  balsa: string | null;
  quantidade: number;
  peso_total: number | null;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  observacoes: string | null;
  avulsa: boolean;
  operador: { nome: string } | null;
}

export default function HistoricoPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: "", to: "", operador: "", balsa: "", nesting: "" });

  const load = async () => {
    setLoading(true);
    let q = supabase.from("producao").select("*, operador:operadores(nome)").order("data", { ascending: false }).order("created_at", { ascending: false }).limit(500);
    if (filters.from) q = q.gte("data", filters.from);
    if (filters.to) q = q.lte("data", filters.to);
    if (filters.balsa) q = q.ilike("balsa", `%${filters.balsa}%`);
    if (filters.nesting) q = q.ilike("nesting", `%${filters.nesting}%`);
    
    const { data } = await q;
    let r = (data ?? []) as Row[];
    if (filters.operador) {
      r = r.filter((x) => x.operador?.nome.toLowerCase().includes(filters.operador.toLowerCase()));
    }
    setRows(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => ({
    pcs: rows.reduce((s, r) => s + r.quantidade, 0),
    kg: rows.reduce((s, r) => s + Number(r.peso_total || 0), 0),
  }), [rows]);

  const del = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    await supabase.from("producao").delete().eq("id", id);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader 
        code="HST-01" 
        title="Histórico" 
        subtitle={`${rows.length} registros • ${totals.pcs} pcs • ${totals.kg.toFixed(0)} kg`} 
      />

      {/* Filters */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <Filter size={16} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Filtros de Busca</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FilterField label="De" icon={<Calendar size={14}/>}>
            <input type="date" className="field" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </FilterField>
          <FilterField label="Até" icon={<Calendar size={14}/>}>
            <input type="date" className="field" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </FilterField>
          <FilterField label="Operador" icon={<User size={14}/>}>
            <input className="field" placeholder="Nome..." value={filters.operador} onChange={(e) => setFilters({ ...filters, operador: e.target.value })} />
          </FilterField>
          <FilterField label="Balsa" icon={<Hash size={14}/>}>
            <input className="field" placeholder="Ex: RAKE..." value={filters.balsa} onChange={(e) => setFilters({ ...filters, balsa: e.target.value })} />
          </FilterField>
          <FilterField label="Nesting" icon={<Hash size={14}/>}>
            <input className="field" placeholder="Ex: 4465..." value={filters.nesting} onChange={(e) => setFilters({ ...filters, nesting: e.target.value })} />
          </FilterField>
          <div className="flex items-end">
            <button onClick={load} className="btn-primary w-full py-3 text-[10px] flex items-center justify-center gap-2">
              <Search size={14} /> Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Cards / Desktop Table */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
            <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground uppercase tracking-widest text-xs">
            Nenhum registro encontrado
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden lg:block glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    {["Data", "Peça", "Nesting", "Balsa", "Operador", "Qtd", "Peso", ""].map((h) => (
                      <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4 text-xs font-mono">{r.data}</td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold">{r.peca}</div>
                        {r.avulsa && <span className="text-[8px] text-primary uppercase font-black tracking-tighter">● Avulsa</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{r.nesting || "—"}</td>
                      <td className="px-5 py-4 text-xs font-medium text-primary/80">{r.balsa || "—"}</td>
                      <td className="px-5 py-4 text-xs">{r.operador?.nome || "—"}</td>
                      <td className="px-5 py-4 text-xs font-bold tabular-nums">{r.quantidade}</td>
                      <td className="px-5 py-4 text-xs font-black tabular-nums">{Number(r.peso_total || 0).toFixed(1)} <span className="text-[9px] text-muted-foreground ml-0.5">KG</span></td>
                      <td className="px-5 py-4 text-right">
                        {isAdmin && (
                          <button onClick={() => del(r.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden flex flex-col gap-4">
              {rows.map((r) => (
                <div key={r.id} className="glass-card p-5 space-y-4 relative overflow-hidden">
                  {r.avulsa && <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Peça Individual</div>}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground mb-1">{r.data} • {r.nesting || "S/N"}</div>
                      <h3 className="text-sm font-bold leading-snug">{r.peca}</h3>
                    </div>
                    {isAdmin && (
                      <button onClick={() => del(r.id)} className="p-2 -mt-2 -mr-2 text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-white/60">Operador</span>
                      <span className="text-xs font-medium">{r.operador?.nome || "—"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-white/60">Balsa</span>
                      <span className="text-xs font-bold text-primary">{r.balsa || "—"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-white/60">Quantidade</span>
                      <span className="text-sm font-black tabular-nums">{r.quantidade} <span className="text-[10px] font-normal text-white/40 ml-1">PCS</span></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-white/60">Peso Total</span>
                      <span className="text-sm font-black tabular-nums text-primary">{Number(r.peso_total || 0).toFixed(1)} <span className="text-[10px] font-normal text-white/40 ml-1">KG</span></span>
                    </div>
                  </div>

                  {r.observacoes && (
                    <div className="bg-white/5 p-3 rounded-xl flex gap-3 items-start">
                      <FileText size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed italic">{r.observacoes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 px-1">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
      </div>
      {children}
    </label>
  );
}
