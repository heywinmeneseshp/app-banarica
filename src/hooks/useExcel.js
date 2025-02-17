import * as XLSX from "xlsx";
import useDate from "./useDate";

const useExcel = (data, sheet_name, book_name) => {
    // Crear un nuevo libro de trabajo
    const book = XLSX.utils.book_new();

    // Convertir los datos JSON a una hoja
    const sheet = XLSX.utils.json_to_sheet(data);

    // Obtener los encabezados (primera fila de la hoja)
    const headers = Object.keys(data[0] || {});

    // Ajustar las columnas al ancho de los encabezados
    const columnWidths = headers.map(header => ({
        wch: Math.max(header.length, ...data.map(row => (row[header]?.toString()?.length || 0)))
    }));
    sheet["!cols"] = columnWidths;

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(book, sheet, sheet_name);

    // Escribir el archivo
    XLSX.writeFile(book, `${book_name} ${useDate()}.xlsx`);
};

export default useExcel;

