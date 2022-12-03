import React, { useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import MovimientoPDF from "@components/documentos/MovimientoPDF";
import { useState } from "react";




export default function PDF( { movimiento } ) {
    const [client, setClient] = useState(false)


    useEffect(() => {
        setClient(true)
    }, [])

    return (

        <PDFViewer  style={{ width: "100%", height: "100vh" }}>
            <MovimientoPDF  move={movimiento} />
        </PDFViewer>
    );
}
