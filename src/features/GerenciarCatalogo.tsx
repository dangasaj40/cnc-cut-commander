import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trash2, 
  Upload, 
  Search, 
  Layers, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
  FileSpreadsheet
} from "lucide-react";

// Carregamento dinâmico para evitar quebras se a lib não estiver pronta
const getXLSX = () => import("xlsx");
const getGemini = () => import("@google/generative-ai");

interface NestingGroup {
  nesting: string;
  total_pecas: number;
  total_peso: number;
  painel: string;
}

export default function GerenciarCatalogo() {
  const [groups, setGroups] = useState<NestingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("catalogo_pecas").select("nesting, peso_kg, painel");
      const agrupado: Record<string, NestingGroup> = {};
      (data ?? []).forEach(d => {
        if (!agrupado[d.nesting]) {
          agrupado[d.nesting] = { nesting: d.nesting, total_pecas: 0, total_peso: 0, painel: d.painel };
        }
        agrupado[d.nesting].total_pecas += 1;
        agrupado[d.nesting].total_peso += Number(d.peso_kg || 0);
      });
      setGroups(Object.values(agrupado).sort((a, b) => a.nesting.localeCompare(b.nesting)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = await getXLSX();
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setImportText(XLSX.utils.sheet_to_csv(ws));
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      alert("Erro ao ler Excel.");
    }
  };

  const handleAIAnalysis = async () => {
    if (!importText.trim()) return;
    setIsAIProcessing(true);
    try {
      // Busca a chave atualizada do localStorage na hora da execução
      const savedKey = localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY;
      if (!savedKey) throw new Error("Chave API não configurada em Ajustes > Sistema.");

      const { GoogleGenerativeAI } = await getGemini();
      const genAI = new GoogleGenerativeAI(savedKey);
      const models = [
        "gemini-1.5-flash", 
        "gemini-1.5-flash-8b", 
        "gemini-2.0-flash-lite", 
        "gemini-2.0-flash", 
        "gemini-1.5-pro",
        "gemini-pro", 
        "gemini-1.0-pro"
      ];
      
      let success = false;
      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const prompt = `Analise este CSV e extraia dados no formato: Nesting;Peça;Painel;Balsa;Quantidade;Peso;Dimensão;Espessura. Sem cabeçalhos. TEXTO: ${importText.substring(0, 4000)}`;
          const result = await model.generateContent(prompt);
          setImportText(result.response.text().trim());
          success = true;
          break;
        } catch (e) {
          console.warn(`Falha no modelo ${modelName}, tentando próximo...`);
        }
      }
      if (!success) throw new Error("Nenhum modelo de IA respondeu. Verifique sua chave.");
    } catch (err: any) {
      alert("Erro na IA: " + err.message);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setBusy(true);
    try {
      const lines = importText.split("\n").filter(l => l.trim() && l.includes(";"));
      const payload = lines.map(line => {
        const [nesting, peca, painel, balsa, qtd, peso, dim, esp] = line.split(";").map(s => s?.trim());
        return { 
          nesting: nesting || "S/N", peca: peca || "SEM NOME", painel: painel || "", 
          tipo_balsa: balsa || "", quantidade_base: parseInt(qtd) || 1, 
          peso_kg: parseFloat(peso?.replace(",", ".")) || 0,
          dimensional: dim || "", espessura_mm: esp || ""
        };
      });
      await supabase.from("catalogo_pecas").insert(payload);
      alert(`Sucesso! ${payload.length} itens importados.`);
      setImportText(""); setShowImport(false); loadData();
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteNesting = async (nesting: string) => {
    if (!confirm(`Excluir Nesting ${nesting}?`)) return;
    await supabase.from("catalogo_pecas").delete().eq("nesting", nesting);
    loadData();
  };

  const Modal = () => createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bg-[#121214] border border-white/10 w-full max-w-4xl rounded-3xl p-6 md:p-10 flex flex-col gap-6 shadow-2xl overflow-hidden max-h-[95vh]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-primary uppercase flex items-center gap-2"><Sparkles /> Importar Catálogo</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Excel ou texto bruto</p>
          </div>
          <button onClick={() => setShowImport(false)} className="p-2 text-muted-foreground hover:text-white"><X size={24} /></button>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.xlsm" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white/5 hover:bg-white/10 text-white p-4 rounded-xl text-[10px] font-bold uppercase border border-white/10 flex items-center justify-center gap-2"><FileSpreadsheet className="text-emerald-400" /> Abrir Excel</button>
          <button onClick={handleAIAnalysis} disabled={isAIProcessing || !importText.trim()} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary p-4 rounded-xl text-[10px] font-bold uppercase border border-primary/20 flex items-center justify-center gap-2">{isAIProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />} IA Analisar</button>
        </div>
        <textarea className="flex-1 w-full bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-white/70 min-h-[300px] outline-none" placeholder="Dados aparecerão aqui..." value={importText} onChange={(e) => setImportText(e.target.value)} />
        <div className="flex gap-4">
          <button onClick={() => setShowImport(false)} className="flex-1 py-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase">Cancelar</button>
          <button onClick={handleImport} disabled={busy || !importText.includes(";")} className="flex-1 py-4 bg-primary text-black rounded-xl text-[10px] font-black uppercase disabled:opacity-30">{busy ? "Salvando..." : "Confirmar Importação"}</button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center pt-4">
        <div className="relative flex-1 w-full max-w-sm">
          <input type="text" placeholder="Buscar Nesting..." className="field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <button onClick={() => setShowImport(true)} className="btn-primary flex items-center gap-2 py-3 px-6 text-[10px]"><Upload size={16} /> Importar Novos Planos</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.filter(g => g.nesting.toLowerCase().includes(searchTerm.toLowerCase())).map(g => (
          <div key={g.nesting} className="glass-card p-5 border border-white/5 group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Layers size={20} /></div>
                <div><h3 className="font-bold text-white">{g.nesting}</h3><p className="text-[10px] text-muted-foreground uppercase">{g.painel || "—"}</p></div>
              </div>
              <button onClick={() => deleteNesting(g.nesting)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 p-3 rounded-xl"><span className="text-[9px] uppercase text-muted-foreground block mb-1">Peças</span><span className="text-sm font-black">{g.total_pecas}</span></div>
              <div className="bg-white/5 p-3 rounded-xl"><span className="text-[9px] uppercase text-muted-foreground block mb-1">Peso</span><span className="text-sm font-black">{g.total_peso.toFixed(0)}kg</span></div>
            </div>
          </div>
        ))}
      </div>
      {showImport && <Modal />}
    </div>
  );
}
