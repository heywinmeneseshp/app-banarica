import React from 'react';
import { useRouter } from 'next/router';
import Cookie from 'js-cookie';
import axios from 'axios';
//Hooks
import { useAuth } from '@hooks/useAuth';
import endPoints from '@services/api';
//Component
import Footer from "@components/Footer";
import Header from '@components/Header';
//CSS
import styles from '@styles/Layout.module.css';
import { useEffect } from 'react';

export default function ThirdLayout({ children }) {
    const router = useRouter();
    const { user, setUser } = useAuth();
    useEffect(() => {
        listar();
    }, []);

    const listar = async () => {
        const token = Cookie.get('token');
        if (!token) {
            localStorage.clear();
            setUser(null);
            router.push('/login');
            window.alert("Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar utilizando la aplicación.");
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
            } catch (error) {
                console.error("Error al obtener el perfil del usuario:", error);
                // Manejar el error apropiadamente, posiblemente redirigir a una página de error
            }
        }
    };

    if (user) {
        return (
            <>
                <Header />
                <main className={styles.main}>
                    <div className='container'>{children}</div>
                </main>
                <Footer />
            </>
        );
    }
}