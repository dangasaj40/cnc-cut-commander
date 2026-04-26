const fs = require("fs");

function bruteForce() {
  const data = fs.readFileSync("public/nesting_report.pdf");
  const pattern = Buffer.from("CNC");
  let lastPos = 0;
  let found = 0;

  console.log("Iniciando varredura bruta...");

  while (true) {
    const pos = data.indexOf(pattern, lastPos);
    if (pos === -1) break;
    
    // Pega 100 bytes após o 'CNC'
    const chunk = data.slice(pos, pos + 100);
    // Limpa caracteres não imprimíveis para facilitar a leitura
    const cleanChunk = chunk.toString("utf-8").replace(/[^\x20-\x7E]/g, ".");
    console.log(`Encontrado na pos ${pos}: ${cleanChunk}`);
    
    lastPos = pos + 1;
    found++;
  }

  console.log(`Total de ocorrências 'CNC': ${found}`);
}

bruteForce();
