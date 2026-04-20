import axios from 'axios';
import endPoints from './index';
import {
    getToken,
    persistToken,
    setStoredUser,
    setStoredWarehouses,
    sortWarehousesByName,
} from 'utils/session';

const loginWithCredentials = async (username, password) => {
    const response = await axios.post(endPoints.auth.login, { username, password });
    const token = response?.data?.token;

    if (!token) {
        throw new Error('La respuesta del login no incluyo un token.');
    }

    persistToken(token, 1 / 24);
    setAuthorizationHeader(token);

    return response.data;
};

const requestPasswordRecovery = async (username) => {
    const response = await axios.post(endPoints.auth.recoverPassword, { username });
    return response.data;
};

const changePasswordWithToken = async (token, password) => {
    const response = await axios.post(endPoints.auth.changePassword, { token, password });
    return response.data;
};

const runPasswordPolicy = async () => {
    const response = await axios.post(endPoints.auth.runPasswordPolicy);
    return response.data;
};

const setAuthorizationHeader = (token) => {
    if (token) {
        axios.defaults.headers.Authorization = `Bearer ${token}`;
        return;
    }

    delete axios.defaults.headers.Authorization;
};

const fetchAuthenticatedProfile = async (token = getToken()) => {
    if (!token) {
        return null;
    }

    persistToken(token);
    setAuthorizationHeader(token);

    const response = await axios.get(endPoints.auth.profile);
    return response.data;
};

const syncSessionFromProfile = (profileData) => {
    const usuario = profileData?.usuario ?? null;
    const almacenes = sortWarehousesByName(profileData?.almacenes ?? []);

    if (usuario) {
        setStoredUser(usuario);
    }

    if (profileData?.almacenes) {
        setStoredWarehouses(almacenes);
    }

    return { usuario, almacenes };
};

export {
    changePasswordWithToken,
    fetchAuthenticatedProfile,
    loginWithCredentials,
    requestPasswordRecovery,
    runPasswordPolicy,
    setAuthorizationHeader,
    syncSessionFromProfile,
};
