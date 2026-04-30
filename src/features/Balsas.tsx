import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { 
  Package, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Trash2,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Balsa {
  id_balsa: string;
  tipo_balsa: string;
  nome_balsa: string;
  data_cadastro: string;
  total_nestings: number;
  emitidos: number;
  finalizados: number;
  pendentes: number;
  percentual_concluido: number;
  status_balsa: string;
}

export default function BalsasPage() {
  const [balsas, setBalsas] = useState<Balsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBalsa, setNewBalsa] = useState({ id: "", tipo: "", nome: "" });
  const [balsaTypes, setBalsaTypes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBalsas();
    fetchParams();
  }, []);

  const fetchBalsas = async () => {
    setLoading(true);
    const { data } = await supabase.from("balsas").select("*").order("data_cadastro", { ascending: false });
    setBalsas(data || []);
    setLoading(false);
  };

  const fetchParams = async () => {
    const { data } = await supabase.from("system_settings").select("value").eq("key", "tipos_balsa").maybeSingle();
    if (data?.value) {
      try { setBalsaTypes(JSON.parse(data.value)); } catch(e){}
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBalsa.id || !newBalsa.tipo) return;

    setIsSaving(true);
    try {
      // 1. Criar o Registro da Balsa
      const { error: balsaError } = await supabase.from("balsas").insert({
        id_balsa: newBalsa.id,
        tipo_balsa: newBalsa.tipo,
        nome_balsa: newBalsa.nome || newBalsa.id,
        status_balsa: "Em andamento"
      });

      if (balsaError) throw balsaError;

      // 2. Buscar a Matriz (Template) na base_dados
      const { data: templateData, error: templateError } = await supabase
        .from("base_dados")
        .select("*")
        .eq("tipo_balsa", newBalsa.tipo);

      if (templateError) throw templateError;

      if (templateData && templateData.length > 0) {
        // 3. Mapear e Inserir no CONTROLE_NESTINGS (Seguindo mdl_ControleNestingsV6)
        const nestingsToInsert = templateData.map(item => ({
          id_balsa: newBalsa.id,
          tipo_balsa: newBalsa.tipo,
          nome_balsa: newBalsa.nome || newBalsa.id,
          bloco: item.bloco,
          painel: item.painel,
          nesting: item.nesting,
          peca: item.peca,
          descricao: item.descricao,
          espessura_mm: Number(item.espessura_mm),
          qtd: item.qtd,
          tempo_corte_total: item.tempo_corte_total,
          status_processo: "Disponivel",
          chave_nesting: `${newBalsa.id}|${item.nesting}`
        }));

        const { error: insertError } = await supabase
          .from("controle_nestings")
          .insert(nestingsToInsert);

        if (insertError) throw insertError;

        // 4. Calcular Total de Nestings ÚNICOS (Chapas)
        const uniqueNestingNumbers = new Set(templateData.map(item => item.nesting));
        const totalUnicos = uniqueNestingNumbers.size;

        // 5. Atualizar os totais na balsa
        const { error: updateError } = await supabase
          .from("balsas")
          .update({
            total_nestings: totalUnicos, // Agora é o total de chapas, não de peças
            pendentes: totalUnicos,
            emitidos: 0,
            finalizados: 0,
            percentual_concluido: 0
          })
          .eq("id_balsa", newBalsa.id);
          
        if (updateError) throw updateError;
      }

      setShowAddModal(false);
      setNewBalsa({ id: "", tipo: "", nome: "" });
      fetchBalsas();
      alert(`Balsa ${newBalsa.id} cadastrada com sucesso! ${templateData?.length || 0} nestings carregados.`);
    } catch (error: any) {
      alert("Erro ao cadastrar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBalsa = async (id: string) => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja excluir a balsa ${id}? 
Isso apagará permanentemente todos os nestings, ordens de emissão e logs de retorno vinculados a ela.`)) return;
    
    const { error } = await supabase.from("balsas").delete().eq("id_balsa", id);
    
    if (error) {
      alert("Erro ao excluir balsa: " + error.message);
    } else {
      fetchBalsas();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader 
        code="PRO-01" 
        title="Cadastro de Balsas" 
        subtitle="Gerenciamento de projetos e progresso"
        right={
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Nova Balsa
          </button>
        }
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-48 animate-pulse bg-white/5" />
          ))
        ) : balsas.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card border-dashed">
             <Package size={48} className="mx-auto mb-4 opacity-20 text-primary" />
             <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Nenhuma balsa cadastrada</p>
          </div>
        ) : (
          balsas.map((b) => (
            <motion.div 
              key={b.id_balsa}
              variants={itemVariants}
              className="bg-white border border-slate-200 rounded-3xl p-0 overflow-hidden flex flex-col group relative shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Package size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-800 leading-tight">{b.id_balsa}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{b.tipo_balsa}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteBalsa(b.id_balsa)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Pendentes</span>
                    <span className="text-sm font-black text-slate-700">{b.pendentes}</span>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 text-center">
                    <span className="text-[9px] uppercase font-black text-primary block mb-1">Emitidos</span>
                    <span className="text-sm font-black text-primary">{b.emitidos}</span>
                  </div>
                  <div className="bg-green-50 p-3 rounded-2xl border border-green-100 text-center">
                    <span className="text-[9px] uppercase font-black text-green-600 block mb-1">Finais</span>
                    <span className="text-sm font-black text-green-600">{b.finalizados}</span>
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-end">
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progresso do Projeto</span>
                         <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border w-fit ${
                           b.percentual_concluido >= 1 ? 'bg-green-100 text-green-700 border-green-200' :
                           b.percentual_concluido > 0 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                           'bg-slate-100 text-slate-500 border-slate-200'
                         }`}>
                           {b.percentual_concluido >= 1 ? 'Concluída' : b.percentual_concluido > 0 ? 'Em andamento' : 'Não iniciada'}
                         </span>
                      </div>
                      <div className="text-right">
                         <span className="text-sm font-black text-slate-800">{(Number(b.percentual_concluido || 0) * 100).toFixed(1)}%</span>
                      </div>
                   </div>

                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(Number(b.percentual_concluido || 0) * 100)}%` }}
                       transition={{ duration: 1, ease: "easeOut" }}
                       className={`h-full ${
                         b.percentual_concluido >= 1 ? 'bg-green-500' : 'bg-primary'
                       }`}
                     />
                   </div>
                </div>
              </div>
              
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-[9px] font-black uppercase text-slate-400">Criada em: {format(new Date(b.data_cadastro), "dd/MM/yyyy")}</span>
                 <ArrowRight size={14} className="text-slate-300" />
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="text-primary" /> Nova Balsa</h2>
               <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-white">Esc</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
               <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">1. Selecione o Tipo</span>
                  <select 
                    required
                    className="field"
                    value={newBalsa.tipo}
                    onChange={e => setNewBalsa(p => ({ ...p, tipo: e.target.value }))}
                  >
                    <option value="">Selecione...</option>
                    {balsaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {newBalsa.tipo && (
                    <p className="text-[9px] text-slate-400 mt-1 px-1">
                      Já cadastradas para {newBalsa.tipo}: {
                        balsas.filter(b => b.tipo_balsa === newBalsa.tipo)
                             .map(b => b.nome_balsa)
                             .sort((a,b) => Number(a) - Number(b))
                             .join(", ") || "Nenhuma"
                      }
                    </p>
                  )}
               </label>

               <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">2. Informe o Número (1 a 999)</span>
                  <input 
                    required
                    type="number" 
                    className="field" 
                    placeholder="Ex: 15"
                    value={newBalsa.nome}
                    onChange={e => {
                      const num = e.target.value;
                      setNewBalsa(p => ({ 
                        ...p, 
                        nome: num,
                        id: p.tipo ? `${p.tipo}-${num.padStart(2, '0')}` : ""
                      }));
                    }}
                  />
               </label>

               {newBalsa.id && (
                 <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-primary block mb-1">ID Gerado Automaticamente</span>
                    <div className="text-3xl font-black text-primary tracking-tighter">{newBalsa.id}</div>
                 </div>
               )}

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" className="btn-primary flex-1">Cadastrar e Carregar Matriz</button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
