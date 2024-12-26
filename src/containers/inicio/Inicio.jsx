import React, { useState, useEffect } from 'react';




import FuelConsumptionDashboard from '@assets/FuelConsumptionDashboard';
import Dashboard from '@containers/seguridad/Dashboard';
import { encontrarModulo } from '@services/api/configuracion';

//CSS


export default function Inicio() {

    const [inicio, setInicio] = useState("");
    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        encontrarModulo(usuario.username).then(res => {
           const confiInicio =  JSON.parse(res[0].detalles);
           setInicio(confiInicio?.inicio);  
        });

       
    }, []);

    return (
        <>
           {(inicio == "Dashboard Combustible" || !inicio) &&<FuelConsumptionDashboard /> }
           {inicio == "Dashboard Contenedores" && <Dashboard />}
        </>
    );
}