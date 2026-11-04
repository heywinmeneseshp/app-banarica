import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
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
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (desde) q.set('desde', desde);
      if (hasta) q.set('hasta', hasta);
      setFilas(await costosGet(`/costo-por-cliente${q.toString() ? `?${q}` : ''}`));
    } catch (e) {
      setError(e.message);
      setFilas([]);
    }
    setCargando(false);
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const total = filas.reduce((s, f) => s + f.total, 0);

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
        <Col xs={12} md="auto">
          <Button size="sm" variant="outline-secondary" className="w-100" onClick={cargar} disabled={cargando}>
            {cargando ? <Spinner size="sm" animation="border" /> : 'Actualizar'}
          </Button>
        </Col>
      </Row>

      <p className="small text-muted">
        Cada ítem de factura se pasa a COP (USD por la TRM de la fecha de la factura; las notas crédito restan) y se reparte
        en partes iguales entre los contenedores que cubre su nivel de asociación. Cada contenedor se asigna al cliente de su embarque.
        Lo que no se puede ubicar en ningún contenedor aparece como «Sin asignar».
      </p>

      {error && <div className="alert alert-danger py-1 px-2 small">{error}</div>}

      <div className="table-responsive">
        <Table size="sm" bordered hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th className="text-end">Contenedores</th>
              {NIVELES.map(([k, n]) => <th key={k} className="text-end">{n}</th>)}
              <th className="text-end">Total (COP)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.cliente}>
                <td className={f.cliente === 'Sin asignar' ? 'text-muted fst-italic' : 'fw-bold'}>{f.cliente}</td>
                <td className="text-end">{f.cliente === 'Sin asignar' ? '-' : f.contenedores}</td>
                {NIVELES.map(([k]) => <td key={k} className="text-end">{f.niveles[k] ? formatoNumero(f.niveles[k], 0) : '-'}</td>)}
                <td className="text-end fw-bold text-primary">{formatoNumero(f.total, 0)}</td>
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
                <td className="text-end fw-bold text-primary">{formatoNumero(total, 0)}</td>
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
}
