import axios from 'axios';
import endPoints from './index';
import { getToken } from 'utils/session';

const buildConfig = () => {
    const token = getToken();
    return {
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
    };
};

const enviarEmail = async (destinatario, asunto, cuerpo) => {
    const body = { destinatario, asunto, cuerpo };
    try {
        const response = await axios.post(endPoints.email.send, body, buildConfig());
        if (response.data?.success === false) {
            return {
                success: false,
                message: response.data?.message || 'No fue posible enviar el correo.',
            };
        }
        return response.data;
    } catch (e) {
        console.error("Error al enviar el correo:", e);
        return {
            success: false,
            message:
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                'No fue posible enviar el correo.',
        };
    }
};

export const enviarCorreo = async (datos) => {
    try {
        const response = await axios.post(endPoints.email.send, datos, buildConfig());
        return response.data;
    } catch (error) {
        console.error("Error al enviar correo:", error);
        throw new Error(
            error?.response?.data?.message ||
            error?.message ||
            "No fue posible enviar el correo."
        );
    }
};

export { enviarEmail };
