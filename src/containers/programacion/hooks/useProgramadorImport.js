import * as XLSX from 'xlsx';
import { useState } from 'react';
import {
  agregarProgramaciones,
  actualizarMasivoProgramaciones,
  listarProgramaciones,
  paginarProgramaciones,
} from '@services/api/programaciones';
import { agregarProductosViaje, actualizarProductosViaje } from '@services/api/productos_viaje';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import { listarVehiculo } from '@services/api/vehiculos';
import { paginarEmbarques } from '@services/api/embarques';
import { listarCombos } from '@services/api/combos';
import { listartipoMovimientoVehiculos } from '@services/api/tipoMovimientoVehiculos';
import {
  normalizeValue,
  getRowValue,
  getTransportadoraLabel,
  formatDateCell,
  formatTimeCell,
  buildFilterBody,
} from '../programadorUtils';

export function useProgramadorImport({
  vehiculosSinCombustible,
  ensureRoute,
  combos,
  ubicaciones,
  conductores,
  vehiculos,
  embarques,
  tiposMovimiento,
  embarqueMap,
  formRef,
  setAlert,
  setReloadKey,
}) {
  const [importing, setImporting] = useState(false);
  const [updatingMass, setUpdatingMass] = useState(false);

  const resolveImportPayload = async (row, catalogs) => {
    const { ubicacionesList, conductoresList, vehiculosList, tiposMovimientoList, embarquesList, combosList } = catalogs;

    const fecha = formatDateCell(getRowValue(row, ['Fecha']));
    const vehiculoText = String(getRowValue(row, ['Vehiculo', 'Vehiculos', 'VehÃ­culo', 'Placa'])).trim();
    const conductorText = String(getRowValue(row, ['Conductor', 'Conductores'])).trim();
    const blText = String(getRowValue(row, ['BL', 'Bl', 'Bill of Loading'])).trim();
    const origenText = String(getRowValue(row, ['Origen', 'Ubicacion 1', 'UbicaciÃ³n 1'])).trim();
    const destinoText = String(getRowValue(row, ['Destino L', 'Destino', 'Ubicacion 2', 'UbicaciÃ³n 2'])).trim();
    const productoText = String(getRowValue(row, ['Producto'])).trim();
    const cantidadText = String(getRowValue(row, ['Cantidad', 'Cajas'])).trim();
    const movimientoText = String(getRowValue(row, ['Movimiento'])).trim();
    const contenedorText = String(getRowValue(row, ['Contenedor', 'Numero contenedor', 'NÃºmero contenedor'])).trim();
    const detallesText = String(getRowValue(row, ['Observaciones', 'Detalle', 'Detalles'])).trim();
    const llegadaOrigen = formatTimeCell(getRowValue(row, ['Llegada origen', 'Ingreso origen']));
    const salidaOrigen = formatTimeCell(getRowValue(row, ['Salida origen']));
    const llegadaDestino = formatTimeCell(getRowValue(row, ['Llegada destino', 'Ingreso destino']));
    const cierre = formatTimeCell(getRowValue(row, ['Cierre']));
    const salidaDestino = formatTimeCell(getRowValue(row, ['Salida destino']));
    const idText = String(getRowValue(row, ['Id', 'ID', 'Programacion ID', 'ProgramaciÃ³n ID'])).trim();

    if (!fecha || !vehiculoText || !conductorText || !origenText || !destinoText || !blText || !movimientoText || !productoText || !cantidadText) {
      throw new Error('faltan columnas obligatorias.');
    }

    const vehiculo = vehiculosList.find((item) => normalizeValue(item?.placa) === normalizeValue(vehiculoText));
    const conductor = conductoresList.find((item) => normalizeValue(item?.conductor) === normalizeValue(conductorText));
    const origen = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(origenText));
    const destino = ubicacionesList.find((item) => normalizeValue(item?.ubicacion) === normalizeValue(destinoText));
    const embarque = (embarquesList || []).find((item) => (
      normalizeValue(item?.bl) === normalizeValue(blText)
      || normalizeValue(item?.booking) === normalizeValue(blText)
    ));
    const combo = (combosList || []).find((item) => normalizeValue(item?.nombre) === normalizeValue(productoText));
    const cantidad = Number(cantidadText);

    if (!vehiculo) throw new Error(`vehiculo "${vehiculoText}" no encontrado.`);
    if (!conductor) throw new Error(`conductor "${conductorText}" no encontrado.`);
    if (!origen) throw new Error(`origen "${origenText}" no encontrado.`);
    if (!destino) throw new Error(`destino "${destinoText}" no encontrado.`);
    if (!embarque) throw new Error(`BL "${blText}" no encontrado en embarques.`);
    if (!combo || combo?.isBlock === true) throw new Error(`producto "${productoText}" no existe o esta bloqueado.`);
    if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error(`cantidad "${cantidadText}" no es valida.`);

    const movimiento = tiposMovimientoList.find(
      (item) => normalizeValue(item?.movimiento) === normalizeValue(movimientoText)
    );

    if (!movimiento) {
      throw new Error(`el movimiento "${movimientoText}" no existe.`);
    }

    if (movimiento?.requiere_contenedor && !contenedorText) {
      throw new Error(`el movimiento ${movimiento.movimiento} requiere numero de contenedor.`);
    }

    const vehiculoExento = vehiculosSinCombustible.includes(String(vehiculo.id));
    if (!vehiculoExento && String(origen.id) === String(destino.id)) {
      throw new Error('origen y destino no pueden ser iguales.');
    }

    const rutaId = await ensureRoute(origen.id, destino.id, {
      vehiculoId: vehiculo.id,
      allowCreateIfExempt: true,
    });

    const semana = String(embarque?.semanas?.consecutivo || embarque?.semana?.consecutivo || '').trim();
    if (!semana) {
      throw new Error(`el BL "${blText}" no tiene semana asociada.`);
    }

    return {
      idText,
      match: {
        fecha,
        semana,
        vehiculoId: String(vehiculo.id),
        rutaId: String(rutaId),
        bl: embarque?.bl || blText,
        movimiento: movimiento.movimiento,
      },
      payload: {
        ruta_id: rutaId,
        cobrar: false,
        id_pagador_flete: combo?.id_cliente || embarque?.id_cliente || null,
        activo: true,
        movimiento: movimiento.movimiento,
        conductor_id: conductor.id,
        vehiculo_id: vehiculo.id,
        contenedor: contenedorText || null,
        bl: embarque?.bl || blText,
        semana,
        fecha,
        detalles: detallesText,
        llegada_origen: llegadaOrigen,
        salida_origen: salidaOrigen,
        llegada_destino: llegadaDestino,
        cierre,
        salida_destino: salidaDestino,
      },
      productoPayload: {
        producto_id: combo.id,
        cantidad,
      },
    };
  };

  const findExistingProgramacion = (existingRows, resolved) => {
    if (resolved.idText) {
      return existingRows.find((item) => String(item?.id || '') === String(resolved.idText));
    }

    return existingRows.find((item) => (
      String(item?.fecha || '') === String(resolved.match.fecha)
      && String(item?.semana || '') === String(resolved.match.semana)
      && String(item?.vehiculo_id || '') === String(resolved.match.vehiculoId)
      && String(item?.ruta_id || '') === String(resolved.match.rutaId)
      && normalizeValue(item?.movimiento) === normalizeValue(resolved.match.movimiento)
      && normalizeValue(item?.bl) === normalizeValue(resolved.match.bl)
    ));
  };

  const processProgramacionRows = async (parsedRows = [], mode = 'create') => {
    const isUpdate = mode === 'update';
    const setBusy = isUpdate ? setUpdatingMass : setImporting;

    try {
      setBusy(true);
      if (!parsedRows.length) {
        throw new Error('El archivo no tiene filas para procesar.');
      }

      const ubicacionesList = ubicaciones.length ? ubicaciones : await listarUbicaciones();
      const conductoresList = conductores.length ? conductores : await listarConductores();
      const vehiculosList = vehiculos.length ? vehiculos : await listarVehiculo();
      const embarquesList = embarques.length ? embarques : (await paginarEmbarques(1, 5000, {}))?.data || [];
      const combosList = combos.length ? combos : await listarCombos();
      const tiposMovimientoList = tiposMovimiento.length ? tiposMovimiento : await listartipoMovimientoVehiculos();
      const existingRows = isUpdate ? (await listarProgramaciones()) || [] : [];

      const resolvedList = [];
      const errors = [];

      await Promise.all(parsedRows.map(async (row, index) => {
        try {
          const resolved = await resolveImportPayload(row, {
            ubicacionesList,
            conductoresList,
            vehiculosList,
            tiposMovimientoList,
            embarquesList,
            combosList,
          });
          resolvedList[index] = resolved;
        } catch (error) {
          errors.push(`Fila ${index + 2}: ${error.message || 'no se pudo procesar.'}`);
          resolvedList[index] = null;
        }
      }));

      const validResolved = resolvedList.filter(Boolean);
      let processed = 0;

      if (isUpdate) {
        const updateRows = validResolved.map((resolved) => {
          const existing = findExistingProgramacion(existingRows, resolved);
          if (!existing?.id) return null;
          return { id: existing.id, ...resolved.payload, existingRow: existing, productoPayload: resolved.productoPayload };
        }).filter(Boolean);

        if (updateRows.length) {
          const bulkResult = await actualizarMasivoProgramaciones(
            updateRows.map(({ existingRow, productoPayload, ...row }) => row) // eslint-disable-line no-unused-vars
          );
          processed = bulkResult?.processed || 0;
          (bulkResult?.errors || []).forEach((e) => errors.push(`ID ${e.id}: ${e.error}`));

          await Promise.all(updateRows.map(async ({ existingRow, productoPayload }) => {
            try {
              const productoExistente = Array.isArray(existingRow?.productos_viajes) ? existingRow.productos_viajes[0] : null;
              if (productoExistente?.id) {
                await actualizarProductosViaje(productoExistente.id, productoPayload);
              } else {
                await agregarProductosViaje({
                  ...productoPayload,
                  unidad_de_medida: '',
                  activo: true,
                  programacion_id: existingRow.id,
                });
              }
            } catch {
              // error de producto no bloquea el conteo de programaciones procesadas
            }
          }));
        }

        validResolved.forEach((resolved) => {
          const existing = findExistingProgramacion(existingRows, resolved);
          if (!existing?.id) {
            const originalIndex = resolvedList.indexOf(resolved);
            errors.push(`Fila ${originalIndex + 2}: no se encontro una programacion existente para actualizar.`);
          }
        });
      } else {
        for (let index = 0; index < validResolved.length; index += 1) {
          const resolved = validResolved[index];
          const originalIndex = resolvedList.indexOf(resolved);
          try {
            const created = await agregarProgramaciones(resolved.payload);
            await agregarProductosViaje({
              ...resolved.productoPayload,
              unidad_de_medida: '',
              activo: true,
              programacion_id: created?.id,
            });
            processed += 1;
          } catch (error) {
            errors.push(`Fila ${originalIndex + 2}: ${error.message || 'no se pudo procesar.'}`);
          }
        }
      }

      setReloadKey((prev) => prev + 1);
      setAlert({
        active: true,
        mensaje: errors.length
          ? `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas. ${errors.length} filas quedaron con error.`
          : `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas correctamente.`,
        color: errors.length ? 'warning' : 'success',
        autoClose: true,
      });
      return {
        message: errors.length
          ? `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas. ${errors.length} filas quedaron con error.`
          : `Se ${isUpdate ? 'actualizaron' : 'importaron'} ${processed} filas correctamente.`,
      };
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || `No fue posible ${isUpdate ? 'actualizar' : 'importar'} el Excel.`,
        color: 'danger',
        autoClose: true,
      });
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const descargarExcel = async () => {
    try {
      const body = formRef.current ? buildFilterBody(formRef.current) : {};
      const { data } = await paginarProgramaciones('', '', body);
      const exportRows = (data || []).map((item) => {
        const embarque = embarqueMap.get(normalizeValue(item?.bl)) || null;
        return {
          Semana: item?.semana || '',
          Fecha: item?.fecha || '',
          Origen: item?.ruta?.ubicacion_1?.ubicacion || '',
          Destino: item?.ruta?.ubicacion_2?.ubicacion || '',
          Producto: combos.find((combo) => String(combo?.id || '') === String(item?.productos_viajes?.[0]?.producto_id || ''))?.nombre || '',
          Cantidad: item?.productos_viajes?.[0]?.cantidad || '',
          Linea: embarque?.lineaLabel || '',
          'Destino embarque': embarque?.destinoLabel || '',
          Buque: embarque?.buqueLabel || '',
          BL: item?.bl || '',
          'Estado listado': normalizeValue(item?.estado_listado) === 'actualizado' ? 'Actualizado' : 'Pendiente',
          Vehiculo: item?.vehiculo?.placa || '',
          Transportadora: getTransportadoraLabel(item?.vehiculo?.transportadora || {}),
          Conductor: item?.conductor?.conductor || '',
          Movimiento: item?.movimiento || '',
          Contenedor: item?.contenedor || '',
          'Llegada origen': item?.llegada_origen || '',
          'Salida origen': item?.salida_origen || '',
          'Llegada destino': item?.llegada_destino || '',
          Cierre: item?.cierre || '',
          'Salida destino': item?.salida_destino || '',
          Observaciones: item?.detalles || '',
        };
      });

      const book = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(book, sheet, 'Programador');
      XLSX.writeFile(book, 'Programador.xlsx');
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible descargar el Excel.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  return {
    importing,
    updatingMass,
    processProgramacionRows,
    descargarExcel,
  };
}
