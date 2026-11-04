import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import {
  FaChevronDown, FaChevronRight, FaEdit, FaExclamationTriangle, FaInfoCircle, FaPlus, FaTimes, FaTrash,
} from 'react-icons/fa';
import Paginacion from '@components/shared/Tablas/Paginacion';
import Alertas from '@components/shared/Alertas';
import useAlert from '@hooks/useAlert';
import { costosEnviar, costosGet, formatoNumero } from './costosApi';
import CargaMasivaCostos from './CargaMasivaCostos';
import FacturaForm from './FacturaForm';
import ManualFacturasModal from './ManualFacturasModal';

const LIMITE = 30;
const TIPOS_FALLBACK = ['Factura', 'Nota Débito', 'Nota Crédito', 'Otro'];
const FILTROS_VACIOS = { nit_proveedor: '', tipo: '', estado: '', advertencia: '', numero_factura: '', fecha_desde: '', fecha_hasta: '' };
const BOTON_CUADRADO = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 25, width: 25, margin: 'auto' };

const NOTAS_CARGUE = [
  'Cada fila es un ítem. Las filas con el mismo N Factura se agrupan en una sola factura; si el N Factura va vacío, cada fila crea su propia factura.',
  'El NIT Proveedor y el Concepto deben existir antes en las pestañas Proveedores y Maestro de ítems; si falta alguno, no se puede importar.',
  'Total Factura es opcional: si lo declara y no coincide con la suma de los ítems (cantidad × valor unitario), la factura se guarda con advertencia.',
  'Los ítems en USD se convierten con la TRM de la fecha de la factura (o la más reciente anterior).',
  'Si no indica el Mes, se calcula a partir de la Semana. Si lo indica y no corresponde a esa semana, la semana y el mes se guardan en blanco.',
  'Nivel Asociacion es opcional y se deduce solo de lo que tenga lleno el ítem: contenedor, booking, semana, mes o año (en ese orden de prioridad). Si escribe uno distinto al real, se guarda el real y se avisa en el resultado.',
  'Para un costo de todo un mes deje Contenedor, Booking y Semana vacíos y escriba el Mes (ej. Junio 2026); para uno de todo un año, solo el Año.',
  'El Contenedor, el Booking y la Semana se validan contra la operación: si no coinciden entre sí, se guardan en blanco y se muestra el aviso.',
  'Una factura repetida (mismo proveedor, número y año) se rechaza y aparece en la lista de errores del resultado.',
];

const COLUMNAS_CARGUE = [
  { key: 'fecha', label: 'Fecha', required: false, example: '2026-06-25' },
  { key: 'tipo', label: 'Tipo', required: false, example: 'Factura' },
  { key: 'numero_factura', label: 'N Factura', required: false, example: 'FV-001' },
  { key: 'nit_proveedor', label: 'NIT Proveedor', required: false, example: '900123456' },
  { key: 'concepto', label: 'Concepto', required: false, example: 'Movilización' },
  { key: 'id_contenedor', label: 'Contenedor', required: false, example: 'TCKU1234567' },
  { key: 'booking', label: 'Booking', required: false, example: 'BK-9876' },
  { key: 'divisa', label: 'Divisa', required: false, example: 'COP' },
  { key: 'cantidad', label: 'Cantidad', required: false, example: '1' },
  { key: 'valor_unitario', label: 'Valor Unitario', required: false, example: '150000' },
  { key: 'semana', label: 'Semana', required: false, example: 'S25-2026' },
  { key: 'mes', label: 'Mes', required: false, example: 'Junio 2026' },
  { key: 'anho', label: 'Año', required: false, example: '2026' },
  { key: 'total', label: 'Total Factura', required: false, example: '300000' },
  { key: 'nivel_asociacion', label: 'Nivel Asociacion', required: false, example: 'booking' },
  { key: 'tipo_costo', label: 'Tipo Costo', required: false, example: 'FINCA' },
];

