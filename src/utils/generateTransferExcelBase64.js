import ExcelJS from 'exceljs';

/**
 * Genera el archivo Excel (.xlsx) a partir de la lista de ítems y devuelve el Base64.
 *
 * @param {Array<Object>} items La lista de objetos seriales a transferir (getTransferData.transferencias).
 * @param {string} destino El consecutivo del almacén de destino.
 * @param {string} userName Nombre del usuario para el campo 'lastModifiedBy'.
 * @returns {Promise<string>} Contenido del archivo Excel codificado en Base64.
 */
export const generateTransferExcelBase64 = async (items, destino, userName) => {
    // 1. Configuración inicial del libro
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Inventario';
    workbook.lastModifiedBy = userName || 'Sistema'; 
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // 2. Agregar hoja de trabajo
    const worksheet = workbook.addWorksheet(`Transferencia a ${destino}`);

    // 3. Definir las columnas
    worksheet.columns = [
        { header: 'ID Artículo', key: 'cons_producto', width: 15 },
        { header: 'Serial Ext', key: 'bag_pack', width: 25 },
        { header: 'S Pack', key: 's_pack', width: 15 },
        { header: 'M Pack', key: 'm_pack', width: 15 },
        { header: 'L Pack', key: 'l_pack', width: 15 },
        { header: 'Almacén Destino', key: 'destino', width: 20 },
    ];

    // 4. Agregar filas y estilos
    items.forEach(item => {
        worksheet.addRow({
            cons_producto: item.cons_producto,
            bag_pack: item.bag_pack,
            s_pack: item.s_pack,
            m_pack: item.m_pack,
            l_pack: item.l_pack,
            destino: destino 
        });
    });

    // Aplicar estilo de negrita a la fila de cabecera
    worksheet.getRow(1).font = { bold: true };
    
    // 5. Escribir a Buffer y convertir a Base64
    const buffer = await workbook.xlsx.writeBuffer();
    
    // El uso de Buffer.from requiere un Polyfill en algunos entornos de React (navegador).
    // Si tienes problemas de "Buffer is not defined", es la mejor solución.
    const base64String = Buffer.from(buffer).toString('base64');
    
    return base64String;
};