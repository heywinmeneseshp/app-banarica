import * as XLSX from "xlsx";
import useDate from "./useDate";

const useExcel = (data, sheet_name, book_name) => {
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(book, sheet, sheet_name);
    XLSX.writeFile(book, `${book_name} ${useDate()}.xlsx`);
};


export default useExcel;