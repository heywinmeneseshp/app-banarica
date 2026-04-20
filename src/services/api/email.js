import axios from 'axios';
import endPoints from './index';

const config = {
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const enviarEmail = async (destinatario, asunto, cuerpo) => {
    const body = { destinatario, asunto, cuerpo };
    try {
        const response = await axios.post(endPoints.email.send, body, config);
        return response.data;
    } catch (e) {
        console.error("Error al enviar el correo:", e);
        return null;
    }
};

export {
    enviarEmail
};
