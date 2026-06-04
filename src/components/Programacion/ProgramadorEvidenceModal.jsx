import React from 'react';
import { Button, Modal } from 'react-bootstrap';

function ProgramadorEvidenceModal({
  show,
  selectedProgramacion,
  evidenceResults,
  evidenceFiles,
  uploadingEvidencia,
  onClose,
  onFilesChange,
  onRemoveFile,
  onUpload,
  onReset,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Subir evidencia fotográfica
          {selectedProgramacion && (
            <small className="text-muted ms-2">
              {selectedProgramacion.fecha} - {selectedProgramacion.vehiculoLabel || selectedProgramacion.contenedorLabel}
            </small>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {evidenceResults ? (
          <div className="mb-3">
            <div className="alert alert-success">
              <strong>Subida completada</strong>
              <p className="mb-0 mt-2">
                Se subieron {evidenceResults.totalFotos || evidenceResults.fotos?.length || 0} fotos.
              </p>
            </div>
            {evidenceResults.fotos && evidenceResults.fotos.length > 0 && (
              <div className="mt-3">
                <strong>Enlaces de las fotos subidas:</strong>
                <ul className="list-group list-group-flush mt-2">
                  {evidenceResults.fotos.map((foto, idx) => (
                    <li key={foto.idDrive || idx} className="list-group-item small">
                      <a href={foto.urlDrive} target="_blank" rel="noopener noreferrer">
                        Foto {idx + 1}: {foto.nombreDrive || foto.urlDrive}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 d-flex justify-content-end">
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
              <Button variant="primary" onClick={onReset} className="ms-2">
                Subir más fotos
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="form-label fw-bold" htmlFor="evidenciaFotos">Seleccionar fotos (máximo 20, 5MB cada una)</label>
              <input
                id="evidenciaFotos"
                type="file"
                className="form-control"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={onFilesChange}
                multiple
                disabled={uploadingEvidencia}
              />
              <small className="text-muted">
                Formatos permitidos: JPG, PNG, GIF, WEBP. Tamaño máximo: 5MB por archivo.
              </small>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="mt-3">
                <strong>Archivos seleccionados ({evidenceFiles.length}):</strong>
                <ul className="list-group list-group-flush mt-2">
                  {evidenceFiles.map((file, idx) => (
                    <li key={idx} className="list-group-item small d-flex justify-content-between align-items-center">
                      <span>
                        {file.name}
                        <span className="text-muted ms-2">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0"
                        onClick={() => onRemoveFile(idx)}
                      >
                        X
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      {!evidenceResults && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={uploadingEvidencia}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={onUpload}
            disabled={uploadingEvidencia || evidenceFiles.length === 0}
          >
            {uploadingEvidencia ? 'Subiendo...' : 'Subir evidencias'}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}

export default ProgramadorEvidenceModal;
