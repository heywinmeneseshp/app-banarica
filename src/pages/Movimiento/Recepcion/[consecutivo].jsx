import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Recepcion from "@containers/almacen/Recepcion";
import ThirdLayout from 'layout/ThirdLayout';

export default function RLiquidacion() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.isReady]);
    return (
        <ThirdLayout>
            <Recepcion movimiento={router.query} />
        </ThirdLayout>
    );
}
