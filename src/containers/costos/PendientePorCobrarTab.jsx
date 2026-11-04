import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, ButtonGroup, Col, Form, Nav, Row, Spinner, Table } from 'react-bootstrap';
import Paginacion from '@components/shared/Tablas/Paginacion';
import useAlert from '@hooks/useAlert';
import Alertas from '@components/shared/Alertas';
import { costosEnviar, costosGet, formatoNumero } from './costosApi';
import { EstadosCobroTab, TercerosTab } from './CatalogosCostos';


// Costos logisticos > Facturas > Pendiente por cobrar: seguimiento de los items que se le van a
// cobrar a un tercero (error de un cliente, finca, proveedor...), con su estado y fechas.
export default function PendientePorCobrarTab() {
  const [seccion, setSeccion] = useState('cobros');
  const [filas, setFilas] = useState([]);
  const [sinTrm, setSinTrm] = useState(0);
  const [terceros, setTerceros] = useState([]);
  const [estados, setEstados] = useState([]);
  const [filtros, setFiltros] = useState({ tercero: '', estado: '', semana: '', desde: '', hasta: '' });
  const [moneda, setMoneda] = useState('COP');
  const [cargando, setCargando] = useState(false);
  const [seleccion, setSeleccion] = useState(new Set());
  const [estadoMasivo, setEstadoMasivo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(30);
  const { alert, setAlert, toogleAlert } = useAlert();

  const cargarCatalogos = useCallback(() => {
    costosGet('/terceros').then(setTerceros).catch(() => setTerceros([]));
    costosGet('/estados-cobro').then((e) => { setEstados(e); setEstadoMasivo((p) => p || e[0]?.nombre || ''); }).catch(() => setEstados([]));
  }, []);
  useEffect(() => { cargarCatalogos(); }, [cargarCatalogos, seccion]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const q = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) q.set(k, v); });
      const r = await costosGet(`/pendiente-por-cobrar?${q}`);
      setFilas(r.filas || []);
      setSinTrm(r.itemsSinTrm || 0);
    } catch (e) {
      setAlert({ active: true, mensaje: e.message, color: 'danger', autoClose: true });
      setFilas([]);
    }
    setCargando(false);
  }, [filtros, setAlert]);
  useEffect(() => { if (seccion === 'cobros') { cargar(); setPagina(1); } }, [cargar, seccion]);

  const usd = moneda === 'USD';
  const monto = (f) => (usd ? f.monto_usd : f.monto_cop);
  const colorEstado = useMemo(() => Object.fromEntries(estados.map((e) => [e.nombre, e.color])), [estados]);
  const cambiarFiltro = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));

  // Totales por tercero (de lo que se ve con los filtros actuales).
  const porTercero = useMemo(() => {
    const m = new Map();
    filas.forEach((f) => {
      const r = m.get(f.tercero) || { tercero: f.tercero, n: 0, total: 0, pendiente: 0 };
      const v = usd ? f.monto_usd : f.monto_cop;
      r.n += 1;
      r.total += v;
      if (f.estado === 'Pendiente por cobrar') r.pendiente += v;
      m.set(f.tercero, r);
    });
    return [...m.values()].sort((a, b) => b.pendiente - a.pendiente || b.total - a.total);
  }, [filas, usd]);
  const total = filas.reduce((s, f) => s + monto(f), 0);
  const dec = usd ? 2 : 0;

  // Actualiza solo la fila afectada (sin recargar el listado).
  async function actualizar(fila, cambios) {
    const anterior = { ...fila };
    setFilas((prev) => prev.map((f) => (f.id === fila.id ? { ...f, ...cambios } : f)));
    const r = await costosEnviar('PATCH', '/pendiente-por-cobrar', { id: fila.id, ...cambios });
    if (!r.ok) {
      setFilas((prev) => prev.map((f) => (f.id === fila.id ? anterior : f)));
      setAlert({ active: true, mensaje: r.error || 'No se pudo guardar', color: 'danger', autoClose: true });
    }
  }

  async function aplicarMasivo() {
    const ids = [...seleccion];
    if (!ids.length || !estadoMasivo) return;
    if (!window.confirm(`¿Cambiar el estado de ${ids.length} cobro(s) a "${estadoMasivo}"?`)) return;
    const r = await costosEnviar('PATCH', '/pendiente-por-cobrar', { ids, estado: estadoMasivo });
    if (!r.ok) {
      setAlert({ active: true, mensaje: r.error || 'No se pudo cambiar', color: 'danger', autoClose: true });
      return;
    }
    setFilas((prev) => prev.map((f) => (seleccion.has(f.id) ? { ...f, estado: estadoMasivo } : f)));
    setSeleccion(new Set());
    setAlert({ active: true, mensaje: `Se actualizaron ${ids.length} cobro(s)`, color: 'success', autoClose: true });
  }

  const filasPagina = filas.slice((pagina - 1) * limite, pagina * limite);
  const paginaCompleta = filasPagina.length > 0 && filasPagina.every((f) => seleccion.has(f.id));
  const alternar = (id) => setSeleccion((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const alternarPagina = () => setSeleccion((p) => {
    const n = new Set(p);
    filasPagina.forEach((f) => (paginaCompleta ? n.delete(f.id) : n.add(f.id)));
    return n;
  });

  return (
    <div>
      <Alertas alert={alert} handleClose={toogleAlert} />
      <h2 className="mb-0">Pendiente por cobrar</h2>
      <div className="line mt-2 mb-3" />

      <Nav variant="pills" activeKey={seccion} onSelect={(k) => setSeccion(k)} className="mb-3">
        <Nav.Item><Nav.Link eventKey="cobros">Cobros a terceros</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="terceros">Terceros</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="estados">Estados de cobro</Nav.Link></Nav.Item>
      </Nav>

      {seccion === 'terceros' && <TercerosTab onCambio={cargarCatalogos} />}
      {seccion === 'estados' && <EstadosCobroTab onCambio={cargarCatalogos} />}

      {seccion === 'cobros' && (
        <>
          <p className="small text-muted">
            Aquí quedan los ítems de factura que se marcan con «Cobrar a» al crear o editar una factura: lo que se pagó
            por un error de otra persona y hay que cobrarle. Estos ítems no se reparten en «Costo por cliente».
          </p>

          <Row className="g-2 align-items-end mb-2">
            <Col xs={12} md={3}>
              <Form.Label className="small mb-0 text-muted">Tercero</Form.Label>
              <Form.Select size="sm" value={filtros.tercero} onChange={(e) => cambiarFiltro('tercero', e.target.value)}>
                <option value="">Todos</option>
                {terceros.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small mb-0 text-muted">Estado</Form.Label>
              <Form.Select size="sm" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                <option value="">Todos</option>
                {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small mb-0 text-muted">Semana</Form.Label>
              <Form.Control size="sm" placeholder="S43-2026" value={filtros.semana} onChange={(e) => cambiarFiltro('semana', e.target.value.trim())} />
            </Col>
            <Col xs={6} md="auto">
              <Form.Label className="small mb-0 text-muted">Facturas desde</Form.Label>
              <Form.Control size="sm" type="date" value={filtros.desde} onChange={(e) => cambiarFiltro('desde', e.target.value)} />
            </Col>
            <Col xs={6} md="auto">
              <Form.Label className="small mb-0 text-muted">Hasta</Form.Label>
              <Form.Control size="sm" type="date" value={filtros.hasta} onChange={(e) => cambiarFiltro('hasta', e.target.value)} />
            </Col>
            <Col xs={12} md="auto">
              <Form.Label className="small mb-0 text-muted d-block">Ver en</Form.Label>
              <ButtonGroup size="sm">
                <Button variant={usd ? 'outline-primary' : 'primary'} onClick={() => setMoneda('COP')}>COP</Button>
                <Button variant={usd ? 'primary' : 'outline-primary'} onClick={() => setMoneda('USD')}>USD</Button>
              </ButtonGroup>
            </Col>
          </Row>

          <Row className="g-2 align-items-center mb-3">
            <Col xs="auto">
              <div className="input-group input-group-sm">
                <Form.Select size="sm" value={estadoMasivo} onChange={(e) => setEstadoMasivo(e.target.value)} aria-label="Estado a aplicar">
                  {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                </Form.Select>
                <Button variant="primary" size="sm" disabled={seleccion.size === 0} onClick={aplicarMasivo}>
                  Aplicar a {seleccion.size} seleccionado(s)
                </Button>
              </div>
            </Col>
            <Col xs="auto">
              <Button variant="outline-primary" size="sm" disabled={!filas.length} onClick={() => setSeleccion(new Set(filas.map((f) => f.id)))}>
                Seleccionar los {filas.length} filtrados
              </Button>
            </Col>
            <Col xs="auto">
              <div className="d-flex align-items-center gap-1 small text-muted">
          <span>Filas por página</span>
          <Form.Select size="sm" style={{ width: 80 }} value={limite} aria-label="Filas por página"
            onChange={(e) => { setLimite(Number(e.target.value)); setPagina(1); }}>
            {[30, 50, 100, 200, 500, 1000].map((n) => <option key={n} value={n}>{n}</option>)}
          </Form.Select>
        </div>
            </Col>
            {cargando && <Col xs="auto"><Spinner size="sm" animation="border" /></Col>}
          </Row>

          {usd && sinTrm > 0 && (
            <p className="small text-warning">{sinTrm} ítem(s) en pesos no tienen TRM para su fecha y no suman en dólares.</p>
          )}

          {porTercero.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              {porTercero.map((t) => (
                <div key={t.tercero} className="border rounded px-2 py-1 small bg-light">
                  <strong>{t.tercero}</strong> · {t.n} cobro(s)<br />
                  Total {formatoNumero(t.total, dec)} · Por cobrar {formatoNumero(t.pendiente, dec)}
                </div>
              ))}
            </div>
          )}

          <div className="table-responsive">
            <Table size="sm" bordered hover className="align-middle text-nowrap">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 32 }}>
                    <Form.Check type="checkbox" checked={paginaCompleta} onChange={alternarPagina} aria-label="Seleccionar página" />
                  </th>
                  {['Tercero', 'Observación', 'Factura', 'Fecha', 'Proveedor', 'Concepto', 'Semana', `Valor (${moneda})`, 'Estado', 'F. cobro', 'F. pago'].map((h) => (
                    <th key={h} className="text-custom-small text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!cargando && filas.length === 0 && <tr><td colSpan={12} className="text-center text-muted py-3">Sin cobros pendientes</td></tr>}
                {filasPagina.map((f) => (
                  <tr key={f.id}>
                    <td><Form.Check type="checkbox" checked={seleccion.has(f.id)} onChange={() => alternar(f.id)} aria-label="Seleccionar" /></td>
                    <td className="fw-bold text-center">{f.tercero} <Badge bg="secondary" className="fw-normal">{f.tercero_tipo}</Badge></td>
                    <td style={{ minWidth: 200 }}>
                      <Form.Control
                        size="sm"
                        defaultValue={f.motivo || ''}
                        placeholder="Observación..."
                        className="text-center"
                        onBlur={(e) => { if (e.target.value !== (f.motivo || '')) actualizar(f, { motivo: e.target.value }); }}
                      />
                    </td>
                    <td className="text-center">{f.numero_factura || '—'}</td>
                    <td className="text-center">{f.fecha || '—'}</td>
                    <td className="text-center">{f.proveedor || '—'}</td>
                    <td className="text-center">{f.concepto || '—'}</td>
                    <td className="text-center">{f.semana || '—'}</td>
                    <td className="text-center fw-bold text-primary">{formatoNumero(monto(f), dec)}</td>
                    <td className="text-center" style={{ minWidth: 160 }}>
                      <Form.Select
                        size="sm"
                        value={f.estado}
                        onChange={(e) => actualizar(f, { estado: e.target.value })}
                        style={{ background: colorEstado[f.estado] || '#6c757d', color: '#fff', borderColor: 'transparent' }}
                      >
                        {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                        {!colorEstado[f.estado] && <option value={f.estado}>{f.estado}</option>}
                      </Form.Select>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <Form.Control size="sm" type="date" className="text-center" value={f.fecha_cobro || ''} onChange={(e) => actualizar(f, { fecha_cobro: e.target.value })} />
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <Form.Control size="sm" type="date" className="text-center" value={f.fecha_pago || ''} onChange={(e) => actualizar(f, { fecha_pago: e.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
              {filas.length > 0 && (
                <tfoot>
                  <tr className="table-light">
                    <td colSpan={9} className="text-end fw-bold">Total ({filas.length} cobros)</td>
                    <td className="text-end fw-bold text-primary">{formatoNumero(total, dec)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
          <Paginacion setPagination={setPagina} pagination={pagina} total={filas.length} limit={limite} />
        </>
      )}
    </div>
  );
}
