import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { FaSyncAlt, FaTrash } from 'react-icons/fa';
import Paginacion from '@components/shared/Tablas/Paginacion';
import Alertas from '@components/shared/Alertas';
import useAlert from '@hooks/useAlert';
import { costosEnviar, costosGet, formatoNumero } from './costosApi';
import CargaMasivaCostos from './CargaMasivaCostos';

const LIMITE = 30;

export default function TrmTab({ onCambio }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await costosGet('/trm');
      setFilas(Array.isArray(data) ? data : []);
      setPagina(1);
    } catch (e) {
      setAlert({ active: true, mensaje: e.message, color: 'danger', autoClose: true });
    }
    setCargando(false);
  }, [setAlert]);

  useEffect(() => { cargar(); }, [cargar]);

  // Trae la TRM oficial (Banco de la Republica / Superfinanciera, datos abiertos).
  async function sincronizar() {
    if (desde && hasta && desde > hasta) {
      setAlert({ active: true, mensaje: 'La fecha inicial no puede ser mayor que la final', color: 'warning', autoClose: true });
      return;
    }
    setSincronizando(true);
    const r = await costosEnviar('POST', '/trm/sincronizar', { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) });
    setSincronizando(false);
    if (!r.ok) {
      setAlert({ active: true, mensaje: r.error || 'No fue posible actualizar la TRM', color: 'danger', autoClose: false });
      return;
    }
    setAlert({
      active: true,
      mensaje: `TRM actualizada: ${r.data.guardados} registro(s) desde ${r.data.desde}${r.data.hasta ? ` hasta ${r.data.hasta}` : ''}${r.data.ultimaFecha ? `. Última: ${r.data.ultimaFecha} = ${formatoNumero(r.data.ultimoValor, 2)}` : ''}`,
      color: 'success',
      autoClose: true,
    });
    cargar();
    onCambio?.();
  }

  async function eliminarTodas() {
    if (!window.confirm('¿Eliminar todas las TRM registradas?')) return;
    const r = await costosEnviar('DELETE', '/trm');
    if (!r.ok) { setAlert({ active: true, mensaje: r.error, color: 'danger', autoClose: true }); return; }
    setAlert({ active: true, mensaje: 'TRM eliminadas', color: 'success', autoClose: true });
    cargar();
    onCambio?.();
  }

  const visibles = filas.slice((pagina - 1) * LIMITE, pagina * LIMITE);

  return (
    <div className="container-fluid">
      <Alertas alert={alert} handleClose={toogleAlert} />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">TRM (USD → COP)</h2>
          <div className="line mt-2" />
        </div>
        <Badge bg="secondary" pill className="fs-6">{filas.length} registro(s)</Badge>
      </div>

      <Row className="g-2 align-items-end mb-2">
        <Col xs={6} md="auto">
          <Form.Label className="small mb-0 text-muted">Desde (opcional)</Form.Label>
          <Form.Control size="sm" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Traer la TRM desde" />
        </Col>
        <Col xs={6} md="auto">
          <Form.Label className="small mb-0 text-muted">Hasta (opcional)</Form.Label>
          <Form.Control size="sm" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Traer la TRM hasta" />
        </Col>
        <Col xs="auto">
          <Button variant="success" size="sm" className="px-3 text-nowrap" type="button" disabled={sincronizando} onClick={sincronizar}>
            <FaSyncAlt className="me-1" /> {sincronizando ? 'Actualizando...' : 'Actualizar desde el Banco de la República'}
          </Button>
        </Col>
        <Col xs="auto">
          <CargaMasivaCostos
            apiUrl="/trm-bulk"
            templateName="plantilla_trm"
            notas={['Fecha y TRM USD son obligatorias.', 'Si ya existe una TRM para esa fecha, se reemplaza por el valor nuevo.', 'Un ítem en USD usa la TRM de la fecha de su factura o, si no hay, la más reciente anterior.']}
            onDone={() => { cargar(); onCambio?.(); }}
            columns={[
              { key: 'fecha', label: 'Fecha', required: true, example: '2026-01-07' },
              { key: 'valor', label: 'TRM USD', required: true, example: '4200.50' },
            ]}
          />
        </Col>
        {filas.length > 0 && (
          <Col xs="auto">
            <Button variant="danger" size="sm" className="px-3 text-nowrap" type="button" onClick={eliminarTodas}>
              <FaTrash className="me-1" /> Eliminar todas
            </Button>
          </Col>
        )}
      </Row>

      <p className="small text-muted mb-3">
        La TRM oficial (Banco de la República / Superfinanciera) se actualiza sola, una vez al día, la primera vez que se abre el módulo de Facturas. Sin fechas, el botón trae lo que falte
        desde la última TRM guardada; con un rango (Desde y Hasta) trae esos días y reemplaza los valores de las fechas que ya existan.
        Un fin de semana o festivo usa la TRM del último día hábil.
      </p>

      <div className="table-responsive" style={{ maxWidth: 420 }}>
        <table className="table table-bordered table-sm table-hover">
          <thead>
            <tr>
              <th className="text-custom-small text-center align-middle" style={{ padding: 2 }}>Fecha</th>
              <th className="text-custom-small text-center align-middle" style={{ padding: 2 }}>TRM USD (COP)</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={2} className="text-center py-4">Cargando...</td></tr>}
            {!cargando && visibles.length === 0 && (
              <tr><td colSpan={2} className="text-center py-4 text-muted">Sin TRM registradas: importe un archivo</td></tr>
            )}
            {!cargando && visibles.map((f) => (
              <tr key={f.fecha}>
                <td className="text-custom-small text-center align-middle" style={{ padding: 2 }}>{f.fecha}</td>
                <td className="text-custom-small text-center align-middle fw-semibold" style={{ padding: 2 }}>{formatoNumero(f.valor, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion setPagination={setPagina} pagination={pagina} total={filas.length} limit={LIMITE} />
    </div>
  );
}