export default function ListadoFacturas({ proveedores, tiposDocs = [], estadosDocs = [], tiposCosto = [] }) {
  const [items, setItems] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [numInput, setNumInput] = useState('');
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [expandida, setExpandida] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState(new Set());
  const [errorGuardar, setErrorGuardar] = useState('');
  const [verManual, setVerManual] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v); });
      const data = await costosGet(`/facturas?${params.toString()}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setAlert({ active: true, mensaje: e.message, color: 'danger', autoClose: true });
      setItems([]);
    }
    setCargando(false);
  }, [filtros, setAlert]);

  useEffect(() => { cargar(); setPagina(1); }, [cargar]);

  const cambiarFiltro = (clave, valor) => setFiltros((f) => ({ ...f, [clave]: valor }));
  const hayFiltros = Object.values(filtros).some(Boolean);

  async function guardar(form) {
    setErrorGuardar('');

    if (form.nit_proveedor?.trim()) {
      const r = await costosEnviar('POST', '/proveedores-local', { _check: true, nits: [form.nit_proveedor.trim()] });
      if (r.data?.unknown?.length > 0) {
        setErrorGuardar(`El NIT ${r.data.unknown[0]} no existe en el maestro de proveedores. Créelo primero en la pestaña Proveedores.`);
        return;
      }
    }

    const conceptos = [...new Set((form.items || []).map((i) => i.concepto?.trim()).filter(Boolean))];
    if (conceptos.length > 0) {
      const r = await costosEnviar('POST', '/items-catalog', { _check: true, names: conceptos });
      if (r.data?.unknown?.length > 0) {
        setErrorGuardar(`Estos conceptos no existen en el catálogo: ${r.data.unknown.join(', ')}. Créelos primero en la pestaña Maestro de ítems.`);
        return;
      }
    }

    const r = editando
      ? await costosEnviar('PATCH', '/facturas', { id: editando.id, ...form })
      : await costosEnviar('POST', '/facturas', form);
    if (!r.ok) { setErrorGuardar(r.error || 'Error al guardar'); return; }
    setEditando(null);
    setCreando(false);
    setAlert({ active: true, mensaje: 'La factura se guardó correctamente', color: 'success', autoClose: true });
    cargar();
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar esta factura?')) return;
    await costosEnviar('DELETE', '/facturas', { id });
    cargar();
  }

  async function eliminarSeleccion() {
    if (seleccion.size === 0) return;
    if (!window.confirm(`¿Eliminar ${seleccion.size} factura(s) seleccionada(s)?`)) return;
    await Promise.all([...seleccion].map((id) => costosEnviar('DELETE', '/facturas', { id })));
    setSeleccion(new Set());
    cargar();
  }

  // Borra TODAS las facturas (no solo las filtradas). Pide escribir VACIAR para confirmar.
  async function vaciarTodas() {
    const texto = window.prompt('Se eliminarán TODAS las facturas y sus ítems. Esta acción no se puede deshacer.\n\nEscribe VACIAR para confirmar:');
    if (texto === null) return;
    if (texto.trim().toUpperCase() !== 'VACIAR') {
      setAlert({ active: true, mensaje: 'Confirmación incorrecta, no se eliminó nada', color: 'warning', autoClose: true });
      return;
    }
    const r = await costosEnviar('DELETE', '/facturas-clear');
    setAlert({
      active: true,
      mensaje: r.ok ? `Se eliminaron ${r.data?.total ?? 0} factura(s)` : (r.error || 'No se pudo vaciar'),
      color: r.ok ? 'success' : 'danger',
      autoClose: true,
    });
    setSeleccion(new Set());
    cargar();
  }

  const alternar = (id) => setSeleccion((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const alternarPagina = (filasPagina) => {
    const ids = filasPagina.map((f) => f.id);
    const todas = ids.every((id) => seleccion.has(id));
    setSeleccion((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (todas ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  async function cambiarEstado(id, estado) {
    await costosEnviar('PATCH', '/facturas', { id, _estadoOnly: true, estado: estado || null });
    cargar();
  }

  const sentidoPorTipo = Object.fromEntries(tiposDocs.map((t) => [t.nombre, t.sentido]));
  const sentido = (tipo) => sentidoPorTipo[tipo] || 'resta';
  const colorEstado = Object.fromEntries(estadosDocs.map((e) => [e.nombre, e.color]));
  const tiposOpciones = tiposDocs.length ? tiposDocs : TIPOS_FALLBACK.map((n) => ({ nombre: n }));

  const filasPagina = items.slice((pagina - 1) * LIMITE, pagina * LIMITE);
  const paginaCompleta = filasPagina.length > 0 && filasPagina.every((f) => seleccion.has(f.id));
  const totalSuma = items.filter((f) => sentido(f.tipo) === 'suma').reduce((s, f) => s + (f.total || 0), 0);
  const totalResta = items.filter((f) => sentido(f.tipo) === 'resta').reduce((s, f) => s + (f.total || 0), 0);
  const neto = totalSuma - totalResta;

  const cerrarFormulario = () => { setEditando(null); setCreando(false); setErrorGuardar(''); };

  return (
    <div className="container-fluid">
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0 d-flex align-items-center gap-2">
            Registro de facturas
            <button
              type="button"
              className="btn btn-link p-0 text-primary"
              style={{ lineHeight: 1 }}
              title="Manual del módulo"
              aria-label="Manual del módulo de facturas"
              onClick={() => setVerManual(true)}
            >
              <FaInfoCircle size={20} />
            </button>
          </h2>
          <div className="line mt-2" />
        </div>
        {seleccion.size > 0 && <Badge bg="primary" pill className="fs-6">{seleccion.size} seleccionada(s)</Badge>}
      </div>

      <Row className="g-2 align-items-center mb-2">
        <Col xs={12} md="auto">
          <Button variant="success" size="sm" className="px-3 text-nowrap w-100" type="button" onClick={() => { setCreando(true); setEditando(null); }}>
            <FaPlus className="me-1" /> Nueva factura
          </Button>
        </Col>
        <Col xs={12} md="auto">
          <Button variant="danger" size="sm" className="px-3 text-nowrap w-100" type="button" disabled={seleccion.size === 0} onClick={eliminarSeleccion}>
            <FaTrash className="me-1" /> Eliminar seleccionadas
          </Button>
        </Col>
        <Col xs={12} md="auto">
          <CargaMasivaCostos
            apiUrl="/facturas-bulk"
            templateName="plantilla_facturas"
            onDone={cargar}
            validateConceptos
            validateNits
            validateUrl="/contenedores-cache"
            notas={NOTAS_CARGUE}
            columns={COLUMNAS_CARGUE}
            groupValidation={{
              groupBy: 'numero_factura',
              totalCol: 'total',
              calcItem: (row) => (parseFloat(row.cantidad) || 0) * (parseFloat(row.valor_unitario) || 0),
            }}
          />
        </Col>
        <Col xs={12} md="auto">
          <Button variant="outline-danger" size="sm" className="px-3 text-nowrap w-100" type="button" onClick={vaciarTodas}>
            <FaTrash className="me-1" /> Vaciar todas
          </Button>
        </Col>
      </Row>

      <Row className="g-2 align-items-center mb-3">
        <Col xs={12} md={6} xl>
          <Form.Control
            size="sm"
            placeholder="N° de factura (Enter)"
            value={numInput}
            onChange={(e) => setNumInput(e.target.value)}
            onBlur={() => cambiarFiltro('numero_factura', numInput)}
            onKeyDown={(e) => e.key === 'Enter' && cambiarFiltro('numero_factura', numInput)}
          />
        </Col>
        <Col xs={12} md={6} xl>
          <Form.Select size="sm" value={filtros.nit_proveedor} onChange={(e) => cambiarFiltro('nit_proveedor', e.target.value)} aria-label="Proveedor">
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => <option key={p.nit} value={p.nit}>{p.nombre}</option>)}
          </Form.Select>
        </Col>
        <Col xs={12} md={6} xl>
          <Form.Select size="sm" value={filtros.tipo} onChange={(e) => cambiarFiltro('tipo', e.target.value)} aria-label="Tipo">
            <option value="">Todos los tipos</option>
            {tiposOpciones.map((t) => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
          </Form.Select>
        </Col>
        <Col xs={12} md={6} xl>
          <Form.Select size="sm" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)} aria-label="Estado">
            <option value="">Todos los estados</option>
            <option value="__sin_estado__">Sin estado</option>
            {estadosDocs.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </Form.Select>
        </Col>
        <Col xs={12} md={6} xl>
          <Form.Select size="sm" value={filtros.advertencia} onChange={(e) => cambiarFiltro('advertencia', e.target.value)} aria-label="Advertencia">
            <option value="">Todas</option>
            <option value="mismatch">Con advertencia de total</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={3} xl="auto">
          <Form.Control size="sm" type="date" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} aria-label="Desde" title="Desde" />
        </Col>
        <Col xs={6} md={3} xl="auto">
          <Form.Control size="sm" type="date" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} aria-label="Hasta" title="Hasta" />
        </Col>
        {hayFiltros && (
          <Col xs="auto">
            <Button variant="outline-secondary" size="sm" type="button" onClick={() => { setNumInput(''); setFiltros(FILTROS_VACIOS); }}>
              <FaTimes className="me-1" /> Limpiar
            </Button>
          </Col>
        )}
      </Row>

      <div className="table-responsive">
        <table className="table table-bordered table-sm table-hover">
          <thead>
            <tr>
              <th className="text-custom-small text-center align-middle" style={{ padding: 2, width: 32 }}>
                <Form.Check type="checkbox" checked={paginaCompleta} onChange={() => alternarPagina(filasPagina)} aria-label="Seleccionar todas" />
              </th>
              <th style={{ padding: 2, width: 28 }} aria-label="Detalle" />
              {['Fecha', 'Tipo', 'N° factura', 'Proveedor', 'Ítems', 'Total', 'Estado', 'Editar', 'Eliminar'].map((h) => (
                <th key={h} className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={11} className="text-center py-4">Cargando...</td></tr>}
            {!cargando && filasPagina.length === 0 && <tr><td colSpan={11} className="text-center py-4 text-muted">Sin facturas registradas</td></tr>}
            {!cargando && filasPagina.map((f) => (
              <React.Fragment key={f.id}>
                <tr>
                  <td className="text-center align-middle" style={{ padding: 2 }}>
                    <Form.Check type="checkbox" checked={seleccion.has(f.id)} onChange={() => alternar(f.id)} aria-label="Seleccionar" />
                  </td>
                  <td className="text-center align-middle" style={{ padding: 2 }}>
                    <button type="button" className="btn btn-link btn-sm p-0 text-secondary" onClick={() => setExpandida(expandida === f.id ? null : f.id)} aria-label="Ver ítems">
                      {expandida === f.id ? <FaChevronDown /> : <FaChevronRight />}
                    </button>
                  </td>
                  <td className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{f.fecha || '—'}</td>
                  <td className="text-custom-small text-center align-middle" style={{ padding: 2 }}>
                    <Badge bg={sentido(f.tipo) === 'suma' ? 'success' : 'danger'} className="fw-normal">{f.tipo || '—'}</Badge>
                  </td>
                  <td className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{f.numero_factura || '—'}</td>
                  <td className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{f.proveedor_nombre || f.nit_proveedor || '—'}</td>
                  <td className="text-custom-small text-center align-middle" style={{ padding: 2 }}>
                    <Badge bg="info" text="dark" className="fw-normal">{(f.items || []).length}</Badge>
                  </td>
                  <td className={`text-custom-small text-end align-middle fw-bold ${f.estado_total === 'mismatch' ? 'text-danger' : sentido(f.tipo) === 'suma' ? 'text-success' : ''}`} style={{ padding: '2px 6px' }}>
                    {sentido(f.tipo) === 'suma' ? '+' : '-'}{formatoNumero(f.total)}
                    {f.estado_total === 'mismatch' && (
                      <FaExclamationTriangle className="ms-1 text-warning" title="El total declarado no coincide con la suma de ítems" />
                    )}
                  </td>
                  <td className="align-middle" style={{ padding: 2, minWidth: 150 }}>
                    <Form.Select
                      size="sm"
                      value={f.estado || ''}
                      onChange={(e) => cambiarEstado(f.id, e.target.value)}
                      aria-label="Estado de la factura"
                      style={f.estado ? { background: colorEstado[f.estado] || '#6c757d', color: '#fff', borderColor: 'transparent' } : undefined}
                    >
                      <option value="">Sin estado</option>
                      {estadosDocs.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </Form.Select>
                  </td>
                  <td className="align-middle" style={{ padding: 2 }}>
                    <button type="button" className="btn btn-warning btn-sm" style={BOTON_CUADRADO} title="Editar" onClick={() => { setEditando(f); setCreando(false); setExpandida(null); }}><FaEdit /></button>
                  </td>
                  <td className="align-middle" style={{ padding: 2 }}>
                    <button type="button" className="btn btn-danger btn-sm" style={BOTON_CUADRADO} title="Eliminar" onClick={() => eliminar(f.id)}><FaTrash /></button>
                  </td>
                </tr>
                {expandida === f.id && (f.items || []).length > 0 && (
                  <tr>
                    <td colSpan={11} className="bg-light" style={{ padding: '8px 16px' }}>
                      <table className="table table-bordered table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            {['#', 'Concepto', 'Contenedor', 'Booking', 'Semana', 'Mes', 'Divisa', 'Cantidad', 'V. unit.', 'Subtotal', 'Nivel', 'Tipo de costo'].map((h) => (
                              <th key={h} className="text-custom-small text-center" style={{ padding: 2 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {f.items.map((it, i) => (
                            <tr key={it.id || i}>
                              <td className="text-custom-small text-center">{i + 1}</td>
                              <td className="text-custom-small">{it.concepto || '-'}</td>
                              <td className="text-custom-small text-center">{it.id_contenedor || '-'}</td>
                              <td className="text-custom-small text-center">{it.booking || '-'}</td>
                              <td className="text-custom-small text-center">{it.semana || '-'}</td>
                              <td className="text-custom-small text-center">{it.mes || '-'}</td>
                              <td className="text-custom-small text-center">{it.divisa || 'COP'}</td>
                              <td className="text-custom-small text-end">{formatoNumero(it.cantidad)}</td>
                              <td className="text-custom-small text-end">{formatoNumero(it.valor_unitario)}</td>
                              <td className="text-custom-small text-end fw-bold">{formatoNumero((parseFloat(it.cantidad) || 0) * (parseFloat(it.valor_unitario) || 0))}</td>
                              <td className="text-custom-small text-center">{it.nivel_asociacion ? <Badge bg="primary" className="fw-normal">{it.nivel_asociacion}</Badge> : '-'}</td>
                              <td className="text-custom-small text-center">{it.tipo_costo ? <Badge bg="secondary" className="fw-normal">{it.tipo_costo}</Badge> : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="table-light fw-bold">
                <td colSpan={7} className="text-end text-muted">Balance total ({items.length} facturas filtradas):</td>
                <td className={`text-end ${neto >= 0 ? 'text-success' : 'text-danger'}`}>
                  {neto >= 0 ? '+' : ''}{formatoNumero(neto)}
                  <div className="fw-normal text-muted" style={{ fontSize: 10 }}>↑ {formatoNumero(totalSuma)} · ↓ {formatoNumero(totalResta)}</div>
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Paginacion setPagination={setPagina} pagination={pagina} total={items.length} limit={LIMITE} />

      <ManualFacturasModal show={verManual} onClose={() => setVerManual(false)} />

      <style>{'.factura-modal.modal-dialog { max-width: 96vw; width: 96vw; }'}</style>
      <Modal show={creando || Boolean(editando)} onHide={cerrarFormulario} centered dialogClassName="factura-modal" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="h6 mb-0">{editando ? 'Editar factura' : 'Nueva factura'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorGuardar && <Alert variant="danger" className="py-2 small">{errorGuardar}</Alert>}
          {(creando || editando) && (
            <FacturaForm
              initial={editando || null}
              proveedores={proveedores}
              tiposDocs={tiposDocs}
              tiposCosto={tiposCosto}
              onSave={guardar}
              onCancel={cerrarFormulario}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
