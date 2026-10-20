import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

const normalizar = (valor) => String(valor || '').trim().toLowerCase();

// Agrega otro vehiculo a una linea del Programador. Los tres campos
// (vehiculo, conductor y observacion) son obligatorios.
function ProgramadorVehiculoRecogidaModal({ show, onClose, programacion, vehiculos = [], conductores = [], onGuardar }) {
  const [vehiculoTexto, setVehiculoTexto] = useState('');
  const [conductorTexto, setConductorTexto] = useState('');
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cerrar = () => {
    setVehiculoTexto('');
    setConductorTexto('');
    setObservacion('');
    setError('');
    onClose?.();
  };

  const guardar = async (event) => {
    event.preventDefault();
    const vehiculo = vehiculos.find((v) => normalizar(v.placa) === normalizar(vehiculoTexto));
    const conductor = conductores.find((c) => normalizar(c.conductor) === normalizar(conductorTexto));
    if (!vehiculo) return setError('Elija un vehiculo valido de la lista.');
    if (!conductor) return setError('Elija un conductor valido de la lista.');
    if (!observacion.trim()) return setError('La observacion es obligatoria.');

    setError('');
    setGuardando(true);
    try {
      await onGuardar?.({ vehiculoId: vehiculo.id, conductorId: conductor.id, observacion: observacion.trim() });
      cerrar();
    } catch (err) {
      setError(err?.message || 'No fue posible agregar el vehiculo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal show={show} onHide={guardando ? undefined : cerrar} centered>
      <Form onSubmit={guardar}>
        <Modal.Header closeButton={!guardando}>
          <Modal.Title className="h6 mb-0">Agregar otro vehiculo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="small text-muted mb-3">
            {programacion?.blLabel || programacion?.bl || 'Sin BL'} | {programacion?.contenedorLabel || 'Sin contenedor'}
          </div>
          <Form.Group className="mb-2">
            <Form.Label className="small mb-1">Vehiculo <span className="text-danger">*</span></Form.Label>
            <Form.Control
              size="sm"
              list="recogida-vehiculos"
              value={vehiculoTexto}
              onChange={(e) => setVehiculoTexto(e.target.value)}
              placeholder="Placa"
              autoComplete="off"
            />
            <datalist id="recogida-vehiculos">
              {vehiculos.map((v) => <option key={v.id} value={v.placa} />)}
            </datalist>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small mb-1">Conductor <span className="text-danger">*</span></Form.Label>
            <Form.Control
              size="sm"
              list="recogida-conductores"
              value={conductorTexto}
              onChange={(e) => setConductorTexto(e.target.value)}
              placeholder="Conductor"
              autoComplete="off"
            />
            <datalist id="recogida-conductores">
              {conductores.map((c) => <option key={c.id} value={c.conductor} />)}
            </datalist>
          </Form.Group>
          <Form.Group>
            <Form.Label className="small mb-1">Observacion <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              size="sm"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej. Recoge el contenedor en finca y lo lleva a puerto"
            />
          </Form.Group>
          {error && <div className="text-danger small mt-2">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" size="sm" onClick={cerrar} disabled={guardando}>Cancelar</Button>
          <Button type="submit" variant="success" size="sm" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Agregar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ProgramadorVehiculoRecogidaModal;
