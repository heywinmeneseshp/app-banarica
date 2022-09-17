import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Liquidacion from "@components/almacen/Liquidacion";
import ThirdLayout from 'layout/ThirdLayout';

export default function RLiquidacion() {
    const router = useRouter()

    useEffect(() => {
    }, [router?.isReady])
    return (
        <ThirdLayout>
            <Liquidacion movimiento={router.query} />
        </ThirdLayout>
    );
}
