import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DownloadTableExcel } from 'react-export-table-to-excel';
import { FaCog, FaSyncAlt } from 'react-icons/fa';
import InsumoConfig from '@assets/InsumoConfig';
import Paginacion from '@components/shared/Tablas/Paginacion';
import { encontrarModulo } from '@services/api/configuracion';
import { filtrarProductos } from '@services/api/productos';
import { paginarProgramaciones } from '@services/api/programaciones';
import { useAuth } from '@hooks/useAuth';

const PROGRAMADOR_GLOBAL_CONFIG = 'Relacion_programador';
const PROGRAMADOR_USER_CONFIG_PREFIX = 'Relacion_programador_';
const PAGE_LIMIT = 200;

const parseConfigTags = (rows) => {
  try {
    const detalles = rows?.[0]?.detalles ? JSON.parse(rows[0].detalles) : {};
    if (Array.isArray(detalles)) {
      return detalles.map((item) => item?.consecutivo || item?.id || item).filter(Boolean);
    }
    return Array.isArray(detalles?.tags) ? detalles.tags.filter(Boolean) : [];
  } catch (error) {
    console.warn('No fue posible leer la configuracion de sellos del programador:', error);
    return [];
  }
};

const formatDateInput = (date) => date.toISOString().split('T')[0];

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getRowContenedor = (row) => row?.contenedorLabel || row?.contenedor || '';

const getProgramadorSeriales = (row) => {
  const seriales = Array.isArray(row?.seriales_programador)
    ? row.seriales_programador
    : row?.serialesProgramador || [];

  return seriales.filter((item) => item?.activo !== false);
};

const getSerialProduct = (serialRow) => (
  serialRow?.serial_articulo?.cons_producto
  || serialRow?.cons_producto
  || serialRow?.serial_articulo?.producto?.consecutivo
  || ''
);

const getSerialValue = (serialRow) => (
  serialRow?.serial_articulo?.bag_pack
  || serialRow?.serial_articulo?.serial
  || serialRow?.bag_pack
  || serialRow?.serial
  || ''
);

const getProductName = (serialRow) => (
  serialRow?.serial_articulo?.producto?.name
  || serialRow?.producto?.name
  || serialRow?.cons_producto
  || ''
);

const buildRowStatus = (row, configProducts) => {
  const activos = getProgramadorSeriales(row);

  if (!String(getRowContenedor(row)).trim()) {
    return { label: 'Sin contenedor', className: 'bg-secondary' };
  }

  if (!configProducts.length) {
    return activos.length ? { label: 'Con sellos', className: 'bg-success' } : { label: 'Sin sellos', className: 'bg-danger' };
  }

  const asignados = new Set(activos.map((item) => String(getSerialProduct(item))));
  const faltantes = configProducts.filter((item) => !asignados.has(String(item?.consecutivo)));

  if (!activos.length || faltantes.length === configProducts.length) {
    return { label: 'Sin sellos', className: 'bg-danger' };
  }

  if (faltantes.length) {
    return { label: `Faltan ${faltantes.length}`, className: 'bg-warning text-dark' };
  }

  return { label: 'Completo', className: 'bg-success' };
};

const getVisibleSeriales = (row, configProducts) => {
  const seriales = getProgramadorSeriales(row);
  if (!configProducts.length) {
    return seriales;
  }

  const visibles = new Set(configProducts.map((item) => String(item?.consecutivo)));
  return seriales.filter((item) => visibles.has(String(getSerialProduct(item))));
};

const formatSerialArticles = (row, configProducts) => (
  getVisibleSeriales(row, configProducts)
    .map(getProductName)
    .filter(Boolean)
    .join(', ')
);

const formatSerialValues = (row, configProducts) => (
  getVisibleSeriales(row, configProducts)
    .map(getSerialValue)
    .filter(Boolean)
    .join(', ')
);

