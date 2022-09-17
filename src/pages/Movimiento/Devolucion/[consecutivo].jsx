import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Devolucion from "@components/almacen/Devolucion";
import ThirdLayout from 'layout/ThirdLayout';

export default function RDevolucion() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.isReady]);
    return (
        <ThirdLayout>
            <Devolucion movimiento={router.query} />
        </ThirdLayout>
    );
}
