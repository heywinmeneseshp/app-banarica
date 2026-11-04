import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Col, Dropdown, Form, Modal, Row } from 'react-bootstrap';
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

const TIPOS_FALLBACK = ['Factura', 'Nota Débito', 'Nota Crédito', 'Otro'];
const FILTROS_VACIOS = { nit_proveedor: '', tipo: '', estado: '', advertencia: '', numero_factura: '', concepto: '', semana: '', fecha_desde: '', fecha_hasta: '' };
// Circulo de color que representa el estado (gris vacio = sin estado).
function PuntoEstado({ color }) {
  return (
    <span
      style={{
        display: 'inline-block', width: 11, height: 11, borderRadius: '50%', verticalAlign: 'middle',
        background: color || 'transparent', border: `1.5px solid ${color || '#adb5bd'}`,
      }}
    />
  );
}

const BOTON_CUADRADO = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 20, width: 20, margin: 'auto', fontSize: 12 };

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
  'Cobrar a (tercero) y Motivo del cobro son opcionales: si escribe un tercero, el ítem queda en la pestaña Pendiente por cobrar (si el tercero no existe, se crea).',
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
  { key: 'tercero', label: 'Cobrar a (tercero)', required: false, example: 'Finca La Esperanza' },
  { key: 'motivo_cobro', label: 'Motivo del cobro', required: false, example: 'Error de la finca en el despacho' },
];

