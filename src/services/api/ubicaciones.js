import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarUbicacion = async (Ubicacion) => {
   try {
    const url = endPoints.ubicaciones.create;
    const response = await axios.post(url, Ubicacion, config);
    return response.data;
   }catch(e){
    alert("Error al ingresar datos");
   }
};

const eliminarUbicacion = async(consecutivo) => {
    const res = await axios.delete(endPoints.ubicaciones.delete(consecutivo));
    return res.data;
};

const actualizarUbicacion = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.ubicaciones.update(consecutivo), changes);
    return res.data;
};

const buscarUbicacion = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.ubicaciones.findOne(consecutivo));
    return res.data;
    } catch (e) {
        alert("Error al buscar Ubicacion");
    } 
};

const listarUbicaciones = async() => {
    try {
        const res = await axios.get(endPoints.ubicaciones.list);
        return res.data;
    } catch (e){
        alert("Error al listar Ubicaciones");
    }
};

const paginarUbicaciones = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.ubicaciones.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar proveedores");
    }
};

export { agregarUbicacion, eliminarUbicacion, actualizarUbicacion,
     buscarUbicacion, listarUbicaciones, paginarUbicaciones };