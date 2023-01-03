import React, { useState, useContext, createContext } from 'react';
import axios from 'axios';
import endPoints from '@services/api';
import Cookie from 'js-cookie';
import { useRouter } from 'next/router';


const AuthContext = createContext();

export function ProviderAuth({ children }) {
    const auth = useProviderAuth();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    return useContext(AuthContext);
};

function useProviderAuth() {
    const [user, setUser] = useState(null);
    const [almacenByUser, setAlmacenByUser] = useState([])
    const router = useRouter();

    const login = async (username, password) => {
        try {
            const { data } = await axios.post(endPoints.auth.login, { username: username, password: password })
            const expire = 1
            Cookie.set('token', data.token, { expires: expire });
            axios.defaults.headers.Authorization = 'Bearer ' + data.token
            const res = await axios.get(endPoints.auth.profile);
            if (res.data.usuario.isBlock == true) return window.alert("El usuario esta deshabilitado, por favor comuníquese con el administrador")
            setUser(res.data.usuario)
            const almacenes = res.data.almacenes.sort((a, b) => {
                if (a.nombre == b.nombre) {
                  return 0;
                }
                if (a.nombre < b.nombre) {
                  return -1;
                }
                return 1;
              });
            setAlmacenByUser(almacenes);
            router.push('/');
        } catch (e) {
            alert('Contraseña o usuario incorrecto');
        }


    }
    return { user, login, almacenByUser, setUser };
}