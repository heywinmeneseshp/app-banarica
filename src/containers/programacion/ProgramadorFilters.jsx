import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { FaInfoCircle, FaCog, FaHistory } from 'react-icons/fa';
import { actualizarModulo } from '@services/api/configuracion';
import { getTransportadoraLabel, DIAS_EDICION_HORAS_MODULE } from './programadorUtils';

const iconButtonStyle = {
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6c757d',
};

export default function ProgramadorFilters({
  formRef,
  ubicaciones,
  conductores,
  movimientoOptions,
  transportadoras,
  transportadoraFiltro,
  setTransportadoraFiltro,
  setPagination,
  setReloadKey,
  setOpen,
  canEditarProgramador,
  isSuperAdmin,
  isEditable,
  setIsEditable,
  diasEdicionHoras,
  setDiasEdicionHoras,
  descargarExcel,
  syncingListado,
  loading,
  sincronizarListadoPendiente,
  canActualizarPendientes,
  setShowColumnConfig,
  setShowInsumoConfig,
  rowCount,
  total,
  rowsShown,
  pageLimit,
  setPageLimit,
  onVerHistorialGeneral,
}) {
  const [movimientoOpen, setMovimientoOpen] = useState(false);
  const [draftLimit, setDraftLimit] = useState(pageLimit ?? 25);
  const [showAyudaEdicion, setShowAyudaEdicion] = useState(false);
  const [showConfigEdicion, setShowConfigEdicion] = useState(false);
  const [diasEdicionDraft, setDiasEdicionDraft] = useState(diasEdicionHoras ?? 1);
  const [guardandoDiasEdicion, setGuardandoDiasEdicion] = useState(false);

  useEffect(() => { setDiasEdicionDraft(diasEdicionHoras ?? 1); }, [diasEdicionHoras]);

  const guardarDiasEdicion = async () => {
    const dias = Math.max(0, parseInt(diasEdicionDraft, 10) || 0);
    setGuardandoDiasEdicion(true);
    try {
      await actualizarModulo({
        modulo: DIAS_EDICION_HORAS_MODULE,
        detalles: JSON.stringify({ diasAtras: dias }),
      });
      setDiasEdicionHoras(dias);
      setShowConfigEdicion(false);
    } finally {
      setGuardandoDiasEdicion(false);
    }
  };

  useEffect(() => { setDraftLimit(pageLimit ?? 25); }, [pageLimit]);

  const commitLimit = () => {
    const v = Math.max(1, Math.min(500, Number(draftLimit) || 25));
    setDraftLimit(v);
    if (v !== pageLimit) setPageLimit(v);
  };
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);
  const movimientoDropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const fechaInicialRef = useRef(null);

  useEffect(() => {
    if (fechaInicialRef.current) {
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      fechaInicialRef.current.value = `${yyyy}-${mm}-${dd}`;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (movimientoDropdownRef.current && !movimientoDropdownRef.current.contains(e.target)) {
        setMovimientoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onFilter = () => { setPagination(1); setReloadKey((prev) => prev + 1); };
  const onFilterDebounced = () => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(onFilter, 400);
  };

  const handleMovimientoChange = (e) => {
    const { value, checked } = e.target;
    setSelectedMovimientos((prev) =>
      checked ? [...prev, value] : prev.filter((m) => m !== value)
    );
    onFilter();
  };

  const movimientoLabel = selectedMovimientos.length === 0
    ? 'Todos'
    : selectedMovimientos.length === 1
      ? selectedMovimientos[0]
      : `${selectedMovimientos.length} seleccionados`;

  return (
    <form ref={formRef} className="container-fluid px-0">
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="semana" className="form-label mb-1">Semana</label>
          <input id="semana" name="semana" type="text" onChange={onFilterDebounced} className="form-control form-control-sm" />
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
          <input id="fecha" name="fecha" type="date" ref={fechaInicialRef} onChange={onFilter} className="form-control form-control-sm" />
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="fecha_fin" className="form-label mb-1">Fecha final</label>
          <input id="fecha_fin" name="fecha_fin" type="date" onChange={onFilter} className="form-control form-control-sm" />
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
          <input id="vehiculo" name="vehiculo" type="text" onChange={onFilterDebounced} className="form-control form-control-sm" />
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="transportadoraFiltro" className="form-label mb-1">Transportadora</label>
          <select
            id="transportadoraFiltro"
            name="transportadoraFiltro"
            className="form-select form-select-sm"
            value={transportadoraFiltro}
            onChange={(event) => { setPagination(1); setTransportadoraFiltro(event.target.value); }}
          >
            {transportadoras.length > 1 && <option value="">Todas</option>}
            {transportadoras.map((item) => (
              <option key={item.id} value={item.id}>{getTransportadoraLabel(item)}</option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="bl" className="form-label mb-1">Booking</label>
          <input id="bl" name="bl" type="text" onChange={onFilterDebounced} className="form-control form-control-sm" />
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
          <input id="conductor" name="conductor" type="text" list="conductorItems" onChange={onFilterDebounced} className="form-control form-control-sm" />
          <datalist id="conductorItems">
            <option value="" />
            {conductores.map((item) => (
              <option key={item.id} value={item.conductor} />
            ))}
          </datalist>
        </div>

        <div className="col-12 col-md-6 col-lg-2" ref={movimientoDropdownRef} style={{ position: 'relative' }}>
          <label htmlFor="movimientoDropdownBtn" className="form-label mb-1">Movimiento</label>
          <button
            id="movimientoDropdownBtn"
            type="button"
            className="form-select form-select-sm text-start d-flex align-items-center justify-content-between"
            onClick={() => setMovimientoOpen((prev) => !prev)}
          >
            <span className="text-truncate">{movimientoLabel}</span>
            <span style={{ fontSize: '0.65rem', marginLeft: '4px' }}>{movimientoOpen ? '▲' : '▼'}</span>
          </button>
          <div
            className="border rounded bg-white shadow-sm p-2"
            style={{
              display: movimientoOpen ? 'block' : 'none',
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1050,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {movimientoOptions.map((item) => (
              <div key={item.id || item.movimiento} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="movimiento"
                  id={`mov-${item.id || item.movimiento}`}
                  value={item.movimiento}
                  checked={selectedMovimientos.includes(item.movimiento)}
                  onChange={handleMovimientoChange}
                />
                <label className="form-check-label small" htmlFor={`mov-${item.id || item.movimiento}`}>
                  {item.movimiento}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="origen" className="form-label mb-1">Origen</label>
          <select id="origen" name="origen" className="form-select form-select-sm" onChange={onFilter}>
            <option value="" />
            {ubicaciones.map((item) => (
              <option key={item.id} value={item.id}>{item.ubicacion}</option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="destino" className="form-label mb-1">Destino</label>
          <select id="destino" name="destino" className="form-select form-select-sm" onChange={onFilter}>
            <option value="" />
            {ubicaciones.map((item) => (
              <option key={item.id} value={item.id}>{item.ubicacion}</option>
            ))}
          </select>
        </div>
      </div>

      <hr className="my-3" />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button type="button" onClick={descargarExcel} variant="success" size="sm">
            Descargar Excel
          </Button>

          {canActualizarPendientes && (
            <Button
              type="button"
              onClick={sincronizarListadoPendiente}
              variant="outline-success"
              size="sm"
              disabled={syncingListado || loading}
            >
              {syncingListado ? 'Actualizando pendientes...' : 'Actualizar pendientes'}
            </Button>
          )}

          <Button type="button" onClick={() => setShowColumnConfig((prev) => !prev)} variant="outline-dark" size="sm">
            Configurar columnas
          </Button>

          {isSuperAdmin && (
            <Button type="button" onClick={() => setShowInsumoConfig(true)} variant="outline-secondary" size="sm">
              Configurar insumos
            </Button>
          )}

          <Button
            type="button"
            onClick={onVerHistorialGeneral}
            variant="outline-primary"
            size="sm"
            className="d-inline-flex align-items-center gap-1"
          >
            <FaHistory /> Historial
          </Button>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0"
            style={iconButtonStyle}
            onClick={() => setShowAyudaEdicion(true)}
            title="Ver restricciones de edición"
          >
            <FaInfoCircle size={17} />
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none p-0"
              style={iconButtonStyle}
              onClick={() => setShowConfigEdicion(true)}
              title="Configurar dias de edicion de horas"
            >
              <FaCog size={17} />
            </button>
          )}
          <Button type="button" onClick={() => setOpen(true)} variant="primary" size="sm">
            Nuevo movimiento
          </Button>

          {(canEditarProgramador || isSuperAdmin) && (
            <Button type="button" onClick={() => setIsEditable((prev) => !prev)} variant={isEditable ? 'success' : 'warning'} size="sm">
              {isEditable ? 'Guardar edición' : 'Permitir edición'}
            </Button>
          )}
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 gap-md-4 mt-3 pt-2 border-top">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Mostrando</span>
          <span style={{ color: '#198754', fontWeight: 700 }}>{rowsShown ?? 0}</span>
          <span className="text-muted small">de</span>
          <span style={{ color: '#0d6efd', fontWeight: 700 }}>{total ?? 0}</span>
          <span className="text-muted small" style={{ marginLeft: '4px' }}>Límite:</span>
          <input
            type="number"
            min={1}
            max={500}
            value={draftLimit}
            onChange={(e) => setDraftLimit(e.target.value)}
            onBlur={commitLimit}
            onKeyDown={(e) => e.key === 'Enter' && commitLimit()}
            className="form-control form-control-sm"
            style={{ width: '60px' }}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className="badge rounded-pill bg-primary fs-6 px-3 py-2"
            title={`${rowCount ?? 0} contenedores únicos de ${total ?? 0} registros en el filtro`}
          >
            {rowCount ?? 0}
          </span>
          <span className="text-muted small">Contenedor{(rowCount ?? 0) !== 1 ? 'es' : ''}</span>
        </div>
      </div>

      <Modal show={showAyudaEdicion} onHide={() => setShowAyudaEdicion(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title className="h6 mb-0">Restricciones de edición del Programador</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul className="mb-3 ps-3">
            <li className="mb-2">
              Necesitas el permiso <strong>&quot;Edición de programador&quot;</strong> (o ser super administrador)
              para poder modificar filas. Sin ese permiso, la tabla es de solo lectura.
            </li>
            <li className="mb-2">
              Aunque tengas el permiso, debes presionar <strong>&quot;Permitir edición&quot;</strong> para activar
              el modo edición. Al terminar, presiona <strong>&quot;Guardar edición&quot;</strong> para salir de ese modo.
            </li>
            <li className="mb-2">
              Una vez una fila queda en estado <strong>&quot;Actualizado&quot;</strong> (ya sincronizada), solo un
              <strong> super administrador</strong> puede seguir editándola; para el resto de usuarios queda bloqueada.
            </li>
            <li className="mb-2">
              Las columnas de horas (Ingreso origen, Salida origen, Llegada Patio, Retiro Patio, Ingreso destino,
              Cierre, Salida destino) solo se pueden editar si la fecha de la fila esta dentro de los
              <strong> últimos {diasEdicionHoras} día{diasEdicionHoras === 1 ? '' : 's'}</strong> (incluyendo hoy).
              Filas con fecha más antigua no permiten editar esas horas, aunque tengas permiso de edición.
              {isSuperAdmin && ' Este numero de dias se puede ajustar con el boton de configuracion (engranaje).'}
            </li>
            <li className="mb-0">
              Para sincronizar los movimientos <strong>pendientes</strong> hacia el estado &quot;Actualizado&quot;
              se necesita el permiso <strong>&quot;Actualizar pendientes&quot;</strong> (botón &quot;Actualizar pendientes&quot;).
            </li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowAyudaEdicion(false)}>Entendido</Button>
        </Modal.Footer>
      </Modal>

      {isSuperAdmin && (
        <Modal show={showConfigEdicion} onHide={() => setShowConfigEdicion(false)} centered>
          <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title className="h6 mb-0">Configurar edición de columnas de horas</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted small mb-3">
              Define hasta cuántos días atrás (contando desde hoy) se pueden seguir editando las columnas de
              horas (Ingreso origen, Salida origen, Llegada Patio, Retiro Patio, Ingreso destino, Cierre,
              Salida destino). Con 0, solo se permite editar horas de filas con fecha de hoy.
            </p>
            <Form.Group>
              <Form.Label className="fw-semibold small">Días atrás permitidos</Form.Label>
              <Form.Control
                type="number"
                min={0}
                size="sm"
                value={diasEdicionDraft}
                onChange={(e) => setDiasEdicionDraft(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowConfigEdicion(false)} disabled={guardandoDiasEdicion}>
              Cancelar
            </Button>
            <Button variant="success" size="sm" onClick={guardarDiasEdicion} disabled={guardandoDiasEdicion}>
              {guardandoDiasEdicion ? 'Guardando...' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </form>
  );
}
