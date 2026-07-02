import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { FaCamera, FaPlus, FaTrashAlt } from 'react-icons/fa';
import Paginacion from '@components/shared/Tablas/Paginacion';
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
  handleEliminarProducto2,
  abrirModalSeriales,
  abrirModalEvidencia,
  eliminar,
  pagination,
  setPagination,
  total,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleExpand = (id) => setExpandedRows((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
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
      `}</style>
      <div className="table-responsive mt-4" style={{ overflowX: 'auto', maxHeight: '75vh', overflowY: 'auto' }}>
        <table
          className="table table-striped table-bordered table-sm mt-2 text-center align-middle mb-0 programador-table"
          style={{ minWidth: isEditable ? '2400px' : '1600px', tableLayout: 'auto', whiteSpace: 'nowrap', fontSize: '0.8rem' }}
        >
          <thead className="align-middle" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', position: 'sticky', top: 0, zIndex: 2, backgroundColor: '#fff' }}>
            <tr>
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
              {visibleColumns.movimiento && renderProgramadorHeader('movimiento', 'Movimiento', isEditable)}
              {visibleColumns.contenedor && renderProgramadorHeader('contenedor', 'Contenedor', isEditable)}
              {visibleColumns.articulo_serial && renderProgramadorHeader('articulo_serial', 'Articulo serial', isEditable)}
              {visibleColumns.serial && renderProgramadorHeader('serial', 'Serial', isEditable)}
              {visibleColumns.estado_listado && renderProgramadorHeader('estado_listado', 'Estado', isEditable)}
              {visibleColumns.agregar_serial && renderProgramadorHeader('agregar_serial', '', isEditable)}
              {visibleColumns.evidencia && renderProgramadorHeader('evidencia', 'Evid.', isEditable)}
              {visibleColumns.eliminar && renderProgramadorHeader('eliminar', '', isEditable)}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const contenedorColorMap = buildContenedorColorMap(rows);
              return rows.map((item) => {
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
                    minHeight: 36,
                  }}
                >
                  {visibleColumns.semana && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-2 px-1 text-center">{item.semanaLabel}</div>
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
                      <div className="py-2 px-1 text-center">{item.fecha}</div>
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
                      <div className="py-2 px-1 text-center">{item.origen}</div>
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
                      <div className="py-2 px-1 text-center">{item.destino}</div>
                    )}
                  </td>}
                  {visibleColumns.productos && (() => {
                    const pvs = item.productosViaje || [];
                    const hasMultiple = pvs.length > 1;
                    const isExpanded = expandedRows.has(item.id);
                    const showSecond = hasMultiple || isExpanded;
                    const pv2 = pvs[1];
                    return (
                      <td className="text-center align-middle p-0" style={cellStyle}>
                        <div className="d-flex align-items-center justify-content-center gap-1 px-1">
                          {rowEditable ? (
                            <input
                              key={`prod-${item.id}-0`}
                              list="producto-options"
                              defaultValue={item.productoLabel || ''}
                              className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                              style={{ minWidth: 80 }}
                              onBlur={(e) => handleLookupTextEdit(item, 'producto', e.target.value)}
                            />
                          ) : (
                            <span className="py-2" style={{ fontSize: '0.75rem', color: '#000' }}>{item.productoLabel || ''}</span>
                          )}
                          {rowEditable && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-success"
                              title="Agregar producto"
                              onClick={() => toggleExpand(item.id)}
                            >
                              <FaPlus size={10} />
                            </button>
                          )}
                        </div>
                        {showSecond && (
                          <div className="border-top pt-1 mt-1 px-1">
                            {rowEditable ? (
                              <div className="d-flex align-items-center gap-1">
                                <input
                                  key={`prod-${item.id}-1`}
                                  list="producto-options"
                                  defaultValue={pv2?.label || ''}
                                  placeholder="Producto 2"
                                  className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                                  style={{ minWidth: 80 }}
                                  onBlur={(e) => handleLookupTextEdit(item, 'producto2', e.target.value)}
                                />
                                {pv2 && (
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0 text-danger"
                                    title="Eliminar segundo producto"
                                    onClick={() => handleEliminarProducto2(item)}
                                  >
                                    <FaTrashAlt size={10} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="py-1 text-center" style={{ fontSize: '0.75rem', color: '#000' }}>{pv2?.label || ''}</div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })()}
                  {visibleColumns.cantidad_productos && (() => {
                    const pvs = item.productosViaje || [];
                    const pv2 = pvs[1];
                    const hasMultiple = pvs.length > 1;
                    const isExpanded = expandedRows.has(item.id);
                    const showSecond = hasMultiple || isExpanded;
                    return (
                      <td className="text-center align-middle p-0" style={cellStyle}>
                        {rowEditable ? (
                          <input
                            key={`qty-${item.id}-0`}
                            type="number"
                            min="0"
                            step="1"
                            defaultValue={item.cantidadProductosLabel || ''}
                            className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                            onBlur={(e) => handleLookupTextEdit(item, 'cantidad', e.target.value)}
                          />
                        ) : (
                          <div className="py-2 px-1 text-center" style={{ fontSize: '0.75rem', color: '#000' }}>{item.cantidadProductosLabel || ''}</div>
                        )}
                        {showSecond && (
                          <div className="border-top pt-1 mt-1 px-1">
                            {rowEditable ? (
                              <input
                                key={`qty-${item.id}-1`}
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={pv2?.cantidad ?? ''}
                                placeholder="Cant. 2"
                                className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                                onBlur={(e) => handleLookupTextEdit(item, 'cantidad2', e.target.value)}
                              />
                            ) : (
                              <div className="py-1 text-center" style={{ fontSize: '0.75rem', color: '#000' }}>{pv2?.cantidad ?? ''}</div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })()}
                  {visibleColumns.linea && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-2 px-1 text-center">{item.lineaLabel || ''}</div>
                  </td>}
                  {visibleColumns.destino_embarque && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-2 px-1 text-center">{item.embarqueDestinoLabel || ''}</div>
                  </td>}
                  {visibleColumns.buque && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-2 px-1 text-center">{item.buqueLabel || ''}</div>
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
                      <div className="py-2 px-1 text-center">{item.blLabel || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.vehiculo && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="vehiculo-options"
                        defaultValue={item.vehiculoLabel || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'vehiculo', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.vehiculoLabel}</div>
                    )}
                  </td>}
                  {visibleColumns.transportadora && (
                    <td className="text-center align-middle p-0" style={cellStyle}>
                      <div className="py-2 px-1 text-center">{item.transportadoraLabel || ''}</div>
                    </td>
                  )}
                  {visibleColumns.conductor && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="conductor-options"
                        defaultValue={item.conductorLabel || ''}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'conductor', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.conductorLabel}</div>
                    )}
                  </td>}
                  {visibleColumns.llegada_origen && <td className={`${accentClass} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.llegada_origen || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'llegada_origen', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.llegada_origen || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.salida_origen && <td className={`${accentClass} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.salida_origen || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'salida_origen', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.salida_origen || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.llegada_patio && <td className={`${accentClassPatio} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.llegada_patio || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'llegada_patio', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.llegada_patio || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.retiro_patio && <td className={`${accentClassPatio} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.retiro_patio || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'retiro_patio', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.retiro_patio || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.llegada_destino && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.llegada_destino || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'llegada_destino', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.llegada_destino || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.cierre && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.cierre || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'cierre', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.cierre || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.salida_destino && <td className={`${accentClass2} text-center align-middle p-0`} style={cellStyle}>
                    {(rowEditable || rowTimeEditable) ? (
                      <input type="time" defaultValue={item.salida_destino || ''} className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1" onBlur={(e) => handleCellEdit(item.id, 'salida_destino', e.target.value, rowTimeEditable ? { preserveEstado: true } : {})} />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.salida_destino || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.movimiento && <td className="text-center align-middle p-0" style={cellStyle}>
                    {rowEditable ? (
                      <input
                        list="movimiento-options"
                        defaultValue={item.movimiento || 'Local'}
                        className="form-control form-control-sm text-center rounded-0 border-0 bg-transparent px-1"
                        onBlur={(e) => handleLookupTextEdit(item, 'movimiento', e.target.value)}
                      />
                    ) : (
                      <div className="py-2 px-1 text-center">{item.movimiento}</div>
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
                      <div className="py-2 px-1 text-center">{item.contenedorLabel || ''}</div>
                    )}
                  </td>}
                  {visibleColumns.articulo_serial && (
                    <td className="text-center align-middle p-0" style={compactCellStyle}>
                      <div className="py-2 px-1 text-center">{formatSerialArticuloLabel(item) || ''}</div>
                    </td>
                  )}
                  {visibleColumns.serial && (
                    <td className="text-center align-middle p-0" style={compactCellStyle}>
                      <div className="py-2 px-1 text-center">{formatSerialLabel(item) || ''}</div>
                    </td>
                  )}
                  {visibleColumns.estado_listado && <td className="text-center align-middle p-0" style={cellStyle}>
                    <div className="py-1 px-1 text-center">
                      <span
                        title={isSuperAdmin
                          ? (normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? 'Actualizado — click para marcar pendiente' : 'Pendiente — click para marcar actualizado')
                          : item.estadoListadoLabel}
                        onClick={isSuperAdmin ? () => {
                          const next = normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO
                            ? ESTADO_LISTADO_PENDIENTE
                            : ESTADO_LISTADO_ACTUALIZADO;
                          handleCellEdit(item.id, 'estado_listado', next);
                        } : undefined}
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? '#198754' : '#ffc107',
                          boxShadow: normalizeValue(item?.estado_listado) === ESTADO_LISTADO_ACTUALIZADO ? '0 0 0 2px #d1e7dd' : '0 0 0 2px #fff3cd',
                          cursor: isSuperAdmin ? 'pointer' : 'default',
                        }}
                      />
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
                        style={{ width: 26, height: 26, lineHeight: '24px', color: item.evidenciaSubida ? '#7e83889d' : '#319c5c' }}
                        onClick={() => abrirModalEvidencia(item)}
                        title={item.evidenciaSubida ? 'Evidencia cargada' : 'Subir evidencia fotografica'}
                      >
                        <FaCamera size={12} />
                      </Button>
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
        <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={PAGE_LIMIT} />
      </div>
    </>
  );
}
