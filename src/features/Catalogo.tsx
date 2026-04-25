import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { 
  Library, 
  Search, 
  Layers, 
  Box, 
  Maximize2, 
  Weight, 
  Hash,
  Info
} from "lucide-react";

interface CatalogoItem {
  id: string;
  peca: string;
  nesting: string;
  painel: string;
  tipo_balsa: string;
  quantidade_base: number;
  peso_kg: number;
  dimensional: string;
  espessura_mm: string;
}

export default function CatalogoPage() {
  const [nestings, setNestings] = useState<string[]>([]);
  const [selectedNesting, setSelectedNesting] = useState("");
  const [searchPeca, setSearchPeca] = useState("");
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar Nestings únicos do catálogo
    supabase.from("catalogo_pecas").select("nesting")
      .then(({ data }) => {
        const unique = Array.from(new Set((data ?? []).map(d => d.nesting))).sort();
        setNestings(unique as string[]);
      });
  }, []);

  const loadData = async (nestingVal?: string, pecaVal?: string) => {
    if (!nestingVal && !pecaVal) {
      setItems([]);
      return;
    }
    setLoading(true);
    let q = supabase.from("catalogo_pecas").select("*").order("peca");
    
    if (nestingVal) q = q.eq("nesting", nestingVal);
    if (pecaVal) q = q.ilike("peca", `%${pecaVal}%`);
    
    const { data } = await q.limit(200);
    setItems((data ?? []) as CatalogoItem[]);
    setLoading(false);
  };

  const onNestingChange = (val: string) => {
    setSelectedNesting(val);
    setSearchPeca(""); // Limpa a busca por nome se mudar o nesting
    loadData(val);
  };

  const onSearchPeca = (val: string) => {
    setSearchPeca(val);
    setSelectedNesting(""); // Limpa o nesting se buscar por nome
    loadData(undefined, val);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader 
        code="CAT-01" 
        title="Catálogo Técnico" 
        subtitle="Consulta de componentes e planos de corte" 
      />

      {/* Selection Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6 text-primary">
          <Search size={18} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Pesquisa Avançada</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
              <Layers size={12} className="text-primary" /> Por Nesting
            </span>
            <select 
              className="field" 
              value={selectedNesting} 
              onChange={(e) => onNestingChange(e.target.value)}
            >
              <option value="">— Selecionar Plano —</option>
              {nestings.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
              <Box size={12} className="text-primary" /> Por Nome da Peça
            </span>
            <div className="relative">
              <input 
                type="text"
                className="field pl-10" 
                placeholder="Ex: B2-B, BPR..."
                value={searchPeca}
                onChange={(e) => onSearchPeca(e.target.value)}
              />
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
            <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Buscando no banco...</span>
          </div>
        ) : (!selectedNesting && !searchPeca) ? (
          <div className="glass-card p-20 flex flex-col items-center gap-4 text-center">
            <div className="size-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 text-muted-foreground/30">
              <Search size={32} />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] max-w-xs">
              Selecione um Nesting ou digite o nome de uma peça para começar.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground uppercase tracking-widest text-xs">
            Nenhuma peça encontrada para este Nesting.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="glass-card p-5 space-y-4 hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-primary/10 group-hover:text-primary/20 transition-colors">
                  <Box size={40} />
                </div>

                <div className="flex flex-col gap-1 relative z-10">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Peça</span>
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors pr-8">
                    {item.peca}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 relative z-10">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase mb-1">
                      <Hash size={10} className="text-primary" /> Qtd Base
                    </div>
                    <div className="text-xs font-black text-emerald-400">{item.quantidade_base} <span className="text-[8px] font-normal text-white/40">un</span></div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase mb-1">
                      <Weight size={10} className="text-primary" /> Peso Total
                    </div>
                    <div className="text-xs font-black">{Number(item.peso_kg || 0).toFixed(2)} <span className="text-[8px] font-normal text-white/40">kg</span></div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase mb-1">
                      <Maximize2 size={10} className="text-primary" /> Dimensão
                    </div>
                    <div className="text-[10px] font-mono font-medium">{item.dimensional || "—"}</div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase mb-1">
                      <Info size={10} className="text-primary" /> Painel / Esp.
                    </div>
                    <div className="text-[10px] font-medium">{item.painel || "—"} ({item.espessura_mm}mm)</div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/10 text-muted-foreground">
                    Nesting: <span className="text-emerald-400 font-mono">{item.nesting || "—"}</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/10 text-muted-foreground">
                    Balsa: <span className="text-primary">{item.tipo_balsa || "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
