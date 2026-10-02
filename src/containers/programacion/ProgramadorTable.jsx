import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { FaCamera, FaHistory, FaMinus, FaPlus, FaTrashAlt } from 'react-icons/fa';
import Paginacion from '@components/shared/Tablas/Paginacion';
import useContenedorRowNumbers from '@hooks/useContenedorRowNumbers';
import {
  normalizeValue,
  READONLY_PROGRAMADOR_COLUMNS,
  ESTADO_LISTADO_ACTUALIZADO,
  ESTADO_LISTADO_PENDIENTE,
  compactCellStyle,
  editableCellStyle,
  PAGE_LIMIT,
  buildContenedorColorMap,
} from './programadorUtils';

function renderProgramadorHeader(columnId, label, isEditable) {
  return (
    <th
      className={`text-custom-small text-center ${READONLY_PROGRAMADOR_COLUMNS.has(columnId) ? 'text-white bg-secondary' : ''}`}
      style={isEditable ? editableCellStyle : compactCellStyle}
    >
      {label}
    </th>
  );
}

export default function ProgramadorTable({
  rows,
  visibleColumns,
  isEditable,
  loading,
  embarqueCatalog,
  ubicaciones,
  vehiculos,
  conductores,
  combosActivos,
  movimientoOptions,
  formatSerialArticuloLabel,
  formatSerialLabel,
  isSuperAdmin,
  canEditRow,
  canEditTimeColumns,
  handleCellEdit,
  handleLookupTextEdit,
  handleEliminarProducto,
  pageLimit = PAGE_LIMIT,
  abrirModalSeriales,
  abrirModalEvidencia,
  abrirVerEvidencias,
  abrirHistorial,
  eliminar,
  pagination,
  setPagination,
  total,
}) {
  const rowNumbers = useContenedorRowNumbers(
    rows,
    (item) => item?.contenedor || item?.contenedorLabel || '',
    pagination,
    pageLimit
  );

  // Espacios vacios para productos nuevos por fila: { base, count } donde
  // base es la cantidad de productos guardados al abrirlos. Cada producto que
  // se guarda consume un espacio (base queda atras de la cantidad real), asi
  // el espacio se cierra solo sin alternar estado desde el blur.
  const [nuevosProductos, setNuevosProductos] = useState({});
  const espaciosNuevos = (id, cantidadActual) => {
    const estado = nuevosProductos[id];
    if (!estado) return 0;
    return Math.max(0, estado.count - Math.max(0, cantidadActual - estado.base));
  };
  const agregarEspacioNuevo = (id, cantidadActual) => setNuevosProductos((prev) => ({
    ...prev,
    [id]: { base: cantidadActual, count: espaciosNuevos(id, cantidadActual) + 1 },
  }));
  const quitarEspacioNuevo = (id, cantidadActual) => setNuevosProductos((prev) => ({
    ...prev,
    [id]: { base: cantidadActual, count: Math.max(0, espaciosNuevos(id, cantidadActual) - 1) },
  }));
  return (
    <>
      {/* Datalists compartidos — una sola instancia para todas las filas editables */}
      <datalist id="bl-options">
        {embarqueCatalog.flatMap((embarque) => {
          const opts = [];
          if (embarque.bl) opts.push(<option key={`${embarque.id}-bl`} value={embarque.bl} />);
          if (embarque.booking) opts.push(<option key={`${embarque.id}-bk`} value={embarque.booking} />);
          return opts;
        })}
      </datalist>
      <datalist id="origen-options">
        {ubicaciones.map((u) => <option key={u.id} value={u.ubicacion} />)}
      </datalist>
      <datalist id="destino-options">
        {ubicaciones.map((u) => <option key={u.id} value={u.ubicacion} />)}
      </datalist>
      <datalist id="vehiculo-options">
        {vehiculos.map((v) => <option key={v.id} value={v.placa} />)}
      </datalist>
      <datalist id="conductor-options">
        {conductores.map((c) => <option key={c.id} value={c.conductor} />)}
      </datalist>
      <datalist id="producto-options">
        {combosActivos.map((c) => <option key={c.id} value={c.nombre} />)}
      </datalist>
      <datalist id="movimiento-options">
        {movimientoOptions.map((m) => <option key={m.id || m.movimiento} value={m.movimiento} />)}
      </datalist>

      <style>{`
        .programador-table tbody tr:hover td { filter: brightness(0.94); }
        .programador-table tbody tr { transition: filter 0.1s; }
        .programador-table tbody tr.row-demo td { background-color: transparent !important; color: red !important; }
        /* Modo compacto de ANCHO: padding horizontal minimo y columnas del
           tamano de su contenido; el alto de las filas no se toca. */
        .programador-table > :not(caption) > * > * { padding-left: 0.1rem !important; padding-right: 0.1rem !important; }
        .programador-table .px-1 { padding-left: 0.05rem !important; padding-right: 0.05rem !important; }
        .programador-table thead th { white-space: normal !important; word-break: normal; line-height: 1.1; }
        .programador-table .form-control,
        .programador-table .form-select { width: 100% !important; min-width: 0 !important; padding-left: 0.1rem !important; padding-right: 0.1rem !important; }
        .programador-table input[type="time"] { min-width: 4.3rem !important; }
        .programador-table input[type="date"] { min-width: 6.2rem !important; }
        .programador-table input[type="number"] { min-width: 2.6rem !important; }
        .programador-table input:not([type]),
        .programador-table input[type="text"] { min-width: 3.5rem !important; }
        .programador-table .btn { padding-left: 0.1rem !important; padding-right: 0.1rem !important; }
      `}</style>
      <div className="table-responsive mt-2" style={{ overflowX: 'auto', maxHeight: '75vh', overflowY: 'auto' }}>
        <table
          className="table table-striped table-bordered table-sm text-center align-middle mb-0 programador-table"
          style={{ width: 'auto', tableLayout: 'auto', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
        >
          <thead className="align-middle" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', position: 'sticky', top: 0, zIndex: 2, backgroundColor: '#fff' }}>
            <tr>
              {renderProgramadorHeader('numero', 'N°', isEditable)}
              {visibleColumns.semana && renderProgramadorHeader('semana', 'Sem', isEditable)}
              {visibleColumns.fecha && renderProgramadorHeader('fecha', 'Fecha', isEditable)}
              {visibleColumns.origen && renderProgramadorHeader('origen', 'Origen', isEditable)}
              {visibleColumns.destino && renderProgramadorHeader('destino', 'Destino L', isEditable)}
              {visibleColumns.productos && renderProgramadorHeader('productos', 'Producto', isEditable)}
              {visibleColumns.cantidad_productos && renderProgramadorHeader('cantidad_productos', 'Cantidad', isEditable)}
              {visibleColumns.linea && renderProgramadorHeader('linea', 'Linea', isEditable)}
              {visibleColumns.destino_embarque && renderProgramadorHeader('destino_embarque', 'Destino', isEditable)}
              {visibleColumns.buque && renderProgramadorHeader('buque', 'Buque', isEditable)}
              {visibleColumns.bl && renderProgramadorHeader('bl', 'Booking', isEditable)}
              {visibleColumns.vehiculo && renderProgramadorHeader('vehiculo', 'Vehiculos', isEditable)}
              {visibleColumns.transportadora && renderProgramadorHeader('transportadora', 'Transportadora', isEditable)}
              {visibleColumns.conductor && renderProgramadorHeader('conductor', 'Conductor', isEditable)}
              {visibleColumns.llegada_origen && renderProgramadorHeader('llegada_origen', 'Ingreso origen', isEditable)}
              {visibleColumns.salida_origen && renderProgramadorHeader('salida_origen', 'Salida origen', isEditable)}
              {visibleColumns.llegada_patio && renderProgramadorHeader('llegada_patio', 'Llegada Patio', isEditable)}
              {visibleColumns.retiro_patio && renderProgramadorHeader('retiro_patio', 'Retiro Patio', isEditable)}
              {visibleColumns.llegada_destino && renderProgramadorHeader('llegada_destino', 'Ingreso destino', isEditable)}
              {visibleColumns.cierre && renderProgramadorHeader('cierre', 'Cierre', isEditable)}
              {visibleColumns.salida_destino && renderProgramadorHeader('salida_destino', 'Salida destino', isEditable)}
              {visibleColumns.hora_revision_puerto && renderProgramadorHeader('hora_revision_puerto', 'Revision puerto', false)}
              {visibleColumns.movimiento && renderProgramadorHeader('movimiento', 'Movimiento', isEditable)}
              {visibleColumns.contenedor && renderProgramadorHeader('contenedor', 'Contenedor', isEditable)}
              {visibleColumns.articulo_serial && renderProgramadorHeader('articulo_serial', 'Articulo serial', isEditable)}
              {visibleColumns.serial && renderProgramadorHeader('serial', 'Serial', isEditable)}
              {visibleColumns.estado_listado && renderProgramadorHeader('estado_listado', 'Estado', isEditable)}
              {visibleColumns.agregar_serial && renderProgramadorHeader('agregar_serial', '', isEditable)}
              {visibleColumns.evidencia && renderProgramadorHeader('evidencia', 'Evid.', isEditable)}
              {visibleColumns.historial && renderProgramadorHeader('historial', '', isEditable)}
              {visibleColumns.eliminar && renderProgramadorHeader('eliminar', '', isEditable)}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const contenedorColorMap = buildContenedorColorMap(rows);
              return rows.map((item, rowIndex) => {
              const rowEditable = canEditRow(item);
              const rowTimeEditable = !rowEditable && canEditTimeColumns(item);
              const rowPending = normalizeValue(item?.estado_listado) !== ESTADO_LISTADO_ACTUALIZADO;
              const contenedor = item?.contenedor || item?.contenedorLabel || '';
              const isDemo = contenedor === 'DEMO0000000';
              const rowBgColor = isDemo ? undefined : (contenedorColorMap[contenedor] || undefined);
              const baseStyle = rowEditable ? editableCellStyle : compactCellStyle;
              const demoStyle = isDemo ? { color: 'red', backgroundColor: 'transparent' } : {};
              const cellStyle = rowBgColor
                ? { ...baseStyle, backgroundColor: rowBgColor }
                : { ...baseStyle, ...demoStyle };
              const accentClass = (rowBgColor || isDemo) ? '' : 'table-success';
              const accentClassPatio = (rowBgColor || isDemo) ? '' : 'table-warning';
              const accentClass2 = (rowBgColor || isDemo) ? '' : 'table-primary';
              const hasMultipleProducts = (item.productosViaje || []).length > 1;
              return (
                <tr
                  key={item.id}
                  className={isDemo ? 'row-demo' : undefined}
                  style={{
                    ...(item.groupStart && !hasMultipleProducts ? { borderTop: '2px solid #356854' } : {}),
                    ...(hasMultipleProducts ? { borderTop: '2px solid #6c757d', borderBottom: '2px solid #6c757d' } : {}),
                    minHeight: 28,
                  }}
                >
                  <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">{rowNumbers[rowIndex]}</div>
                  </td>
                  {visibleColumns.semana && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">{item.semanaLabel}</div>
                  </td>}
                  {visibleColumns.fecha && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        type="date"
                        defaultValue={item.fecha || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleCellEdit(item.id, 'fecha', e.target.value)}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.fecha}</div>
                    )}
                  </td>}
                  {visibleColumns.origen && <td className={`${accentClass} text-center align-middle p-0`} style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="origen-options"
                        defaultValue={item.origen || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'origen', e.target.value)}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.origen}</div>
                    )}
                  </td>}
                  {visibleColumns.destino && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="destino-options"
                        defaultValue={item.destino || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'destino', e.target.value)}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.destino}</div>
                    )}
                  </td>}
                  {visibleColumns.productos && (() => {
                    const pvs = item.productosViaje || [];
                    const borradores = rowEditable && pvs.length > 0 ? espaciosNuevos(item.id, pvs.length) : 0;
                    const inputProducto = (valor, campo, placeholder, key) => (
                      <input
                        key={key}
                        list="producto-options"
                        defaultValue={valor}
                        placeholder={placeholder}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        style={{ minWidth: 80 }}
                        onBlur={(e) => handleLookupTextEdit(item, campo, e.target.value)}
                      />
                    );
                    return (
                      <td className="text-center align-middle p-0" style={cellStyle}>
                        {pvs.length === 0 && (rowEditable
                          ? inputProducto('', 'producto', 'Producto', `prod-${item.id}-vacio`)
                          : <span className="py-1" style={{ fontSize: '0.75rem', color: '#000' }}>{item.productoLabel || ''}</span>)}
                        {pvs.map((pv, index) => (
                          <div
                            key={`prod-${item.id}-${index}-${pv?.id || ''}`}
                            className={`d-flex align-items-center justify-content-center gap-1 px-1 ${index > 0 ? 'border-top' : ''}`}
                          >
                            {rowEditable
                              ? inputProducto(pv?.label || '', index === 0 ? 'producto' : `producto:${index}`, `Producto ${index + 1}`, `prod-${item.id}-${index}-${pv?.id || ''}-i`)
                              : <span className="py-1" style={{ fontSize: '0.75rem', color: '#000' }}>{pv?.label || ''}</span>}
                            {rowEditable && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-danger"
                                title={`Quitar producto ${index + 1}`}
                                onClick={() => handleEliminarProducto(item, index)}
                              >
                                <FaMinus size={10} />
                              </button>
                            )}
                            {rowEditable && index === pvs.length - 1 && borradores === 0 && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success"
                                title="Agregar producto"
                                onClick={() => agregarEspacioNuevo(item.id, pvs.length)}
                              >
                                <FaPlus size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                        {Array.from({ length: borradores }, (_, k) => (
                          <div key={`prod-${item.id}-nuevo-${pvs.length}-${k}`} className="d-flex align-items-center justify-content-center gap-1 px-1 border-top">
                            {inputProducto('', `producto:${pvs.length}`, `Producto ${pvs.length + k + 1}`, `prod-${item.id}-nuevo-${pvs.length}-${k}-i`)}
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-danger"
                              title="Quitar producto nuevo"
                              onClick={() => quitarEspacioNuevo(item.id, pvs.length)}
                            >
                              <FaMinus size={10} />
                            </button>
                            {k === borradores - 1 && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-success"
                                title="Agregar producto"
                                onClick={() => agregarEspacioNuevo(item.id, pvs.length)}
                              >
                                <FaPlus size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })()}
                  {visibleColumns.cantidad_productos && (() => {
                    const pvs = item.productosViaje || [];
                    const borradores = rowEditable && pvs.length > 0 ? espaciosNuevos(item.id, pvs.length) : 0;
                    return (
                      <td className="text-center align-middle p-0" style={cellStyle}>
                        {pvs.length === 0 && (rowEditable ? (
                          <input
                            key={`qty-${item.id}-vacio`}
                            type="number"
                            min="0"
                            step="1"
                            defaultValue=""
                            disabled
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                          />
                        ) : null)}
                        {pvs.map((pv, index) => (
                          <div key={`qty-${item.id}-${index}-${pv?.id || ''}`} className={`px-1 ${index > 0 ? 'border-top' : ''}`}>
                            {rowEditable ? (
                              <input
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={pv?.cantidad ?? ''}
                                placeholder={`Cant. ${index + 1}`}
                                className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                                onBlur={(e) => handleLookupTextEdit(item, index === 0 ? 'cantidad' : `cantidad:${index}`, e.target.value)}
                              />
                            ) : (
                              <div className="py-1 text-center" style={{ fontSize: '0.75rem', color: '#000' }}>{pv?.cantidad ?? ''}</div>
                            )}
                          </div>
                        ))}
                        {Array.from({ length: borradores }, (_, k) => (
                          <div key={`qty-${item.id}-nuevo-${pvs.length}-${k}`} className="px-1 border-top">
                            <input
                              type="number"
                              disabled
                              placeholder={`Cant. ${pvs.length + k + 1}`}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            />
                          </div>
                        ))}
                      </td>
                    );
                  })()}
                  {visibleColumns.linea && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">{item.lineaLabel || ''}</div>
                  </td>}
                  {visibleColumns.destino_embarque && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">{item.embarqueDestinoLabel || ''}</div>
                  </td>}
                  {visibleColumns.buque && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">{item.buqueLabel || ''}</div>
                  </td>}
                  {visibleColumns.bl && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="bl-options"
                        defaultValue={item.blLabel || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'bl', e.target.value)}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.blLabel || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.vehiculo && <td className="text-center align-middle p-0" style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input
                        list="vehiculo-options"
                        defaultValue={item.vehiculoLabel || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'vehiculo', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.vehiculoLabel}</div>
                    )}
                  </td>}
                  {visibleColumns.transportadora && (
                    <td className="text-center align-middle p-0" style={cellStyle}>
                      <div className="py-1 px-1 text-center">{item.transportadoraLabel || ''}</div>
                    </td>
                  )}
                  {visibleColumns.conductor && <td className="text-center align-middle p-0" style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input
                        list="conductor-options"
                        defaultValue={item.conductorLabel || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'conductor', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.conductorLabel}</div>
                    )}
                  </td>}
                  {visibleColumns.llegada_origen && <td className={`${accentClass} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.llegada_origen || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'llegada_origen', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.llegada_origen || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.salida_origen && <td className={`${accentClass} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.salida_origen || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'salida_origen', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.salida_origen || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.llegada_patio && <td className={`${accentClassPatio} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.llegada_patio || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'llegada_patio', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.llegada_patio || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.retiro_patio && <td className={`${accentClassPatio} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.retiro_patio || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'retiro_patio', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.retiro_patio || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.llegada_destino && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.llegada_destino || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'llegada_destino', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.llegada_destino || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.cierre && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.cierre || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'cierre', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.cierre || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.salida_destino && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.salida_destino || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'salida_destino', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.salida_destino || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.hora_revision_puerto && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center text-nowrap">
                      {item.hora_revision_puerto
                        ? new Date(item.hora_revision_puerto).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' })
                        : ''}
                    </div>
                  </td>}
                  {visibleColumns.movimiento && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="movimiento-options"
                        defaultValue={item.movimientoLabel || 'Local'}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'movimiento', e.target.value)}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.movimientoLabel}</div>
                    )}
                  </td>}
                  {visibleColumns.contenedor && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        type="text"
                        defaultValue={item.contenedorLabel || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleCellEdit(item.id, 'contenedor', e.target.value)}
                      />
                    ) : (
                      <div className="py-1 px-1 text-center">{item.contenedorLabel || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.articulo_serial && (
                    <td className="text-center align-middle p-0" style={compactCellStyle}>
                      <div className="py-1 px-1 text-center">{formatSerialArticuloLabel(item) || ''}</div>
                    </td>
                  )}
                  {visibleColumns.serial && (
                    <td className="text-center align-middle p-0" style={compactCellStyle}>
                      <div className="py-1 px-1 text-center">{formatSerialLabel(item) || ''}</div>
                    </td>
                  )}
                  {visibleColumns.estado_listado && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">
                      {isSuperAdmin ? (
                        <button
                          type="button"
                          title={normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? 'Actualizado — click para marcar pendiente' : 'Pendiente — click para marcar actualizado'}
                          onClick={() => {
                            const next = normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO
                              ? ESTADO_LISTADO_PENDIENTE
                              : ESTADO_LISTADO_ACTUALIZADO;
                            handleCellEdit(item.id, 'estado_listado', next);
                          }}
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? '#198754' : '#ffc107',
                            boxShadow: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? '0 0 0 2px #d1e7dd' : '0 0 0 2px #fff3cd',
                            cursor: 'pointer',
                            border: 'none',
                            padding: 0,
                          }}
                        />
                      ) : (
                        <span
                          title={item.estadoListadoLabel}
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? '#198754' : '#ffc107',
                            boxShadow: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? '0 0 0 2px #d1e7dd' : '0 0 0 2px #fff3cd',
                          }}
                        />
                      )}
                    </div>
                  </td>}
                  {visibleColumns.agregar_serial && (
                    <td className="text-center align-middle p-0" style={compactCellStyle}>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-decoration-none p-0"
                        style={{ width: 26, height: 26, lineHeight: '24px', color: '#0d6efd' }}
                        onClick={() => abrirModalSeriales(item)}
                        title="Agregar serial"
                      >
                        <FaPlus size={12} />
                      </Button>
                    </td>
                  )}
                  {visibleColumns.evidencia && (
                    <td className="text-center align-middle p-0" style={cellStyle}>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-decoration-none p-0"
                        style={{ width: 26, height: 26, lineHeight: '24px', color: item.evidenciaSubida ? '#319c5c' : '#f0ad4e' }}
                        onClick={() => (item.evidenciaSubida ? abrirVerEvidencias(item) : abrirModalEvidencia(item))}
                        title={item.evidenciaSubida ? 'Ver evidencia cargada' : 'Subir evidencia fotografica'}
                      >
                        <FaCamera size={12} />
                      </Button>
                    </td>
                  )}
                  {visibleColumns.historial && (
                    <td className="text-center align-middle p-0" style={cellStyle}>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-decoration-none p-0"
                        style={{ width: 26, height: 26, lineHeight: '24px', color: '#0d6efd' }}
                        title="Ver historial de cambios"
                        onClick={() => abrirHistorial(item.id)}
                      >
                        <FaHistory size={12} />
                      </button>
                    </td>
                  )}
                  {visibleColumns.eliminar && (
                    <td className="text-center align-middle p-0" style={cellStyle}>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-decoration-none p-0"
                        style={{ width: 26, height: 26, lineHeight: '24px', color: rowPending ? '#7f1d1d' : '#6c757d' }}
                        title={rowPending ? 'Eliminar' : 'Solo se eliminan pendientes'}
                        disabled={!rowPending}
                        onClick={() => eliminar(item.id)}
                      >
                        <FaTrashAlt size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            });
            })()}

            {!rows.length && (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 1} className="py-3 text-center">
                  {loading ? 'Cargando...' : 'No hay movimientos para los filtros seleccionados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 d-flex justify-content-center">
        <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={pageLimit} />
      </div>
    </>
  );
}
