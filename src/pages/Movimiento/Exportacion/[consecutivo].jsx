import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Ajuste from "@components/almacen/Ajuste";
import ThirdLayout from 'layout/ThirdLayout';

export default function RAjuste() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.isReady]);
    return (
        <ThirdLayout>
            <Ajuste movimiento={router.query} exportacion={"Exportación"} />
        </ThirdLayout>
    );
}
