import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
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

      <Row className="g-2 mb-3">
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
