import React, { useCallback, useEffect, useState } from 'react';
import { Button, ButtonGroup, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { costosGet, formatoNumero } from './costosApi';

const NIVELES = [
  ['contenedor', 'Contenedor'],
  ['booking', 'Booking'],
  ['semana', 'Semana'],
  ['mes', 'Mes'],
  ['año', 'Año'],
];

// Costos logisticos > Facturas > Costo por cliente: costo acumulado de las facturas por cliente.
export default function CostoPorClienteTab() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [semana, setSemana] = useState('');
  const [concepto, setConcepto] = useState('');
  const [semanasSug, setSemanasSug] = useState([]);
  const [conceptosSug, setConceptosSug] = useState([]);
  const [filas, setFilas] = useState([]);
  const [sinTrm, setSinTrm] = useState(0);
  const [moneda, setMoneda] = useState('COP');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (desde) q.set('desde', desde);
      if (hasta) q.set('hasta', hasta);
      if (semana.trim()) q.set('semana', semana.trim());
      if (concepto.trim()) q.set('concepto', concepto.trim());
      const r = await costosGet(`/costo-por-cliente${q.toString() ? `?${q}` : ''}`);
      setFilas(r.filas || []);
      setSinTrm(r.itemsSinTrm || 0);
    } catch (e) {
      setError(e.message);
      setFilas([]);
    }
    setCargando(false);
  }, [desde, hasta, semana, concepto]);

  useEffect(() => {
    const t = setTimeout(cargar, 400);
    return () => clearTimeout(t);
  }, [cargar]);

  // Sugerencias para los filtros de semana y de ítem facturado.
  useEffect(() => {
    if (semana.length < 2) { setSemanasSug([]); return undefined; }
    const t = setTimeout(() => costosGet(`/semanas?q=${encodeURIComponent(semana)}`).then((d) => setSemanasSug(Array.isArray(d) ? d.slice(0, 12) : [])).catch(() => setSemanasSug([])), 250);
    return () => clearTimeout(t);
  }, [semana]);
  useEffect(() => {
    if (concepto.length < 2) { setConceptosSug([]); return undefined; }
    const t = setTimeout(() => costosGet(`/items-catalog?q=${encodeURIComponent(concepto)}`).then((d) => setConceptosSug(Array.isArray(d) ? d.slice(0, 12) : [])).catch(() => setConceptosSug([])), 250);
    return () => clearTimeout(t);
  }, [concepto]);

  const usd = moneda === 'USD';
  const valor = (f) => (usd ? f.totalUsd : f.total);
  const nivel = (f, k) => (usd ? f.nivelesUsd : f.niveles)?.[k];
  const dec = usd ? 2 : 0;
  const total = filas.reduce((s, f) => s + valor(f), 0);

  return (
    <div>
      <h2 className="mb-0">Costo acumulado por cliente</h2>
      <div className="line mt-2 mb-3" />

      <Row className="g-2 align-items-end mb-3">
        <Col xs={6} md="auto">
          <Form.Label className="small mb-0 text-muted">Facturas desde</Form.Label>
          <Form.Control size="sm" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </Col>
        <Col xs={6} md="auto">
          <Form.Label className="small mb-0 text-muted">Facturas hasta</Form.Label>
          <Form.Control size="sm" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </Col>
        <Col xs={6} md="auto">
          <Form.Label className="small mb-0 text-muted">Semana</Form.Label>
          <Form.Control size="sm" list="costo-cliente-semanas" placeholder="Ej: S43-2026" value={semana} onChange={(e) => setSemana(e.target.value)} />
          <datalist id="costo-cliente-semanas">{semanasSug.map((x) => <option key={x.consecutivo} value={x.consecutivo} />)}</datalist>
        </Col>
        <Col xs={6} md={3}>
          <Form.Label className="small mb-0 text-muted">Ítem facturado</Form.Label>
          <Form.Control size="sm" list="costo-cliente-items" placeholder="Concepto..." value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          <datalist id="costo-cliente-items">{conceptosSug.map((x) => <option key={x.id} value={x.nombre} />)}</datalist>
        </Col>
        <Col xs={12} md="auto">
          <Form.Label className="small mb-0 text-muted d-block">Ver en</Form.Label>
          <ButtonGroup size="sm">
            <Button variant={usd ? 'outline-primary' : 'primary'} onClick={() => setMoneda('COP')}>Pesos (COP)</Button>
            <Button variant={usd ? 'primary' : 'outline-primary'} onClick={() => setMoneda('USD')}>Dólares (USD)</Button>
          </ButtonGroup>
        </Col>
        <Col xs={12} md="auto">
          <Button size="sm" variant="outline-secondary" className="w-100" onClick={cargar} disabled={cargando}>
            {cargando ? <Spinner size="sm" animation="border" /> : 'Actualizar'}
          </Button>
        </Col>
      </Row>

      <p className="small text-muted">
        Cada ítem de factura se lleva a pesos (USD por la TRM de la fecha de la factura) o a dólares (pesos entre esa TRM); las notas crédito restan y se reparte
        en partes iguales entre los contenedores que cubre su nivel de asociación. Cada contenedor se asigna al cliente de su embarque.
        Lo que no se puede ubicar en ningún contenedor aparece como «Sin asignar». Con una semana filtrada se muestra solo la parte que le toca a los contenedores de esa semana; con un ítem, solo los costos de ese concepto.
      </p>

      {usd && (
        <p className="small text-muted">
          Los dólares se calculan con la TRM de la fecha de cada factura (los ítems facturados en USD se muestran tal cual).
          {sinTrm > 0 && <span className="text-warning"> {sinTrm} ítem(s) en pesos no tienen TRM para su fecha y no se incluyen en este total.</span>}
        </p>
      )}
      {error && <div className="alert alert-danger py-1 px-2 small">{error}</div>}

      <div className="table-responsive">
        <Table size="sm" bordered hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th className="text-end">Contenedores</th>
              {NIVELES.map(([k, n]) => <th key={k} className="text-end">{n}</th>)}
              <th className="text-end">Total ({moneda})</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.cliente}>
                <td className={f.cliente === 'Sin asignar' ? 'text-muted fst-italic' : 'fw-bold'}>{f.cliente}</td>
                <td className="text-end">{f.cliente === 'Sin asignar' ? '-' : f.contenedores}</td>
                {NIVELES.map(([k]) => <td key={k} className="text-end">{nivel(f, k) ? formatoNumero(nivel(f, k), dec) : '-'}</td>)}
                <td className="text-end fw-bold text-primary">{formatoNumero(valor(f), dec)}</td>
              </tr>
            ))}
            {!cargando && filas.length === 0 && (
              <tr><td colSpan={NIVELES.length + 3} className="text-center text-muted py-3">Sin costos para mostrar</td></tr>
            )}
          </tbody>
          {filas.length > 0 && (
            <tfoot>
              <tr className="table-light">
                <td colSpan={NIVELES.length + 2} className="text-end fw-bold">Total</td>
                <td className="text-end fw-bold text-primary">{formatoNumero(total, dec)}</td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
}
