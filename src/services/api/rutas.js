import axios from 'axios';
import endPoints from './index';
import { listarUbicaciones } from './ubicaciones';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const agregarRutas = async (rutas) => {
    try {
        const url = endPoints.rutas.create;
        const response = await axios.post(url, rutas, config);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al ingresar datos de rutas: " + message);
    }
};


const buscarRutaPost = async (rutas) => {
    try {
        const url = endPoints.rutas.findWhere;
        const response = await axios.post(url, rutas,config);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al ingresar datos de rutas: " + message);
    }
};

const eliminarRutas = async(id) => {
    try {
        const res = await axios.delete(endPoints.rutas.delete(id));
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al eliminar rutas: " + message);
    }
};

const actualizarRutas = async(consecutivo, changes) => {
    try {
        const res = await axios.patch(endPoints.rutas.update(consecutivo), changes);
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al actualizar rutas: " + message);
    }
};

const buscarRutas = async(consecutivo) => {
    try {
        const res = await axios.get(endPoints.rutas.findOne(consecutivo));
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al buscar rutas: " + message);
    }
};

const listarRutas = async() => {
    try {
        const [res, ubicaciones] = await Promise.all([
            axios.get(endPoints.rutas.list),
            listarUbicaciones(),
        ]);

        const ubicacionesMap = new Map(
            (ubicaciones || []).map((item) => [String(item.id), item.ubicacion])
        );

        const rutas = (res.data || []).map((item) => ({
            ...item,
            origen: ubicacionesMap.get(String(item.ubicacion1)) || item.origen || item.ubicacion1,
            destino: ubicacionesMap.get(String(item.ubicacion2)) || item.destino || item.ubicacion2,
        }));

        return rutas;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al listar rutas: " + message);
    }
};

const paginarRutas = async (page, limit, nombre) => {
    try {
        let res = await axios.get(endPoints.rutas.pagination(page, limit, nombre));
        res.data.data.map((item, index)=>{
            res.data.data[index].origen =  item.ubicacion_1.ubicacion;
            res.data.data[index].destino =  item.ubicacion_2.ubicacion;
        });
        return res.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error("Error al paginar rutas: " + message);
    }
};

const consultarGalonesPorRuta = async () => {
    try {
        const res = await axios.get(endPoints.galonesPorRuta.consultar);
        return res.data;
    } catch (error) {
        throw new Error("Error al listar rutas: " + error.message);
    }
};

const actualizarGalonesPorRuta = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.galonesPorRuta.update(id), changes);
        return res.data;
    } catch (error) {
        throw new Error("Error al listar rutas: " + error.message);
    }
};

export { 
    agregarRutas, 
    eliminarRutas, 
    actualizarRutas,
    buscarRutas, 
    listarRutas, 
    paginarRutas,
    buscarRutaPost,
    consultarGalonesPorRuta,
    actualizarGalonesPorRuta
};
