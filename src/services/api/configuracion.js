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

const encontrarModulo = async (modulo) => {
    const res = await axios.get(endPoints.confi.buscarModulo(modulo), getAuthConfig());
    return res.data;
};

const actualizarModulo = async (dataModulo) => {
    const res = await axios.patch(endPoints.confi.actualizarModulo, dataModulo, getAuthConfig());
    return res.data;
};

const encontrarEmpresa = async () => {
    const res = await axios.get(endPoints.confi.encontrarEmpresa);
    return res.data;
};

const actualizarEmpresa = async (body) => {
    const res = await axios.patch(endPoints.confi.actualizarEmpresa, body);
    return res.data;
};

const encontrarEmailConfig = async () => {
    const res = await axios.get(endPoints.confi.encontrarEmail, getAuthConfig());
    return res.data;
};

const actualizarEmailConfig = async (body) => {
    const payload = {
        modulo: 'email_envio',
        ...body,
    };

    try {
        const res = await axios.patch(endPoints.confi.actualizarEmail, payload, getAuthConfig());
        return res.data;
    } catch (error) {
        console.error('Fallo al actualizarEmailConfig', {
            url: endPoints.confi.actualizarEmail,
            payload,
            status: error?.response?.status,
            data: error?.response?.data,
        });
        throw error;
    }
};


export {
encontrarModulo,
actualizarModulo,
encontrarEmpresa,
actualizarEmpresa,
encontrarEmailConfig,
actualizarEmailConfig
};
