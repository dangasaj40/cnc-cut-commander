import React, { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/lib/auth";
import { 
  Package, 
  Layers, 
  User, 
  Calendar, 
  Clock, 
  Hash, 
  Weight, 
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Operador { id: string; nome: string; }
interface CatalogoItem {
  id: string;
  peca: string;
  nesting: string;
  painel: string;
  tipo_balsa: string;
  quantidade_base: number;
  peso_kg: number;
}

interface FormState {
  peca: string; nesting: string; balsa: string; versao?: number;
  balsa_numero: string;
  operador_id: string; quantidade: number; peso_unitario: string;
  observacoes: string; avulsa: boolean;
  data: string; hora: string;
}

const empty: FormState = {
  peca: "", nesting: "", balsa: "",
  balsa_numero: "",
  operador_id: "", quantidade: 1, peso_unitario: "",
  observacoes: "", avulsa: false,
  data: new Date().toISOString().split("T")[0],
  hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
};

export default function ProducaoPage() {
  const { user, isSupervisor } = useAuth();
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [last, setLast] = useState<FormState | null>(null);

  // Estados do catálogo
  const [nestings, setNestings] = useState<{id: string, versao: number, data: string}[]>([]);
  const [pecasNoNesting, setPecasNoNesting] = useState<CatalogoItem[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  useEffect(() => {
    supabase.from("operadores").select("id,nome").eq("ativo", true).order("nome")
      .then(({ data }) => setOperadores((data ?? []) as Operador[]));

    // Carregar Nestings únicos do catálogo com versão (e fallback)
    supabase.from("catalogo_pecas").select("nesting, versao, data_importacao")
      .then(({ data, error }) => {
        let finalData = data;
        
        if (error) {
          console.warn("Colunas de versão ausentes na produção, usando busca básica...");
          supabase.from("catalogo_pecas").select("nesting")
            .then(({ data: basicData }) => {
              processNestings(basicData || []);
            });
          return;
        }
        
        processNestings(data || []);
      });

    const processNestings = (data: any[]) => {
      const uniqueMap = new Map();
      data.forEach(d => {
        if (!uniqueMap.has(d.nesting)) {
          uniqueMap.set(d.nesting, { 
            id: d.nesting, 
            versao: d.versao || 1, 
            data: d.data_importacao ? new Date(d.data_importacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ""
          });
        }
      });
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.id.localeCompare(b.id));
      setNestings(sorted);
    };
  }, []);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onNestingChange = async (nestingVal: string) => {
    if (!nestingVal) {
      setForm(empty);
      setPecasNoNesting([]);
      return;
    }

    setLoadingCatalogo(true);
    const { data } = await supabase.from("catalogo_pecas")
      .select("*")
      .eq("nesting", nestingVal);
    
    const items = (data ?? []) as CatalogoItem[];
    setPecasNoNesting(items);

    if (items.length > 0) {
      if (!form.avulsa) {
        // MODO CATÁLOGO: Agrupa tudo
        const totalPeso = items.reduce((acc, curr) => acc + (curr.peso_kg || 0), 0);
        const totalQtd = items.reduce((acc, curr) => acc + (curr.quantidade_base || 0), 0);
        
        // Agrupar nomes para o resumo: "Peça A (x8) / Peça B (x12)"
        const agrupado: Record<string, number> = {};
        items.forEach(i => {
          agrupado[i.peca] = (agrupado[i.peca] || 0) + (i.quantidade_base || 0);
        });
        const listaPecas = Object.entries(agrupado)
          .map(([nome, qtd]) => `${nome} (x${qtd})`)
          .join(" / ");
        
        setForm(f => ({
          ...f,
          nesting: nestingVal,
          painel: items[0].painel || "",
          peca: listaPecas,
          balsa: items[0].tipo_balsa || "",
          quantidade: totalQtd,
          peso_unitario: String(totalPeso / (totalQtd || 1)),
        }));
      } else {
        // MODO AVULSO: Só preenche o básico do Nesting, usuário escolhe a peça
        setForm(f => ({
          ...f,
          nesting: nestingVal,
          balsa: items[0].tipo_balsa || "",
          peca: "", // Usuário vai selecionar
          quantidade: 1,
          peso_unitario: "0"
        }));
      }
    }
    setLoadingCatalogo(false);
  };

  const onPecaIndividualChange = (pecaNome: string) => {
    const item = pecasNoNesting.find(p => p.peca === pecaNome);
    if (item) {
      setForm(f => ({
        ...f,
        peca: item.peca,
        quantidade: item.quantidade_base || 1,
        peso_unitario: String((item.peso_kg || 0) / (item.quantidade_base || 1))
      }));
    } else {
      update("peca", pecaNome);
    }
  };


  const pesoUnit = parseFloat(form.peso_unitario) || 0;
  const pesoTotal = pesoUnit * form.quantidade;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupervisor) { setMsg("Sem permissão para registrar."); return; }
    setBusy(true); setMsg(null);
    const nestMeta = nestings.find(n => n.id === form.nesting);
    
    const payload = {
      peca: form.peca,
      nesting: form.nesting || null,
      versao: nestMeta?.versao || null,
      data_importacao: nestMeta?.data ? new Date().toISOString() : null,
      painel: form.painel || null,
      balsa: `${form.balsa} ${form.balsa_numero}`.trim() || null,
      operador_id: form.operador_id || null,
      quantidade: form.quantidade,
      peso_unitario: pesoUnit || null,
      peso_total: pesoTotal || null,
      data: form.data,
      hora_inicio: new Date(`${form.data}T${form.hora}:00`).toISOString(),
      observacoes: form.observacoes || null,
      avulsa: form.avulsa,
      criado_por: user?.id,
      atualizado_por: user?.id,
    };
    let { error } = await supabase.from("producao").insert(payload);

    // Fallback: Se falhar por colunas ausentes, tenta salvar sem versão/data
    if (error && (error.message?.includes("versao") || error.message?.includes("data_importacao"))) {
      console.warn("Falha ao salvar versão, tentando salvamento simplificado...");
      const { versao, data_importacao, ...basicPayload } = payload;
      const { error: basicError } = await supabase.from("producao").insert(basicPayload);
      error = basicError;
    }

    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setMsg("Lançamento registrado.");
    setLast(form);
    setForm(empty);
  };

  const repeatLast = () => { if (last) setForm({ ...last }); };
  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader
        code="PRD-01"
        title="Registro de Corte"
        subtitle="Novo lançamento"
        right={last && (
          <button onClick={repeatLast} className="btn-secondary flex items-center gap-2">
             ↻ Repetir Anterior
          </button>
        )}
      />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <input type="checkbox" checked={form.avulsa} id="avulsa" onChange={(e) => {
              setForm(empty);
              setPecasNoNesting([]);
              update("avulsa", e.target.checked);
            }} className="accent-primary size-5" />
            <label htmlFor="avulsa" className="text-xs font-bold uppercase tracking-widest cursor-pointer select-none text-primary">
              Corte de Peça Individual / Ajuste
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nesting" icon={<Layers size={16}/>}>
              <select className="field" value={form.nesting} onChange={(e) => onNestingChange(e.target.value)}>
                <option value="">— Selecionar Nesting —</option>
                {nestings.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.id} (V{n.versao} - {n.data})
                  </option>
                ))}
              </select>
            </Field>

            {form.avulsa && (
              <Field label="Peça *" icon={<Package size={16}/>}>
                <select required className="field" value={form.peca} onChange={(e) => onPecaIndividualChange(e.target.value)} disabled={!form.nesting}>
                  <option value="">{form.nesting ? "— Selecionar Peça —" : "Aguardando Nesting"}</option>
                  {pecasNoNesting.map(p => <option key={p.id} value={p.peca}>{p.peca}</option>)}
                  <option value="OUTRA">-- Outra (Manual) --</option>
                </select>
              </Field>
            )}

            {form.peca === "OUTRA" && form.avulsa && (
              <Field label="Nome da Peça (Manual)" icon={<Package size={16}/>}>
                <input required className="field" value={form.peca === "OUTRA" ? "" : form.peca} onChange={(e) => update("peca", e.target.value)} />
              </Field>
            )}

            {!form.avulsa && form.nesting && (
              <div className="md:col-span-2">
                 <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="text-primary shrink-0" size={18} />
                      <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Resumo do Plano</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.peca.split(" / ").map((item, idx) => {
                        const match = item.match(/(.+) \(x(\d+)\)/);
                        if (!match) return <span key={idx} className="badge-item">{item}</span>;
                        const [_, name, qty] = match;
                        return (
                          <div key={idx} className="flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg overflow-hidden transition-all hover:border-[#4F46E5]/30 group">
                            <span className="px-3 py-1.5 text-[11px] font-semibold text-[#64748B] group-hover:text-[#4F46E5] transition-colors">{name}</span>
                            <span className="bg-[#A3E635] text-[#0F172A] px-2 py-1.5 text-[10px] font-black border-l border-[#E2E8F0] min-w-[32px] text-center">
                              {qty}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <Field label="Balsa" icon={<Hash size={16}/>}>
                <input className="field" value={form.balsa} onChange={(e) => update("balsa", e.target.value)} readOnly={!form.avulsa} />
              </Field>
              <Field label="Nº Balsa" icon={<Hash size={16}/>}>
                <input className="field" placeholder="Ex: 10" value={form.balsa_numero} onChange={(e) => update("balsa_numero", e.target.value)} />
              </Field>
            </div>

            <Field label="Operador" icon={<User size={16}/>}>
              <select required className="field" value={form.operador_id} onChange={(e) => update("operador_id", e.target.value)}>
                <option value="">— Selecionar —</option>
                {operadores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <Field label="Data" icon={<Calendar size={16}/>}>
                <input type="date" required className="field" value={form.data} onChange={(e) => update("data", e.target.value)} />
              </Field>
              <Field label="Hora" icon={<Clock size={16}/>}>
                <input type="time" required className="field" value={form.hora} onChange={(e) => update("hora", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <Field label="Quantidade" icon={<Hash size={16}/>}>
                <input type="number" min={1} className="field" value={form.quantidade} onChange={(e) => update("quantidade", parseInt(e.target.value) || 1)} readOnly={!form.avulsa} />
              </Field>
              <Field label="Peso Unitário" icon={<Weight size={16}/>}>
                <input type="number" step="0.01" className="field" value={form.peso_unitario} onChange={(e) => update("peso_unitario", e.target.value)} readOnly={!form.avulsa} />
              </Field>
            </div>

            <div className="md:col-span-2">
              <div className="glass-card bg-primary/5 p-4 flex justify-between items-center border-white/5">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Peso Total Estimado</span>
                <span className="text-2xl font-black tracking-tight text-primary tabular-nums">{pesoTotal.toFixed(2)} <span className="text-sm font-bold ml-1">KG</span></span>
              </div>
            </div>

            <Field label="Observações" icon={<FileText size={16}/>} className="md:col-span-2">
              <textarea rows={2} className="field" value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} placeholder="Notas adicionais..." />
            </Field>
          </div>
        </div>

        {msg && (
          <div className={`p-5 rounded-2xl flex items-center gap-3 animate-slide-up border ${msg.includes("registrad") ? "bg-primary/10 border-primary/20 text-primary" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
            {msg.includes("registrad") ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-xs font-bold uppercase tracking-widest">{msg}</span>
          </div>
        )}

        <button type="submit" disabled={busy || !isSupervisor || loadingCatalogo}
          className="btn-primary w-full py-5 text-sm flex items-center justify-center gap-3 group">
          {busy ? "Processando..." : (
            <>
              Confirmar Registro de Corte
              <CheckCircle2 size={20} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        
        {!isSupervisor && (
          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.2em]">
            Acesso restrito a Supervisores
          </p>
        )}
      </form>
    </div>
  );
}

function Field({ label, icon, children, className = "" }: { label: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4F46E5] px-1">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      {children}
    </label>
  );
}



