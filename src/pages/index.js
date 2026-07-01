import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Cookie from 'js-cookie';
import { useAuth } from '@hooks/useAuth';
import endPoints from '@services/api';
import { encontrarModulo } from '@services/api/configuracion';
import Inicio from '@containers/inicio/Inicio';

export default function Home() {
    const { user, setUser, setAlmacenByUser } = useAuth();
    const router = useRouter();
    const [checking, setChecking] = useState(true);

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
                window.alert("El usuario esta deshabilitado, por favor comuniquese con el administrador");
                router.push('/login');
                return;
            }

            const usuario = res.data.usuario;
            if (!usuario) { router.push('/login'); return; }

            setUser(usuario);
            localStorage.setItem('usuario', JSON.stringify(usuario));

            const almacenes = Array.isArray(res.data.almacenes)
                ? [...res.data.almacenes].sort((a, b) => a.nombre.localeCompare(b.nombre))
                : [];

            setAlmacenByUser(almacenes);
            localStorage.setItem('almacenByUser', JSON.stringify(almacenes));

            try {
                const configResponse = await encontrarModulo(usuario.username);
                const config = configResponse?.length
                    ? JSON.parse(configResponse[0]?.detalles || '{}')
                    : {};
                if (config?.inicio && config.inicio.startsWith('/') && config.inicio !== '/') {
                    router.push(config.inicio);
                    return;
                }
            } catch {
                // si falla el config, se queda en inicio por defecto
            }
        } catch (error) {
            console.error("Error al obtener el perfil del usuario:", error);
            router.push('/login');
            return;
        } finally {
            setChecking(false);
        }
    };

    if (checking || !user) {
        return null;
    }

    return <Inicio />;
}
