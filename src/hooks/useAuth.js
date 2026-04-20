import React, { useState, useContext, createContext } from 'react';
import axios from 'axios';
import endPoints from '@services/api';
import { useRouter } from 'next/router';
import { loginWithCredentials } from '@services/api/auth';
import {
    getStoredUser,
    setStoredUser,
    setStoredWarehouses,
    sortWarehousesByName,
} from 'utils/session';

const defaultAuthContext = {
    user: null,
    login: null,
    almacenByUser: [],
    setAlmacenByUser: () => {},
    setUser: () => {},
    getUser: () => null,
    isLoggingIn: false,
};

const AuthContext = createContext(defaultAuthContext);

export function ProviderAuth({ children }) {
    const auth = useProviderAuth();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    return useContext(AuthContext) || defaultAuthContext;
};

function useProviderAuth() {
    const [user, setUser] = useState(null);
    const [almacenByUser, setAlmacenByUser] = useState([]);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();

    const login = async (username, password) => {
        try {
            setIsLoggingIn(true);
            await loginWithCredentials(username, password);

            const res = await axios.get(endPoints.auth.profile);
            if (res.data.usuario.isBlock) {
                return window.alert("El usuario esta deshabilitado, por favor comuniquese con el administrador");
            }

            setUser(res.data.usuario);
            setStoredUser(res.data.usuario);

            const almacenes = sortWarehousesByName(res.data.almacenes);
            setAlmacenByUser(almacenes);
            setStoredWarehouses(almacenes);

            router.push('/');
        } catch (e) {
            alert(e?.response?.data?.message || 'Contrasena o usuario incorrecto');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const getUser = () => getStoredUser();

    return { user, login, almacenByUser, setAlmacenByUser, setUser, getUser, isLoggingIn };
}
