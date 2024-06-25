import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppContext from '@context/AppContext';
import axios from 'axios';
import Cookie from 'js-cookie';
//Hooks
import { useAuth } from '@hooks/useAuth';
import endPoints from '@services/api';
//Components
import Inicio from '@containers/inicio/Inicio';
import Adminsitrador from '@containers/administrador';
import Almacen from '@containers/almacen';
import Informes from '@containers/informes';
//CSS
import RootLayout from '@layout/RootLayout';

export default function Home() {
    const { user, setUser, setAlmacenByUser } = useAuth();
    const { initialMenu } = useContext(AppContext);
    const router = useRouter();

    useEffect(() => {
        listar();
    }, []);

    const listar = async () => {
        const token = Cookie.get('token');
        if (!token) {
            localStorage.clear();
            setUser(null);
            router.push('/login');
        } else {
            Cookie.set('token', token, { expires: 1 / 48 });
            axios.defaults.headers.Authorization = 'Bearer ' + token;
            try {
                const res = await axios.get(endPoints.auth.profile);
                if (res.data.usuario.isBlock === true) {
                    return window.alert("El usuario está deshabilitado, por favor comuníquese con el administrador");
                }
                setUser(res.data.usuario);
                // Guardar usuario en localStorage
                const usuario = res.data.usuario;
                const usuarioComoCadena = JSON.stringify(usuario);
                localStorage.setItem('usuario', usuarioComoCadena);
                const almacenByUser = JSON.parse(localStorage.getItem("almacenByUser"));
                setAlmacenByUser(almacenByUser);
                if (!usuario) router.push('/login');
            } catch (error) {
                console.error("Error al obtener el perfil del usuario:", error);
                // Manejar el error apropiadamente, posiblemente redirigir a una página de error
            }
        }
    };

    if (user) {
        return (
            <div>
                <RootLayout>
                        {initialMenu.menu.inicio && <Inicio />}
                        {initialMenu.menu.administrador && <Adminsitrador />}
                        {initialMenu.menu.almacen && <Almacen />}
                        {initialMenu.menu.informes && <Informes />}
                </RootLayout>

            </div>
        );
    }
}