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
    const response = await axios.post(endPoints.traslados.execute, data, config);
    return response.data;
};

const crearTrasladoPendiente = async (data) => {
    try {
        const response = await axios.post(endPoints.traslados.crearPendiente, data, config);
        return response.data;
    } catch (err) {
        resolveApiError(err, "Error al registrar la transferencia pendiente");
    }
};

const listarTrasladosPendientes = async (almacenes = [], tipo = "recibir") => {
    try {
        const res = await axios.get(endPoints.traslados.listarPendientes(almacenes.join(","), tipo));
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al listar transferencias pendientes");
    }
};

const contarTrasladosPendientes = async (almacenes = []) => {
    try {
        const res = await axios.get(endPoints.traslados.contarPendientes(almacenes.join(",")));
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al contar transferencias pendientes");
    }
};

const aceptarTraslado = async (id, usuario) => {
    try {
        const res = await axios.patch(endPoints.traslados.aceptar(id), { usuario }, config);
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al aceptar la transferencia");
    }
};

const rechazarTraslado = async (id, usuario, motivo) => {
    try {
        const res = await axios.patch(endPoints.traslados.rechazar(id), { usuario, motivo }, config);
        return res.data;
    } catch (err) {
        resolveApiError(err, "Error al rechazar la transferencia");
    }
};

const listarEvidenciasTraslado = async (id, usuario) => {
    try {
        const res = await axios.post(endPoints.traslados.listarEvidencias(id), { usuario }, config);
        return res.data;
    } catch (err) {
        resolveApiError(err, "No fue posible cargar la evidencia de esta transferencia");
    }
};

const listarArticulosTraslado = async (id, usuario) => {
    try {
        const res = await axios.post(endPoints.traslados.listarArticulos(id), { usuario }, config);
        return res.data;
    } catch (err) {
        resolveApiError(err, "No fue posible cargar los articulos de esta transferencia");
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

export {
    agregarTraslado,
    ejecutarTraslado,
    crearTrasladoPendiente,
    listarTrasladosPendientes,
    contarTrasladosPendientes,
    aceptarTraslado,
    rechazarTraslado,
    listarEvidenciasTraslado,
    listarArticulosTraslado,
    eliminarTraslado,
    actualizarTraslado,
    buscarTraslado,
    filtrarTraslados,
    listarTraslados,
};
