import axios from 'axios';
import endPoints from './index';
const getErrorMessage = (error, fallback) => (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
);

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const agregarRecord_consumo = async (record_consumo) => {
    try {
        const url = endPoints.record_consumo.create;
        const response = await axios.post(url, record_consumo, config);
        return response.data;
    } catch (e) {
        alert("Error al ingresar datos de consumo");
    }
};

const encontrarUnConsumo = async (body) => {
    try {
        const res = await axios.post(endPoints.record_consumo.findOne, body);
        return res.data;
    } catch (e) {
        return null;
    }
};

const consultarConsumo = async () => {
    try {
        const res = await axios.get(endPoints.record_consumo.consultarConsumo);
        return res.data;
    } catch {
        return [];
    }
};

const eliminarRecord_consumo = async (consecutivo) => {
    try {
        const res = await axios.delete(endPoints.record_consumo.delete(consecutivo));
        return res.data;
    }catch{
        return[];
    }
   
};

const listarRecord_consumo = async () => {
    try {
        const res = await axios.get(endPoints.record_consumo.list);
        return res.data;
    } catch (e) {
        alert("Error al listar consumos");
    }
};

const paginarRecord_consumo = async (page, limit, item) => {
    try {
        const res = await axios.post(endPoints.record_consumo.pagination(page, limit), item);
        return res.data;
    } catch {
        alert("Error al paginar consumos");
    }
};

const actualizarRecord_consumo = async (consecutivo, changes) => {
    const res = await axios.patch(endPoints.record_consumo.update(consecutivo), changes);
    return res.data;
};

const liquidarConsumoRutas = async (body) => {
    try {
        const res = await axios.post(endPoints.record_consumo.liquidar, body);
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al liquidar consumo"));
    }
};

const previewLiquidacionRuta = async (body) => {
    try {
        const res = await axios.post(endPoints.record_consumo.previewLiquidacionRuta, body);
        return res.data?.data || res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al calcular la preliquidacion por ruta"));
    }
};

const liquidarRutaDia = async (body) => {
    try {
        const res = await axios.post(endPoints.record_consumo.liquidarRuta, body);
        return res.data?.data || res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Error al liquidar el dia por ruta"));
    }
};

export {
    agregarRecord_consumo, encontrarUnConsumo, consultarConsumo,
    eliminarRecord_consumo, listarRecord_consumo, paginarRecord_consumo,
    actualizarRecord_consumo, liquidarConsumoRutas, previewLiquidacionRuta, liquidarRutaDia
};
