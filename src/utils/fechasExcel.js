import * as XLSX from "xlsx";

const CLAVES_FECHA = ["Date/Time", "fecha_hora", "fechaHora", "dateTime"];
const pad = (n) => String(n).padStart(2, "0");

// Convierte el valor de una celda de fecha/hora a "AAAA-MM-DD HH:mm:ss" sin pasar por zonas horarias.
//  - numero de serie de Excel (46052.925): celdas con formato de fecha
//  - Date: componentes locales
//  - texto: se devuelve recortado (el servidor entiende "AAAA-MM-DD HH:mm:ss" y "M/D/AAAA H:mm[:ss]")
export function normalizarFechaHora(valor) {
    if (valor === null || valor === undefined || valor === "") return "";

    if (typeof valor === "number" && valor > 0 && valor < 2958466) {
        const dias = Math.floor(valor);
        const segundos = Math.min(86399, Math.round((valor - dias) * 86400));
        const f = new Date(Date.UTC(1899, 11, 30) + dias * 86400000);
        return `${f.getUTCFullYear()}-${pad(f.getUTCMonth() + 1)}-${pad(f.getUTCDate())} `
            + `${pad(Math.floor(segundos / 3600))}:${pad(Math.floor((segundos % 3600) / 60))}:${pad(segundos % 60)}`;
    }

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        return `${valor.getFullYear()}-${pad(valor.getMonth() + 1)}-${pad(valor.getDate())} `
            + `${pad(valor.getHours())}:${pad(valor.getMinutes())}:${pad(valor.getSeconds())}`;
    }

    return String(valor).trim();
}

// Lee la primera hoja de un Excel de temperatura y devuelve las filas con la columna de fecha/hora
// ya normalizada (acepta fecha de Excel o texto).
export function leerFilasTemperatura(contenido) {
    const datos = contenido instanceof ArrayBuffer ? new Uint8Array(contenido) : contenido;
    const libro = XLSX.read(datos, { type: "array" });
    const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]]);
    return filas.map((fila) => {
        const clave = CLAVES_FECHA.find((k) => fila[k] !== undefined);
        return clave ? { ...fila, [clave]: normalizarFechaHora(fila[clave]) } : fila;
    });
}
