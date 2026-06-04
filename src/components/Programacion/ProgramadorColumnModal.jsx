import React from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

function ProgramadorColumnModal({
  show,
  onClose,
  columns,
  visibleColumns,
  onToggleColumn,
  onSave,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Columnas visibles</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-2">
          {columns.map((column) => (
            <div className="col-12 col-md-6" key={column.id}>
              <Form.Check
                type="checkbox"
                id={`column-${column.id}`}
                label={column.label}
                checked={Boolean(visibleColumns[column.id])}
                onChange={() => onToggleColumn(column.id)}
              />
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="outline-secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button type="button" variant="primary" onClick={onSave}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProgramadorColumnModal;
