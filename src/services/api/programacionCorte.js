import axios from "axios";
import endPoints from "@services/api/index";
import { getToken } from "utils/session";

const getAuthConfig = () => {
    const token = getToken();
    if (!token) {
        return {};
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

const listarProgramacionCorte = async () => {
    const res = await axios.get(endPoints.programacionCorte.list, getAuthConfig());
    return res.data;
};

const cargarProgramacionCorte = async (filas, semana) => {
    const res = await axios.post(endPoints.programacionCorte.cargar, { filas, semana }, getAuthConfig());
    return res.data;
};

const eliminarProgramacionCorte = async (id) => {
    const res = await axios.delete(endPoints.programacionCorte.delete(id), getAuthConfig());
    return res.data;
};

const comparativaProgramacionCorte = async (semana) => {
    const res = await axios.get(endPoints.programacionCorte.comparativa(semana), getAuthConfig());
    return res.data;
};

const listadoRelacionadoProgramacionCorte = async (id) => {
    const res = await axios.get(endPoints.programacionCorte.listadoRelacionado(id), getAuthConfig());
    return res.data;
};

export {
    listarProgramacionCorte,
    cargarProgramacionCorte,
    eliminarProgramacionCorte,
    comparativaProgramacionCorte,
    listadoRelacionadoProgramacionCorte
};