export default function ListadoFacturas({ proveedores, tiposDocs = [], estadosDocs = [], tiposCosto = [] }) {
  const [items, setItems] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [numInput, setNumInput] = useState('');
  const [conceptoInput, setConceptoInput] = useState('');
  const [semanaInput, setSemanaInput] = useState('');
  const [semanasSug, setSemanasSug] = useState([]);
  const [vista, setVista] = useState('factura');
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [expandida, setExpandida] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(30);
  const [estadoMasivo, setEstadoMasivo] = useState('');
  const [cambiandoMasivo, setCambiandoMasivo] = useState(false);
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

  useEffect(() => {
    if (semanaInput.length < 2) { setSemanasSug([]); return undefined; }
    const t = setTimeout(() => costosGet(`/semanas?q=${encodeURIComponent(semanaInput)}`)
      .then((d) => setSemanasSug(Array.isArray(d) ? d.slice(0, 12) : [])).catch(() => setSemanasSug([])), 250);
    return () => clearTimeout(t);
  }, [semanaInput]);

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

  // Completa booking y semana de los ítems con contenedor que no los tienen (solo si el dato es único).
  async function completarBookings() {
    if (!window.confirm('Se completará el booking y la semana de los ítems que tienen contenedor pero no los tienen. ¿Continuar?')) return;
    const r = await costosEnviar('POST', '/facturas-completar-bookings');
    setAlert({
      active: true,
      mensaje: r.ok ? `Se revisaron ${r.data.revisados} ítem(s) y se completaron ${r.data.actualizados}` : (r.error || 'No se pudo completar'),
      color: r.ok ? 'success' : 'danger',
      autoClose: true,
    });
    if (r.ok) cargar();
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

  // Cambia el estado actualizando solo esa fila en pantalla (sin recargar el listado).
  async function cambiarEstado(id, estado) {
    const anterior = items.find((f) => f.id === id)?.estado || '';
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, estado: estado || null } : f)));
    const r = await costosEnviar('PATCH', '/facturas', { id, _estadoOnly: true, estado: estado || null });
    if (!r.ok) {
      setItems((prev) => prev.map((f) => (f.id === id ? { ...f, estado: anterior || null } : f)));
      setAlert({ active: true, mensaje: r.error || 'No se pudo cambiar el estado', color: 'danger', autoClose: true });
    }
  }

  // Aplica un estado a todas las facturas seleccionadas, en lotes, sin recargar el listado.
  async function cambiarEstadoMasivo() {
    const ids = [...seleccion];
    if (!ids.length) return;
    const nombre = estadoMasivo || 'Sin estado';
    if (!window.confirm(`¿Cambiar el estado de ${ids.length} factura(s) a "${nombre}"?`)) return;
    setCambiandoMasivo(true);
    const fallidas = new Set();
    for (let i = 0; i < ids.length; i += 10) {
      // eslint-disable-next-line no-await-in-loop
      const rs = await Promise.all(ids.slice(i, i + 10).map((id) => costosEnviar('PATCH', '/facturas', { id, _estadoOnly: true, estado: estadoMasivo || null })));
      rs.forEach((r, k) => { if (!r.ok) fallidas.add(ids[i + k]); });
    }
    setItems((prev) => prev.map((f) => (seleccion.has(f.id) && !fallidas.has(f.id) ? { ...f, estado: estadoMasivo || null } : f)));
    setSeleccion(new Set(fallidas));
    setCambiandoMasivo(false);
    setAlert({
      active: true,
      mensaje: fallidas.size ? `Se actualizaron ${ids.length - fallidas.size} factura(s); ${fallidas.size} fallaron` : `Se actualizaron ${ids.length} factura(s) a "${nombre}"`,
      color: fallidas.size ? 'warning' : 'success',
      autoClose: true,
    });
  }

  const sentidoPorTipo = Object.fromEntries(tiposDocs.map((t) => [t.nombre, t.sentido]));
  const sentido = (tipo) => sentidoPorTipo[tipo] || 'resta';
  const colorEstado = Object.fromEntries(estadosDocs.map((e) => [e.nombre, e.color]));
  const tiposOpciones = tiposDocs.length ? tiposDocs : TIPOS_FALLBACK.map((n) => ({ nombre: n }));

  const filasPagina = items.slice((pagina - 1) * limite, pagina * limite);
  // Vista "una línea por ítem": cada ítem de cada factura filtrada es una fila.
  const lineas = items.flatMap((f) => (f.items || []).map((it) => ({ ...it, factura: f })));
  const lineasPagina = lineas.slice((pagina - 1) * limite, pagina * limite);
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

      {/* Acciones principales */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Button variant="success" size="sm" className="px-3 text-nowrap" type="button" onClick={() => { setCreando(true); setEditando(null); }}>
          <FaPlus className="me-1" /> Nueva factura
        </Button>
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
        <Button variant="outline-secondary" size="sm" className="px-3 text-nowrap" type="button" onClick={completarBookings}
          title="Completa el booking y la semana de los ítems que tienen contenedor pero les falta">
          Completar bookings
        </Button>
        <Button variant="outline-danger" size="sm" className="px-3 text-nowrap ms-auto" type="button" onClick={vaciarTodas}>
          <FaTrash className="me-1" /> Vaciar todas
        </Button>
      </div>

      {/* Filtros */}
      <div className="border rounded bg-light p-2 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} sm={6} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">N° de factura</Form.Label>
            <Form.Control
              size="sm"
              placeholder="Buscar + Enter"
              value={numInput}
              onChange={(e) => setNumInput(e.target.value)}
              onBlur={() => cambiarFiltro('numero_factura', numInput)}
              onKeyDown={(e) => e.key === 'Enter' && cambiarFiltro('numero_factura', numInput)}
            />
          </Col>
          <Col xs={12} sm={6} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">Ítem / concepto</Form.Label>
            <Form.Control
              size="sm"
              placeholder="Buscar + Enter"
              value={conceptoInput}
              onChange={(e) => setConceptoInput(e.target.value)}
              onBlur={() => cambiarFiltro('concepto', conceptoInput.trim())}
              onKeyDown={(e) => e.key === 'Enter' && cambiarFiltro('concepto', conceptoInput.trim())}
              aria-label="Filtrar por ítem"
            />
          </Col>
          <Col xs={12} sm={6} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">Semana</Form.Label>
            <Form.Control
              size="sm"
              list="listado-semanas"
              placeholder="Ej. S43-2026 + Enter"
              value={semanaInput}
              onChange={(e) => setSemanaInput(e.target.value)}
              onBlur={() => cambiarFiltro('semana', semanaInput.trim())}
              onKeyDown={(e) => e.key === 'Enter' && cambiarFiltro('semana', semanaInput.trim())}
              aria-label="Filtrar por semana"
            />
            <datalist id="listado-semanas">{semanasSug.map((x) => <option key={x.consecutivo} value={x.consecutivo} />)}</datalist>
          </Col>
          <Col xs={12} sm={6} lg={3} xl={3}>
            <Form.Label className="small text-muted mb-0">Proveedor</Form.Label>
            <Form.Select size="sm" value={filtros.nit_proveedor} onChange={(e) => cambiarFiltro('nit_proveedor', e.target.value)} aria-label="Proveedor">
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => <option key={p.nit} value={p.nit}>{p.nombre}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} sm={4} lg={3} xl={3}>
            <Form.Label className="small text-muted mb-0">Tipo</Form.Label>
            <Form.Select size="sm" value={filtros.tipo} onChange={(e) => cambiarFiltro('tipo', e.target.value)} aria-label="Tipo">
              <option value="">Todos los tipos</option>
              {tiposOpciones.map((t) => <option key={t.nombre} value={t.nombre}>{t.nombre}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} sm={4} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">Estado</Form.Label>
            <Form.Select size="sm" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)} aria-label="Estado">
              <option value="">Todos los estados</option>
              <option value="__sin_estado__">Sin estado</option>
              {estadosDocs.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </Form.Select>
          </Col>
          <Col xs={12} sm={4} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">Advertencia</Form.Label>
            <Form.Select size="sm" value={filtros.advertencia} onChange={(e) => cambiarFiltro('advertencia', e.target.value)} aria-label="Advertencia">
              <option value="">Todas</option>
              <option value="mismatch">Con advertencia de total</option>
            </Form.Select>
          </Col>
          <Col xs={6} sm={4} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">Fecha desde</Form.Label>
            <Form.Control size="sm" type="date" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro('fecha_desde', e.target.value)} aria-label="Desde" />
          </Col>
          <Col xs={6} sm={4} lg={3} xl={2}>
            <Form.Label className="small text-muted mb-0">Fecha hasta</Form.Label>
            <Form.Control size="sm" type="date" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro('fecha_hasta', e.target.value)} aria-label="Hasta" />
          </Col>
          {hayFiltros && (
            <Col xs="auto">
              <Button variant="outline-secondary" size="sm" type="button" onClick={() => { setNumInput(''); setConceptoInput(''); setSemanaInput(''); setFiltros(FILTROS_VACIOS); }}>
                <FaTimes className="me-1" /> Limpiar filtros
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* Vista y acciones sobre la selección */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <span className="small text-muted">Ver:</span>
        <ButtonGroup size="sm">
          <Button variant={vista === 'factura' ? 'primary' : 'outline-primary'} onClick={() => { setVista('factura'); setPagina(1); }}>Por factura</Button>
          <Button variant={vista === 'item' ? 'primary' : 'outline-primary'} onClick={() => { setVista('item'); setPagina(1); }}>Línea por ítem</Button>
        </ButtonGroup>
        {vista === 'item' && <span className="small text-muted">{lineas.length} ítem(s) en {items.length} factura(s)</span>}
        <div className="d-flex align-items-center gap-1 small text-muted">
          <span>Filas por página</span>
          <Form.Select size="sm" style={{ width: 80 }} value={limite} aria-label="Filas por página"
            onChange={(e) => { setLimite(Number(e.target.value)); setPagina(1); }}>
            {[30, 50, 100, 200, 500, 1000].map((n) => <option key={n} value={n}>{n}</option>)}
          </Form.Select>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 ms-lg-auto">
          <span className="small text-muted">{seleccion.size} seleccionada(s)</span>
          <Button variant="outline-primary" size="sm" className="text-nowrap" type="button" disabled={items.length === 0}
            onClick={() => setSeleccion(new Set(items.map((f) => f.id)))}>
            Seleccionar las {items.length} filtradas
          </Button>
          <div className="input-group input-group-sm" style={{ width: 'auto' }}>
            <Form.Select size="sm" value={estadoMasivo} onChange={(e) => setEstadoMasivo(e.target.value)} aria-label="Estado a aplicar" style={{ maxWidth: 190 }}>
              <option value="">Sin estado</option>
              {estadosDocs.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </Form.Select>
            <Button variant="primary" size="sm" className="text-nowrap" type="button" disabled={seleccion.size === 0 || cambiandoMasivo} onClick={cambiarEstadoMasivo}>
              {cambiandoMasivo ? 'Aplicando...' : 'Aplicar estado'}
            </Button>
          </div>
          <Button variant="outline-danger" size="sm" className="text-nowrap" type="button" disabled={seleccion.size === 0} onClick={eliminarSeleccion}>
            <FaTrash className="me-1" /> Eliminar seleccionadas
          </Button>
        </div>
      </div>

      {vista === 'item' && (
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover text-nowrap">
            <thead>
              <tr>
                {['Fecha', 'Tipo', 'N° factura', 'Proveedor', 'Concepto', 'Contenedor', 'Booking', 'Semana', 'Mes', 'Cód. cliente', 'Divisa', 'Cantidad', 'V. unit.', 'Subtotal', 'Nivel', 'Tipo de costo', 'Cobrar a', 'Editar'].map((h) => (
                  <th key={h} className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan={18} className="text-center py-4">Cargando...</td></tr>}
              {!cargando && lineasPagina.length === 0 && <tr><td colSpan={18} className="text-center py-4 text-muted">Sin ítems para mostrar</td></tr>}
              {!cargando && lineasPagina.map((it) => (
                <tr key={it.id}>
                  <td className="text-custom-small text-center">{it.factura.fecha || '—'}</td>
                  <td className="text-custom-small text-center">
                    <Badge bg={sentido(it.factura.tipo) === 'suma' ? 'success' : 'danger'} className="fw-normal">{it.factura.tipo || '—'}</Badge>
                  </td>
                  <td className="text-custom-small text-center">{it.factura.numero_factura || '—'}</td>
                  <td className="text-custom-small text-center">{it.factura.proveedor_nombre || it.factura.nit_proveedor || '—'}</td>
                  <td className="text-custom-small">{it.concepto || '-'}</td>
                  <td className="text-custom-small text-center">{it.id_contenedor || '-'}</td>
                  <td className="text-custom-small text-center">{it.booking || '-'}</td>
                  <td className="text-custom-small text-center">{it.semana || '-'}</td>
                  <td className="text-custom-small text-center">{it.mes || '-'}</td>
                  <td className="text-custom-small text-center" title={it.cliente_nombre || ''}>{it.cliente || '-'}</td>
                  <td className="text-custom-small text-center">{it.divisa || 'COP'}</td>
                  <td className="text-custom-small text-end">{formatoNumero(it.cantidad)}</td>
                  <td className="text-custom-small text-end">{formatoNumero(it.valor_unitario)}</td>
                  <td className="text-custom-small text-end fw-bold">{formatoNumero((parseFloat(it.cantidad) || 0) * (parseFloat(it.valor_unitario) || 0))}</td>
                  <td className="text-custom-small text-center">{it.nivel_asociacion ? <Badge bg="primary" className="fw-normal">{it.nivel_asociacion}</Badge> : '-'}</td>
                  <td className="text-custom-small text-center">{it.tipo_costo ? <Badge bg="secondary" className="fw-normal">{it.tipo_costo}</Badge> : '-'}</td>
                  <td className="text-custom-small text-center">
                    {it.tercero_nombre ? <Badge bg="warning" text="dark" className="fw-normal" title={it.cobro_motivo || ''}>{it.tercero_nombre} · {it.cobro_estado}</Badge> : '-'}
                  </td>
                  <td className="align-middle text-center" style={{ padding: 2 }}>
                    <button type="button" className="btn btn-link btn-sm p-0 border-0 text-warning" style={BOTON_CUADRADO} title="Editar la factura" onClick={() => { setEditando(it.factura); setCreando(false); setExpandida(null); }}><FaEdit /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-responsive" hidden={vista === 'item'}>
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
                  <td className="align-middle text-start" style={{ padding: 2 }}>
                    <Dropdown align="end">
                      <Dropdown.Toggle
                        as="button"
                        type="button"
                        className="btn btn-link p-0 border-0 shadow-none no-caret"
                        title={f.estado || 'Sin estado'}
                        aria-label={`Estado: ${f.estado || 'Sin estado'}`}
                      >
                        <PuntoEstado color={f.estado ? (colorEstado[f.estado] || '#6c757d') : null} />
                        <span className="ms-1 text-custom-small text-body text-nowrap">{f.estado || 'Sin estado'}</span>
                      </Dropdown.Toggle>
                      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                        <Dropdown.Item active={!f.estado} onClick={() => cambiarEstado(f.id, '')}><PuntoEstado color={null} /> Sin estado</Dropdown.Item>
                        {estadosDocs.map((e) => (
                          <Dropdown.Item key={e.id} active={f.estado === e.nombre} onClick={() => cambiarEstado(f.id, e.nombre)}>
                            <PuntoEstado color={e.color} /> {e.nombre}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                  <td className="align-middle" style={{ padding: 2 }}>
                    <button type="button" className="btn btn-link btn-sm p-0 border-0 text-warning" style={BOTON_CUADRADO} title="Editar" onClick={() => { setEditando(f); setCreando(false); setExpandida(null); }}><FaEdit /></button>
                  </td>
                  <td className="align-middle" style={{ padding: 2 }}>
                    <button type="button" className="btn btn-link btn-sm p-0 border-0 text-danger" style={BOTON_CUADRADO} title="Eliminar" onClick={() => eliminar(f.id)}><FaTrash /></button>
                  </td>
                </tr>
                {expandida === f.id && (f.items || []).length > 0 && (
                  <tr>
                    <td colSpan={11} className="bg-light" style={{ padding: '8px 16px' }}>
                      <table className="table table-bordered table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            {['#', 'Concepto', 'Contenedor', 'Booking', 'Semana', 'Mes', 'Divisa', 'Cantidad', 'V. unit.', 'Subtotal', 'Nivel', 'Tipo de costo', 'Cobrar a'].map((h) => (
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
                              <td className="text-custom-small text-center">
                                {it.tercero_nombre ? <Badge bg="warning" text="dark" className="fw-normal" title={it.cobro_motivo || ''}>{it.tercero_nombre} · {it.cobro_estado}</Badge> : '-'}
                              </td>
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

      <Paginacion setPagination={setPagina} pagination={pagina} total={vista === 'item' ? lineas.length : items.length} limit={limite} />

      <ManualFacturasModal show={verManual} onClose={() => setVerManual(false)} />

      <style>{'.factura-modal.modal-dialog { max-width: 96vw; width: 96vw; } .dropdown-toggle.no-caret::after { display: none; }'}</style>
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
