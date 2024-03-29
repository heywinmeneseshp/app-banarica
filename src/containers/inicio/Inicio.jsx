import React, { useEffect, useState } from 'react';

import {  paginarNotificaciones } from '@services/api/notificaciones';

import AlertaCombustible from '@assets/AlertaCombustible';
import FuelConsumptionDashboard from '@assets/FuelConsumptionDashboard';

//CSS


export default function Inicio() {

    const [notificaciones, setNotificaciones] = useState([]);
    const [change, setChange] = useState(0);

    useEffect(() => {
        listar();
    }, [change]);

    const listar = async () => {
        const {data} = await paginarNotificaciones(1, 50, { aprobado: false, visto: false });
        setNotificaciones(data);
    };

    return (
        <>
            {notificaciones.map((item, index) => {
                return (
                    <AlertaCombustible key={index} data={item} setChange={setChange} change={change} />
                );
            })}

            <FuelConsumptionDashboard />

        </>
    );
}