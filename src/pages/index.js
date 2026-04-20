import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppContext from '@context/AppContext';
import axios from 'axios';
import Cookie from 'js-cookie';
import { useAuth } from '@hooks/useAuth';
import endPoints from '@services/api';
import Inicio from '@containers/inicio/Inicio';
import Adminsitrador from '@containers/administrador';
import Almacen from '@containers/almacen';
import Informes from '@containers/informes';
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
            return;
        }

        try {
            Cookie.set('token', token, { expires: 1 / 48 });
            axios.defaults.headers.Authorization = `Bearer ${token}`;
            const res = await axios.get(endPoints.auth.profile);
            if (res.data.usuario?.isBlock === true) {
                return window.alert("El usuario esta deshabilitado, por favor comuniquese con el administrador");
            }

            const usuario = res.data.usuario;
            setUser(usuario);
            localStorage.setItem('usuario', JSON.stringify(usuario));

            const almacenes = Array.isArray(res.data.almacenes)
                ? [...res.data.almacenes].sort((a, b) => a.nombre.localeCompare(b.nombre))
                : [];

            setAlmacenByUser(almacenes);
            localStorage.setItem('almacenByUser', JSON.stringify(almacenes));

            if (!usuario) {
                router.push('/login');
            }
        } catch (error) {
            console.error("Error al obtener el perfil del usuario:", error);
            router.push('/login');
        }
    };

    if (!user) {
        return null;
    }

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
