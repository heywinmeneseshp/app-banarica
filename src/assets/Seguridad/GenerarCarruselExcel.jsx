import React, { useEffect, useCallback, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import styles from "@components/shared/Formularios/Formularios.module.css";
import { Form, Col, Row, Button } from 'react-bootstrap';
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
import { listarProductosSeguridad } from '@services/api/seguridad';

// 🎨 Estilos y configuración base (inmutables) - SIN CAMBIOS
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
    sd: [9, 9, 9, 9, 9, 9, 13, 22, 10, 10, 24, 9, 17, 12],
    isoCodes: [12, 12, 35],
  },
});

const BASE_DATA = Object.freeze({
  sdHeaders: [
    "Prefijo", "Numero", "ISOCode", "Estado", "Sello1", "Peso",
    "BookingEDO", "OrigenContenedor", "Cantidad", "Empaque", "ObservacionContenedor",
    "", "Motonave", "Buque"
  ],
  isoCodes: [['IsoCode', 'SizeType', 'Descripción'], ['20G0', '20DR', '20 DRY FREIGHT CONTAINER'], ['20G1', '20DR', '20 DRY FREIGHT CONTAINER'], ['20H0', '20RF', '20 REEFER CONTAINER'], ['20P1', '20FR', '20 FLAT RACK CONTAINER'], ['20T3', '20TK', '20 TANK CONTAINER'], ['20T4', '20TK', '20 TANK CONTAINER'], ['20T5', '20TK', '20 TANK CONTAINER'], ['20T6', '20TK', '20 TANK CONTAINER'], ['20T7', '20TK', '20 TANK CONTAINER'], ['20T8', '20TK', '20 TANK CONTAINER'], ['20T0', '20TK', '20 TANK CONTAINER'], ['20T1', '20TK', '20 TANK CONTAINER'], ['20T2', '20TK', '20 TANK CONTAINER'], ['22B0', '20TK', '20 TANK CONTAINER'], ['22G0', '20DR', '20 DRY FREIGHT CONTAINER'], ['22G1', '20DR', '20 DRY FREIGHT CONTAINER'], ['22H0', '20RF', '20 REEFER CONTAINER'], ['22P3', '20FR', '20 FLAT RACK CONTAINER'], ['22P8', '20FR', '20 FLAT RACK CONTAINER'], ['22P9', '20FR', '20 FLAT RACK CONTAINER'], ['22P1', '20FR', '20 FLAT RACK CONTAINER'], ['22P7', '20FR', '20 FLAT RACK CONTAINER'], ['22R9', '20RF', '20 REEFER CONTAINER'], ['22R7', '20RF', '20 REEFER CONTAINER'], ['22R1', '20RF', '20 REEFER CONTAINER'], ['22S1', '20DR', '20 DRY FREIGHT CONTAINER'], ['22T3', '20TK', '20 TANK CONTAINER'], ['22T4', '20TK', '20 TANK CONTAINER'], ['22T5', '20TK', '20 TANK CONTAINER'], ['22T6', '20TK', '20 TANK CONTAINER'], ['22T7', '20TK', '20 TANK CONTAINER'], ['22T8', '20TK', '20 TANK CONTAINER'], ['22T0', '20TK', '20 TANK CONTAINER'], ['22T1', '20TK', '20 TANK CONTAINER'], ['22T2', '20TK', '20 TANK CONTAINER'], ['22U6', '20OT', '20 OPEN TOP CONTAINER'], ['22U1', '20OT', '20 OPEN TOP CONTAINER'], ['28T8', '20TK', '20 TANK CONTAINER'], ['28U1', '20OT', '20 OPEN TOP CONTAINER'], ['29P0', '20PF', '20 PLATAFORM CONTAINER'], ['42G0', '40DR', '40 DRY FREIGHT CONTAINER'], ['42G1', '40DR', '40 DRY FREIGHT CONTAINER'], ['42H0', '40RF', '40 REEFER CONTAINER'], ['42P3', '40FR', '40 FLAT RACK CONTAINER'], ['42P8', '40FR', '40 FLAT RACK CONTAINER'], ['42P9', '40FR', '40 FLAT RACK CONTAINER'], ['42P1', '40FR', '40 FLAT RACK CONTAINER'], ['42P6', '40PF', '40 PLATAFORM CONTAINER'], ['42R9', '40RF', '40 REEFER CONTAINER'], ['42R3', '40RF', '40 REEFER CONTAINER'], ['42R1', '40RF', '40 REEFER CONTAINER'], ['42S1', '40DR', '40 DRY FREIGHT CONTAINER'], ['42T5', '40TK', '40 TANK CONTAINER'], ['42T6', '40TK', '40 TANK CONTAINER'], ['42T8', '40TK', '40 TANK CONTAINER'], ['42T2', '40TK', '40 TANK CONTAINER'], ['42U6', '40OT', '40 OPEN TOP CONTAINER'], ['42U1', '40OT', '40 OPEN TOP CONTAINER'], ['45B3', '40DH', '40 HIGH CUBE DRY CONTAINER'], ['45G0', '40DH', '40 HIGH CUBE DRY CONTAINER'], ['45G1', '40DH', '40 HIGH CUBE DRY CONTAINER'], ['45P3', '40FR', '40 FLAT RACK CONTAINER'], ['45P8', '40FR', '40 FLAT RACK CONTAINER'], ['45R9', '40RH', '40 HIGH CUBE REEFER CONTAINER'], ['45R1', '40RH', '40 HIGH CUBE REEFER CONTAINER'], ['45U1', '40OT', '40 OPEN TOP CONTAINER'], ['45U6', '40OT', '40 OPEN TOP CONTAINER'], ['46H0', '40RH', '40 HIGH CUBE REEFER CONTAINER'], ['48T8', '40TK', '40 TANK CONTAINER'], ['49P0', '40PF', '40 PLATAFORM CONTAINER'], ['4CG0', '40DR', '40 DRY FREIGHT CONTAINER'], ['L0G1', '45DR', '45  DRY CONTAINER'], ['L2G1', '45DR', '45  DRY CONTAINER'], ['L5G1', '45DH', '45 HIGH CUBE DRY CONTAINER'], ['45R8', '40RH', '40 HIGH CUBE REEFER CONTAINER']]
});

