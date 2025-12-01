import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import styles2 from "@components/shared/Formularios/Formularios.module.css";

function CrearQRCode({ contenedor, setOpenQR }) {
    const [contenedorId, setContenedorId] = useState('');
    const [fechaValue, setFechaValue] = useState('');
    const [qrData, setQrData] = useState(null);
    const [repeticiones, setRepeticiones] = useState(25);
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const qrRef = useRef();
    const canvasRef = useRef();

    useEffect(() => {
        console.log(contenedor);
        if (contenedor.id) {
            // ✅ SOLUCIÓN: Crear un objeto JSON y codificarlo
            const datos = {
                id: contenedor.id,
                timestamp: Date.now(),
                contenedor: contenedor.contenedor
            };
            const token = btoa(JSON.stringify(datos));
            setContenedorId(token);
        }
        if (contenedor.createdAt) {
            setFechaValue(contenedor.createdAt);
        }
    }, [contenedor]);

    const handleGenerarQR = (e) => {
        e.preventDefault();

        if (!contenedorId) {
            alert('No se pudo generar el ID del contenedor');
            return;
        }

        // ✅ SOLUCIÓN: Usar el token Base64 directamente sin encodeURIComponent
        const baseUrl = window.location.origin;
        const traceUrl = `${baseUrl}/tracecode?token=${contenedorId}`; // ❌ QUITÉ el } extra

        setQrData(traceUrl);
    };



    // Convertir SVG a Canvas y luego a Data URL
    const convertSVGtoCanvas = () => {
        return new Promise((resolve) => {
            const svgElement = qrRef.current.querySelector('svg');
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Configurar canvas del mismo tamaño que el SVG
            const svgRect = svgElement.getBoundingClientRect();
            canvas.width = svgRect.width;
            canvas.height = svgRect.height;

            // Limpiar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Convertir SVG a imagen
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);

                // Convertir canvas a Data URL
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            };
            img.src = url;
        });
    };

    const generarPDFConQRReal = async () => {
        if (!qrData || !qrRef.current) {
            alert('Primero genera el QR');
            return;
        }

        setGenerandoPDF(true);

        try {
            const numRepeticiones = Math.min(Math.max(1, repeticiones), 100);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter' // Formato Carta (Letter)
            });

            const pageWidth = 215.9;
            const pageHeight = 279.4;

            // Configuración para 25 etiquetas por hoja (5x5)
            const qrPerRow = 5;
            const qrPerColumn = 5;
            const totalPerPage = qrPerRow * qrPerColumn;

            // --- Ajustes de Espacio y Márgenes ---
            const spacingBetweenQR = 4;   // Espacio horizontal entre QR (4mm)
            const dateTextHeight = 5;  // Altura reservada para el texto de la fecha (AUMENTADO a 5mm)
       

            // 1. CALCULAR TAMAÑO MÁXIMO DEL QR (Limitado por el ancho)
            const assumedMarginHorizontal = 5;
            const usableWidth = pageWidth - (2 * assumedMarginHorizontal);
            const totalSpacingH = (qrPerRow - 1) * spacingBetweenQR;

            // Cálculo del QR Size: el QR debe ser cuadrado y está limitado por el ancho.
            const qrSize = Math.floor((usableWidth - totalSpacingH) / qrPerRow);

            // 2. CALCULAR MARGEN HORIZONTAL REAL (Para centrado y margen uniforme)
            const totalBlockWidth = (qrPerRow * qrSize) + totalSpacingH;
            // Este margen es el que se usa para centrar y para los márgenes superior/inferior.
            const uniformMargin = (pageWidth - totalBlockWidth) / 2;

            // Asignar el margen uniforme
            const marginHorizontal = uniformMargin;


            // 3. CALCULAR ESPACIADO VERTICAL RESTANTE (Para centrado vertical)
            // Altura requerida por los 5 códigos QR + 5 textos de fecha (usamos dateTextHeight + datePadding)
            const totalHeightRequiredByElements = (qrPerColumn * qrSize) + (qrPerColumn * dateTextHeight);

            // Espacio total disponible verticalmente quitando el margen uniforme (arriba y abajo)
            const usableHeightForSpacing = pageHeight - (2 * uniformMargin) - totalHeightRequiredByElements;

            // El número de "espacios" entre las celdas (4 entre 5 filas)
            const numberOfVerticalSpaces = qrPerColumn - 1;

            // Calcular el nuevo spacing vertical, ajustando para usar el espacio restante.
            const spacingVertical = Math.max(0, usableHeightForSpacing / numberOfVerticalSpaces);

            // Recalcular la posición de inicio vertical (startY)
            const startY = uniformMargin;
            // -----------------------------------------------------

            // Convertir SVG a Data URL
            const qrDataURL = await convertSVGtoCanvas();
            const dateString = new Date().toLocaleDateString();

            let currentRep = 0;
            let pageNumber = 1;

            while (currentRep < numRepeticiones) {
                if (currentRep > 0) {
                    pdf.addPage();
                    pageNumber++;
                }

                const qrsThisPage = Math.min(numRepeticiones - currentRep, totalPerPage);

                for (let i = 0; i < qrsThisPage; i++) {
                    const row = Math.floor(i / qrPerRow);
                    const col = i % qrPerRow;

                    // 1. Calcular posición X e Y
                    const x = marginHorizontal + (col * (qrSize + spacingBetweenQR));

                    // La posición Y incluye el qrSize, la altura del texto de la fecha y el nuevo spacingVertical
                    // Se usa el spacingVertical calculado para el espacio entre celdas
                    const yIncrement = qrSize + dateTextHeight + spacingVertical;
                    const y = startY + (row * yIncrement);

                    // 2. Agregar el QR real como imagen al PDF
                    pdf.addImage(qrDataURL, 'PNG', x, y, qrSize, qrSize);

                    // 3. Borde sutil alrededor del QR
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.1);
                    pdf.rect(x, y, qrSize, qrSize, 'S');

                    // 4. Agregar la fecha de impresión debajo del cuadro y CENTRADA
                    pdf.setFontSize(8); // **AJUSTE: Fuente más grande (8pt)**
                    pdf.setTextColor(50, 50, 50);

                    // AJUSTE: Mover el texto 3mm debajo del QR para dejar un espacio pequeño
                    const yDate = y + qrSize + 3;
                    const xDateCenter = x + (qrSize / 2);

                    pdf.text(dateString, xDateCenter, yDate, { align: 'center' });
                }

                currentRep += qrsThisPage;

                // Pie de página global con información (usando el margen uniforme)
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);

                // Posicionar el footer usando el margen uniforme
                const footerY = pageHeight - (uniformMargin / 2);
                pdf.text(`Página ${pageNumber} - ${contenedor.contenedor}`, pageWidth - uniformMargin, footerY, { align: 'right' });
                pdf.text(`Generado: ${new Date().toLocaleDateString()}`, uniformMargin, footerY);
            }

            // Guardar PDF
            pdf.save(`QR-${contenedor.contenedor}-${fechaValue}.pdf`);

        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error al generar el PDF: ' + error.message);
        } finally {
            setGenerandoPDF(false);
        }
    };
    // Función para copiar la URL al portapapeles
    const copiarURL = async () => {
        if (!qrData) return;

        try {
            await navigator.clipboard.writeText(qrData);
            alert('URL copiada al portapapeles');
        } catch (err) {
            console.error('Error al copiar: ', err);
            alert('Error al copiar la URL');
        }
    };

    return (
        <div className={styles2.fondo}>
            <div className={styles2.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between">
                        <span className="fw-bold">Generar QR de Contenedor</span>
                        <button
                            type="button"
                            onClick={() => setOpenQR(false)}
                            className="btn-close"
                            aria-label="Close"
                        />
                    </div>
                    <div className="card-body" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

                        {(contenedor.id || fechaValue) && (
                            <div style={{
                                background: '#e3f2fd',
                                padding: '10px 10px 10px 10px',
                                borderRadius: '5px',
                                marginBottom: '5px',
                                border: '1px solid #90caf9',
                                textAlign: "center"
                            }}>
                                {contenedor?.contenedor && <p className='m-1'> <strong>Contenedor:</strong> {contenedor?.contenedor}</p>}
                                {contenedorId && (
                                    <p className='m-1' style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                                        <strong>Token:</strong> {contenedorId}
                                    </p>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleGenerarQR}>

                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="repeticiones-input">Número de etiquetas a generar (20 por hoja):</label>
                                <input
                                    id="repeticiones-input"
                                    type="number"
                                    value={repeticiones}
                                    onChange={(e) => setRepeticiones(parseInt(e.target.value) || 25)}
                                    min="1"
                                    max="100"
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                                <small style={{ color: '#666' }}>
                                    Máximo 100 etiquetas. Se generarán {Math.ceil(repeticiones / 25)} hojas.
                                </small>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        flex: 1
                                    }}
                                >
                                    Generar QR
                                </button>

                                {qrData && (
                                    <button
                                        type="button"
                                        onClick={generarPDFConQRReal}
                                        disabled={generandoPDF}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: generandoPDF ? '#6c757d' : '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            flex: 1,
                                            cursor: generandoPDF ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {generandoPDF ? 'Generando PDF...' : `Generar PDF (${repeticiones} etiquetas)`}
                                    </button>
                                )}
                            </div>
                        </form>

                        {qrData && (
                            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                <h3>Vista Previa del QR:</h3>

                                <div ref={qrRef}>
                                    <QRCodeSVG
                                        value={qrData}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                        bgColor="#FFFFFF"
                                        fgColor="#000000"
                                    />
                                </div>

                                {/* Canvas oculto para conversión */}
                                <canvas
                                    ref={canvasRef}
                                    style={{ display: 'none' }}
                                />

                                {/* Información de la URL generada */}
                                <div style={{ marginTop: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                                    <p><strong>Contenedor:</strong> {contenedor.contenedor}</p>
                                    <p><strong>Total de etiquetas:</strong> {repeticiones}</p>
                                    <p><strong>Hojas requeridas:</strong> {Math.ceil(repeticiones / 25)}</p>

                                    <div style={{ marginTop: '10px', padding: '10px', background: '#e9ecef', borderRadius: '3px' }}>
                                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>URL en el QR:</p>
                                        <code style={{
                                            wordBreak: 'break-all',
                                            fontSize: '12px',
                                            background: '#fff',
                                            padding: '5px',
                                            borderRadius: '3px',
                                            display: 'block'
                                        }}>
                                            {qrData}
                                        </code>
                                        <button
                                            onClick={copiarURL}
                                            style={{
                                                marginTop: '8px',
                                                padding: '5px 10px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            📋 Copiar URL
                                        </button>
                                    </div>
                                </div>

                                {generandoPDF && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        backgroundColor: '#fff3cd',
                                        border: '1px solid #ffeaa7',
                                        borderRadius: '5px'
                                    }}>
                                        ⏳ Generando PDF con {repeticiones} etiquetas ({Math.ceil(repeticiones / 25)} hojas), por favor espere...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CrearQRCode;