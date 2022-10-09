import React, { useEffect } from "react";
import { useRouter } from "next/router";
import ThirdLayout from 'layout/ThirdLayout';
import Devolucion from "@components/almacen/Devolucion";

export default function RAjuste() {
    const router = useRouter();

    useEffect(() => {
    }, [router?.isReady]);
    return (
        <ThirdLayout>
            <Devolucion movimiento={router.query} />
        </ThirdLayout>
    );
}
