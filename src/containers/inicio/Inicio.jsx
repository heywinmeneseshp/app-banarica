import React, { useState, useEffect } from 'react';




import FuelConsumptionDashboard from '@assets/FuelConsumptionDashboard';
import Dashboard from '@containers/seguridad/Dashboard';
import { encontrarModulo } from '@services/api/configuracion';
import Configuracion from '@components/administrador/Configuracion';

//CSS


export default function Inicio() {

    const [inicio, setInicio] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Recuperar y parsear el usuario desde localStorage
                const storedUser = localStorage.getItem('usuario');
                if (!storedUser) {
                    console.error('No se encontró un usuario en el almacenamiento local.');
                    return;
                }
                const usuario = JSON.parse(storedUser);
                // Llamar a la función para encontrar el módulo del usuario
                const res = await encontrarModulo(usuario.username);
                if (res?.length > 0) {
                    // Parsear y establecer la configuración inicial si existe
                    const confiInicio = JSON.parse(res[0].detalles);
                    const existeConfig = confiInicio?.inicio || null;
                    setInicio(existeConfig);
                    if (!existeConfig) setOpen(true);
                    
                } else {
                    console.warn('No se encontraron detalles para el usuario.');
                }
            } catch (error) {
                console.error('Ocurrió un error al cargar los datos:', error);
            }
        };

        fetchData();
    }, []);


    return (
        <>
            {inicio == "Dashboard Combustible" && <FuelConsumptionDashboard />}
            {inicio == "Dashboard Contenedores" && <Dashboard />}
            {open && <Configuracion setOpen={setOpen}/>}
        </>
    );
}