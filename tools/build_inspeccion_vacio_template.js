const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const outputDir = path.resolve(__dirname, "..", "outputs", "inspeccion-vacio");
const outputPath = path.join(outputDir, "Plantilla-Ejemplo-Inspeccion-Vacio.xlsx");

const templateRows = [
  {
    semana: "S17-2026",
    fecha: "2026-04-22",
    contenedor: "ABCD1234567",
    INSUMO_1: "KIT00100001",
    INSUMO_2: "KIT00200001",
    INSUMO_3: "KIT00300001",
    observaciones: "Ejemplo de cargue masivo. Reemplaza estas columnas por tus insumos configurados."
  },
  {
    semana: "S17-2026",
    fecha: "2026-04-22",
    contenedor: "WXYZ7654321",
    INSUMO_1: "KIT00100002",
    INSUMO_2: "KIT00200002",
    INSUMO_3: "KIT00300002",
    observaciones: "Una fila por cada inspeccion vacio."
  }
];

const instructions = [
  ["Campo", "Obligatorio", "Regla / ejemplo"],
  ["semana", "Si", "Formato S00-0000. Ejemplo: S17-2026"],
  ["fecha", "Si", "Formato YYYY-MM-DD. Ejemplo: 2026-04-22"],
  ["contenedor", "Si", "4 letras y 7 numeros. Ejemplo: ABCD1234567"],
  ["INSUMO_1", "Si", "Renombra esta columna con el consecutivo o nombre exacto del insumo configurado"],
  ["INSUMO_2", "Si", "Agrega tantas columnas como insumos tengas configurados"],
  ["INSUMO_3", "Si", "Cada valor debe ser el serial o kit correspondiente"],
  ["observaciones", "No", "Comentario opcional por fila"],
  ["Nota", "", "No cambies los nombres de semana, fecha, contenedor ni observaciones"],
  ["Nota", "", "Si tienes mas o menos insumos, agrega o elimina columnas de insumo segun tu configuracion actual"]
];

const workbook = XLSX.utils.book_new();

const plantillaSheet = XLSX.utils.json_to_sheet(templateRows);
plantillaSheet["!cols"] = [
  { wch: 12 },
  { wch: 14 },
  { wch: 18 },
  { wch: 16 },
  { wch: 16 },
  { wch: 16 },
  { wch: 70 }
];

const instruccionesSheet = XLSX.utils.aoa_to_sheet(instructions);
instruccionesSheet["!cols"] = [
  { wch: 18 },
  { wch: 12 },
  { wch: 90 }
];

XLSX.utils.book_append_sheet(workbook, plantillaSheet, "Plantilla");
XLSX.utils.book_append_sheet(workbook, instruccionesSheet, "Instrucciones");

fs.mkdirSync(outputDir, { recursive: true });
XLSX.writeFile(workbook, outputPath);

console.log(outputPath);
