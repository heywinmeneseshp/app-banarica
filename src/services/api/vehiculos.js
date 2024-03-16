import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarVehiculo = async (Vehiculo) => {
   try {
    const url = endPoints.vehiculos.create;
    const response = await axios.post(url, Vehiculo, config);
    return response.data;
   }catch(e){
    alert("Error al ingresar datos");
   }
};

const eliminarVehiculo = async(consecutivo) => {
    const res = await axios.delete(endPoints.vehiculos.delete(consecutivo));
    return res.data;
};

const actualizarVehiculo = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.vehiculos.update(consecutivo), changes);
    return res.data;
};

const buscarVehiculo = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.vehiculos.findOne(consecutivo));
    return res.data;
    } catch (e) {
        alert("Error al buscar Vehiculo");
    } 
};

const listarVehiculo = async() => {
    try {
        const res = await axios.get(endPoints.vehiculos.list);
        return res.data;
    } catch (e){
        alert("Error al listar Vehiculo");
    }
};

const paginarVehiculo = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.vehiculos.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar proveedores");
    }
};

export { agregarVehiculo, eliminarVehiculo, actualizarVehiculo,
     buscarVehiculo, listarVehiculo, paginarVehiculo };