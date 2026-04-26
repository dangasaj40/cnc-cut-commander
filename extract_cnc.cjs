const fs = require("fs");

function extract() {
  const data = fs.readFileSync("public/nesting_report.pdf");
  const text = data.toString("utf-8");
  
  // Tenta encontrar o padrão CNC seguido de números
  const matches = text.match(/CNC\s*(\d{4,})/g);
  if (matches) {
    console.log("Números encontrados:", matches);
  } else {
    console.log("Nenhum padrão CNC direto encontrado nos bytes.");
  }
}

extract();
