const XLSX = require('xlsx');
const fs = require('fs');

try {
  const filePath = "c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\Planilha Controle de Corte v0.2.xlsm";
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['BASE_DADOS'];
  
  // Converte para JSON ignorando as 4 primeiras linhas de cabeçalho manual
  const rawData = XLSX.utils.sheet_to_json(sheet, { range: 3 }); 
  
  // Mapeia para as colunas do banco de dados
  const csvData = rawData.map(row => ({
    tipo_balsa: row['TIPO_BALSA'],
    tempo_corte_total: row['TEMPO DE CORTE TOTAL'],
    qtd: row['QTD'],
    peca: row['PECA'],
    descricao: row['DESCRICAO'],
    espessura_mm: row['ESPESSURA_MM'],
    peso_kg: row['PESO_KG'],
    peso_total_kg: row['PESO_TOTAL_KG'],
    bloco: row['BLOCO'],
    painel: row['PAINEL'],
    nesting: row['NESTING'],
    obs_base: row['OBS_BASE']
  }));

  // Gera o CSV
  const header = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(row => {
    return Object.values(row).map(val => {
        if (val === null || val === undefined) return '';
        const s = String(val).replace(/"/g, '""');
        return `"${s}"`;
    }).join(',');
  }).join('\n');

  fs.writeFileSync('c:\\Users\\Danilo\\Desktop\\cnc-cut-commander-main\\base_dados_matriz.csv', header + '\n' + rows);
  console.log("Arquivo base_dados_matriz.csv gerado com sucesso!");

} catch (e) {
  console.error("Erro ao gerar CSV:", e);
}
