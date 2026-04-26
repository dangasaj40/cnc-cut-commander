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
  versao: number;
  data_atualizacao: string;
}

export default function GerenciarCatalogo() {
  const [groups, setGroups] = useState<NestingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [pendingFile, setPendingFile] = useState<{data: string, type: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      let query = supabase.from("catalogo_pecas").select("nesting, peso_kg, versao, data_importacao");
      
      if (period.from) query = query.gte("data_importacao", period.from);
      if (period.to) query = query.lte("data_importacao", period.to + "T23:59:59");

      let { data, error } = await query;
      
      if (error) {
        // Se falhar (provavelmente colunas novas não existem), tenta busca básica
        const { data: basic, error: basicErr } = await supabase.from("catalogo_pecas").select("nesting, peso_kg");
        if (basicErr) throw basicErr;
        data = basic;
      }

      const agrupado: Record<string, NestingGroup> = {};
      (data ?? []).forEach(d => {
        if (!agrupado[d.nesting]) {
          agrupado[d.nesting] = { 
            nesting: d.nesting, 
            total_pecas: 0, 
            total_peso: 0,
            versao: (d as any).versao || 1,
            data_atualizacao: (d as any).data_importacao || new Date().toISOString()
          };
        }
        agrupado[d.nesting].total_pecas += 1;
        agrupado[d.nesting].total_peso += Number(d.peso_kg || 0);
      });
      setGroups(Object.values(agrupado).sort((a, b) => a.nesting.localeCompare(b.nesting)));
    } catch (err: any) {
      console.error("Erro ao carregar catálogo:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [period]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = (evt.target?.result as string).split(",")[1];
        setPendingFile({ data: base64, type: file.type, name: file.name });
        setImportText(`Arquivo carregado: ${file.name}\n\nClique em 'IA Analisar' para extrair os dados deste PDF.`);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      const XLSX = await getXLSX();
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setImportText(XLSX.utils.sheet_to_csv(ws));
        setPendingFile(null);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      alert("Erro ao ler arquivo.");
    }
  };

  const handleAIAnalysis = async () => {
    if (!importText.trim()) return;
    setIsAIProcessing(true);
    try {
      const savedKey = localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY;
      if (!savedKey) throw new Error("Chave API não configurada em Ajustes > Sistema.");

      const { GoogleGenerativeAI } = await getGemini();
      
      let modelsToTry: string[] = [];
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${savedKey.trim()}`);
        if (res.ok) {
          const json = await res.json();
          const availableModels = json.models || [];
          const genModels = availableModels.filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent') &&
            !m.name.includes('nano') &&
            !m.name.includes('experimental')
          );
          
          const preferred = ["gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-1.5-flash", "gemini-pro-latest"];
          const availableNames = genModels.map((m: any) => m.name.replace('models/', ''));
          modelsToTry = preferred.filter(p => availableNames.includes(p));
          const others = availableNames.filter(name => !modelsToTry.includes(name));
          modelsToTry = [...modelsToTry, ...others];
        }
      } catch (e) {
        console.error("Falha na autodescoberta", e);
      }

      if (modelsToTry.length === 0) {
        modelsToTry = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];
      }

      const genAI = new GoogleGenerativeAI(savedKey);
      let success = false;
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`Tentando IA modelo: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const prompt = `Você é um especialista em ler documentos técnicos de CNC e Nesting. 
          Sua missão é extrair os dados das peças deste documento com precisão absoluta.
          
          Mapeamento de Campos:
          1. NESTING: No campo "CNC", extraia apenas o primeiro código numérico (ex: "1552").
          2. ESPESSURA: Também no campo "CNC", identifique o valor da espessura (ex: "x8" significa espessura 8).
          3. PEÇA: Coluna "Referência".
          4. QUANTIDADE: Coluna "Chapa".
          5. PESO: Coluna "Peso".
          6. DIMENSÃO: Coluna "Dimensões".
          7. BALSA: Campo "Dado de utilizador 2" (Híbrido: se tiver RAKE e BOX, use "RAKE/BOX").
          
          Instrução de Formato:
          Retorne um array JSON de objetos: [{"nesting": "...", "peca": "...", "balsa": "...", "quantidade": ..., "peso": ..., "dimensao": "...", "espessura": "..."}]
          Ignore cabeçalhos, rodapés e a coluna "Painel".
          Importante: Retorne APENAS o JSON puro.`;

          let result;
          if (pendingFile) {
            result = await model.generateContent([
              prompt,
              { inlineData: { data: pendingFile.data, mimeType: pendingFile.type } }
            ]);
          } else {
            result = await model.generateContent([prompt, importText]);
          }
          
          const text = result.response.text();
          
          try {
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(cleanText);
            
            const csvOutput = data.map((item: any) => 
              `${item.nesting || ""};${item.peca || ""};;${item.balsa || ""};${item.quantidade || 0};${item.peso || 0};${item.dimensao || ""};${item.espessura || ""}`
            ).join("\n");
            
            setImportText(csvOutput);
            success = true;
            break;
          } catch (parseErr) {
            const objMatch = text.match(/\[.*\]/s);
            if (objMatch) {
              const data = JSON.parse(objMatch[0]);
              const csvOutput = data.map((item: any) => 
                `${item.nesting || ""};${item.peca || ""};;${item.balsa || ""};${item.quantidade || 0};${item.peso || 0};${item.dimensao || ""};${item.espessura || ""}`
              ).join("\n");
              setImportText(csvOutput);
              success = true;
              break;
            }
            throw parseErr;
          }
        } catch (err: any) {
          console.warn(`Falha no modelo ${modelName}:`, err.message);
          if (err.message?.includes("API_KEY_INVALID")) break;
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
        const [nesting, peca, _painel, balsa, qtd, peso, dim, esp] = line.split(";").map(s => s?.trim());
        return { 
          nesting: nesting || "S/N", 
          peca: peca || "SEM NOME", 
          painel: "", 
          tipo_balsa: balsa || "", 
          quantidade_base: parseInt(qtd || "1") || 1, 
          peso_kg: parseFloat(peso?.replace(",", ".") || "0") || 0,
          dimensional: dim || "", 
          espessura_mm: esp || ""
        };
      });
      // Lógica de Versão e Sobrescrita
      const uniqueNestings = Array.from(new Set(payload.map(p => p.nesting)));
      const now = new Date().toISOString();
      
      for (const nestingId of uniqueNestings) {
        // Buscar versão atual
        const { data: existing } = await supabase
          .from("catalogo_pecas")
          .select("versao")
          .eq("nesting", nestingId)
          .limit(1);
        
        const nextVersion = existing && existing.length > 0 ? (existing[0].versao || 1) + 1 : 1;
        
        // Apagar antigos
        await supabase.from("catalogo_pecas").delete().eq("nesting", nestingId);
        
        // Atualizar payload para este nesting com a nova versão e data
        payload.forEach(item => {
          if (item.nesting === nestingId) {
            (item as any).versao = nextVersion;
            (item as any).data_importacao = now;
          }
        });
      }

      const { error } = await supabase.from("catalogo_pecas").insert(payload);
      if (error) throw error;

      alert(`Sucesso! ${payload.length} itens importados e nestings antigos sobrescritos.`);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-sm">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] w-full max-w-4xl rounded-3xl p-6 md:p-10 flex flex-col gap-6 shadow-2xl overflow-hidden max-h-[95vh]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-primary uppercase flex items-center gap-2"><Sparkles /> Importar Catálogo</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Excel ou texto bruto</p>
          </div>
          <button onClick={() => setShowImport(false)} className="p-2 text-[#64748B] hover:text-[#0F172A]"><X size={24} /></button>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.xlsm,.pdf" className="hidden" />
          <button onClick={() => { setImportText(""); setPendingFile(null); fileInputRef.current?.click(); }} className="flex-1 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] p-4 rounded-xl text-[10px] font-bold uppercase border border-[#E2E8F0] flex items-center justify-center gap-2"><FileSpreadsheet className="text-emerald-600" /> Abrir Arquivo (Excel/PDF)</button>
          <button onClick={handleAIAnalysis} disabled={isAIProcessing || !importText.trim()} className="flex-1 bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 text-[#4F46E5] p-4 rounded-xl text-[10px] font-bold uppercase border border-[#4F46E5]/20 flex items-center justify-center gap-2">{isAIProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />} IA Analisar</button>
        </div>
        <textarea className="flex-1 w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 font-mono text-[10px] text-[#334155] min-h-[300px] outline-none" placeholder="Dados aparecerão aqui..." value={importText} onChange={(e) => setImportText(e.target.value)} />
        <div className="flex gap-4">
          <button onClick={() => setShowImport(false)} className="flex-1 py-4 bg-[#F1F5F9] text-[#334155] rounded-xl text-[10px] font-bold uppercase hover:bg-[#E2E8F0]">Cancelar</button>
          <button onClick={handleImport} disabled={busy || !importText.includes(";")} className="flex-1 py-4 bg-[#4F46E5] text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-30">{busy ? "Salvando..." : "Confirmar Importação"}</button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 bg-[#F8FAFC]/50 border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 relative">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Buscar Nesting</label>
            <div className="relative">
              <input type="text" placeholder="Código..." className="field pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="md:col-span-1">
             <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">De (Importação)</label>
             <input type="date" className="field" value={period.from} onChange={(e) => setPeriod(p => ({ ...p, from: e.target.value }))} />
          </div>
          <div className="md:col-span-1">
             <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block px-1">Até</label>
             <input type="date" className="field" value={period.to} onChange={(e) => setPeriod(p => ({ ...p, to: e.target.value }))} />
          </div>
          <div className="md:col-span-1">
             <button onClick={() => setShowImport(true)} className="btn-primary flex items-center justify-center gap-2 py-3.5 w-full text-[10px]"><Upload size={16} /> Importar Planos</button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.filter(g => 
          g.nesting.toLowerCase().includes(searchTerm.toLowerCase()) || 
          g.versao.toString() === searchTerm.toLowerCase().replace('v', '')
        ).map(g => (
          <div key={g.nesting} className="glass-card p-5 border border-[#E2E8F0] group hover:border-[#4F46E5]/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h3 className="font-bold text-[#0F172A] text-lg leading-tight">{g.nesting}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-version">V{g.versao}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Plan: {new Date(g.data_atualizacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteNesting(g.nesting)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl"><span className="text-[9px] uppercase text-muted-foreground block mb-1">Peças</span><span className="text-sm font-black text-[#0F172A]">{g.total_pecas}</span></div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl"><span className="text-[9px] uppercase text-muted-foreground block mb-1">Peso</span><span className="text-sm font-black text-[#0F172A]">{g.total_peso.toFixed(0)}kg</span></div>
            </div>
          </div>
        ))}
      </div>
      {showImport && <Modal />}
    </div>
  );
}
