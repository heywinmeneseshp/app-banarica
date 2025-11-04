import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import styles2 from "@components/shared/Formularios/Formularios.module.css";

function CrearQRCode({ contenedor, setOpenQR }) {
    const [contenedorId, setContenedorId] = useState('');
    const [fechaValue, setFechaValue] = useState('');
    const [qrData, setQrData] = useState(null);
    const [repeticiones, setRepeticiones] = useState(20);
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

            // Crear nuevo PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter'
            });

            const pageWidth = 215.9;
            const pageHeight = 279.4;

            // Configuración optimizada para 20 etiquetas por hoja (4x5)
            const qrPerRow = 4;
            const qrPerColumn = 5;
            const totalPerPage = qrPerRow * qrPerColumn;

            const usableWidth = pageWidth - 20;
            const usableHeight = pageHeight - 20;

            const qrWidth = (usableWidth / qrPerRow) - 5;
            const qrHeight = (usableHeight / qrPerColumn) - 4;

            const qrSize = Math.min(qrWidth, qrHeight);

            const marginHorizontal = (pageWidth - (qrPerRow * qrSize + (qrPerRow - 1) * 5)) / 2;
            const marginVertical = (pageHeight - (qrPerColumn * qrSize + (qrPerColumn - 1) * 4)) / 2;

            // Convertir SVG a Data URL usando canvas
            const qrDataURL = await convertSVGtoCanvas();

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

                    const x = marginHorizontal + (col * (qrSize + 5));
                    const y = marginVertical + (row * (qrSize + 4));

                    // Agregar el QR real como imagen al PDF
                    pdf.addImage(
                        qrDataURL,
                        'PNG',
                        x,
                        y,
                        qrSize,
                        qrSize
                    );

                    // Borde sutil alrededor del QR
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.1);
                    pdf.rect(x, y, qrSize, qrSize, 'S');
                }

                currentRep += qrsThisPage;

                // Pie de página con información
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Página ${pageNumber} - ${contenedor.contenedor}`, pageWidth - 20, pageHeight - 10);
                pdf.text(`Generado: ${new Date().toLocaleDateString()}`, 15, pageHeight - 10);
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
                                    onChange={(e) => setRepeticiones(parseInt(e.target.value) || 20)}
                                    min="1"
                                    max="100"
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />
                                <small style={{ color: '#666' }}>
                                    Máximo 100 etiquetas. Se generarán {Math.ceil(repeticiones / 20)} hojas.
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
                                    <p><strong>Hojas requeridas:</strong> {Math.ceil(repeticiones / 20)}</p>

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
                                        ⏳ Generando PDF con {repeticiones} etiquetas ({Math.ceil(repeticiones / 20)} hojas), por favor espere...
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