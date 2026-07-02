import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { getTransportadoraLabel } from './programadorUtils';

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
  descargarExcel,
  syncingListado,
  loading,
  sincronizarListadoPendiente,
  canActualizarPendientes,
  setShowColumnConfig,
  setShowInsumoConfig,
}) {
  const [movimientoOpen, setMovimientoOpen] = useState(false);
  const [selectedMovimientos, setSelectedMovimientos] = useState([]);
  const movimientoDropdownRef = useRef(null);
  const debounceRef = useRef(null);

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
          <input id="fecha" name="fecha" type="date" onChange={onFilter} className="form-control form-control-sm" />
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

        <div className="col-12 col-md-6 col-lg-2">
          <Button type="button" onClick={() => setOpen(true)} className="w-100 mt-0 mt-md-4" variant="primary" size="sm">
            Nuevo movimiento
          </Button>
        </div>

        {(canEditarProgramador || isSuperAdmin) && (
          <div className="col-12 col-md-6 col-lg-2">
            <Button type="button" onClick={() => setIsEditable((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant={isEditable ? 'success' : 'warning'} size="sm">
              {isEditable ? 'Guardar edición' : 'Permitir edición'}
            </Button>
          </div>
        )}

        <div className="col-12 col-md-6 col-lg-2">
          <Button type="button" onClick={descargarExcel} className="w-100 mt-0 mt-md-4" variant="success" size="sm">
            Descargar Excel
          </Button>
        </div>

        {canActualizarPendientes && (
          <div className="col-12 col-md-6 col-lg-2">
            <Button
              type="button"
              onClick={sincronizarListadoPendiente}
              className="w-100 mt-0 mt-md-4"
              variant="outline-success"
              size="sm"
              disabled={syncingListado || loading}
            >
              {syncingListado ? 'Actualizando pendientes...' : 'Actualizar pendientes'}
            </Button>
          </div>
        )}

        <div className="col-12 col-md-6 col-lg-2">
          <Button type="button" onClick={() => setShowColumnConfig((prev) => !prev)} className="w-100 mt-0 mt-md-4" variant="outline-dark" size="sm">
            Configurar columnas
          </Button>
        </div>

        {isSuperAdmin && (
          <div className="col-12 col-md-6 col-lg-2">
            <Button type="button" onClick={() => setShowInsumoConfig(true)} className="w-100 mt-0 mt-md-4" variant="outline-secondary" size="sm">
              Configurar insumos
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
