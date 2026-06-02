import axios from 'axios';
import endPoints from './index';
import { getToken } from 'utils/session';

const buildMultipartConfig = () => {
  const token = getToken();
  const headers = {
    accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { headers };
};

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.message
  || error?.response?.data?.error
  || error?.response?.statusText
  || error?.message
  || fallback
);

const subirEvidencias = async (formData) => {
  try {
    const response = await axios.post(
      endPoints.googleDrive.subirEvidencias,
      formData,
      buildMultipartConfig()
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No fue posible subir las evidencias.'));
  }
};

const subirEvidenciaUnica = async (formData) => {
  try {
    const response = await axios.post(
      endPoints.googleDrive.subirEvidenciaUnica,
      formData,
      buildMultipartConfig()
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No fue posible subir la evidencia.'));
  }
};

const probarGoogleDrive = async () => {
  try {
    const response = await axios.get(endPoints.googleDrive.test, buildMultipartConfig());
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No fue posible validar Google Drive.'));
  }
};

export {
  probarGoogleDrive,
  subirEvidenciaUnica,
  subirEvidencias,
};
