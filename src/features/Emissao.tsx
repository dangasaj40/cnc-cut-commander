import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { 
  FilePlus, 
  Search, 
  Filter, 
  CheckSquare, 
  Square,
  Cpu,
  Clock,
  Layers,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface NestingGroup {
  nesting: string;
  pecas: string[];
  esps: string[];
  tempo: number;
  blocos: string[];
  painels: string[];
  count: number;
}

const generatePDF = (idEmissao: string, balsa: any, config: any, selectedData: NestingGroup[]) => {
  const doc = new jsPDF('l', 'mm', 'a4'); 
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo (Canto Superior Direito)
  try {
    doc.addImage("/logo.jpg", "JPEG", pageWidth - 60, 12, 50, 20);
  } catch(e) {}

  // Cabeçalho Principal (Azul Escuro)
  doc.setFillColor(31, 58, 102); 
  doc.rect(10, 10, pageWidth - 80, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DIARIA DE NESTINGS - PREENCHIMENTO MANUAL", (pageWidth - 80) / 2 + 10, 17, { align: 'center' });

  // Quadros de Informação
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  // Linha 1
  doc.setFillColor(31, 58, 102); doc.rect(10, 25, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("ID_EMISSAO", 12, 30);
  doc.setTextColor(0, 0, 0); doc.rect(40, 25, 60, 7); doc.text(idEmissao, 42, 30);

  doc.setFillColor(31, 58, 102); doc.rect(110, 25, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("MAQUINA", 112, 30);
  doc.setTextColor(0, 0, 0); doc.rect(140, 25, 40, 7); doc.text(config.maquina, 142, 30);

  // Linha 2
  doc.setFillColor(31, 58, 102); doc.rect(10, 32, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("ID_BALSA", 12, 37);
  doc.setTextColor(0, 0, 0); doc.rect(40, 32, 60, 7); doc.text(balsa.id_balsa, 42, 37);

  doc.setFillColor(31, 58, 102); doc.rect(110, 32, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("TURNO", 112, 37);
  doc.setTextColor(0, 0, 0); doc.rect(140, 32, 40, 7); doc.text(config.turno, 142, 37);

  // Linha 3
  doc.setFillColor(31, 58, 102); doc.rect(10, 39, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("TIPO_BALSA", 12, 44);
  doc.setTextColor(0, 0, 0); doc.rect(40, 39, 60, 7); doc.text(balsa.tipo_balsa, 42, 44);

  doc.setFillColor(31, 58, 102); doc.rect(110, 46, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("DATA_EMISSAO", 112, 51);
  doc.setTextColor(0, 0, 0); doc.rect(140, 46, 40, 7); doc.text(format(new Date(config.data), "dd/MM/yyyy"), 142, 51);

  // Linha 4
  doc.setFillColor(31, 58, 102); doc.rect(10, 46, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("NOME_BALSA", 12, 51);
  doc.setTextColor(0, 0, 0); doc.rect(40, 46, 60, 7); doc.text(balsa.nome_balsa, 42, 51);

  doc.setFillColor(31, 58, 102); doc.rect(190, 46, 30, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.text("OPERADOR", 192, 51);
  doc.setTextColor(0, 0, 0); doc.rect(220, 46, 67, 7); // Espaço em branco para assinatura

  // Tabela de Nestings
  const tableData = selectedData.map((n, i) => [
    i + 1,
    n.nesting,
    format(new Date(0, 0, 0, 0, 0, n.tempo * 86400), "HH:mm"),
    n.esps.join(", "),
    n.blocos.join(", "),
    n.painels.join(", "),
    "", // Carreira Chapa (Manual)
    "", // Hora Início (Manual)
    "", // Hora Fim (Manual)
    ""  // Parada (Manual)
  ]);

  autoTable(doc, {
    startY: 60,
    head: [["Seq.", "Nesting", "Tempo", "Esp. (mm)", "Bloco", "Painel", "Carreira", "Início", "Fim", "Observações"]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [31, 58, 102],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 15 },
      6: { cellWidth: 25 },
      7: { cellWidth: 15 },
      8: { cellWidth: 15 },
      9: { cellWidth: 40 }
    }
  });

  doc.save(`FICHA-${idEmissao}.pdf`);
};

export default function EmissaoPage() {
  const [balsas, setBalsas] = useState<any[]>([]);
  const [selectedBalsa, setSelectedBalsa] = useState("");
  const [maquinas, setMaquinas] = useState<string[]>([]);
  const [turnos, setTurnos] = useState<string[]>([]);
  const [config, setConfig] = useState({ maquina: "", turno: "", data: format(new Date(), "yyyy-MM-dd") });
  
  const [filters, setFilters] = useState({ bloco: "", painel: "", nesting: "" });
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [availablePanels, setAvailablePanels] = useState<string[]>([]);
  const [availableNestings, setAvailableNestings] = useState<string[]>([]);
  
  const [nestings, setNestings] = useState<NestingGroup[]>([]);
  const [selectedNestings, setSelectedNestings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBalsa) {
      fetchNestings();
    } else {
      setNestings([]);
    }
  }, [selectedBalsa, filters.bloco, filters.painel, filters.nesting]);

  const fetchInitialData = async () => {
    const { data: bData } = await supabase.from("balsas").select("id_balsa, tipo_balsa, nome_balsa").order("data_cadastro", { ascending: false });
    setBalsas(bData || []);

    const { data: sData } = await supabase.from("system_settings").select("key, value");
    sData?.forEach(item => {
      if (item.key === "maquinas") setMaquinas(JSON.parse(item.value));
      if (item.key === "turnos") setTurnos(JSON.parse(item.value));
    });
  };

  const fetchNestings = async () => {
    if (!selectedBalsa) {
      setNestings([]);
      setAvailableNestings([]);
      setAvailableBlocks([]);
      setAvailablePanels([]);
      return;
    }

    setLoading(true);
    
    // 1. Buscar os dados brutos de TUDO que está disponível para esta balsa
    const { data: allAvailable, error: fetchErr } = await supabase
      .from("controle_nestings")
      .select("nesting, bloco, painel, peca, espessura_mm, tempo_corte_total, descricao, status_processo")
      .eq("id_balsa", selectedBalsa)
      .eq("status_processo", "Disponivel");

    if (fetchErr) {
      console.error("Erro ao buscar nestings:", fetchErr);
      setLoading(false);
      return;
    }

    if (allAvailable) {
      // Popular filtros com os dados REAIS que vieram do banco
      const nests = new Set<string>();
      const blocks = new Set<string>();
      const panels = new Set<string>();
      
      allAvailable.forEach(item => {
        if (item.nesting) nests.add(item.nesting);
        if (item.bloco) blocks.add(item.bloco);
        if (item.painel) panels.add(item.painel);
      });

      setAvailableNestings(Array.from(nests).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
      setAvailableBlocks(Array.from(blocks).sort());
      setAvailablePanels(Array.from(panels).sort());

      // 2. Aplicar os filtros de interface (Agrupamento em memória para ser instantâneo)
      const filtered = allAvailable.filter(item => {
        const matchBloco = !filters.bloco || item.bloco === filters.bloco;
        const matchPainel = !filters.painel || item.painel === filters.painel;
        const matchNesting = !filters.nesting || item.nesting === filters.nesting;
        return matchBloco && matchPainel && matchNesting;
      });

      const groups: Record<string, NestingGroup> = {};
      filtered.forEach(item => {
        if (!groups[item.nesting]) {
          groups[item.nesting] = {
            nesting: item.nesting,
            pecas: [],
            esps: [],
            tempo: item.tempo_corte_total || 0,
            blocos: [],
            painels: [],
            count: 0
          };
        }
        if (!groups[item.nesting].pecas.includes(item.peca)) groups[item.nesting].pecas.push(item.peca);
        if (!groups[item.nesting].esps.includes(String(item.espessura_mm))) groups[item.nesting].esps.push(String(item.espessura_mm));
        if (!groups[item.nesting].blocos.includes(item.bloco)) groups[item.nesting].blocos.push(item.bloco);
        if (!groups[item.nesting].painels.includes(item.painel)) groups[item.nesting].painels.push(item.painel);
        groups[item.nesting].count++;
      });

      setNestings(Object.values(groups));
    }
    setLoading(false);
  };

  const toggleSelect = (nesting: string) => {
    const next = new Set(selectedNestings);
    if (next.has(nesting)) next.delete(nesting);
    else next.add(nesting);
    setSelectedNestings(next);
  };

  const toggleAll = () => {
    if (selectedNestings.size === nestings.length) {
      setSelectedNestings(new Set());
    } else {
      setSelectedNestings(new Set(nestings.map(n => n.nesting)));
    }
  };

  const handleEmit = async () => {
    if (!selectedBalsa || !config.maquina || !config.turno || selectedNestings.size === 0) {
      alert("Preencha todos os campos e selecione ao menos um nesting.");
      return;
    }

    setIsEmitting(true);
    try {
      const balsa = balsas.find(b => b.id_balsa === selectedBalsa);
      const timestamp = format(new Date(), "ddMMHHmm");
      const idEmissao = `${timestamp}-${config.maquina}-${config.turno}-${selectedBalsa}`;

      const selectedData = nestings.filter(n => selectedNestings.has(n.nesting));

      // 1. Gravar no Histórico de EMISSOES
      const emissoesToInsert = selectedData.map(n => ({
        id_emissao: idEmissao,
        id_balsa: selectedBalsa,
        tipo_balsa: balsa.tipo_balsa,
        nome_balsa: balsa.nome_balsa,
        maquina: config.maquina,
        turno: config.turno,
        bloco: n.blocos.join(", "),
        painel: n.painels.join(", "),
        nesting: n.nesting,
        pecas: n.pecas.join(", "),
        qtd_pecas: n.count,
        espessura: n.esps.join(", "),
        status_processo: "Em processamento",
        chave_emissao: `${idEmissao}|${n.nesting}`
      }));

      const { error: emError } = await supabase.from("emissoes").insert(emissoesToInsert);
      if (emError) throw emError;

      // 2. Atualizar CONTROLE_NESTINGS
      const { error: ctrlError } = await supabase
        .from("controle_nestings")
        .update({
          status_processo: "Em processamento",
          id_emissao: idEmissao,
          data_emissao: new Date().toISOString(),
          maquina: config.maquina,
          turno: config.turno
        })
        .eq("id_balsa", selectedBalsa)
        .in("nesting", Array.from(selectedNestings));

      if (ctrlError) throw ctrlError;

      // 3. Atualizar Totais na Balsa
      const { data: balsaCounts } = await supabase
        .from("controle_nestings")
        .select("status_processo, nesting")
        .eq("id_balsa", selectedBalsa);

      if (balsaCounts) {
        const uniqueAll = new Set(balsaCounts.map(c => c.nesting)).size;
        const finalizados = new Set(balsaCounts.filter(c => c.status_processo === "Finalizado").map(c => c.nesting)).size;
        const emitidos = new Set(balsaCounts.filter(c => c.status_processo === "Em processamento").map(c => c.nesting)).size;
        const pendentes = new Set(balsaCounts.filter(c => c.status_processo === "Disponivel").map(c => c.nesting)).size;

        await supabase
          .from("balsas")
          .update({
            emitidos,
            finalizados,
            pendentes,
            percentual_concluido: uniqueAll > 0 ? finalizados / uniqueAll : 0
          })
          .eq("id_balsa", selectedBalsa);
      }

      alert(`Emissão ${idEmissao} realizada com sucesso!`);
      generatePDF(idEmissao, balsa, config, selectedData);
      
      setSelectedNestings(new Set());
      fetchNestings();
    } catch (e: any) {
      alert("Erro na emissão: " + e.message);
    } finally {
      setIsEmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader 
        code="PRO-02" 
        title="Emissão de Ordens" 
        subtitle="Agrupamento e envio de nestings para produção"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Configuração */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <FilePlus size={14} /> Identificação
             </h3>
             
             <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Balsa / Projeto</span>
                <select 
                  className="field"
                  value={selectedBalsa}
                  onChange={e => setSelectedBalsa(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {balsas.map(b => (
                    <option key={b.id_balsa} value={b.id_balsa}>{b.id_balsa} ({b.tipo_balsa})</option>
                  ))}
                </select>
             </label>

             <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Máquina</span>
                  <select 
                    className="field"
                    value={config.maquina}
                    onChange={e => setConfig(p => ({ ...p, maquina: e.target.value }))}
                  >
                    <option value="">...</option>
                    {maquinas.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Turno</span>
                  <select 
                    className="field"
                    value={config.turno}
                    onChange={e => setConfig(p => ({ ...p, turno: e.target.value }))}
                  >
                    <option value="">...</option>
                    {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
             </div>
          </div>

          <div className="glass-card p-6 space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Filter size={14} /> Filtros de Carga
             </h3>
             
             <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Nesting específico</span>
                <select 
                  className="field py-1.5 text-xs"
                  value={filters.nesting}
                  onChange={e => setFilters(p => ({ ...p, nesting: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {availableNestings.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </label>

             <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Bloco</span>
                <select 
                  className="field"
                  value={filters.bloco}
                  onChange={e => setFilters(p => ({ ...p, bloco: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {availableBlocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
             </label>

             <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Painel</span>
                <select 
                  className="field"
                  value={filters.painel}
                  onChange={e => setFilters(p => ({ ...p, painel: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {availablePanels.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
             </label>
          </div>

          <button 
            disabled={selectedNestings.size === 0 || isEmitting}
            onClick={handleEmit}
            className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-sm"
          >
            {isEmitting ? "Processando..." : (
              <>Emitir {selectedNestings.size} Nesting(s) <ArrowRight size={18} /></>
            )}
          </button>
        </div>

        {/* Lista de Nestings */}
        <div className="lg:col-span-3">
           <div className="glass-card p-0 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={toggleAll}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-primary"
                    >
                      {selectedNestings.size === nestings.length && nestings.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest">Lista de Nestings Disponíveis ({nestings.length})</span>
                 </div>
                 {selectedNestings.size > 0 && (
                   <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full font-bold">
                     {selectedNestings.size} selecionados
                   </span>
                 )}
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 bg-white/[0.02]">
                          <th className="p-4 w-12"></th>
                          <th className="p-4">Nesting</th>
                          <th className="p-4">Bloco/Painel</th>
                          <th className="p-4">Peças</th>
                          <th className="p-4">Esp.</th>
                          <th className="p-4 text-right">Tempo</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {loading ? (
                         Array.from({ length: 5 }).map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={6} className="p-8 bg-white/5"></td>
                           </tr>
                         ))
                       ) : nestings.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="p-20 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                               {selectedBalsa ? "Nenhum nesting disponível com esses filtros" : "Selecione uma balsa para carregar"}
                            </td>
                         </tr>
                       ) : (
                         nestings.map(n => (
                           <tr 
                             key={n.nesting} 
                             onClick={() => toggleSelect(n.nesting)}
                             className={`group cursor-pointer hover:bg-white/[0.03] transition-colors ${selectedNestings.has(n.nesting) ? 'bg-primary/[0.05]' : ''}`}
                           >
                              <td className="p-4">
                                 {selectedNestings.has(n.nesting) ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-muted-foreground group-hover:text-white" />}
                              </td>
                              <td className="p-4">
                                 <div className="font-black text-white">{n.nesting}</div>
                                 <div className="text-[9px] text-muted-foreground uppercase">{n.count} peças</div>
                              </td>
                              <td className="p-4">
                                 <div className="flex flex-wrap gap-1">
                                    {n.blocos.map(b => <span key={b} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{b}</span>)}
                                 </div>
                                 <div className="text-[9px] text-muted-foreground mt-1 truncate max-w-[150px]">{n.painels.join(", ")}</div>
                              </td>
                              <td className="p-4">
                                 <div className="text-[10px] leading-relaxed line-clamp-2 max-w-[250px]">
                                    {n.pecas.join(", ")}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="flex flex-wrap gap-1">
                                    {n.esps.map(e => <span key={e} className="text-[9px] font-bold text-primary">{e}mm</span>)}
                                 </div>
                              </td>
                              <td className="p-4 text-right font-mono text-xs">
                                 {format(new Date(0, 0, 0, 0, 0, n.tempo * 86400), "HH:mm")}
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
