import React, { useEffect, useState } from 'react';
import Alertas from '@assets/Alertas';
import { listarVehiculo } from '@services/api/vehiculos';
import { listarRutas } from '@services/api/rutas';
import {
  listarConsumoRutaVehiculo,
  agregarConsumoRutaVehiculo,
  actualizarConsumoRutaVehiculo,
  eliminarConsumoRutaVehiculo,
} from '@services/api/consumoRutaVehiculo';

export default function ConsumoRutaVehiculo() {
  const [vehiculos, setVehiculos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [form, setForm] = useState({
    vehiculo_id: '',
    ruta_id: '',
    consumo_por_km: '',
    activo: true,
  });
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState({ active: false, mensaje: '', color: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [vehiculosData, rutasData, consumosData] = await Promise.all([
        listarVehiculo(),
        listarRutas(),
        listarConsumoRutaVehiculo(),
      ]);
      setVehiculos(vehiculosData || []);
      setRutas(rutasData || []);
      setConsumos(consumosData || []);
    } catch (error) {
      setAlert({ active: true, mensaje: error.message, color: 'danger' });
    }
  };

  const getRouteLabel = (ruta) => {
    const origen = ruta?.ubicacion_1?.ubicacion || ruta?.origen || ruta?.ubicacion1 || 'Origen';
    const destino = ruta?.ubicacion_2?.ubicacion || ruta?.destino || ruta?.ubicacion2 || 'Destino';
    return `${origen} - ${destino}`;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.vehiculo_id || !form.ruta_id || !form.consumo_por_km) {
      setAlert({ active: true, mensaje: 'Vehiculo, ruta y consumo son obligatorios.', color: 'danger' });
      return;
    }

    const registro = {
      vehiculo_id: form.vehiculo_id,
      ruta_id: form.ruta_id,
      consumo_por_km: parseFloat(form.consumo_por_km),
      activo: form.activo,
    };

    try {
      if (selected) {
        await actualizarConsumoRutaVehiculo(selected.id, registro);
        setAlert({ active: true, mensaje: 'Asignacion actualizada.', color: 'success' });
      } else {
        await agregarConsumoRutaVehiculo(registro);
        setAlert({ active: true, mensaje: 'Asignacion creada.', color: 'success' });
      }
      setSelected(null);
      setForm({ vehiculo_id: '', ruta_id: '', consumo_por_km: '', activo: true });
      cargarDatos();
    } catch (error) {
      setAlert({ active: true, mensaje: error.message, color: 'danger' });
    }
  };

  const handleEdit = (item) => {
    setSelected(item);
    setForm({
      vehiculo_id: item.vehiculo_id || '',
      ruta_id: item.ruta_id || '',
      consumo_por_km: item.consumo_por_km?.toString() || '',
      activo: item.activo === false ? false : true,
    });
  };

  const handleDelete = async (item) => {
    try {
      await eliminarConsumoRutaVehiculo(item.id);
      setAlert({ active: true, mensaje: 'Asignacion eliminada.', color: 'success' });
      if (selected?.id === item.id) {
        setSelected(null);
        setForm({ vehiculo_id: '', ruta_id: '', consumo_por_km: '', activo: true });
      }
      cargarDatos();
    } catch (error) {
      setAlert({ active: true, mensaje: error.message, color: 'danger' });
    }
  };

  return (
    <div className="container mt-4">
      <Alertas alert={alert} handleClose={() => setAlert({ active: false, mensaje: '', color: '' })} />
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Consumo por Ruta y Vehiculo</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="vehiculo_id" className="form-label">Vehiculo</label>
              <select id="vehiculo_id" name="vehiculo_id" value={form.vehiculo_id} onChange={handleChange} className="form-select">
                <option value="">Seleccione vehiculo</option>
                {vehiculos.map((vehiculo) => (
                  <option key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.placa || vehiculo.nombre || `Vehiculo ${vehiculo.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="ruta_id" className="form-label">Ruta</label>
              <select id="ruta_id" name="ruta_id" value={form.ruta_id} onChange={handleChange} className="form-select">
                <option value="">Seleccione ruta</option>
                {rutas.map((ruta) => (
                  <option key={ruta.id} value={ruta.id}>
                    {getRouteLabel(ruta)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="consumo_por_km" className="form-label">Galones consumidos</label>
              <input
                id="consumo_por_km"
                type="number"
                step="0.01"
                min="0"
                name="consumo_por_km"
                value={form.consumo_por_km}
                onChange={handleChange}
                className="form-control"
                placeholder="Galones"
              />
            </div>
            <div className="col-md-2 d-flex align-items-center">
              <div className="form-check mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                  id="consumo-activo"
                />
                <label className="form-check-label" htmlFor="consumo-activo">
                  Activo
                </label>
              </div>
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button type="button" className="btn btn-success" onClick={handleSubmit}>
              {selected ? 'Actualizar' : 'Guardar'}
            </button>
            {selected && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelected(null);
                  setForm({ vehiculo_id: '', ruta_id: '', consumo_por_km: '', activo: true });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-4">
        <div className="card-header">
          <h6 className="mb-0">Asignaciones existentes</h6>
        </div>
        <div className="card-body table-responsive">
          <table className="table table-sm table-bordered mb-0">
            <thead>
              <tr>
                <th>Vehiculo</th>
                <th>Ruta</th>
                <th>Galones consumidos</th>
                <th>Activo</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consumos.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    No hay asignaciones registradas.
                  </td>
                </tr>
              )}
              {consumos.map((item) => (
                <tr key={item.id}>
                  <td>{item.vehiculo?.placa || item.vehiculo_id}</td>
                  <td>{getRouteLabel(item.ruta)}</td>
                  <td>{item.consumo_por_km}</td>
                  <td>{item.activo ? 'Si' : 'No'}</td>
                  <td className="text-end">
                    <button type="button" className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(item)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(item)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
