// services/api/correo.js
import axios from 'axios';
import endPoints from '.';

export const enviarCorreo = async (datos) => {
  try {
    const response = await axios.post(endPoints.email.send, datos);
    return response.data;
  } catch (error) {
    console.error( error);
  }
};