import axios from "axios";
import endPoints from "@services/api/index";

const crearSemanas = async (body) => {
    const res = await axios.post(endPoints.semanas.create, body);
    return res.data;
};

const actualizarSemanas = async (id, body) => {
    const res = await axios.patch(endPoints.semanas.update(id), body);
    return res.data;
};

const listarSemanas = async () => {
    const res = await axios.get(endPoints.semanas.list);
    return res.data;
};

const encontrarSemanas = async (id) => {
    const res = await axios.get(endPoints.semanas.findOne(id));
    return res.data;
};

const filtrarSemanas = async (body) => {
    const res = await axios.post(endPoints.semanas.filter, body);
    return res.data;
};

const filtrarSemanaRangoMes = async (previousMonths, afterMonths) => {
    const mas1Mes = new Date();
    mas1Mes.setMonth(mas1Mes.getMonth() + afterMonths);
    const mas1MesFormatted = mas1Mes.toISOString().slice(0, 19).replace('T', ' ');
    const menos1Mes = new Date();
    menos1Mes.setMonth(menos1Mes.getMonth() - previousMonths);
    const menos1MesFormatted = menos1Mes.toISOString().slice(0, 19).replace('T', ' ');
    const semanas = await filtrarSemanas({ createdAt: [menos1MesFormatted, mas1MesFormatted] });
    return semanas;
};

const eliminarSemanas = async (body) => {
    const res = await axios.delete(endPoints.semanas.delete(body));
    return res.data;
};


export {
    listarSemanas,
    crearSemanas,
    actualizarSemanas,
    filtrarSemanas,
    encontrarSemanas,
    eliminarSemanas,
    filtrarSemanaRangoMes
};