import React from "react";
import Ajuste from "@components/almacen/Ajuste";
import ThirdLayout from 'layout/ThirdLayout';


export default function RExportacion() {
    const exportacion = "Exportación";
    return (
        <ThirdLayout>
            <Ajuste exportacion={exportacion}/>
        </ThirdLayout>
    );
}

