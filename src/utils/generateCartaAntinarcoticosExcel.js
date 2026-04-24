import ExcelJS from 'exceljs';

const HEADERS = [
  'FECHA DE LLENADO',
  'ANUNCIO',
  'LINEA',
  'BOOKING',
  'BUQUE',
  'DESTINO',
  'FINCA/PUERTO',
  'CONTENEDOR',
  'SELLO',
  'CAJAS TOTALES',
  'PALLETS',
  'PESO NETO',
  'PESO BRUTO',
  'CARGA A GRANEL Y/O LIQUIDA',
  'EXPORTADOR',
  'NIT EXPORTADOR',
  'AGENCIA DE ADUANAS',
  'NIT AGENCIA DE ADUANAS',
  'CONSIGNATARIO',
];

export const generateCartaAntinarcoticosExcelBuffer = async (rows = []) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Listado Contenedores', {
    views: [{ showGridLines: false }],
  });

  worksheet.addRow(HEADERS);
  rows.forEach((row) => {
    worksheet.addRow([
      row.fecha || '',
      row.anuncio || '',
      row.linea || '',
      row.booking || '',
      row.buque || '',
      row.destino || '',
      row.fincaPuerto || '',
      row.contenedor || '',
      row.sello || '',
      row.cajasTotales || 0,
      row.pallets || 0,
      row.pesoNeto || 0,
      row.pesoBruto || 0,
      row.carga || '',
      row.exportador || '',
      row.nitExportador || '',
      row.agenciaAduanas || '',
      row.nitAgenciaAduanas || '',
      row.consignatario || '',
    ]);
  });

  worksheet.columns = [
    { width: 16 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 28 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 24 },
    { width: 18 },
    { width: 24 },
    { width: 22 },
    { width: 28 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' },
  };

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
      cell.alignment = { vertical: 'middle', horizontal: rowNumber === 1 ? 'center' : 'left', wrapText: true };
    });
  });

  worksheet.getColumn(10).alignment = { horizontal: 'center' };
  worksheet.getColumn(11).alignment = { horizontal: 'center' };
  worksheet.getColumn(12).alignment = { horizontal: 'center' };
  worksheet.getColumn(13).alignment = { horizontal: 'center' };
  worksheet.autoFilter = 'A1:S1';

  return workbook.xlsx.writeBuffer();
};
