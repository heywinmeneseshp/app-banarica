const fs = require("fs");
const path = require("path");
const axios = require("axios");
const XLSX = require("xlsx");

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || "v1";
const USERNAME = process.env.APP_BANARICA_USERNAME || "";
const PASSWORD = process.env.APP_BANARICA_PASSWORD || "";
const PAGE_SIZE = Number(process.env.APP_BANARICA_PAGE_SIZE || 500);
const OUTPUT_DIR = path.join(process.cwd(), "outputs");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "contenedores-fincas-duplicados.xlsx");

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const uniqueSorted = (values) =>
  Array.from(
    new Set(
      values
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

async function login() {
  if (!USERNAME || !PASSWORD) {
    throw new Error(
      "Faltan credenciales. Define APP_BANARICA_USERNAME y APP_BANARICA_PASSWORD."
    );
  }

  const response = await axios.post(`${API_URL}/api/${API_VERSION}/auth/login`, {
    username: USERNAME,
    password: PASSWORD,
  });

  const token = response?.data?.token;
  if (!token) {
    throw new Error("El login no devolvio token.");
  }

  return token;
}

async function fetchPage(token, page) {
  const response = await axios.post(
    `${API_URL}/api/${API_VERSION}/listado/paginar?offset=${page}&limit=${PAGE_SIZE}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data || {};
}

async function fetchAllRows(token) {
  let page = 1;
  let total = 0;
  const rows = [];

  while (true) {
    const payload = await fetchPage(token, page);
    const batch = Array.isArray(payload?.data) ? payload.data : [];
    total = Number(payload?.total || total || 0);
    rows.push(...batch);

    if (!batch.length) {
      break;
    }

    if (total > 0 && rows.length >= total) {
      break;
    }

    if (batch.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return rows;
}

function buildDuplicatePairs(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const contenedor = normalizeText(row?.Contenedor?.contenedor || row?.contenedor);
    const finca =
      String(
        row?.almacen?.nombre ||
          row?.almacene?.nombre ||
          row?.lugar_de_llenado?.nombre ||
          row?.finca ||
          ""
      ).trim();

    if (!contenedor || !finca) {
      continue;
    }

    const current = grouped.get(contenedor) || [];
    current.push(row);
    grouped.set(contenedor, current);
  }

  const pairs = [];

  for (const [contenedor, containerRows] of grouped.entries()) {
    const fincas = uniqueSorted(
      containerRows.map(
        (row) =>
          row?.almacen?.nombre ||
          row?.almacene?.nombre ||
          row?.lugar_de_llenado?.nombre ||
          row?.finca ||
          ""
      )
    );

    if (fincas.length < 2) {
      continue;
    }

    const semanas = uniqueSorted(containerRows.map((row) => row?.semana));
    const bols = uniqueSorted(
      containerRows.map((row) => row?.embarque?.bl || row?.bl || row?.BoL)
    );
    const fechas = uniqueSorted(containerRows.map((row) => formatDate(row?.fecha)));

    for (let i = 0; i < fincas.length; i += 1) {
      for (let j = i + 1; j < fincas.length; j += 1) {
        const fincaA = fincas[i];
        const fincaB = fincas[j];
        const matchingRows = containerRows.filter((row) => {
          const finca =
            row?.almacen?.nombre ||
            row?.almacene?.nombre ||
            row?.lugar_de_llenado?.nombre ||
            row?.finca ||
            "";
          return finca === fincaA || finca === fincaB;
        });

        pairs.push({
          Contenedor: contenedor,
          "Finca A": fincaA,
          "Finca B": fincaB,
          "Total fincas en contenedor": fincas.length,
          "Registros involucrados": matchingRows.length,
          Semanas: semanas.join(", "),
          BLs: bols.join(", "),
          Fechas: fechas.join(", "),
        });
      }
    }
  }

  return pairs.sort((a, b) => {
    if (a.Contenedor !== b.Contenedor) {
      return a.Contenedor.localeCompare(b.Contenedor, "es");
    }
    if (a["Finca A"] !== b["Finca A"]) {
      return a["Finca A"].localeCompare(b["Finca A"], "es");
    }
    return a["Finca B"].localeCompare(b["Finca B"], "es");
  });
}

function exportWorkbook(rows, sourceRows) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const summarySheet = XLSX.utils.json_to_sheet(rows);
  const rawSheet = XLSX.utils.json_to_sheet(
    sourceRows.map((row) => ({
      Contenedor: row?.Contenedor?.contenedor || row?.contenedor || "",
      Finca:
        row?.almacen?.nombre ||
        row?.almacene?.nombre ||
        row?.lugar_de_llenado?.nombre ||
        row?.finca ||
        "",
      Semana: row?.semana || "",
      Fecha: formatDate(row?.fecha),
      BL: row?.embarque?.bl || row?.bl || row?.BoL || "",
      Producto: row?.combo?.nombre || row?.producto?.name || row?.producto?.nombre || "",
      IdListado: row?.id || "",
      IdContenedor: row?.Contenedor?.id || row?.id_contenedor || "",
    }))
  );

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, summarySheet, "Combinaciones");
  XLSX.utils.book_append_sheet(book, rawSheet, "Base revisada");
  XLSX.writeFile(book, OUTPUT_FILE);
}

async function main() {
  const token = await login();
  const rows = await fetchAllRows(token);
  const duplicatePairs = buildDuplicatePairs(rows);
  exportWorkbook(duplicatePairs, rows);

  console.log(
    JSON.stringify(
      {
        output: OUTPUT_FILE,
        totalRows: rows.length,
        uniqueDuplicatePairs: duplicatePairs.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
