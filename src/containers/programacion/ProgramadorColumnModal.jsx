import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

function ProgramadorColumnModal({
  show,
  onClose,
  columns,
  visibleColumns,
  onToggleColumn,
  onToggleAll,
  onSave,
  isSuperAdmin = false,
  presetsUsuario = [],
  presetsGlobales = [],
  onAplicarPreset,
  onGuardarPreset,
  onEliminarPreset,
}) {
  const [nombre, setNombre] = useState('');
  const [esGlobal, setEsGlobal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardarComoPreset = async () => {
    setError('');
    setGuardando(true);
    try {
      await onGuardarPreset?.({ nombre, global: esGlobal });
      setNombre('');
      setEsGlobal(false);
    } catch (err) {
      setError(err?.message || 'No fue posible guardar la configuracion.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (preset, global) => {
    if (!window.confirm(`¿Eliminar la configuracion "${preset.nombre}"?`)) return;
    setError('');
    try {
      await onEliminarPreset?.(preset, global);
    } catch (err) {
      setError(err?.message || 'No fue posible eliminar la configuracion.');
    }
  };

  const renderPresets = (titulo, presets, global) => (
    presets.length > 0 && (
      <div className="mb-2">
        <div className="small text-muted fw-semibold">{titulo}</div>
        {presets.map((preset) => (
          <div key={preset.id} className="d-flex align-items-center gap-2 py-1">
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              className="flex-grow-1 text-start"
              onClick={() => onAplicarPreset?.(preset)}
            >
              {preset.nombre}
            </Button>
            {(!global || isSuperAdmin) && (
              <Button
                type="button"
                variant="outline-danger"
                size="sm"
                title="Eliminar configuracion"
                onClick={() => eliminar(preset, global)}
              >
                <FaTrash size={11} />
              </Button>
            )}
          </div>
        ))}
      </div>
    )
  );

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Columnas visibles</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {(presetsUsuario.length > 0 || presetsGlobales.length > 0) && (
          <div className="mb-3 pb-2 border-bottom">
            <div className="fw-semibold mb-1">Configuraciones guardadas</div>
            {renderPresets('Mis configuraciones', presetsUsuario, false)}
            {renderPresets('Globales', presetsGlobales, true)}
          </div>
        )}

        <Form.Check
          className="mb-2 fw-semibold"
          type="checkbox"
          id="column-all"
          label="Seleccionar todas"
          checked={columns.every((column) => visibleColumns[column.id])}
          ref={(el) => {
            if (el) {
              const algunas = columns.some((column) => visibleColumns[column.id]);
              const todas = columns.every((column) => visibleColumns[column.id]);
              el.indeterminate = algunas && !todas;
            }
          }}
          onChange={(e) => onToggleAll?.(e.target.checked)}
        />

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

        <div className="mt-3 pt-2 border-top">
          <div className="fw-semibold mb-1">Guardar esta seleccion como configuracion</div>
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              size="sm"
              placeholder="Nombre de la configuracion"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Button
              type="button"
              variant="success"
              size="sm"
              className="text-nowrap"
              disabled={guardando || !nombre.trim()}
              onClick={guardarComoPreset}
            >
              {guardando ? 'Guardando...' : 'Guardar configuracion'}
            </Button>
          </div>
          {isSuperAdmin && (
            <Form.Check
              className="mt-1"
              type="checkbox"
              id="preset-global"
              label="Global (visible para todos los usuarios)"
              checked={esGlobal}
              onChange={(e) => setEsGlobal(e.target.checked)}
            />
          )}
          {error && <div className="text-danger small mt-1">{error}</div>}
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
