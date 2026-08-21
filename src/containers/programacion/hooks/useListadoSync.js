import * as XLSX from 'xlsx';
import { useCallback, useState } from 'react';
import { paginarProgramaciones } from '@services/api/programaciones';
import { paginarListado, actualizarListadoMasivo, actualizarListado } from '@services/api/listado';
import { listarAlmacenes } from '@services/api/almacenes';
import { vincularContenedoresProgramacionSeriales } from '@services/api/programacionSeriales';
import { normalizeValue, ESTADO_LISTADO_PENDIENTE, ESTADO_LISTADO_ACTUALIZADO } from '../programadorUtils';

export function useListadoSync({ setAlert, markProgramacionesEstadoListado }) {
  const [syncingListado, setSyncingListado] = useState(false);
  const [pendingListadoSync, setPendingListadoSync] = useState(null);
  const [diferenciasListado, setDiferenciasListado] = useState(null);

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

          const transportadoraId = item?.vehiculo?.transportadoraId || item?.vehiculo?.transportadora?.id || null;

          // El tipo de movimiento va en la clave: si dos filas de Programador
          // del mismo contenedor/fecha/destino/producto son movimientos
          // distintos (p.ej. "Cargue" y "Entrega"), son dos hechos distintos y
          // deben sincronizarse como dos actualizaciones de Listado separadas,
          // no fusionarse en una sola (antes eso dejaba a una de las dos filas
          // sin marcar como sincronizada).
          const movimientoKey = normalizeValue(item?.movimiento) || 'sin-movimiento';
          const key = `${fecha}__${contenedor}__${bl}__${almacenDestino.id}__${productoId || 'sin-producto'}__${movimientoKey}`;
          const existing = groupedRows.get(key) || {
            fecha,
            contenedor,
            bl,
            id_lugar_de_llenado: almacenDestino.id,
            id_producto: productoId || null,
            id_transportadora: null,
            cajas_unidades: null,
            programacionIds: [],
          };

          groupedRows.set(key, {
            fecha,
            contenedor,
            bl,
            id_lugar_de_llenado: almacenDestino.id,
            id_producto: productoId || existing.id_producto,
            id_transportadora: transportadoraId || existing.id_transportadora,
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

  const fetchListadoRowsPorFecha = useCallback(async (fecha) => {
    const all = [];
    const limit = 500;
    let offset = 1;
    let hayMasPaginas = true;

    while (hayMasPaginas) {
      const res = await paginarListado(offset, limit, {
        fecha_inicial: fecha,
        fecha_final: fecha,
        includeSeriales: false,
        // Sin esto, el backend trae tambien las lineas deshabilitadas
        // (borradas logicamente) y las mezcla en el emparejamiento con las
        // activas, dando coincidencias/duplicados incorrectos.
        habilitado: true,
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      all.push(...data);

      hayMasPaginas = data.length >= limit && all.length < Number(res?.total || 0);
      offset += 1;
    }

    return all;
  }, []);

  // Trae TODAS las lineas de Programador de una fecha, sin importar su
  // estado_listado (pendiente o ya actualizado). Se usa solo para el
  // emparejamiento contra Listado: si el comparativo solo mirara las lineas
  // pendientes, cualquier linea de Listado cuya contraparte ya estuviera
  // sincronizada no encontraria con que emparejar y se marcaria como
  // "sobrante" (y se deshabilitaria), borrando datos que ya estaban bien.
  const fetchProgramacionRowsPorFecha = useCallback(async (fecha) => {
    const res = await paginarProgramaciones('', '', { fecha, fechaFin: fecha });
    return Array.isArray(res?.data) ? res.data : [];
  }, []);

  const normalizarListadoRow = useCallback((row = {}) => {
    const embarque = row?.Embarque || {};
    return {
      id: row?.id ?? null,
      fecha: String(row?.fecha || '').trim(),
      contenedor: String(row?.Contenedor?.contenedor || row?.contenedor || '').trim(),
      bl: String(embarque?.bl || embarque?.booking || '').trim(),
      id_embarque: row?.id_embarque ?? null,
      id_lugar_de_llenado: row?.id_lugar_de_llenado ?? null,
      id_producto: row?.id_producto ?? null,
      cajas_unidades: row?.cajas_unidades ?? null,
    };
  }, []);

  const computarDiferenciasPorDia = useCallback(async (payloadRows = [], almacenesList = []) => {
    const fechas = [...new Set(payloadRows
      .map((item) => String(item?.fecha || '').trim())
      .filter(Boolean))];

    const listadoPorFecha = {};
    const programacionCompletaPorFecha = {};
    await Promise.all(fechas.map(async (fecha) => {
      listadoPorFecha[fecha] = (await fetchListadoRowsPorFecha(fecha)).map(normalizarListadoRow);

      // TODAS las lineas de Programador de esa fecha (pendientes o no), para
      // el emparejamiento — ver comentario en fetchProgramacionRowsPorFecha.
      const todasLasProgramaciones = await fetchProgramacionRowsPorFecha(fecha);
      const { rows: filasCompletas } = buildListadoUpdateRowsFromProgramaciones(todasLasProgramaciones, almacenesList);
      programacionCompletaPorFecha[fecha] = filasCompletas;
    }));

    const porDia = [];
    const soloListadoRows = [];
    const totales = {
      programacion: payloadRows.length,
      coincidencias: 0,
      cajasDifieren: 0,
      soloProgramacion: 0,
      soloListado: 0,
    };

    for (const fecha of fechas) {
      const filasDia = payloadRows.filter((item) => String(item?.fecha || '').trim() === fecha);
      // El emparejamiento usa TODAS las lineas de Programador de ese dia
      // (filasDiaCompletas), no solo las pendientes (filasDia): si solo se
      // miraran las pendientes, una linea de Listado ya sincronizada con una
      // linea de Programador que ya estaba "actualizado" no encontraria con
      // que emparejar y se marcaria como sobrante — deshabilitandola por
      // error aunque siguiera vigente en Programador.
      const filasDiaCompletas = programacionCompletaPorFecha[fecha] || [];
      const listadoDia = listadoPorFecha[fecha] || [];

      const pool = new Map();
      listadoDia.forEach((row) => {
        const key = normalizeValue(row.contenedor);
        if (!pool.has(key)) {
          pool.set(key, []);
        }
        pool.get(key).push(row);
      });

      const usados = new Set();
      const soloProgramacionContenedores = new Set();
      let coincidencias = 0;
      let cajasDifieren = 0;

      filasDiaCompletas.forEach((item) => {
        const candidates = pool.get(normalizeValue(item.contenedor)) || [];
        if (!candidates.length) {
          soloProgramacionContenedores.add(normalizeValue(item.contenedor));
          return;
        }

        const expectedAlmacen = item.id_lugar_de_llenado != null && item.id_lugar_de_llenado !== ''
          ? Number(item.id_lugar_de_llenado)
          : null;
        const expectedProducto = item.id_producto != null && item.id_producto !== ''
          ? Number(item.id_producto)
          : null;

        const match = candidates.find((row) => (
          !usados.has(String(row.id))
          && (expectedAlmacen == null || Number(row.id_lugar_de_llenado) === expectedAlmacen)
          && (expectedProducto == null || Number(row.id_producto) === expectedProducto)
        )) || candidates.find((row) => !usados.has(String(row.id))) || null;

        if (!match) {
          soloProgramacionContenedores.add(normalizeValue(item.contenedor));
          return;
        }

        usados.add(String(match.id));
        coincidencias += 1;

        const progCajas = Number(item.cajas_unidades);
        const listadoCajas = Number(match.cajas_unidades);
        if (Number.isFinite(progCajas) && Number.isFinite(listadoCajas) && progCajas !== listadoCajas) {
          cajasDifieren += 1;
        }
      });

      const soloListadoRowsDia = listadoDia.filter((row) => !usados.has(String(row.id)));
      const soloListadoContenedores = new Set(soloListadoRowsDia.map((row) => normalizeValue(row.contenedor)));

      porDia.push({
        fecha,
        programacion: filasDia.length,
        coincidencias,
        cajasDifieren,
        soloProgramacion: [...soloProgramacionContenedores],
        soloListado: [...soloListadoContenedores],
      });

      soloListadoRows.push(...soloListadoRowsDia);

      totales.coincidencias += coincidencias;
      totales.cajasDifieren += cajasDifieren;
      totales.soloProgramacion += soloProgramacionContenedores.size;
      totales.soloListado += soloListadoContenedores.size;
    }

    return { porDia, totales, soloListadoRows };
  }, [fetchListadoRowsPorFecha, normalizarListadoRow, fetchProgramacionRowsPorFecha, buildListadoUpdateRowsFromProgramaciones]);

  // Lineas de Listado que ya no tienen ninguna linea de Programador
  // correspondiente (p.ej. porque se elimino en Programador): se
  // deshabilitan para que Listado quede igual a Programador, igual que ya
  // pasa con las coincidencias.
  const deshabilitarSobrantesListado = useCallback(async (soloListadoRows = []) => {
    const ids = [...new Set(soloListadoRows.map((row) => row?.id).filter(Boolean))];
    if (!ids.length) return;
    await Promise.all(ids.map((id) => actualizarListado(id, { habilitado: false })));
  }, []);

  const ejecutarSincronizacion = useCallback(async (payloadRows = [], skippedRows = [], soloListadoRows = []) => {
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
    await deshabilitarSobrantesListado(soloListadoRows);

    setAlert({
      active: true,
      mensaje: result?.partial
        ? `${result?.message || 'Actualizacion parcial completada'}. Coincidencias: ${result?.total || 0}. Sin coincidencia: ${result?.missingCount || 0}.`
        : result?.message || 'Listado actualizado desde Programador.',
      color: result?.partial ? 'warning' : 'success',
      autoClose: true,
    });
  }, [deshabilitarSobrantesListado, getProcessedProgramacionIdsFromListadoResult, markProgramacionesEstadoListado, setAlert, toListadoSyncPayload, vincularSerialesPendientesDeListado]);

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

      const { porDia, totales, soloListadoRows } = await computarDiferenciasPorDia(payloadRows, almacenesList || []);
      const hayDiferencias = totales.soloProgramacion > 0
        || totales.soloListado > 0
        || totales.cajasDifieren > 0
        || skippedRows.length > 0;

      if (hayDiferencias) {
        setDiferenciasListado({ payloadRows, skippedRows, porDia, totales, soloListadoRows });
        return;
      }

      await ejecutarSincronizacion(payloadRows, skippedRows, soloListadoRows);
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
  }, [buildListadoUpdateRowsFromProgramaciones, computarDiferenciasPorDia, ejecutarSincronizacion, setAlert]);

  const continuarSincronizacion = useCallback(async () => {
    const datos = diferenciasListado;
    setDiferenciasListado(null);

    if (!datos?.payloadRows?.length) {
      return;
    }

    try {
      setSyncingListado(true);
      await ejecutarSincronizacion(datos.payloadRows, datos.skippedRows || [], datos.soloListadoRows || []);
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
  }, [diferenciasListado, ejecutarSincronizacion, setAlert]);

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
    diferenciasListado,
    setDiferenciasListado,
    continuarSincronizacion,
  };
}
