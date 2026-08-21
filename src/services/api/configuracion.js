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

const encontrarModulo = async (modulo, options = {}) => {
    const query = options.syncWeeks === false ? '?syncWeeks=false' : '';
    const res = await axios.get(`${endPoints.confi.buscarModulo(modulo)}${query}`, getAuthConfig());
    return res.data;
};

const listarModulos = async (prefix = '') => {
    const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    const res = await axios.get(`${endPoints.confi.actualizarModulo.replace('/actualizar', '/listar')}${query}`, getAuthConfig());
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


// Descarga el .sql completo y lo entrega como archivo (el navegador no puede
// "guardar" la respuesta de axios directamente, hay que armar el blob).
const exportarBaseDatos = async () => {
    try {
        const res = await axios.get(endPoints.confi.exportarDb, {
            ...getAuthConfig(),
            responseType: 'blob',
            timeout: 5 * 60 * 1000, // el export completo puede tardar bastante
        });

        const disposition = res.headers?.['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] || `backup-banarica-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.sql`;

        const url = window.URL.createObjectURL(res.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        // Con responseType 'blob', axios entrega el error como Blob (no como
        // JSON) aunque el backend haya mandado un {message: '...'} normal.
        // Sin esto, el mensaje real del error nunca se ve.
        if (error?.response?.data instanceof Blob) {
            try {
                const texto = await error.response.data.text();
                const parsed = JSON.parse(texto);
                error.response.data = parsed;
            } catch {
                // el cuerpo del error no era JSON (p.ej. una pagina de error
                // de un proxy/timeout); se deja el error tal cual.
            }
        }
        throw error;
    }
};

// confirmacion debe ser EXACTAMENTE "IMPORTAR BASE DE DATOS" (validado tambien
// en el backend) para evitar restaurar la base de datos por error de un clic.
const importarBaseDatos = async (archivo, confirmacion) => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('confirmacion', confirmacion);

    const res = await axios.post(endPoints.confi.importarDb, formData, {
        ...getAuthConfig(),
        headers: { ...getAuthConfig().headers, 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export {
encontrarModulo,
listarModulos,
actualizarModulo,
encontrarEmpresa,
actualizarEmpresa,
encontrarEmailConfig,
actualizarEmailConfig,
exportarBaseDatos,
importarBaseDatos
};
