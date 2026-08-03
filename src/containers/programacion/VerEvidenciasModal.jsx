import React from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';

const formatearFecha = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' });
};

function VerEvidenciasModal({ show, onClose, loading, error, fotos, carpetaUrl, onSubirMas }) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Fotos de evidencia</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Cargando fotos...
          </div>
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : fotos.length === 0 ? (
          <div className="alert alert-secondary mb-0">No hay fotos en esta carpeta.</div>
        ) : (
          <>
            <strong>{fotos.length} foto{fotos.length !== 1 ? 's' : ''} cargada{fotos.length !== 1 ? 's' : ''}:</strong>
            <ul className="list-group list-group-flush mt-2">
              {fotos.map((foto) => (
                <li key={foto.id} className="list-group-item small d-flex justify-content-between align-items-center">
                  <a href={foto.webViewLink} target="_blank" rel="noopener noreferrer">
                    {foto.name}
                  </a>
                  <span className="text-muted ms-2">{formatearFecha(foto.createdTime)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        {carpetaUrl ? (
          <a href={carpetaUrl} target="_blank" rel="noopener noreferrer" className="small">
            Abrir carpeta en Google Drive
          </a>
        ) : <span />}
        <div>
          <Button variant="secondary" onClick={onClose} className="me-2">Cerrar</Button>
          <Button variant="primary" onClick={onSubirMas}>Subir mas fotos</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default VerEvidenciasModal;
