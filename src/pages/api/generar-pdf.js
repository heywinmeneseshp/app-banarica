export default function handler(req, res) {
    const { contenedorId, fecha, repeticiones = 1 } = req.query;
    
    // Validar parámetros
    if (!contenedorId || !fecha) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const numRepeticiones = Math.min(Math.max(1, parseInt(repeticiones)), 21);
    
    try {
        // Para este ejemplo, redirigimos a una página de descarga simulada
        // En producción, aquí implementarías la generación real del PDF con jspdf
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            message: 'PDF generado exitosamente',
            data: {
                contenedorId,
                fecha,
                repeticiones: numRepeticiones,
                pdfUrl: `/downloads/QR-${contenedorId}.pdf`
            }
        });

    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ error: 'Error al generar el PDF' });
    }
}