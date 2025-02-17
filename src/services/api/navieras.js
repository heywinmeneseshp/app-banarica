import axios from "axios";
import endPoints from "@services/api/index";

const crearNavieras = async (body) => {
    const res = await axios.post(endPoints.Navieras.create, body);
    return res.data;
};

const cargueMasivoNavieras = async (body) => {
    const res = await axios.post(endPoints.Navieras.cargueMasivo, body);
    return res.data;
};

const actualizarNavieras = async (id, body) => {
    const res = await axios.patch(endPoints.Navieras.update(id), body);
    return res.data;
};

const listarNavieras = async () => {
    const res = await axios.get(endPoints.Navieras.list);
    return res.data;
};

const encontrarNavieras = async (id) => {
    const res = await axios.get(endPoints.Navieras.findOne(id));
    return res.data;
};

const paginarNavieras = async (offset, limit, body) => {
    let item = (typeof body === 'object' && body !== null) ? { ...body } : { navieras: body };
    const res = await axios.post(endPoints.Navieras.paginar(offset, limit), item);
    return res.data;
};

const eliminarNavieras = async (body) => {
    const res = await axios.delete(endPoints.Navieras.delete(body));
    return res.data;
};


export {
    listarNavieras,
    crearNavieras,
    actualizarNavieras,
    paginarNavieras,
    encontrarNavieras,
    eliminarNavieras,
    cargueMasivoNavieras
};