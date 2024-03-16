import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};
const agregarcategoriaVehiculos = async (categoriaVehiculos) => {
   try {
    const url = endPoints.categoriaVehiculos.create;
    const response = await axios.post(url, categoriaVehiculos, config);
    return response.data;
   }catch(e){
    alert("Error al ingresar datos");
   }
};

const eliminarcategoriaVehiculos = async(id) => {
    const res = await axios.delete(endPoints.categoriaVehiculos.delete(id));
    return res.data;
};

const actualizarcategoriaVehiculos = async(consecutivo, changes) => {
    const res = await axios.patch(endPoints.categoriaVehiculos.update(consecutivo), changes);
    return res.data;
};

const buscarcategoriaVehiculos = async(consecutivo) => {
    try {
    const res = await axios.get(endPoints.catego.findOne(consecutivo));
    return res.data;
    } catch (e) {
        alert("Error al buscar categoriaVehiculos");
    } 
};

const listarcategoriaVehiculos = async() => {
    try {
        const res = await axios.get(endPoints.categoriaVehiculos.list);
        return res.data;
    } catch (e){
        alert("Error al listar Categoria Vehiculos");
    }
};

const paginarcategoriaVehiculos = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.categoriaVehiculos.pagination(page, limit, nombre));
        return res.data;
    } catch {
        alert("Error al paginar Categoria Vehicuslo");
    }
};

export { agregarcategoriaVehiculos, eliminarcategoriaVehiculos, actualizarcategoriaVehiculos,
     buscarcategoriaVehiculos, listarcategoriaVehiculos, paginarcategoriaVehiculos };