// components/TablaViajes.tsx

import React, { useEffect } from 'react';

import HistorialConsumos from '@components/Programacion/HistorialConsumos';
import { useRouter } from 'next/router';

export default function HistorialConsumoReporte() {

    const router = useRouter();
    const { query } = router;



    useEffect(() => {
 
    }, []);

    return (
        <>
            <div className='container mt-4'>
                <HistorialConsumos
                    placa={query?.item}
                    mes={query?.mes}
                    sem={query?.sem}
                    anho={query?.anho} />
            </div>
        </>
    );
}
