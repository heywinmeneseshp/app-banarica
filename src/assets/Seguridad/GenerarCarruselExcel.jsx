import React, { useEffect, useCallback, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import styles from "@components/shared/Formularios/Formularios.module.css";
import { Form, Col, Row, Button } from 'react-bootstrap';
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
import { listarProductosSeguridad } from '@services/api/seguridad';

// 🎨 Estilos y configuración base (inmutables)
const STYLES = Object.freeze({
  colors: {
    darkBlue: '333399',
    yellow: 'FFFF00',
    lightBlue: 'CCFFFF',
    green: 'FF70AD47',
    gris: 'C0C0C0',
    white: 'FFFFFFFF',
    lightGray: 'FFF2F2F2',
    black: 'FF000000',
  },
  columnWidths: {
    sd: [9, 9, 9, 9, 9, 9, 12, 22, 10, 10, 22, 3, 17, 12],
    isoCodes: [12, 12, 35],
  },
});

const BASE_DATA = Object.freeze({
  sdHeaders: [
    "Prefijo", "Numero", "ISOCode", "Estado", "Sello", "Peso",
    "BookingEDO", "OrigenContenedor", "Cantidad", "Empaque", "ObservacionContenedor",
    "", "Motonave", "Buque"
  ],
  isoCodes: [['IsoCode', 'SizeType', 'Descripción'], ['20G0', '20DR', '20 DRY FREIGHT CONTAINER'], ['20G1', '20DR', '20 DRY FREIGHT CONTAINER'], ['20H0', '20RF', '20 REEFER CONTAINER'], ['20P1', '20FR', '20 FLAT RACK CONTAINER'], ['20T3', '20TK', '20 TANK CONTAINER'], ['20T4', '20TK', '20 TANK CONTAINER'], ['20T5', '20TK', '20 TANK CONTAINER'], ['20T6', '20TK', '20 TANK CONTAINER'], ['20T7', '20TK', '20 TANK CONTAINER'], ['20T8', '20TK', '20 TANK CONTAINER'], ['20T0', '20TK', '20 TANK CONTAINER'], ['20T1', '20TK', '20 TANK CONTAINER'], ['20T2', '20TK', '20 TANK CONTAINER'], ['22B0', '20TK', '20 TANK CONTAINER'], ['22G0', '20DR', '20 DRY FREIGHT CONTAINER'], ['22G1', '20DR', '20 DRY FREIGHT CONTAINER'], ['22H0', '20RF', '20 REEFER CONTAINER'], ['22P3', '20FR', '20 FLAT RACK CONTAINER'], ['22P8', '20FR', '20 FLAT RACK CONTAINER'], ['22P9', '20FR', '20 FLAT RACK CONTAINER'], ['22P1', '20FR', '20 FLAT RACK CONTAINER'], ['22P7', '20FR', '20 FLAT RACK CONTAINER'], ['22R9', '20RF', '20 REEFER CONTAINER'], ['22R7', '20RF', '20 REEFER CONTAINER'], ['22R1', '20RF', '20 REEFER CONTAINER'], ['22S1', '20DR', '20 DRY FREIGHT CONTAINER'], ['22T3', '20TK', '20 TANK CONTAINER'], ['22T4', '20TK', '20 TANK CONTAINER'], ['22T5', '20TK', '20 TANK CONTAINER'], ['22T6', '20TK', '20 TANK CONTAINER'], ['22T7', '20TK', '20 TANK CONTAINER'], ['22T8', '20TK', '20 TANK CONTAINER'], ['22T0', '20TK', '20 TANK CONTAINER'], ['22T1', '20TK', '20 TANK CONTAINER'], ['22T2', '20TK', '20 TANK CONTAINER'], ['22U6', '20OT', '20 OPEN TOP CONTAINER'], ['22U1', '20OT', '20 OPEN TOP CONTAINER'], ['28T8', '20TK', '20 TANK CONTAINER'], ['28U1', '20OT', '20 OPEN TOP CONTAINER'], ['29P0', '20PF', '20 PLATAFORM CONTAINER'], ['42G0', '40DR', '40 DRY FREIGHT CONTAINER'], ['42G1', '40DR', '40 DRY FREIGHT CONTAINER'], ['42H0', '40RF', '40 REEFER CONTAINER'], ['42P3', '40FR', '40 FLAT RACK CONTAINER'], ['42P8', '40FR', '40 FLAT RACK CONTAINER'], ['42P9', '40FR', '40 FLAT RACK CONTAINER'], ['42P1', '40FR', '40 FLAT RACK CONTAINER'], ['42P6', '40PF', '40 PLATAFORM CONTAINER'], ['42R9', '40RF', '40 REEFER CONTAINER'], ['42R3', '40RF', '40 REEFER CONTAINER'], ['42R1', '40RF', '40 REEFER CONTAINER'], ['42S1', '40DR', '40 DRY FREIGHT CONTAINER'], ['42T5', '40TK', '40 TANK CONTAINER'], ['42T6', '40TK', '40 TANK CONTAINER'], ['42T8', '40TK', '40 TANK CONTAINER'], ['42T2', '40TK', '40 TANK CONTAINER'], ['42U6', '40OT', '40 OPEN TOP CONTAINER'], ['42U1', '40OT', '40 OPEN TOP CONTAINER'], ['45B3', '40DH', '40 HIGH CUBE DRY CONTAINER'], ['45G0', '40DH', '40 HIGH CUBE DRY CONTAINER'], ['45G1', '40DH', '40 HIGH CUBE DRY CONTAINER'], ['45P3', '40FR', '40 FLAT RACK CONTAINER'], ['45P8', '40FR', '40 FLAT RACK CONTAINER'], ['45R9', '40RH', '40 HIGH CUBE REEFER CONTAINER'], ['45R1', '40RH', '40 HIGH CUBE REEFER CONTAINER'], ['45U1', '40OT', '40 OPEN TOP CONTAINER'], ['45U6', '40OT', '40 OPEN TOP CONTAINER'], ['46H0', '40RH', '40 HIGH CUBE REEFER CONTAINER'], ['48T8', '40TK', '40 TANK CONTAINER'], ['49P0', '40PF', '40 PLATAFORM CONTAINER'], ['4CG0', '40DR', '40 DRY FREIGHT CONTAINER'], ['L0G1', '45DR', '45  DRY CONTAINER'], ['L2G1', '45DR', '45  DRY CONTAINER'], ['L5G1', '45DH', '45 HIGH CUBE DRY CONTAINER'], ['45R8', '40RH', '40 HIGH CUBE REEFER CONTAINER']]
});

// 🔧 Utilidades
const getUniqueBuques = (data) =>
  [...new Set(data?.map(item => item?.Embarque?.Buque?.buque).filter(Boolean))];

// 🧩 Construcción de la lista del carrusel (filtra por buque)
const buildCarruselList = (data, formData) => {
  if (!Array.isArray(data)) return [];

  // 1️⃣ Filtrar por buque seleccionado (ignorando mayúsculas/minúsculas)
  const filteredData = data.filter(item => {
    const buqueName = item.Embarque?.Buque?.buque?.toLowerCase?.() || '';
    const selected = formData.buque?.toLowerCase?.() || '';
    return buqueName === selected;
  });

  if (filteredData.length === 0) return [];

  // 2️⃣ Agrupar por contenedor
  const grouped = filteredData.reduce((acc, item) => {
    const contId = item.Contenedor?.id;
    if (!acc[contId]) acc[contId] = [];
    acc[contId].push(item);
    return acc;
  }, {});

  // 3️⃣ Mapear grupos
  return Object.values(grouped).map(items => {
    const res = items[0];
    const container = res.Contenedor?.contenedor || '';
    const botella = res.serial_de_articulos
      .filter(item => item.cons_producto === formData.sello)
      .sort((a, b) => new Date(b.fecha_de_uso) - new Date(a.fecha_de_uso))
      .pop().serial; // Toma el último elemento del array
    const caja = items.reduce((acc, i) => acc + (i.cajas_unidades || 0), 0);
    const peso = items.reduce(
      (acc, i) => acc + ((i.combo?.peso_bruto || 0) * (i.cajas_unidades || 0)),
      0
    );

    return [
      container.slice(0, 4),
      container.slice(4),
      formData.isoCode,
      formData.estado,
      botella,
      peso,
      res?.Embarque?.bl,
      formData.origen,
      caja,
      formData.empaque,
      res?.Embarque?.sae || formData.observacion,
    ];
  });
};

// 💾 Componente principal
const GenerarCarruselExcelConEstilos = ({ data = [], setOpen }) => {
  const [buques, setBuques] = useState([]);
  const [formData, setFormData] = useState({
    isoCode: '', estado: '', sello: "", origen: '', empaque: '', observacion: '', buque: ''
  });
  const [insumoSeg, setInsumoSeg] = useState([]);

  // Cargar configuración y buques únicos
  useEffect(() => {
    (async () => {
      try {
        const res = await encontrarModulo("carrusel");
        const inputs = JSON.parse(res?.[0]?.detalles || "{}");
        setFormData(inputs);
        setBuques(getUniqueBuques(data));
        const producto = await listarProductosSeguridad();
        setInsumoSeg(producto);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    })();
  }, [data]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await actualizarModulo({ modulo: "carrusel", detalles: JSON.stringify(formData, null, 2) });
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la configuración');
    }
  }, [formData]);

  const listaCarrusel = useMemo(() => buildCarruselList(data, formData), [data, formData]);

  const shipInfo = useMemo(() => ({
    nombre: formData.buque || 'Buque',
    fecha: new Date().toLocaleDateString('es-ES'),
  }), [formData.buque]);

  // 🎨 Aplicar estilo a una celda
  const applyCellStyle = useCallback((cell, bg = null, color = STYLES.colors.black, bold = false) => {
    cell.font = { color: { argb: color }, bold };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  }, []);

  // 🧾 Hoja principal (SD) - CORREGIDO
  const setupSDWorksheet = useCallback((worksheet) => {
    // Agregar headers
    worksheet.addRow(BASE_DATA.sdHeaders);

    // Agregar datos del carrusel
    listaCarrusel.forEach(row => worksheet.addRow(row));

    // Configurar anchos de columna
    worksheet.columns = STYLES.columnWidths.sd.map(width => ({ width }));

    // Aplicar estilos a los headers
    for (let col = 1; col <= 11; col++) {
      applyCellStyle(worksheet.getCell(1, col), STYLES.colors.darkBlue, STYLES.colors.white, true);
    }

    // Merge cells y configurar información del buque
    worksheet.mergeCells('N1:O1');
    worksheet.mergeCells('N2:O2');

    worksheet.getCell('N1').value = shipInfo.nombre;
    worksheet.getCell('N2').value = shipInfo.fecha;
    worksheet.getCell('M1').value = "Motonave";
    worksheet.getCell('M2').value = "Fecha Anuncio";

    applyCellStyle(worksheet.getCell('N1'), STYLES.colors.lightBlue, STYLES.colors.black, false);
    applyCellStyle(worksheet.getCell('N2'), STYLES.colors.lightBlue, STYLES.colors.black, false);

    ['M1', 'M2'].forEach(ref =>
      applyCellStyle(worksheet.getCell(ref), STYLES.colors.yellow, STYLES.colors.black, true)
    );

    // CORRECCIÓN: Estilos adicionales para tamaños y estados
    worksheet.getCell('M5').value = "Tamaño";
    worksheet.getCell('M6').value = 20;
    worksheet.getCell('M7').value = 40;
    worksheet.getCell('M8').value = 45;

    worksheet.getCell('M11').value = "Estado";
    worksheet.getCell('M12').value = "L";
    worksheet.getCell('M13').value = "V";

    worksheet.getCell('N11').value = "Descripción";
    worksheet.getCell('N12').value = "Lleno";
    worksheet.getCell('N13').value = "Vacío";

    // Estilo para sección de Tamaño (gris como en la imagen)
    for (let row = 6; row <= 8; row++) {
      for (let col = 13; col <= 14; col++) {
        const cell = worksheet.getCell(row, col);
        if (cell.value) {
          applyCellStyle(cell, STYLES.colors.gris, STYLES.colors.black, false);
        }
      }
    }

    // Estilo para sección de Estado (gris como en la imagen)
    for (let row = 12; row <= 13; row++) {
      for (let col = 13; col <= 14; col++) {
        const cell = worksheet.getCell(row, col);
        if (cell.value) {
          applyCellStyle(cell, STYLES.colors.gris, STYLES.colors.black, false);
        }
      }
    }

    // Aplicar estilos amarillos a las etiquetas
    applyCellStyle(worksheet.getCell(5, 13), STYLES.colors.yellow, STYLES.colors.black, true);
    applyCellStyle(worksheet.getCell(11, 13), STYLES.colors.yellow, STYLES.colors.black, true);
    applyCellStyle(worksheet.getCell(11, 14), STYLES.colors.yellow, STYLES.colors.black, true);
  }, [listaCarrusel, applyCellStyle, shipInfo]);

  // 📘 Hoja IsoCodes
  const setupIsoCodesWorksheet = useCallback((worksheet) => {
    worksheet.addRows(BASE_DATA.isoCodes);
    worksheet.columns = STYLES.columnWidths.isoCodes.map(width => ({ width }));

    // Aplicar estilos a los headers
    for (let c = 1; c <= 3; c++) {
      applyCellStyle(worksheet.getCell(1, c), STYLES.colors.darkBlue, STYLES.colors.white, true);
    }

    // Aplicar estilos a los datos
    for (let r = 2; r <= BASE_DATA.isoCodes.length; r++) {
      for (let c = 1; c <= 3; c++) {
        applyCellStyle(worksheet.getCell(r, c), STYLES.colors.lightBlue);
      }
    }
  }, [applyCellStyle]);

  // 📤 Generar Excel
  const generarExcelConEstilos = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const wsSD = workbook.addWorksheet('SD');
      const wsIso = workbook.addWorksheet('IsoCodes');

      setupSDWorksheet(wsSD);
      setupIsoCodesWorksheet(wsIso);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Carrusel_${shipInfo.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert('Ocurrió un error al generar el archivo.');
    }
  };

  // 🧱 UI
  return (
    <div className={styles.fondo}>
      <div className="container py-4">

        <div className="card shadow-sm border-0 mb-4 pb-3">

          <div className="card-header bg-light py-3 px-4">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <i className="bi bi-gear me-3 fs-4 text-primary"></i>
                <h4 className="card-title mb-0 fw-bold text-dark">
                  Parámetros Carrusel
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-close btn-close-lg"
                aria-label="Cerrar"
                style={{ fontSize: '1.2rem' }}
              />
            </div>
          </div>

          <div className="card-body p-4">
            <Row className="g-3" xs={1} sm={2} md={3} lg={6}>
              {["isoCode", "estado", "sello", "origen", "empaque", "observacion"].map((field) => (
                <Col key={field}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2 text-capitalize">
                      {field === 'isoCode' ? 'ISO Code' :
                        field === 'empaque' ? 'Empaque' :
                          field === 'observacion' ? 'Observación' : field}
                    </Form.Label>
                    {field === "estado" || field === "sello" ? (
                      <Form.Select name={field} value={formData[field]} onChange={handleChange}>
                        {field === "estado" && <>
                          <option value="">Seleccione estado</option>
                          <option value="L">L (Lleno)</option>
                          <option value="V">V (Vacío)</option>
                        </>}
                        {insumoSeg.map((e, index) => {
                          if (field === "sello") return (<option key={index} value={e.consecutivo}>{e.name}</option>);
                        })}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        className="form-control-sm border-secondary-subtle"
                        placeholder={`Ingrese ${field}`}
                      />
                    )}
                  </Form.Group>
                </Col>
              ))}

              <Col xs={12} sm={6} md={4} lg={2}>
                <Form.Group>
                  <Form.Label className="form-label-sm text-secondary mb-2 d-block">Buque</Form.Label>
                  <Form.Select
                    name="buque"
                    onChange={handleChange}
                  >
                    <option value="">Seleccione buque</option>
                    {buques.map((b, i) => <option key={i} value={b}>{b}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col className="d-flex align-items-end">
                <Button
                  onClick={async () => {
                    await handleSave();
                    await generarExcelConEstilos();
                  }} className="btn btn-primary w-100">
                  <i className="bi bi-check-lg me-2"></i>Descargar Carrusel
                </Button>
              </Col>

              {formData.buque && (

                <Col className='d-flex align-items-end' xs={12} md={8} lg={8}>
                  <div className="p-2 alert alert-primary text-center w-100 h-80 d-flex align-items-center justify-content-center mb-0 border-0 shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-ship me-2 fs-5"></i>
                        <strong className="me-3">Buque:</strong>
                        <span className="fw-bold text-dark me-2">{formData.buque}</span>
                      </div>
                      <div className="vr"></div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-box-seam me-2 fs-5"></i>
                        <strong className="me-1">Contenedores:</strong>
                        <span className="badge  text-black fs-6">{listaCarrusel.length}</span>
                      </div>
                    </div>
                  </div>
                </Col>

              )}
            </Row>


          </div>
        </div>
      </div>
    </div>

  );
};

export default GenerarCarruselExcelConEstilos;