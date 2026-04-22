// services/api/correo.js
import axios from 'axios';
import endPoints from '.';

export const enviarCorreo = async (datos) => {
  try {
    const response = await axios.post(endPoints.email.send, datos);
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
