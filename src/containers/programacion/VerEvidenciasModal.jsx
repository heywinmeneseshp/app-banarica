import React, { useEffect, useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import endPoints from '@services/api';

const formatearFecha = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' });
};

const Miniatura = ({ foto, onAmpliar }) => {
  const [fallo, setFallo] = useState(false);

  return (
    <div title={foto.name}>
      {fallo ? (
        <div
          className="border rounded d-flex align-items-center justify-content-center bg-light text-muted small text-center p-1"
          style={{ width: '100%', height: 110 }}
        >
          No se pudo cargar la vista previa
        </div>
      ) : (
        <button
          type="button"
          onClick={onAmpliar}
          style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
        >
          <img
            src={endPoints.googleDrive.imagen(foto.id)}
            alt={foto.name}
            className="border rounded"
            style={{ width: '100%', height: 110, objectFit: 'cover' }}
            onError={() => setFallo(true)}
          />
        </button>
      )}
      <div className="text-muted text-truncate small mt-1">{formatearFecha(foto.createdTime)}</div>
    </div>
  );
};

function VerEvidenciasModal({ show, onClose, loading, error, fotos, carpetaUrl, onSubirMas, mostrarEnlaceDrive = false }) {
  const [indiceAmpliado, setIndiceAmpliado] = useState(null);
  const imagenAmpliada = indiceAmpliado !== null ? fotos[indiceAmpliado] : null;

  const cerrarAmpliada = () => setIndiceAmpliado(null);
  const irAnterior = () => setIndiceAmpliado((prev) => (prev - 1 + fotos.length) % fotos.length);
  const irSiguiente = () => setIndiceAmpliado((prev) => (prev + 1) % fotos.length);

  useEffect(() => {
    if (indiceAmpliado === null) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') cerrarAmpliada();
      if (e.key === 'ArrowLeft') irAnterior();
      if (e.key === 'ArrowRight') irSiguiente();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceAmpliado, fotos.length]);

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
            <strong className="d-block mb-2">
              {fotos.length} foto{fotos.length !== 1 ? 's' : ''} cargada{fotos.length !== 1 ? 's' : ''}:
            </strong>
            <div className="row g-2">
              {fotos.map((foto, index) => (
                <div key={foto.id} className="col-6 col-sm-4 col-md-3">
                  <Miniatura foto={foto} onAmpliar={() => setIndiceAmpliado(index)} />
                </div>
              ))}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        {mostrarEnlaceDrive && carpetaUrl ? (
          <a href={carpetaUrl} target="_blank" rel="noopener noreferrer" className="small">
            Abrir carpeta en Google Drive
          </a>
        ) : <span />}
        <div>
          <Button variant="secondary" onClick={onClose} className="me-2">Cerrar</Button>
          <Button variant="primary" onClick={onSubirMas}>Subir mas fotos</Button>
        </div>
      </Modal.Footer>

      {imagenAmpliada && (
        <>
          <div
            aria-hidden="true"
            onClick={cerrarAmpliada}
            style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(0,0,0,0.85)', cursor: 'zoom-out' }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={imagenAmpliada.name}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1061,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              pointerEvents: 'none',
            }}
          >
            <img
              src={endPoints.googleDrive.imagen(imagenAmpliada.id)}
              alt={imagenAmpliada.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4, pointerEvents: 'auto' }}
            />

            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={irAnterior}
                  aria-label="Foto anterior"
                  style={{
                    all: 'unset', position: 'fixed', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'auto', cursor: 'pointer', color: '#fff', fontSize: 32,
                    padding: '0.5rem', lineHeight: 1,
                  }}
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={irSiguiente}
                  aria-label="Foto siguiente"
                  style={{
                    all: 'unset', position: 'fixed', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'auto', cursor: 'pointer', color: '#fff', fontSize: 32,
                    padding: '0.5rem', lineHeight: 1,
                  }}
                >
                  <FaChevronRight />
                </button>
                <span
                  style={{
                    position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
                    color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '0.15rem 0.75rem',
                    fontSize: 13, pointerEvents: 'none',
                  }}
                >
                  {indiceAmpliado + 1} / {fotos.length}
                </span>
              </>
            )}

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={cerrarAmpliada}
              aria-label="Cerrar"
              style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', pointerEvents: 'auto' }}
            />
          </div>
        </>
      )}
    </Modal>
  );
}

export default VerEvidenciasModal;
