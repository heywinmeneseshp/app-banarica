import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL;
const VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
const baseUrl = API
  ? `${API}/api/${VERSION}/consumoRutaVehiculo`
  : `/api/${VERSION}/consumoRutaVehiculo`;

const config = {
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const listarConsumoRutaVehiculo = async () => {
  try {
    const res = await axios.get(baseUrl);
    return res.data;
  } catch (error) {
    throw new Error('Error al listar consumos por ruta y vehículo: ' + error.message);
  }
};

const agregarConsumoRutaVehiculo = async (registro) => {
  try {
    const res = await axios.post(baseUrl, registro, config);
    return res.data;
  } catch (error) {
    throw new Error('Error al crear consumo por ruta y vehículo: ' + error.message);
  }
};

const actualizarConsumoRutaVehiculo = async (id, changes) => {
  try {
    const res = await axios.patch(`${baseUrl}/${id}`, changes, config);
    return res.data;
  } catch (error) {
    throw new Error('Error al actualizar consumo por ruta y vehículo: ' + error.message);
  }
};

const eliminarConsumoRutaVehiculo = async (id) => {
  try {
    const res = await axios.delete(`${baseUrl}/${id}`);
    return res.data;
  } catch (error) {
    throw new Error('Error al eliminar consumo por ruta y vehículo: ' + error.message);
  }
};

export {
  listarConsumoRutaVehiculo,
  agregarConsumoRutaVehiculo,
  actualizarConsumoRutaVehiculo,
  eliminarConsumoRutaVehiculo,
};
