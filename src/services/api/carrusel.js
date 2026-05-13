import axios from 'axios';
import endPoints from './index';

const obtenerPorTransportadora = async (id) => {
    try {
        const res = await axios.get(endPoints.carrusel.porTransportadora(id));
        return res.data;
    } catch (e) {
        console.error("Error al obtener carrusel por transportadora:", e);
        return [];
    }
};

const obtenerPorContenedor = async (contenedorId) => {
    try {
        const res = await axios.get(endPoints.carrusel.porContenedor(contenedorId));
        return res.data;
    } catch (e) {
        console.error("Error al obtener carrusel por contenedor:", e);
        return null;
    }
};

export {
    obtenerPorTransportadora,
    obtenerPorContenedor
};