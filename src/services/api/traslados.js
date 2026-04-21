import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const resolveApiError = (error, fallbackMessage) => {
    const message = error?.response?.data?.message || error?.message || fallbackMessage;
    throw new Error(message);
};

const agregarTraslado = async (data) => {
    try {
        const response = await axios.post(endPoints.traslados.create, data, config);
        return response.data;
    } catch (err) {
        resolveApiError(err, "Error al crear el traslado");
    }
};

const ejecutarTraslado = async (data) => {
    try {
        const response = await axios.post(endPoints.traslados.execute, data, config);
        return response.data;
    } catch (err) {
        throw err;
    }
};

const eliminarTraslado = async (consecutivo) => {
    const res = await axios.delete(endPoints.traslados.delete(consecutivo));
    return res.data;
};

const actualizarTraslado = async (id, changes) => {
    try {
        const res = await axios.patch(endPoints.traslados.update(id), changes);
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al actualizar traslado");
    }
};

const buscarTraslado = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.traslados.findOne(consecutivo));
        return res.data;
    } catch (e) {
        resolveApiError(e, "El traslado no existe");
    }
};

const filtrarTraslados = async (almacenes, semana, product_name, cons_categoria, offset, limit) => {
    let data = {
        "almacenes": almacenes,
        "semana": semana,
        "producto": {
            "name": product_name,
            "cons_categoria": cons_categoria
        },
        "pagination": {
            "offset": offset,
            "limit": limit
        }
    };
    if (!offset || !limit) delete data.pagination;
    try {
        const res = await axios.post(endPoints.traslados.filter, data);
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al filtrar traslados");
    }
};

const listarTraslados = async () => {
    try {
        const res = await axios.get(endPoints.traslados.list);
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al listar traslados");
    }
};

export { agregarTraslado, ejecutarTraslado, eliminarTraslado, actualizarTraslado, buscarTraslado, filtrarTraslados, listarTraslados };
