import axios from 'axios';
import endPoints from './index';

const agregarCombos = async (body) => {
    const config = {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const response = await axios.post(endPoints.combos.create, body, config);
    return response.data;
};

const eliminarCombos = async (consecutivo) => {
    const res = await axios.delete(endPoints.combos.delete(consecutivo));
    return res.data;
};

const actualizarCombos = async (id, changes) => {
    const res = await axios.patch(endPoints.combos.update(id), changes);
    return res.data;
};

const buscarCombos = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.combos.findOne(consecutivo));
        return res.data;
    } catch (e) {
        alert("Se ha presentado un error al buscar el combo");
    }
};

const buscarComboArmado = async (consecutivo) => {
    try {
        const res = await axios.get(endPoints.combos.findOneAsembled(consecutivo));
        return res.data;
    } catch (e) {
        alert("Se ha presentado un erro al buscar el combo armado");
    }
};

const listarCombos = async () => {
    try {
        const res = await axios.get(endPoints.combos.list);
        return res.data;
    } catch {
        alert("Se ha presentado un erro al listar los combos");
    }
};

const armarCombo = async (cons_combo, cons_producto) => {
    const res = await axios.post(endPoints.combos.assemble, { cons_combo, cons_producto });
    return res.data;
};

const paginarCombos = async (page, limit, nombre, body) => {
    try {
        let element = body;
        if (!element?.isBlock) element.isBlock = true;
        const res = await axios.post(endPoints.combos.pagination(page, limit, nombre), element);
        return res.data;
    } catch {
        alert("Error al paginar combos");
    }
};

export {
    agregarCombos,
    eliminarCombos,
    actualizarCombos,
    buscarCombos,
    listarCombos,
    armarCombo,
    buscarComboArmado,
    paginarCombos
};