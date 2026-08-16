import React, { useEffect, useState } from 'react';
import { Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { historialListado, paginarHistorialListado } from '@services/api/listado';

const ACCION_BADGE = {
  creado: 'success',
  editado: 'warning',
  eliminado: 'danger',
  restaurado: 'info',
};

const CAMPOS_A_MOSTRAR = [
  'fecha', 'id_lugar_de_llenado', 'id_producto', 'cajas_unidades',
  'transbordado', 'habilitado',
];

function formatFechaHora(iso) {
  if (!iso) return '';
  return String(iso).replace('T', ' ').replace(/-05:00$/, '');
}

function DiferenciasCampos({ antes, despues }) {
  if (!antes && !despues) return null;

  const campos = CAMPOS_A_MOSTRAR.filter((campo) => {
    const valorAntes = antes?.[campo] ?? '';
    const valorDespues = despues?.[campo] ?? '';
    return !antes || !despues || String(valorAntes) !== String(valorDespues);
  });

  if (campos.length === 0) return <span className="text-muted small">Sin cambios en los campos principales.</span>;

  return (
    <Table size="sm" borderless className="mb-0 small">
      <thead>
        <tr className="text-muted">
          <th>Campo</th>
          <th>Antes</th>
          <th>Después</th>
        </tr>
      </thead>
      <tbody>
        {campos.map((campo) => (
          <tr key={campo}>
            <td className="fw-semibold">{campo}</td>
            <td className="text-danger">{antes ? String(antes[campo] ?? '—') : '—'}</td>
            <td className="text-success">{despues ? String(despues[campo] ?? '—') : '—'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function TimelineItem({ item }) {
  return (
    <div className="border rounded p-3 mb-2">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
        <Badge bg={ACCION_BADGE[item.accion] || 'secondary'} className="text-uppercase">
          {item.accion}
        </Badge>
        <span className="fw-semibold">{item.usuario || 'Usuario desconocido'}</span>
        {item.contenedor && <span className="text-muted small">· Contenedor: {item.contenedor}</span>}
      </div>
      <div className="text-muted small mb-2">
        Creado: {formatFechaHora(item.creado_en)} (hora Bogotá)
        {item.actualizado_en && item.actualizado_en !== item.creado_en && (
          <> · Actualizado: {formatFechaHora(item.actualizado_en)} (hora Bogotá)</>
        )}
      </div>
      <DiferenciasCampos antes={item.datos_anteriores} despues={item.datos_nuevos} />
    </div>
  );
}

export default function ListadoHistorialModal({ show, onClose, listadoId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros de la vista general (solo aplican cuando no hay un listadoId puntual)
  const [filtros, setFiltros] = useState({ usuario: '', contenedor: '', accion: '', fechaInicio: '', fechaFin: '' });
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const esGeneral = !listadoId;

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      if (listadoId) {
        const res = await historialListado(listadoId);
        setItems(res?.data || []);
      } else {
        const res = await paginarHistorialListado(pagination, limit, filtros);
        setItems(res?.data || []);
        setTotal(res?.total || 0);
      }
    } catch (err) {
      setError(err.message || 'No fue posible cargar el historial.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!show) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, listadoId, pagination]);

  const buscarGeneral = () => {
    setPagination(1);
    cargar();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title className="h6 mb-0">
          {esGeneral ? 'Historial general del Listado' : `Historial de la línea #${listadoId}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {esGeneral && (
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-4">
              <Form.Control
                size="sm"
                placeholder="Usuario"
                value={filtros.usuario}
                onChange={(e) => setFiltros((prev) => ({ ...prev, usuario: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-4">
              <Form.Control
                size="sm"
                placeholder="Contenedor"
                value={filtros.contenedor}
                onChange={(e) => setFiltros((prev) => ({ ...prev, contenedor: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-4">
              <Form.Select
                size="sm"
                value={filtros.accion}
                onChange={(e) => setFiltros((prev) => ({ ...prev, accion: e.target.value }))}
              >
                <option value="">Todas las acciones</option>
                <option value="creado">Creado</option>
                <option value="editado">Editado</option>
                <option value="eliminado">Eliminado</option>
                <option value="restaurado">Restaurado</option>
              </Form.Select>
            </div>

            <div className="col-6 col-md-3">
              <Form.Label className="small text-muted mb-1">Desde</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-3">
              <Form.Label className="small text-muted mb-1">Hasta</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-6 d-flex align-items-end">
              <Button size="sm" variant="primary" onClick={buscarGeneral} className="w-100">Buscar</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" /> Cargando historial...
          </div>
        ) : error ? (
          <div className="alert alert-danger py-2">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted py-4">No hay registros de historial para mostrar.</div>
        ) : (
          items.map((item) => <TimelineItem key={item.id} item={item} />)
        )}

        {esGeneral && total > limit && (
          <div className="d-flex justify-content-between align-items-center mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={pagination <= 1}
              onClick={() => setPagination((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <span className="small text-muted">Página {pagination} de {Math.ceil(total / limit)}</span>
            <Button
              size="sm"
              variant="outline-secondary"
              disabled={pagination >= Math.ceil(total / limit)}
              onClick={() => setPagination((prev) => prev + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
}
