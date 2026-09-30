import React, { useEffect, useState } from 'react';
import { Badge, Button, Modal } from 'react-bootstrap';

const CONTAINER_CHIP_LIMIT = 20;

function ContainerChips({ contenedores = [] }) {
  if (!contenedores.length) {
    return <span className="text-muted">-</span>;
  }

  const visibles = contenedores.slice(0, CONTAINER_CHIP_LIMIT);
  const restantes = contenedores.length - visibles.length;

  return (
    <div className="d-flex flex-wrap gap-1">
      {visibles.map((contenedor) => (
        <span
          key={contenedor}
          className="badge rounded-pill text-bg-dark fw-normal text-break"
          style={{ fontSize: '0.72rem', maxWidth: '100%' }}
        >
          {contenedor}
        </span>
      ))}
      {restantes > 0 && (
        <span className="badge rounded-pill text-bg-secondary fw-normal" style={{ fontSize: '0.72rem' }}>
          +{restantes} más
        </span>
      )}
    </div>
  );
}

function ListadoDiferenciasModal({ diferenciasListado, show, syncingListado, onClose, onContinue }) {
  const totales = diferenciasListado?.totales || {};
  const skippedRows = diferenciasListado?.skippedRows || [];
  const haySkipped = skippedRows.length > 0;
  const soloListadoRows = diferenciasListado?.soloListadoRows || [];
  const haySoloListado = soloListadoRows.length > 0;

  // Unidades que el usuario marco explicitamente para quitar del Listado —
  // arranca vacio a proposito: una unidad que esta en Listado pero no en
  // Programador ya NO se deshabilita sola, el usuario decide caso por caso
  // (pedido explicito, antes se quitaban todas al continuar).
  const [idsAQuitar, setIdsAQuitar] = useState(() => new Set());

  useEffect(() => {
    setIdsAQuitar(new Set());
  }, [diferenciasListado]);

  const toggleQuitar = (id) => {
    setIdsAQuitar((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered size="xl" scrollable>
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title className="h6 mb-0">Diferencias entre Listado y Programación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="small text-muted mb-3">
          Se detectaron diferencias entre lo programado y el Listado para las fechas con movimientos
          pendientes. Revisa el resumen antes de sincronizar: las líneas con coincidencia se actualizan.
          Las unidades que quedaron <strong>solo en Listado</strong> (p. ej. porque todavía no tienen línea
          en Programador) <strong>no se eliminan solas</strong> — quedan listadas abajo para que decidas,
          una por una, si las querés quitar del Listado o dejarlas como están.
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <Badge bg="primary">Programación: {totales.programacion ?? 0}</Badge>
          <Badge bg="success">Coincidencias: {totales.coincidencias ?? 0}</Badge>
          <Badge bg="warning" text="dark">Solo en programación: {totales.soloProgramacion ?? 0}</Badge>
          <Badge bg="danger">Solo en Listado: {totales.soloListado ?? 0}</Badge>
          <Badge bg="info">Cajas difieren: {totales.cajasDifieren ?? 0}</Badge>
          {haySkipped && <Badge bg="secondary">Sin almacén destino: {skippedRows.length}</Badge>}
        </div>

        <div className="table-responsive mb-3" style={{ maxHeight: '300px' }}>
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-secondary">
              <tr>
                <th>Fecha</th>
                <th className="text-center">Programación</th>
                <th className="text-center">Coincidencias</th>
                <th className="text-center">Cajas difieren</th>
                <th>Solo en programación</th>
              </tr>
            </thead>
            <tbody>
              {(diferenciasListado?.porDia || []).map((dia) => (
                <tr key={dia.fecha}>
                  <td className="text-nowrap">{dia.fecha}</td>
                  <td className="text-center">{dia.programacion}</td>
                  <td className="text-center">{dia.coincidencias}</td>
                  <td className="text-center">{dia.cajasDifieren}</td>
                  <td><ContainerChips contenedores={dia.soloProgramacion} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {haySoloListado && (
          <>
            <h6 className="mb-2">Unidades solo en Listado (sin línea en Programador)</h6>
            <div className="table-responsive mb-3" style={{ maxHeight: '260px' }}>
              <table className="table table-sm table-bordered align-middle mb-0">
                <thead className="table-secondary">
                  <tr>
                    <th className="text-center" style={{ width: '1%' }}>Quitar</th>
                    <th>Fecha</th>
                    <th>Contenedor</th>
                    <th>BL</th>
                  </tr>
                </thead>
                <tbody>
                  {soloListadoRows.map((row) => (
                    <tr key={row.id}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={idsAQuitar.has(row.id)}
                          onChange={() => toggleQuitar(row.id)}
                          aria-label={`Quitar ${row.contenedor} del Listado`}
                        />
                      </td>
                      <td className="text-nowrap">{row.fecha || '-'}</td>
                      <td>{row.contenedor || '-'}</td>
                      <td>{row.bl || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="small text-muted mb-3">
              Marcadas: {idsAQuitar.size} de {soloListadoRows.length}. Las que no marques quedan igual en el Listado.
            </div>
          </>
        )}

        {haySkipped && (
          <>
            <h6 className="mb-2">Sin almacén destino (no se pueden sincronizar)</h6>
            <div className="table-responsive mb-2" style={{ maxHeight: '150px' }}>
              <table className="table table-sm table-bordered mb-0">
                <thead className="table-secondary">
                  <tr>
                    <th>Fecha</th>
                    <th>BL</th>
                    <th>Contenedor</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedRows.map((item, index) => (
                    <tr key={`${item.contenedor || 'sin-contenedor'}-${item.fecha || 'sin-fecha'}-${index}`}>
                      <td>{item.fecha || '-'}</td>
                      <td>{item.bl || '-'}</td>
                      <td>{item.contenedor || '-'}</td>
                      <td>{item.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={syncingListado}>
          Cancelar
        </Button>
        <Button variant="success" onClick={() => onContinue([...idsAQuitar])} disabled={syncingListado}>
          {syncingListado ? 'Sincronizando...' : 'Continuar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ListadoDiferenciasModal;