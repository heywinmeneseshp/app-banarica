import React, { useRef, useState } from 'react';
import { Alert, Badge, Button, Collapse, Form, Modal } from 'react-bootstrap';
import { FaDownload, FaInfoCircle, FaUpload } from 'react-icons/fa';
import { costosEnviar, formatoNumero } from './costosApi';

// Cargue masivo desde Excel o CSV para los catalogos y las facturas de Costos logisticos.
//  columns: [{ key, label, required, example }]
//  apiUrl: ruta del backend que recibe el arreglo de filas (ej. "/proveedores-local")
//  groupValidation (facturas): { groupBy, totalCol, calcItem } agrupa filas por numero de factura y
//    compara el total declarado contra la suma de items.
//  validateUrl: valida contenedor/booking/semana de cada fila; validateConceptos / validateNits:
//    exigen que existan en sus catalogos antes de importar.
//  notas: reglas propias de este cargue que se muestran en el manual (icono de informacion).
export default function CargaMasivaCostos({
  columns, apiUrl, templateName, onDone, groupValidation, validateUrl, validateConceptos, validateNits, notas = [],
}) {
  const [verManual, setVerManual] = useState(false);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [groups, setGroups] = useState(null);
  const [msg, setMsg] = useState({ texto: '', tipo: 'danger' });
  const [loading, setLoading] = useState(false);
  const [unknownConceptos, setUnknownConceptos] = useState([]);
  const [unknownNits, setUnknownNits] = useState([]);
  const [resultado, setResultado] = useState(null);
  const fileRef = useRef(null);

  const limpiar = () => {
    setRows(null);
    setGroups(null);
    setUnknownConceptos([]);
    setUnknownNits([]);
    setResultado(null);
    setMsg({ texto: '', tipo: 'danger' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const cerrar = () => {
    limpiar();
    setOpen(false);
  };

  async function descargarPlantilla() {
    const m = await import('xlsx');
    const XLSX = m.default || m;
    const header = columns.map((c) => c.label);
    const example = columns.map((c) => c.example || '');
    const ws = XLSX.utils.aoa_to_sheet([header, example]);
    ws['!cols'] = header.map((h, i) => ({ wch: Math.max(h.length, String(example[i]).length, 12) + 2 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `${templateName}.xlsx`);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    limpiar();
    try {
      const m = await import('xlsx');
      const XLSX = m.default || m;
      const buf = await file.arrayBuffer();
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      let wb;
      if (isCSV) {
        // Separador: si la primera linea tiene mas ';' que ',', se usa ';'
        const text = new TextDecoder('utf-8').decode(buf);
        const firstLine = text.split('\n')[0] || '';
        const sep = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
        wb = XLSX.read(text, { type: 'string', FS: sep });
      } else {
        wb = XLSX.read(buf, { type: 'array' });
      }
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const labelToKey = {};
      columns.forEach((c) => {
        labelToKey[c.label.toLowerCase()] = c.key;
        labelToKey[c.key.toLowerCase()] = c.key;
      });
      const numericKeys = new Set(['cantidad', 'valor_unitario', 'total']);
      const dateKeys = new Set(['fecha']);

      const mapped = raw.map((r) => {
        const obj = {};
        for (const [k, v] of Object.entries(r)) {
          const key = labelToKey[String(k).trim().toLowerCase()];
          if (!key) continue;
          let val = String(v).trim();
          if (numericKeys.has(key) && isCSV) val = val.replace(/\./g, '').replace(',', '.');
          if (dateKeys.has(key) && /^\d{4,6}(\.\d+)?$/.test(val)) {
            // Serial numerico de Excel -> fecha
            const serial = parseFloat(val);
            if (!Number.isNaN(serial)) val = new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
          }
          obj[key] = val;
        }
        return obj;
      }).filter((r) => Object.keys(r).length > 0);

      if (!mapped.length) {
        setMsg({ texto: 'No se encontraron filas validas. Verifique que los encabezados coincidan con la plantilla.', tipo: 'danger' });
        return;
      }
      setRows(mapped);

      if (validateNits) {
        const nits = [...new Set(mapped.map((r) => r.nit_proveedor?.trim()).filter(Boolean))];
        if (nits.length > 0) {
          const r = await costosEnviar('POST', '/proveedores-local', { _check: true, nits });
          setUnknownNits(r.data?.unknown || []);
        }
      }
      if (validateConceptos) {
        const names = [...new Set(mapped.map((r) => r.concepto?.trim()).filter(Boolean))];
        if (names.length > 0) {
          const r = await costosEnviar('POST', '/items-catalog', { _check: true, names });
          setUnknownConceptos(r.data?.unknown || []);
        }
      }

      if (groupValidation) {
        const { groupBy, totalCol, calcItem } = groupValidation;
        const grpMap = new Map();
        let autoIdx = 0;
        for (const row of mapped) {
          const key = row[groupBy]?.trim() || `(sin ${groupBy}) #${++autoIdx}`;
          if (!grpMap.has(key)) grpMap.set(key, { key, rows: [], declaredTotal: null });
          const g = grpMap.get(key);
          g.rows.push(row);
          if (g.declaredTotal === null && row[totalCol] !== '') g.declaredTotal = parseFloat(row[totalCol]) || 0;
        }
        let desajustes = new Set();
        if (validateUrl) {
          const r = await costosEnviar('POST', validateUrl, mapped.map((x) => ({
            contenedor: x.id_contenedor || null, booking: x.booking || null, semana: x.semana || null,
          })));
          desajustes = new Set(r.data?.mismatches || []);
        }
        let globalIdx = 0;
        setGroups([...grpMap.values()].map((g) => {
          const calcTotal = g.rows.reduce((s, r) => s + (calcItem(r) || 0), 0);
          const match = g.declaredTotal === null || Math.abs(calcTotal - g.declaredTotal) < 0.01;
          const hasPending = g.rows.some((r) => !r.semana?.trim() || !r.concepto?.trim());
          const anotadas = g.rows.map((r) => {
            const idx = globalIdx++;
            return { ...r, _contMismatch: desajustes.has(idx) };
          });
          return { ...g, rows: anotadas, calcTotal, match, hasPending, hasContMismatch: anotadas.some((r) => r._contMismatch) };
        }));
      }
    } catch (err) {
      setMsg({ texto: `Error al leer el archivo: ${err.message}`, tipo: 'danger' });
    }
  }

  async function importar() {
    if (!rows?.length) return;
    setLoading(true);
    try {
      const r = await costosEnviar('POST', apiUrl, rows);
      if (r.ok) {
        setResultado(r.data);
        setRows(null);
        setGroups(null);
        if (fileRef.current) fileRef.current.value = '';
        onDone?.();
      } else {
        setMsg({ texto: r.error || 'Error al importar', tipo: 'danger' });
      }
    } catch (err) {
      setMsg({ texto: err.message, tipo: 'danger' });
    }
    setLoading(false);
  }

  const requiredKeys = columns.filter((c) => c.required).map((c) => c.key);
  const visColumns = groupValidation ? columns.filter((c) => c.key !== groupValidation.totalCol) : columns;
  const bloqueado = unknownConceptos.length > 0 || unknownNits.length > 0;
  const hayAdvertencias = groups?.some((g) => (!g.match && g.declaredTotal !== null) || g.hasPending);

  return (
    <>
      <Button variant="primary" size="sm" className="px-3 text-nowrap" type="button" onClick={() => setOpen(true)}>
        <FaUpload className="me-1" /> Cargue masivo
      </Button>

      <Modal show={open} onHide={cerrar} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="h6 mb-0 d-flex align-items-center gap-2">
            Cargue masivo
            <button
              type="button"
              className="btn btn-link p-0 text-primary"
              style={{ lineHeight: 1 }}
              title="Manual del cargue masivo"
              aria-label="Manual del cargue masivo"
              aria-expanded={verManual}
              onClick={() => setVerManual((v) => !v)}
            >
              <FaInfoCircle size={16} />
            </button>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          <Collapse in={verManual}>
            <div>
              <Alert variant="info" className="mb-3">
                <div className="fw-bold mb-2">Manual del cargue masivo</div>
                <ol className="ps-3 mb-2">
                  <li>Descargue la <strong>plantilla</strong> (botón “Descargar plantilla”) y llénela sin cambiar los encabezados de la primera fila.</li>
                  <li>Guárdela como <strong>.xlsx</strong> o <strong>.csv</strong> (separado por coma o punto y coma; en CSV el decimal puede ir con coma).</li>
                  <li>Las fechas van como <strong>AAAA-MM-DD</strong> (por ejemplo 2026-06-25); también se aceptan fechas de Excel.</li>
                  <li>Súbalo con “Elegir archivo”: se muestra una <strong>vista previa</strong> con las advertencias y, si todo está bien, el botón <strong>Importar</strong>.</li>
                </ol>
                <div className="table-responsive mb-2">
                  <table className="table table-sm table-bordered mb-0 bg-white">
                    <thead className="table-light">
                      <tr><th>Columna</th><th>Obligatoria</th><th>Ejemplo</th></tr>
                    </thead>
                    <tbody>
                      {columns.map((c) => (
                        <tr key={c.key}>
                          <td>{c.label}</td>
                          <td>{c.required ? 'Sí' : 'No'}</td>
                          <td className="text-muted">{c.example || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {notas.length > 0 && (
                  <>
                    <div className="fw-semibold">Reglas de este cargue</div>
                    <ul className="ps-3 mb-0">{notas.map((n) => <li key={n}>{n}</li>)}</ul>
                  </>
                )}
              </Alert>
            </div>
          </Collapse>

          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <Form.Control ref={fileRef} type="file" size="sm" accept=".xlsx,.xls,.csv" style={{ maxWidth: 320 }} onChange={handleFile} />
            <Button variant="outline-secondary" size="sm" type="button" onClick={descargarPlantilla}>
              <FaDownload className="me-1" /> Descargar plantilla
            </Button>
            {rows && (
              <>
                <Button
                  size="sm"
                  type="button"
                  variant={bloqueado ? 'danger' : hayAdvertencias ? 'warning' : 'success'}
                  disabled={loading || bloqueado}
                  onClick={importar}
                >
                  {loading
                    ? 'Importando...'
                    : bloqueado
                      ? `No se puede importar (${unknownConceptos.length + unknownNits.length} no existen)`
                      : `Importar ${groups ? `${groups.length} factura(s)` : `${rows.length} fila(s)`}${hayAdvertencias ? ' (con advertencias)' : ''}`}
                </Button>
                <Button variant="outline-secondary" size="sm" type="button" onClick={limpiar}>Cancelar</Button>
              </>
            )}
          </div>

          {msg.texto && <Alert variant={msg.tipo} className="py-2">{msg.texto}</Alert>}

          {resultado && (
            <Alert variant="success" className="py-2">
              Importacion completada: <strong>{resultado.inserted ?? 0}</strong> registro(s).
              {[...(resultado.errors || []), ...(resultado.contWarnings || []), ...(resultado.mesWarnings || []), ...(resultado.nivelWarnings || [])].length > 0 && (
                <ul className="mb-0 mt-2">
                  {[...(resultado.errors || []), ...(resultado.contWarnings || []), ...(resultado.mesWarnings || []), ...(resultado.nivelWarnings || [])].map((t) => <li key={t}>{t}</li>)}
                </ul>
              )}
            </Alert>
          )}

          {unknownNits.length > 0 && (
            <Alert variant="danger" className="py-2">
              <strong>Estos NIT no existen en Proveedores; creelos primero y vuelva a importar:</strong>
              <ul className="mb-0">{unknownNits.map((n) => <li key={n}>{n}</li>)}</ul>
            </Alert>
          )}
          {unknownConceptos.length > 0 && (
            <Alert variant="danger" className="py-2">
              <strong>Estos items no existen en el Maestro de items; creelos con su tipo de costo y vuelva a importar:</strong>
              <ul className="mb-0">{unknownConceptos.map((n) => <li key={n}>{n}</li>)}</ul>
            </Alert>
          )}

          {groups && (
            <>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {groups.some((g) => !g.match && g.declaredTotal !== null) && (
                  <Badge bg="warning" text="dark">{groups.filter((g) => !g.match && g.declaredTotal !== null).length} factura(s) con total que no cuadra</Badge>
                )}
                {groups.some((g) => g.hasPending) && (
                  <Badge bg="secondary">{groups.filter((g) => g.hasPending).length} factura(s) con items pendientes por completar</Badge>
                )}
                {groups.some((g) => g.hasContMismatch) && (
                  <Badge bg="danger">{groups.filter((g) => g.hasContMismatch).length} factura(s) con contenedor/booking/semana inconsistentes: se guardaran en blanco</Badge>
                )}
              </div>
              <div className="table-responsive" style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="table table-bordered table-sm table-hover mb-0">
                  <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                    <tr>
                      <th>#</th>
                      {visColumns.map((c) => <th key={c.key}>{c.label}</th>)}
                      <th className="text-end">Subtotal</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g, gi) => (
                      <React.Fragment key={g.key}>
                        {g.rows.map((row, ri) => {
                          const subtotal = groupValidation.calcItem(row);
                          const faltan = [];
                          if (!row.semana?.trim()) faltan.push('Semana');
                          if (!row.concepto?.trim()) faltan.push('Concepto');
                          return (
                            <tr key={`${gi}-${ri}`} className={row._contMismatch ? 'table-danger' : ''}>
                              <td className="text-muted">{ri + 1}</td>
                              {visColumns.map((c) => (
                                <td key={c.key} className={row._contMismatch && ['id_contenedor', 'booking', 'semana'].includes(c.key) ? 'text-decoration-line-through text-danger' : ''}>
                                  {row[c.key] || <span className="text-muted">—</span>}
                                </td>
                              ))}
                              <td className="text-end fw-bold">{subtotal > 0 ? formatoNumero(subtotal) : '—'}</td>
                              <td>
                                {row._contMismatch && <Badge bg="danger">Contenedor/booking/semana no coinciden: se guardan en blanco</Badge>}
                                {!row._contMismatch && faltan.length > 0 && <Badge bg="warning" text="dark">Pendiente: {faltan.join(', ')}</Badge>}
                                {!row._contMismatch && faltan.length === 0 && <span className="text-success">✓</span>}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className={!g.match && g.declaredTotal !== null ? 'table-warning' : 'table-success'}>
                          <td colSpan={visColumns.length + 1} className="text-end fw-semibold">{g.key} · suma de items:</td>
                          <td className="text-end fw-bold">{formatoNumero(g.calcTotal)}</td>
                          <td>
                            {g.declaredTotal === null && <span className="text-muted">Sin total declarado</span>}
                            {g.declaredTotal !== null && g.match && <span className="text-success">✓ Cuadra con {formatoNumero(g.declaredTotal)}</span>}
                            {g.declaredTotal !== null && !g.match && (
                              <span>Declarado {formatoNumero(g.declaredTotal)} · dif. {formatoNumero(Math.abs(g.calcTotal - g.declaredTotal))}</span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {rows && !groups && (
            <div className="table-responsive" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table table-bordered table-sm table-hover mb-0">
                <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th>#</th>
                    {columns.map((c) => <th key={c.key}>{c.label}{c.required ? ' *' : ''}</th>)}
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const faltan = requiredKeys.filter((k) => !row[k]);
                    return (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={i} className={faltan.length ? 'table-warning' : ''}>
                        <td>{i + 1}</td>
                        {columns.map((c) => <td key={c.key}>{row[c.key] || <span className="text-muted">—</span>}</td>)}
                        <td>{faltan.length ? <span className="text-danger">Falta: {faltan.join(', ')}</span> : <span className="text-success">✓</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!rows && !resultado && (
            <p className="text-muted mb-0">
              Suba un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con los encabezados de la plantilla.
              {groupValidation && <> Las filas con el mismo <strong>N Factura</strong> se agrupan en una sola factura.</>}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={cerrar}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
