import React, { useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import MovimientoPDF from "@components/documentos/MovimientoPDF";
import PedidoPDF from "@components/documentos/PedidoPDF";
import TrasladoPDF from "@components/documentos/TrasladoPDF";
import StockPDF from "@components/documentos/StockPDF";
import BarcodePDF from "@components/documentos/BarcodePDF";

export default function PDF( { movimiento, documento } ) {


    useEffect(() => {
    }, []);

    return (
        <PDFViewer  style={{ width: "100%", height: "100vh" }}>
           {(documento == "movimiento") && <MovimientoPDF  move={movimiento} />}
           {(documento == "pedido") && <PedidoPDF  move={movimiento} />}
           {(documento == "traslado") && <TrasladoPDF  move={movimiento} />}
           {(documento == "stock") && <StockPDF  data={movimiento} />}
           {(documento == "barcodes") && <BarcodePDF  />}
        </PDFViewer>
    );
}
