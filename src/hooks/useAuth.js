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
    const [almacenByUser, setAlmacenByUser] = useState([]);
    const router = useRouter();

    const login = async (username, password) => {
        try {
            const { data } = await axios.post(endPoints.auth.login, { username: username, password: password });

            const expire = 1 / 24;

            Cookie.set('token', data.token, { expires: expire });
            axios.defaults.headers.Authorization = 'Bearer ' + data.token;
            const res = await axios.get(endPoints.auth.profile);
            if (res.data.usuario.isBlock == true) return window.alert("El usuario esta deshabilitado, por favor comuníquese con el administrador");
            setUser(res.data.usuario);

            //Guardar usuario en local storage
            const usuario = res.data.usuario;

            const usuarioComoCadena = JSON.stringify(usuario);

            localStorage.setItem('usuario', usuarioComoCadena);

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
            const almacenesComoCadena = JSON.stringify(almacenes);
            localStorage.setItem('almacenByUser', almacenesComoCadena);
            router.push('/');
        } catch (e) {
            alert('Contraseña o usuario incorrecto');
        }


    };

    const getUser = () => {
        const usuario = localStorage.getItem('usuario');
        const usuarioComoObjeto = JSON.parse(usuario);
        return usuarioComoObjeto;
    };

    return { user, login, almacenByUser, setAlmacenByUser, setUser, getUser };
}