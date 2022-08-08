import React, { useState, useContext, createContext } from 'react';
import { buscarUsuario, listarAlmacenesPorUsuario } from '@services/api/usuarios';
import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { listarAlmacenes } from '@services/api/almacenes';

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
    const [consAlmacenByUser, setConsAlmacenByUser] = useState([])
    const router = useRouter();

    const login = (username, password) => {
        buscarUsuario(username).then((res) => {
            try {
                if (res.password === password) {
                    setUser(res);
                    router.push('/');
                } else {
                    alert('Contraseña incorrecta');
                }
            } catch (error) {
                alert('El usuario no se encuentra registrado');
            }
        });
        let array = [];
        let otherArray = [];
        listarAlmacenes().then((res) => {
            listarAlmacenesPorUsuario(username).then((resB) => {
                const result = resB.filter((item) => item.habilitado === true);
                res.map((almacen) => {
                    result.map((item) => {
                        if (item.id_almacen === almacen.consecutivo) {
                            array.push(almacen); //agrega al array los almacenes que tiene el usuario
                            otherArray.push(almacen.consecutivo)
                        }
                    }
                    )
                })
                setAlmacenByUser(array);
                setConsAlmacenByUser(otherArray);
            })
        })

        
    }
    return { user, login, almacenByUser, consAlmacenByUser };
}