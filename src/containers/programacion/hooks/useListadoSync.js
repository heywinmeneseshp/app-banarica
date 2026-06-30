import * as XLSX from 'xlsx';
import { useCallback, useState } from 'react';
import { paginarProgramaciones } from '@services/api/programaciones';
import { actualizarListadoMasivo } from '@services/api/listado';
import { listarAlmacenes } from '@services/api/almacenes';
import { vincularContenedoresProgramacionSeriales } from '@services/api/programacionSeriales';
import { normalizeValue, ESTADO_LISTADO_PENDIENTE, ESTADO_LISTADO_ACTUALIZADO } from '../programadorUtils';

export function useListadoSync({ setAlert, markProgramacionesEstadoListado }) {
  const [syncingListado, setSyncingListado] = useState(false);
  const [pendingListadoSync, setPendingListadoSync] = useState(null);

  const findAlmacenFromUbicacion = useCallback((ubicacionDestino, almacenesList = []) => {
    const cod = normalizeValue(ubicacionDestino?.cod);
    const nombre = normalizeValue(ubicacionDestino?.ubicacion);

    return almacenesList.find((almacen) => (
      (cod && normalizeValue(almacen?.consecutivo) === cod)
      || (nombre && normalizeValue(almacen?.nombre) === nombre)
    )) || null;
  }, []);

  const buildListadoUpdateRowsFromProgramaciones = useCallback((programaciones = [], almacenesList = []) => {
    const groupedRows = new Map();
    const skippedRows = [];

    [...programaciones]
      .sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
      .forEach((item) => {
        const fecha = String(item?.fecha || '').trim();
        const contenedor = String(item?.contenedor || '').trim();
        const bl = String(item?.bl || '').trim();

        if (!fecha || !contenedor) {
          return;
        }

        const almacenDestino = findAlmacenFromUbicacion(item?.ruta?.ubicacion_2, almacenesList);
        if (!almacenDestino?.id) {
          skippedRows.push({
            fecha,
            bl,
            contenedor,
            reason: `No se encontro almacen para el destino ${item?.ruta?.ubicacion_2?.ubicacion || 'sin nombre'}`,
          });
          return;
        }

        const productosViajes = Array.isArray(item?.productos_viajes) && item.productos_viajes.length
          ? item.productos_viajes
          : [null];

        productosViajes.forEach((productoViaje) => {
          const productoId = productoViaje?.producto_id || null;
          const cantidad = productoViaje?.cantidad;
          const cantidadNumero = cantidad === null || cantidad === undefined || cantidad === ''
            ? null
            : Number(cantidad);

          const key = `${fecha}__${contenedor}__${bl}__${almacenDestino.id}__${productoId || 'sin-producto'}`;
          const existing = groupedRows.get(key) || {
            fecha,
            contenedor,
            bl,
            id_lugar_de_llenado: almacenDestino.id,
            id_producto: productoId || null,
            cajas_unidades: null,
            programacionIds: [],
          };

          groupedRows.set(key, {
            fecha,
            contenedor,
            bl,
            id_lugar_de_llenado: almacenDestino.id,
            id_producto: productoId || existing.id_producto,
            cajas_unidades: Number.isFinite(cantidadNumero)
              ? (Number(existing.cajas_unidades || 0) + cantidadNumero)
              : existing.cajas_unidades,
            programacionIds: [...new Set([...(existing.programacionIds || []), item.id].filter(Boolean))],
          });
        });
      });

    return {
      rows: Array.from(groupedRows.values()).filter((item) => (
        item.fecha
        && item.contenedor
        && item.id_lugar_de_llenado
      )),
      skippedRows,
    };
  }, [findAlmacenFromUbicacion]);

  const toListadoSyncPayload = useCallback((rows = []) => (
    (rows || []).map((row) => {
      const nextRow = { ...row };
      delete nextRow.programacionIds;
      return nextRow;
    })
  ), []);

  const listadoRowKey = useCallback((row = {}) => [
    normalizeValue(row.fecha),
    normalizeValue(row.contenedor),
    normalizeValue(row.bl || row.booking),
    String(row.id_lugar_de_llenado || ''),
    String(row.id_producto || ''),
  ].join('__'), []);

  const listadoRowMatchesMissing = useCallback((payloadRow = {}, missingRow = {}) => {
    const sameValue = (payloadValue, missingValue) => (
      missingValue === null
      || missingValue === undefined
      || String(missingValue) === ''
      || normalizeValue(payloadValue) === normalizeValue(missingValue)
    );

    return (
      sameValue(payloadRow.fecha, missingRow.fecha)
      && sameValue(payloadRow.contenedor, missingRow.contenedor)
      && sameValue(payloadRow.bl, missingRow.bl || missingRow.booking)
      && sameValue(payloadRow.id_lugar_de_llenado, missingRow.id_lugar_de_llenado)
      && sameValue(payloadRow.id_producto, missingRow.id_producto)
    );
  }, []);

  const getProcessedProgramacionIdsFromListadoResult = useCallback((payloadRows = [], result = {}) => {
    const missingRows = Array.isArray(result?.missingRows) ? result.missingRows : [];

    if (!result?.partial && !result?.requiresConfirmation && Number(result?.missingCount || 0) === 0) {
      return [...new Set(payloadRows.flatMap((item) => item.programacionIds || []))];
    }

    if (!missingRows.length) {
      return Number(result?.missingCount || 0) > 0
        ? []
        : [...new Set(payloadRows.flatMap((item) => item.programacionIds || []))];
    }

    const missingKeys = new Set(missingRows.map((item) => listadoRowKey(item)));
    return [
      ...new Set(
        payloadRows
          .filter((item) => (
            !missingKeys.has(listadoRowKey(item))
            && !missingRows.some((missingRow) => listadoRowMatchesMissing(item, missingRow))
          ))
          .flatMap((item) => item.programacionIds || [])
      ),
    ];
  }, [listadoRowKey, listadoRowMatchesMissing]);

  const vincularSerialesPendientesDeListado = useCallback(async (payloadRows = [], processedIds = []) => {
    const rows = payloadRows
      .filter((row) => (
        (row.programacionIds || []).some((id) => processedIds.includes(id))
      ))
      .flatMap((row) => (row.programacionIds || []).map((programacionId) => ({
        programacion_id: programacionId,
        contenedor: row.contenedor,
      })));

    if (!rows.length) {
      return;
    }

    await vincularContenedoresProgramacionSeriales(rows);
  }, []);

  const sincronizarListadoPendiente = useCallback(async () => {
    try {
      setSyncingListado(true);
      const filtros = { estado_listado: ESTADO_LISTADO_PENDIENTE };

      const [{ data }, almacenesList] = await Promise.all([
        paginarProgramaciones('', '', filtros),
        listarAlmacenes(),
      ]);
      const { rows: payloadRows, skippedRows } = buildListadoUpdateRowsFromProgramaciones(data || [], almacenesList || []);

      if (!payloadRows.length) {
        if (skippedRows.length) {
          setPendingListadoSync({
            payloadRows: [],
            processableCount: 0,
            missingCount: skippedRows.length,
            missingRows: skippedRows,
            processedProgramacionIds: [],
          });
        } else {
          setAlert({
            active: true,
            mensaje: 'No hay programaciones pendientes con contenedor para sincronizar al listado.',
            color: 'warning',
            autoClose: true,
          });
        }
        return;
      }

      if (skippedRows.length) {
        setPendingListadoSync({
          payloadRows,
          processableCount: payloadRows.length,
          missingCount: skippedRows.length,
          missingRows: skippedRows,
          processedProgramacionIds: getProcessedProgramacionIdsFromListadoResult(payloadRows, {
            partial: true,
            missingRows: skippedRows,
          }),
        });
        return;
      }

      let response = await actualizarListadoMasivo({ rows: toListadoSyncPayload(payloadRows) });
      let result = response?.data || response;

      if (result?.requiresConfirmation) {
        setPendingListadoSync({
          payloadRows,
          processableCount: result.processableCount || 0,
          missingCount: result.missingCount || 0,
          missingRows: result.missingRows || [],
          processedProgramacionIds: getProcessedProgramacionIdsFromListadoResult(payloadRows, result),
        });
        return;
      }

      const processedIds = getProcessedProgramacionIdsFromListadoResult(payloadRows, result);
      await markProgramacionesEstadoListado(processedIds, ESTADO_LISTADO_ACTUALIZADO);
      await vincularSerialesPendientesDeListado(payloadRows, processedIds);

      setAlert({
        active: true,
        mensaje: result?.partial
          ? `${result?.message || 'Actualizacion parcial completada'}. Coincidencias: ${result?.total || 0}. Sin coincidencia: ${result?.missingCount || 0}.`
          : result?.message || 'Listado actualizado desde Programador.',
        color: result?.partial ? 'warning' : 'success',
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar el listado desde Programador.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setSyncingListado(false);
    }
  }, [buildListadoUpdateRowsFromProgramaciones, getProcessedProgramacionIdsFromListadoResult, markProgramacionesEstadoListado, setAlert, toListadoSyncPayload, vincularSerialesPendientesDeListado]);

  const descargarNoEncontradosListado = useCallback(() => {
    if (!pendingListadoSync?.missingRows?.length) {
      return;
    }

    const rows = pendingListadoSync.missingRows.map((item) => ({
      fecha: item.fecha || '',
      bl: item.bl || item.booking || '',
      contenedor: item.contenedor || '',
      id_lugar_de_llenado: item.id_lugar_de_llenado ?? '',
      id_producto: item.id_producto ?? '',
      cajas_unidades: item.cajas_unidades ?? '',
      motivo: item.reason || 'Sin coincidencia',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'No encontrados');
    XLSX.writeFile(workbook, 'programador-no-encontrados-listado.xlsx');
  }, [pendingListadoSync]);

  const confirmarListadoCoincidencias = useCallback(async () => {
    if (!pendingListadoSync?.payloadRows?.length) {
      return;
    }

    try {
      setSyncingListado(true);
      const response = await actualizarListadoMasivo({
        rows: toListadoSyncPayload(pendingListadoSync.payloadRows),
        allowPartial: true,
      });
      const result = response?.data || response;
      const processedProgramacionIds = getProcessedProgramacionIdsFromListadoResult(
        pendingListadoSync.payloadRows,
        result
      );

      await markProgramacionesEstadoListado(processedProgramacionIds, ESTADO_LISTADO_ACTUALIZADO);
      await vincularSerialesPendientesDeListado(pendingListadoSync.payloadRows, processedProgramacionIds);

      setAlert({
        active: true,
        mensaje: result?.partial
          ? `${result?.message || 'Actualizacion parcial completada'}. Coincidencias: ${result?.total || 0}. Sin coincidencia: ${result?.missingCount || 0}.`
          : result?.message || 'Listado actualizado desde Programador.',
        color: result?.partial ? 'warning' : 'success',
        autoClose: true,
      });
      setPendingListadoSync(null);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible actualizar coincidencias del listado.',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setSyncingListado(false);
    }
  }, [getProcessedProgramacionIdsFromListadoResult, markProgramacionesEstadoListado, pendingListadoSync, setAlert, toListadoSyncPayload, vincularSerialesPendientesDeListado]);

  return {
    syncingListado,
    pendingListadoSync,
    setPendingListadoSync,
    sincronizarListadoPendiente,
    descargarNoEncontradosListado,
    confirmarListadoCoincidencias,
  };
}