// 🔧 Utilidades - SIN CAMBIOS
const getUniqueBuques = (data) =>
  [...new Set(data?.map(item => item?.Embarque?.Buque?.buque).filter(Boolean))];

// 🧩 Construcción de la lista del carrusel (filtra por buque) - SIN CAMBIOS
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
      parseInt(peso),
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
  const [enviando, setEnviando] = useState(false);

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

  // 🎨 Aplicar estilo a una celda - SIN CAMBIOS
  const applyCellStyle = useCallback((cell, bg = null, color = STYLES.colors.black, bold = false, horizontal = "center", border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }) => {
    cell.font = {
      color: { argb: color },
      bold,
      name: 'Arial',
      size: 10
    };
    cell.alignment = { vertical: 'middle', horizontal, wrapText: true };
    cell.border = border;
    if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  }, []);

  // 🧾 Hoja principal (SD) - SIN CAMBIOS (exactamente igual)
  const setupSDWorksheet = useCallback((worksheet) => {
    // Agregar headers
    worksheet.addRow(BASE_DATA.sdHeaders);

    // Agregar datos del carrusel
    listaCarrusel.forEach(row => worksheet.addRow(row));

    // Configurar anchos de columna
    worksheet.columns = STYLES.columnWidths.sd.map(width => ({ width }));

    // Aplicar estilos a los headers
    for (let col = 1; col <= 11; col++) {
      applyCellStyle(worksheet.getCell(1, col), STYLES.colors.darkBlue, STYLES.colors.white, true, null, null);
    }

    // Merge cells y configurar información del buque
    worksheet.mergeCells('N1:O1');
    worksheet.mergeCells('N2:O2');

    worksheet.getCell('N1').value = shipInfo.nombre;
     worksheet.getCell('N2').numFmt = 'dd/mm/yyyy hh:mm:ss "a. m."';
    worksheet.getCell('N2').value = shipInfo.fecha;
    worksheet.getCell('M1').value = "Motonave";
    worksheet.getCell('M2').value = "Fecha Anuncio";

    applyCellStyle(worksheet.getCell('N1'), STYLES.colors.lightBlue, STYLES.colors.black, false);
    applyCellStyle(worksheet.getCell('N2'), STYLES.colors.lightBlue, STYLES.colors.black, false);

    ['M1', 'M2'].forEach(ref =>
      applyCellStyle(worksheet.getCell(ref), STYLES.colors.yellow, STYLES.colors.black, true)
    );

    // Sección de Tamaño y Estado (manteniendo exactamente tu estilo)
    worksheet.getCell('M5').value = "Tamaño";
    worksheet.getCell('M6').value = 20;
    worksheet.getCell('M7').value = 40;
    worksheet.getCell('M8').value = 45;

    worksheet.getCell('M11').value = "Estado";
    worksheet.getCell('M12').value = "L";
    worksheet.getCell('M13').value = "V";

    worksheet.getCell('N11').value = "Descripción";
    worksheet.getCell('N12').value = "Lleno";
    worksheet.getCell('N13').value = "Vacio";

    // Estilo para sección de Tamaño (gris como en tu diseño)
    for (let row = 6; row <= 8; row++) {
      for (let col = 13; col <= 14; col++) {
        const cell = worksheet.getCell(row, col);
        if (cell.value) {
          applyCellStyle(cell, STYLES.colors.gris, STYLES.colors.black, false);
        }
      }
    }

    // Estilo para sección de Estado (gris como en tu diseño)
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

  // 📘 Hoja IsoCodes - SIN CAMBIOS (exactamente igual)
  const setupIsoCodesWorksheet = useCallback((worksheet) => {
    worksheet.addRows(BASE_DATA.isoCodes);
    worksheet.columns = STYLES.columnWidths.isoCodes.map(width => ({ width }));

    // Aplicar estilos a los headers
    for (let c = 1; c <= 3; c++) {
      applyCellStyle(worksheet.getCell(1, c), STYLES.colors.white, STYLES.colors.black, true, "left");
    }

    // Aplicar estilos a los datos
    for (let r = 2; r <= BASE_DATA.isoCodes.length; r++) {
      for (let c = 1; c <= 3; c++) {
        applyCellStyle(worksheet.getCell(r, c), null, null, null, "left");
      }
    }
    const columnaC = worksheet.getColumn(2);
    columnaC.hidden = true;
  }, [applyCellStyle]);

  // 📤 Función para generar el Excel (sin cambios en la generación)
  const generarExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const wsSD = workbook.addWorksheet('CARRUSEL', {
        views: [
          {
            showGridLines: false // Desactiva las líneas de cuadrícula
          }
        ]
      });
      const wsIso = workbook.addWorksheet('IsoCodes', {
        views: [
          {
            showGridLines: false // Desactiva las líneas de cuadrícula
          }
        ]
      });

      setupSDWorksheet(wsSD);
      setupIsoCodesWorksheet(wsIso);

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Error al generar Excel:', error);
      throw error;
    }
  };

  // 📥 Descargar Excel localmente (tu función original sin cambios)
  const descargarExcelLocal = async () => {
    try {
      const buffer = await generarExcel();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Carrusel_${shipInfo.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      alert('¡Archivo descargado exitosamente!');
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      alert('Ocurrió un error al generar el archivo.');
    }
  };

  // 📧 Enviar Excel por correo (NUEVA FUNCIONALIDAD)
  const enviarExcelPorCorreo = async () => {
    if (!formData.correo) {
      alert('Por favor ingresa un correo destino');
      return;
    }

    // ACEPTA UNO O VARIOS EMAILS SEPARADOS POR COMA
    const multipleEmailRegex = /^([^\s@]+@[^\s@]+\.[^\s@]+)(\s*,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/;

    if (!multipleEmailRegex.test(formData.correo)) {
      alert('Por favor ingresa uno o varios correos electrónicos válidos, separados por comas.');
      return;
    }

    try {
      setEnviando(true);
      const buffer = await generarExcel();

      // Convertir buffer a base64
      const base64String = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const fechaActual = new Date();
      const fechaFormateada = fechaActual.toLocaleDateString('es-ES');
      const horaFormateada = fechaActual.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Preparar datos para enviar al backend
      const datosCorreo = {
        destinatario: formData.correo,
        asunto: `Carrusel - ${shipInfo.nombre} - ${fechaFormateada} ${horaFormateada}`,
        cuerpo: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
        <p>Estimado/a,</p>
        
        <p>Se adjunta el archivo correspondiente al buque <strong>${shipInfo.nombre}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2c5282; margin: 20px 0;">
            <p style="margin-top: 0; font-weight: bold; color: #2c5282;">Detalles del documento:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Buque:</strong> ${shipInfo.nombre}</li>
                <li><strong>Fecha de generación:</strong> ${fechaFormateada} ${horaFormateada}</li>
                <li><strong>Tipo:</strong> Carrusel</li>
            </ul>
        </div>
        
        <p>El archivo adjunto contiene el listado requerido según lo programado.</p>
        
        <p>Por favor, verifique la información y proceda según corresponda.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Atentamente,<br>
            <strong>Departamento de Logística</strong></p>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
            ---<br>
            Este es un mensaje generado automáticamente.
            </p>
        </div>
    </div>
    `,
        archivo: {
          nombre: `Carrusel_${shipInfo.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`,
          contenido: base64String,
          tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      };

      // Importar el servicio dinámicamente (ajusta la ruta según tu proyecto)
      const { enviarCorreo } = await import('@services/api/correo');
      const respuesta = await enviarCorreo(datosCorreo);
      if (respuesta.success) {
        alert('¡Archivo enviado por correo exitosamente!');
      } else {
        alert('Error al enviar el correo: ' + respuesta.message);
      }
    } catch (error) {
      console.error('Error al enviar por correo:', error);
      alert('Ocurrió un error al enviar el archivo por correo');
    } finally {
      setEnviando(false);
    }
  };

  // 🧱 UI - MEJORADO EL GRID
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
            {/* 📝 SECCIÓN 1: PARÁMETROS DEL CARRUSEL */}
            <div className="mb-4">
              <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center">
                <i className="bi bi-sliders me-2"></i>
                Configuración del Carrusel
              </h6>
              <Row className="g-3 mb-4">
                {/* Primera fila de parámetros */}
                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-upc-scan me-1"></i> ISO Code
                    </Form.Label>
                    <Form.Control
                      name="isoCode"
                      value={formData.isoCode}
                      onChange={handleChange}
                      className="form-control-sm border-secondary-subtle"
                      placeholder="Ej: 20G0"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-circle-half me-1"></i> Estado
                    </Form.Label>
                    <Form.Select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="form-select-sm"
                    >
                      <option value="">Seleccione estado</option>
                      <option value="L">L (Lleno)</option>
                      <option value="V">V (Vacío)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-tag me-1"></i> Sello
                    </Form.Label>
                    <Form.Select
                      name="sello"
                      value={formData.sello}
                      onChange={handleChange}
                      className="form-select-sm"
                    >
                      <option value="">Seleccione sello</option>
                      {insumoSeg.map((e, index) => (
                        <option key={index} value={e.consecutivo}>{e.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-geo-alt me-1"></i> Origen
                    </Form.Label>
                    <Form.Control
                      name="origen"
                      value={formData.origen}
                      onChange={handleChange}
                      className="form-control-sm border-secondary-subtle"
                      placeholder="Origen del contenedor"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Segunda fila de parámetros */}
              <Row className="g-3">
                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-box me-1"></i> Empaque
                    </Form.Label>
                    <Form.Control
                      name="empaque"
                      value={formData.empaque}
                      onChange={handleChange}
                      className="form-control-sm border-secondary-subtle"
                      placeholder="Tipo de empaque"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-chat-left-text me-1"></i> Observación
                    </Form.Label>
                    <Form.Control
                      name="observacion"
                      value={formData.observacion}
                      onChange={handleChange}
                      className="form-control-sm border-secondary-subtle"
                      placeholder="Observaciones adicionales"
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      <i className="bi bi-ship me-1"></i> Buque
                    </Form.Label>
                    <Form.Select
                      name="buque"
                      value={formData.buque}
                      onChange={handleChange}
                      className="form-select-sm"
                    >
                      <option value="">Seleccione buque</option>
                      {buques.map((b, i) => (
                        <option key={i} value={b}>{b}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6} lg={3}>
                  <Form.Group>
                    <Form.Label className="form-label-sm text-secondary mb-2">
                      Correo Destino
                    </Form.Label>
                    <div className="input-group input-group-sm">

                      <Form.Control
                        type="email"
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        className="form-control-sm border-secondary-subtle"
                        placeholder="ejemplo@empresa.com"
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* 📤 SECCIÓN 2: ACCIONES */}
            <div className="mb-4">
              <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center">
                <i className="bi bi-lightning-charge me-2"></i>
                Acciones
              </h6>
              <Row className="g-3">
                <Col xs={12} lg={8}>
                  <div className="d-flex gap-3">
                    <Button
                      onClick={async () => {
                        await handleSave();
                        await descargarExcelLocal();
                      }}
                      className="btn btn-primary flex-fill d-flex align-items-center justify-content-center"
                      style={{ minHeight: '44px' }}
                    >
                      <i className="bi bi-download me-2 fs-5"></i>
                      <div className="text-start">
                        <div className="fw-bold">Descargar Excel</div>
                        <small className="opacity-75">Guardar en dispositivo</small>
                      </div>
                    </Button>
                    {/*Enviar carrusel */}
                    <Button
                      onClick={async () => {
                        await handleSave();
                        await enviarExcelPorCorreo();
                      }}
                      disabled={enviando || !formData.correo}
                      className="btn btn-success flex-fill d-flex align-items-center justify-content-center"
                      style={{ minHeight: '44px' }}
                    >
                      {enviando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          <div className="text-start">
                            <div className="fw-bold">Enviando...</div>
                            <small className="opacity-75">Espere por favor</small>
                          </div>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2 fs-5"></i>
                          <div className="text-start">
                            <div className="fw-bold">Enviar por Correo</div>
                          </div>
                        </>
                      )}
                    </Button>
                  </div>
                </Col>

                <Col xs={12} lg={4}>
                  <div className="d-flex h-100">
                    <Button
                      onClick={() => {
                        handleSave();
                        window.alert("Parámetros guardados");
                      }}
                      className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                      style={{ minHeight: '44px' }}
                    >
                      <i className="bi bi-save me-2"></i>
                      <div className="text-start text-white">
                        <div className="fw-bold">Guardar Parámetros</div>
                      </div>
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* 📊 SECCIÓN 3: INFORMACIÓN DEL BUQUE */}
            {formData.buque && (
              <div className="mt-4">
                <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center">
                  <i className="bi bi-info-circle me-2"></i>
                  Resumen
                </h6>
                <div className="p-4 bg-light rounded-3 border">
                  <Row className="align-items-center">
                    <Col xs={12} md={6} lg={4}>
                      <div className="d-flex align-items-center mb-3 mb-md-0">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                          <i className="bi bi-ship fs-4 text-primary"></i>
                        </div>
                        <div>
                          <div className="text-muted small">Buque Seleccionado</div>
                          <div className="fw-bold fs-5 text-dark">{formData.buque}</div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={12} md={6} lg={4}>
                      <div className="d-flex align-items-center mb-3 mb-md-0">
                        <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                          <i className="bi bi-box-seam fs-4 text-success"></i>
                        </div>
                        <div>
                          <div className="text-muted small">Contenedores a Procesar</div>
                          <div className="fw-bold fs-5 text-dark">
                            <span className="badge bg-success bg-opacity-25 text-success fs-6 px-3 py-2">
                              {listaCarrusel.length} contenedores
                            </span>
                          </div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={12} md={12} lg={4}>
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                          <i className="bi bi-calendar-check fs-4 text-info"></i>
                        </div>
                        <div>
                          <div className="text-muted small">Fecha de Generación</div>
                          <div className="fw-bold fs-5 text-dark">
                            {new Date().toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerarCarruselExcelConEstilos;