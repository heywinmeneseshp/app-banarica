import axios from 'axios';
import endPoints from './index';
const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const getErrorMessage = (error, fallback) => (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
);

const agregarcategoriaVehiculos = async (categoriaVehiculos) => {
   try {
    const url = endPoints.categoriaVehiculos.create;
    const response = await axios.post(url, categoriaVehiculos, config);
    return response.data;
   }catch(error){
    throw new Error(getErrorMessage(error, "Error al ingresar categoria de vehiculo"));
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
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al buscar categoriaVehiculos"));
    } 
};

const listarcategoriaVehiculos = async() => {
    try {
        const res = await axios.get(endPoints.categoriaVehiculos.list);
        return res.data;
    } catch (error){
        throw new Error(getErrorMessage(error, "Error al listar Categoria Vehiculos"));
    }
};

const paginarcategoriaVehiculos = async (page, limit, nombre) => {
    try {
        const res = await axios.get(endPoints.categoriaVehiculos.pagination(page, limit, nombre));
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al paginar Categoria Vehiculos"));
    }
};

export { agregarcategoriaVehiculos, eliminarcategoriaVehiculos, actualizarcategoriaVehiculos,
     buscarcategoriaVehiculos, listarcategoriaVehiculos, paginarcategoriaVehiculos };
