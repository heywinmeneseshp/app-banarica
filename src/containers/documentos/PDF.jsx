import React, { useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import MovimientoPDF from "@components/documentos/MovimientoPDF";
import PedidoPDF from "@components/documentos/PedidoPDF";
import { useState } from "react";




export default function PDF( { movimiento, documento } ) {
    const [client, setClient] = useState(false)


    useEffect(() => {
        setClient(true)
    }, [])

    return (
        <PDFViewer  style={{ width: "100%", height: "100vh" }}>
           {(documento == "movimiento") && <MovimientoPDF  move={movimiento} />}
           {(documento == "pedido") && <PedidoPDF  move={movimiento} />}
        </PDFViewer>
    );
}
