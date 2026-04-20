import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import Alertas from '@assets/Alertas';
import useAlert from '@hooks/useAlert';
import exportToExcel from '@hooks/useExcel';
import { consultarTanqueos } from '@services/api/tanqueo';

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthStart = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export default function HistoricoCarguesCombustible({ embedded = false }) {
  const [itemList, setItemList] = useState([]);
  const [rangoFecha] = useState({
    inicio: getMonthStart(),
    fin: getToday(),
  });
  const formRef = useRef();
  const { alert, setAlert, toogleAlert } = useAlert();

  useEffect(() => {
    listar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listar = async () => {
    try {
      const formData = new FormData(formRef.current);
      const body = {
        fecha: formData.get('fecha') || '',
        fechaFin: formData.get('fecha_fin') || '',
        vehiculo: formData.get('vehiculo') || '',
        factura: formData.get('factura') || '',
      };

      const data = await consultarTanqueos(body);
      setItemList(data || []);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || 'No fue posible cargar el historico de cargues.',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const rows = useMemo(() => {
    return itemList.map((item) => ({
      ...item,
      fechaLabel: item?.fecha ? String(item.fecha).slice(0, 10) : '',
      placa: item?.vehiculo?.placa || item?.vehiculo_id || '',
      tipoVehiculo: item?.vehiculo?.vehiculo || 'N/A',
      galones: Number(item?.tanqueo || 0),
      costo: Number(item?.costo || 0),
      saldoAnterior: Number(item?.saldo_anterior || 0),
      saldoNuevo: Number(item?.saldo_nuevo || 0),
      isAdjustment:
        item?.ajuste === true ||
        item?.is_adjustment === true ||
        String(item?.tipo_movimiento || item?.tipo || item?.movimiento || '')
          .trim()
          .toLowerCase() === 'ajuste',
    }));
  }, [itemList]);

  const totalGalones = useMemo(() => rows.reduce((sum, item) => sum + item.galones, 0), [rows]);
  const totalCosto = useMemo(() => rows.reduce((sum, item) => sum + item.costo, 0), [rows]);

  const descargarExcel = () => {
    if (!rows.length) {
      setAlert({
        active: true,
        mensaje: 'No hay cargues para exportar con los filtros actuales.',
        color: 'warning',
        autoClose: true,
      });
      return;
    }

    exportToExcel(rows.map((item) => ({
      Fecha: item.fechaLabel,
      Vehiculo: item.placa,
      Tipo: item.tipoVehiculo,
      Factura: item.factura || '',
      Galones: item.galones.toFixed(2),
      Costo: item.costo.toFixed(2),
      'Saldo anterior': item.saldoAnterior.toFixed(2),
      'Saldo nuevo': item.saldoNuevo.toFixed(2),
      Observacion: item.observacion || '',
    })), 'Cargues', 'Historico cargues combustible');
  };

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />
      <div className={embedded ? 'card shadow-sm' : 'container-fluid px-0'}>
        {embedded && (
          <div className="card-header bg-secondary text-white">
            <h6 className="mb-0">Historico de cargues</h6>
          </div>
        )}
        <div className={embedded ? 'card-body' : ''}>
        <form ref={formRef} className="container-fluid px-0">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                defaultValue={rangoFecha.inicio}
                onChange={listar}
                className="form-control form-control-sm"
              />
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="fecha_fin" className="form-label mb-1">Fecha final</label>
              <input
                type="date"
                id="fecha_fin"
                name="fecha_fin"
                defaultValue={rangoFecha.fin}
                onChange={listar}
                className="form-control form-control-sm"
              />
            </div>

            <div className="col-12 col-md-6 col-lg-2">
              <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
              <input
                type="text"
                id="vehiculo"
                name="vehiculo"
                onChange={listar}
                className="form-control form-control-sm"
                placeholder="Placa"
              />
            </div>

            <div className="col-12 col-md-6 col-lg-2">
              <label htmlFor="factura" className="form-label mb-1">Factura</label>
              <input
                type="text"
                id="factura"
                name="factura"
                onChange={listar}
                className="form-control form-control-sm"
                placeholder="Numero"
              />
            </div>

            <div className="col-12 col-md-6 col-lg-2">
              <Button type="button" onClick={descargarExcel} className="w-100 mt-0 mt-md-4" variant="success" size="sm">
                Descargar Excel
              </Button>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="w-100 mt-0 mt-md-4 p-2 border rounded bg-light text-center">
                <strong>Total galones:</strong> {totalGalones.toFixed(2)}
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <div className="w-100 mt-0 mt-md-4 p-2 border rounded bg-light text-center">
                <strong>Total costo:</strong> {totalCosto.toFixed(2)}
              </div>
            </div>
          </div>
        </form>

        <div className="table-responsive mt-4">
          <table className="table table-striped table-bordered table-sm align-middle text-center mb-0">
            <thead>
              <tr>
                <th className="text-center align-middle">Fecha</th>
                <th className="text-center align-middle">Vehiculo</th>
                <th className="text-center align-middle">Tipo</th>
                <th className="text-center align-middle">Factura</th>
                <th className="bg-success text-white text-center align-middle">Galones</th>
                <th className="text-center align-middle">Costo</th>
                <th className="text-center align-middle">Saldo anterior</th>
                <th className="text-center align-middle">Saldo nuevo</th>
                <th className="text-center align-middle">Observacion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const adjustmentClass = item.isAdjustment
                  ? (item.galones >= 0 ? 'table-success' : 'table-danger')
                  : '';

                return (
                <tr key={item.id} className={adjustmentClass}>
                  <td className="text-center align-middle">{item.fechaLabel}</td>
                  <td className="text-center align-middle">{item.placa}</td>
                  <td className="text-center align-middle">{item.tipoVehiculo}</td>
                  <td className="text-center align-middle">{item.factura || 'N/A'}</td>
                  <td className={`${item.isAdjustment ? '' : 'table-success'} text-center align-middle`}>
                    {item.galones.toFixed(2)}
                  </td>
                  <td className="text-center align-middle">{item.costo ? item.costo.toFixed(2) : '0.00'}</td>
                  <td className="text-center align-middle">{item.saldoAnterior.toFixed(2)}</td>
                  <td className="text-center align-middle">{item.saldoNuevo.toFixed(2)}</td>
                  <td className="text-center align-middle">{item.observacion || 'N/A'}</td>
                </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center align-middle py-3">
                    No hay cargues registrados para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </>
  );
}
