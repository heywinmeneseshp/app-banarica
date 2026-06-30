import React from 'react';
import { Button, Modal } from 'react-bootstrap';

function ProgramadorPendingSyncModal({
  pendingListadoSync,
  show,
  onClose,
  onDownloadMissing,
  onConfirm,
  syncingListado,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Coincidencias incompletas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="small text-muted mb-3">
          Se encontraron {pendingListadoSync?.processableCount || 0} registros listos para actualizar y {pendingListadoSync?.missingCount || 0} sin coincidencia.
          Puedes descargar los no encontrados o continuar solo con las coincidencias.
        </div>

        <div className="table-responsive mb-3" style={{ maxHeight: '260px' }}>
          <table className="table table-sm table-bordered mb-0">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>BL</th>
                <th>Contenedor</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {(pendingListadoSync?.missingRows || []).map((item, index) => (
                <tr key={`${item.contenedor || 'sin-contenedor'}-${item.fecha || 'sin-fecha'}-${index}`}>
                  <td>{item.fecha || '-'}</td>
                  <td>{item.bl || item.booking || '-'}</td>
                  <td>{item.contenedor || '-'}</td>
                  <td>{item.reason || 'Sin coincidencia'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onDownloadMissing} disabled={syncingListado}>
          Descargar no encontrados
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={syncingListado}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={onConfirm}
          disabled={syncingListado || (pendingListadoSync?.processableCount || 0) === 0}
        >
          {syncingListado ? 'Actualizando...' : 'Actualizar coincidencias'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProgramadorPendingSyncModal;
