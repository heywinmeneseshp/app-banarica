import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarProductosViaje = async (ProductosViaje) => {
   try {
    const url = endPoints.ProductosViaje.create;
    const response = await axios.post(url, ProductosViaje, config);
    return response.data;
   }catch(e){
    alert("Error al ingresar datos");
   }
};

const eliminarProductosViaje = async(consecutivo) => {
    const res = await axios.delete(endPoints.ProductosViaje.delete(consecutivo));
    return res.data;
};

const actualizarProductosViaje = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.ProductosViaje.update(consecutivo), changes);
    return res.data;
};

const buscarProductosViaje = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.ProductosViaje.findOne(consecutivo));
    return res.data;
    } catch (e) {
        alert("Error al buscar item");
    } 
};

const listarProductosViaje = async() => {
    try {
        const res = await axios.get(endPoints.ProductosViaje.list);
        return res.data;
    } catch (e){
        alert("Error al listar items");
    }
};

const paginarProductosViaje = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.ProductosViaje.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar items");
    }
};

export { agregarProductosViaje, eliminarProductosViaje, actualizarProductosViaje,
     buscarProductosViaje, listarProductosViaje, paginarProductosViaje };