export default function DashboardSellosProgramador() {
  const tableRef = useRef(null);
  const { getUser } = useAuth();
  const user = getUser() || {};
  const isSuperAdmin = user?.id_rol === 'Super administrador';
  const username = user?.username || '';
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return formatDateInput(now);
  }, []);
  const yearEnd = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-12-31`;
  }, []);

  const [offset, setOffset] = useState(1);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(yearEnd);
  const [contenedorFilter, setContenedorFilter] = useState('');
  const [blFilter, setBlFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [configProducts, setConfigProducts] = useState([]);
  const [openConfig, setOpenConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadConfig = async () => {
      const configRequests = [
        encontrarModulo(PROGRAMADOR_GLOBAL_CONFIG).catch(() => []),
      ];

      if (username) {
        configRequests.push(encontrarModulo(`${PROGRAMADOR_USER_CONFIG_PREFIX}${username}`).catch(() => []));
      }

      const configs = await Promise.all(configRequests);
      const tags = configs.map(parseConfigTags).find((items) => items.length) || [];

      if (!tags.length) {
        setConfigProducts([]);
        return;
      }

      const productos = await filtrarProductos({ producto: { consecutivo: tags, isBlock: false } });
      setConfigProducts(
        tags
          .map((tag) => (productos || []).find((item) => String(item?.consecutivo) === String(tag)))
          .filter(Boolean)
      );
    };

    loadConfig().catch((error) => {
      console.error('Error cargando configuracion de sellos del programador:', error);
      setConfigProducts([]);
    });
  }, [openConfig, reloadKey, username]);

  useEffect(() => {
    const loadProgramaciones = async () => {
      try {
        setLoading(true);
        const response = await paginarProgramaciones(offset, PAGE_LIMIT, {
          fecha: startDate,
          fechaFin: endDate,
        });
        setRows(response?.data || []);
        setTotal(response?.total || 0);
      } catch (error) {
        console.error('Error cargando resumen de sellos del programador:', error);
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadProgramaciones();
  }, [endDate, offset, reloadKey, startDate]);

  const visibleRows = useMemo(() => {
    const contenedor = normalizeText(contenedorFilter);
    const bl = normalizeText(blFilter);

    return rows.filter((row) => {
      const rowContenedor = getRowContenedor(row);
      const matchContenedor = !contenedor || normalizeText(rowContenedor).includes(contenedor);
      const matchBl = !bl || normalizeText(row?.bl).includes(bl);
      return String(rowContenedor || '').trim() && matchContenedor && matchBl;
    });
  }, [blFilter, contenedorFilter, rows]);

  const resumen = useMemo(() => (
    visibleRows.reduce((acc, row) => {
      const status = buildRowStatus(row, configProducts).label;
      acc.total += 1;
      if (status === 'Completo' || status === 'Con sellos') acc.completos += 1;
      if (status === 'Sin sellos') acc.sinSellos += 1;
      if (status.startsWith('Faltan')) acc.incompletos += 1;
      if (status === 'Sin contenedor') acc.sinContenedor += 1;
      return acc;
    }, { total: 0, completos: 0, incompletos: 0, sinSellos: 0, sinContenedor: 0 })
  ), [configProducts, visibleRows]);

  const handleRefresh = () => {
    setReloadKey((value) => value + 1);
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Sellos programador</h2>
      </div>

      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-md-3">
          <div className="input-group">
            <span className="input-group-text">Fecha inicio</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(event) => {
                setOffset(1);
                setStartDate(event.target.value);
              }}
            />
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="input-group">
            <span className="input-group-text">Fecha fin</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(event) => {
                setOffset(1);
                setEndDate(event.target.value);
              }}
            />
          </div>
        </div>
        <div className="col-12 col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="Contenedor"
            value={contenedorFilter}
            onChange={(event) => setContenedorFilter(event.target.value)}
          />
        </div>
        <div className="col-12 col-md-2">
          <input
            type="text"
            className="form-control"
            placeholder="BL"
            value={blFilter}
            onChange={(event) => setBlFilter(event.target.value)}
          />
        </div>
        <div className="col-6 col-md-1">
          <button type="button" className="btn btn-outline-secondary w-100" onClick={handleRefresh} disabled={loading}>
            <FaSyncAlt />
          </button>
        </div>
        {isSuperAdmin && (
          <div className="col-6 col-md-1">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={() => setOpenConfig(true)}>
              <FaCog />
            </button>
          </div>
        )}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-6 col-md-2">
          <div className="border rounded bg-light px-3 py-2 text-center">
            <div className="fw-bold">{resumen.total}</div>
            <div className="small text-muted">Lineas</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="border rounded bg-light px-3 py-2 text-center">
            <div className="fw-bold text-success">{resumen.completos}</div>
            <div className="small text-muted">Completos</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="border rounded bg-light px-3 py-2 text-center">
            <div className="fw-bold text-warning">{resumen.incompletos}</div>
            <div className="small text-muted">Incompletos</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="border rounded bg-light px-3 py-2 text-center">
            <div className="fw-bold text-danger">{resumen.sinSellos}</div>
            <div className="small text-muted">Sin sellos</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="border rounded bg-light px-3 py-2 text-center">
            <div className="fw-bold text-secondary">{resumen.sinContenedor}</div>
            <div className="small text-muted">Sin contenedor</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <DownloadTableExcel
            filename={`Sellos Programador ${new Date().toISOString().split('T')[0]}`}
            sheet={`Del ${startDate} al ${endDate}`}
            currentTableRef={tableRef.current}
          >
            <button type="button" className="btn btn-secondary w-100 h-100">
              Descargar
            </button>
          </DownloadTableExcel>
        </div>
      </div>

      <div className="table-responsive">
        <table ref={tableRef} className="table table-striped table-bordered table-sm align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="text-center text-nowrap">Fecha</th>
              <th className="text-center text-nowrap">BL</th>
              <th className="text-center text-nowrap">Contenedor</th>
              <th className="text-center text-nowrap">Cliente</th>
              <th className="text-center text-nowrap">Articulo serial</th>
              <th className="text-center text-nowrap">Serial</th>
              <th className="text-center text-nowrap">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const status = buildRowStatus(row, configProducts);
              return (
                <tr key={row.id}>
                  <td className="text-center text-nowrap">{row.fecha || ''}</td>
                  <td className="text-center text-nowrap">{row.bl || ''}</td>
                  <td className="text-center text-nowrap fw-semibold">{getRowContenedor(row)}</td>
                  <td className="text-center text-nowrap">
                    {row?.clientes?.cod || row?.clientes?.razon_social || row?.cliente?.cod || row?.cliente?.razon_social || ''}
                  </td>
                  <td className="text-center">{formatSerialArticles(row, configProducts)}</td>
                  <td className="text-center">{formatSerialValues(row, configProducts)}</td>
                  <td className="text-center text-nowrap">
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
            {!visibleRows.length && (
              <tr>
                <td className="text-center text-muted py-4" colSpan={7}>
                  {loading ? 'Cargando...' : 'No hay lineas de programador para los filtros seleccionados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion setPagination={setOffset} pagination={offset} total={total} limit={PAGE_LIMIT} />

      {openConfig && isSuperAdmin && (
        <InsumoConfig
          handleConfig={() => {
            setOpenConfig(false);
            handleRefresh();
          }}
          modulo_confi={PROGRAMADOR_GLOBAL_CONFIG}
        />
      )}
    </div>
  );
}
