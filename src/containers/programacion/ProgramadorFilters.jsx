import React from 'react';
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
  listar,
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
  const onFilter = () => { setPagination(1); listar(); };

  return (
    <form ref={formRef} className="container-fluid px-0">
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="semana" className="form-label mb-1">Semana</label>
          <input id="semana" name="semana" type="text" onChange={onFilter} className="form-control form-control-sm" />
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
          <input id="vehiculo" name="vehiculo" type="text" onChange={onFilter} className="form-control form-control-sm" />
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
            <option value="">Todas</option>
            {transportadoras.map((item) => (
              <option key={item.id} value={item.id}>{getTransportadoraLabel(item)}</option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="bl" className="form-label mb-1">BL</label>
          <input id="bl" name="bl" type="text" onChange={onFilter} className="form-control form-control-sm" />
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
          <input id="conductor" name="conductor" type="text" list="conductorItems" onChange={onFilter} className="form-control form-control-sm" />
          <datalist id="conductorItems">
            <option value="" />
            {conductores.map((item) => (
              <option key={item.id} value={item.conductor} />
            ))}
          </datalist>
        </div>

        <div className="col-12 col-md-6 col-lg-2">
          <label htmlFor="movimiento" className="form-label mb-1">Movimiento</label>
          <input id="movimiento" name="movimiento" type="text" list="movimientoList" onChange={onFilter} className="form-control form-control-sm" />
          <datalist id="movimientoList">
            <option value="" />
            {movimientoOptions.map((item) => (
              <option key={item.id || item.movimiento} value={item.movimiento} />
            ))}
          </datalist>
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
