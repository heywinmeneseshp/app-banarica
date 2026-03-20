import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { paginarListado } from '@services/api/listado';
import { encontrarContenedor } from '@services/api/contenedores';

export default function ShippingInfo() {
    const router = useRouter();
    const { token } = router.query;
    const [containerId, setContainerId] = useState('');
    const [loading, setLoading] = useState(false);

    const demoData = {
        paisOrigen: "Colombia",
        finca: "Null",
        productos: "Null",
        diaCosecha: "Null",
        inspeccionPuerto: "Null",
        diaZarpe: "Null",
        diaLlegada: "Null",
        puertoDestino: "Null",
        transito: "Null",
        contenedor: "Null"
    };

    const [shippingData, setshippingData] = useState(demoData);

    // Función para decodificar el ID (para usar en tracecode)
    const decodeContenedorId = (token) => {
        try {
            const decoded = atob(token);
            const datos = JSON.parse(decoded);
            return datos.id; // Retorna el ID original
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    };

    const diasTranscurridos = (fecha1, fecha2) => {
        if (!fecha1 || !fecha2) return 'N/A';

        const date1 = new Date(fecha1);
        const date2 = new Date(fecha2);

        const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

        return Math.floor(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
    };



    useEffect(() => {
        const fetchContainerData = async () => {
            if (!token) return;

            try {
                const id = decodeContenedorId(token);
                setContainerId(id);
                setLoading(true);

                const res = await encontrarContenedor(id);
                const filtros = {
                    contenedor: res.contenedor,
                    booking: '',
                    bl: '',
                    destino: '',
                    naviera: '',
                    cliente: '',
                    semana: '',
                    buque: '',
                    llenado: '',
                    producto: '',
                    habilitado: true
                };

                const contenedor = await paginarListado(1, 21, filtros);

                const shipping = contenedor.data.filter(item => item.Contenedor.id === id);

                if (shipping.length === 0) {
                    console.warn('No se encontraron datos para el contenedor:', id);
                    return;
                }

                // Procesar datos
                const embarque = shipping[0].Embarque;
       

                // Función helper para formatear fechas
                const formatDate = (fecha) =>
                    fecha ? new Date(fecha).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A';

                const formatDateTime = (fecha) =>
                    fecha ? new Date(fecha).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A';

                // Calcular días transcurridos de forma segura
                const calcularTransito = (zarpe, arribo) => {
                    if (!zarpe || !arribo) return 'N/A';
                    try {
                        return diasTranscurridos(zarpe, arribo);
                    } catch (error) {
                        console.error('Error calculando tránsito:', error);
                        return 'N/A';
                    }
                };

                // Obtener datos únicos
                const almacenesUnicos = [...new Set(shipping.map(item => item.almacen.nombre))].join(', ');
                const productosUnicos = [...new Set(shipping.map(item => item.combo.nombre))].join(', ');
                const diasCosechaUnicos = [...new Set(
                    shipping.map(item => formatDate(item.fecha))
                )].join(', ');

                setshippingData({
                    ...demoData,
                    finca: almacenesUnicos,
                    productos: productosUnicos,
                    diaCosecha: diasCosechaUnicos,
                    inspeccionPuerto: shipping[0]?.Inspeccion?.fecha_inspeccion?.split("T")[0] + " " + shipping[0]?.Inspeccion?.hora_inicio,
                    diaZarpe: formatDateTime(embarque?.fecha_zarpe),
                    diaLlegada: formatDateTime(embarque?.fecha_arribo),
                    puertoDestino: embarque?.Destino?.destino || 'N/A',
                    transito: calcularTransito(embarque?.fecha_zarpe, embarque?.fecha_arribo),
                    contenedor: shipping[0].Contenedor.contenedor
                });

            } catch (error) {
                console.error('Error fetching container data:', error);
                // Aquí podrías agregar un manejo de errores visual
            } finally {
                setTimeout(() => setLoading(false), 800);
            }
        };

        fetchContainerData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div className="text-center text-white">
                    <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <h4 className="mb-2">Cargando información</h4>
                    <p className="mb-0 opacity-75">Contenedor: {shippingData.contenedor}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Segoe UI, system-ui, sans-serif'
        }}>
            {/* Header con efecto glassmorphism */}
            <div className="pt-5">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12 col-lg-10">
                            <div className="text-center text-white mb-3">
                                <div className="position-relative d-inline-block">
                                    <h1 className="display-4 fw-bold mb-3 text-shadow">
                                        Información de Envío
                                    </h1>
                                </div>
                                <p className="fs-5 opacity-90 mb-4">
                                    Seguimiento completo del proceso de exportación
                                </p>

                                {containerId && (
                                    <div className="alert alert-success d-inline-flex align-items-center border-0 shadow-sm" style={{
                                        background: 'rgba(255, 255, 255, 0.95)'
                                    }}>
                                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                                        <span className="text-dark fw-semibold">Contenedor: {shippingData.contenedor}</span>
                                    </div>
                                )}
                            </div>

                            {/* Tarjeta principal */}
                            <div className="card border-0 rounded-4 shadow-lg mb-5" style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div className="card-body p-4 p-lg-5">

                                    {/* Timeline Superior */}
                                    <div className="row mb-5">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-between align-items-center position-relative">
                                                {/* Línea de tiempo */}
                                                <div className="position-absolute top-50 start-0 end-0 h-2 bg-light rounded"></div>

                                                {[
                                                    { icon: '🌱', label: 'Cosecha', date: shippingData.diaCosecha },
                                                    { icon: '🔍', label: 'Inspección', date: shippingData.inspeccionPuerto },
                                                    { icon: '🚢', label: 'Zarpe', date: shippingData.diaZarpe },
                                                    { icon: '🏁', label: 'Llegada', date: shippingData.diaLlegada }
                                                ].map((step, index) => (
                                                    <div key={index} className="text-center position-relative z-1">
                                                        <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow"
                                                            style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                                                            {step.icon}
                                                        </div>
                                                        <div className="fw-bold text-dark">{step.label}</div>
                                                        <div className="text-muted small">{step.date}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-4">
                                        {/* Columna Izquierda - Información de Origen */}
                                        <div className="col-12 col-lg-6">
                                            <div className="rounded-4 p-4 h-100" style={{
                                                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                                                border: '2px solid rgba(102, 126, 234, 0.1)'
                                            }}>
                                                <div className="d-flex align-items-center mb-4">
                                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                                        style={{ width: '50px', height: '50px' }}>
                                                        <i className="bi bi-geo-alt-fill fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="fw-bold text-primary mb-1">Origen</h4>
                                                        <p className="text-muted mb-0">Información de procedencia</p>
                                                    </div>
                                                </div>

                                                {[
                                                    { icon: '🇨🇴', label: 'País Origen', value: shippingData.paisOrigen },
                                                    { icon: '🏠', label: 'Finca', value: shippingData.finca },
                                                    { icon: '📦', label: 'Productos', value: shippingData.productos },
                                                    { icon: '📅', label: 'Cosecha', value: shippingData.diaCosecha }
                                                ].map((item, index) => (
                                                    <div key={index} className="mb-4 pb-3 border-bottom border-light">
                                                        <div className="d-flex align-items-start">
                                                            <span className="fs-4 me-3">{item.icon}</span>
                                                            <div className="flex-grow-1">
                                                                <div className="fw-semibold text-dark mb-1">{item.label}</div>
                                                                <div className="fs-5 text-primary fw-bold">{item.value}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Columna Derecha - Información de Logística */}
                                        <div className="col-12 col-lg-6">
                                            <div className="rounded-4 p-4 h-100" style={{
                                                background: 'linear-gradient(135deg, #fff8f8 0%, #fff0f0 100%)',
                                                border: '2px solid rgba(118, 75, 162, 0.1)'
                                            }}>
                                                <div className="d-flex align-items-center mb-4">
                                                    <div className="bg-purple text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                                        style={{ width: '50px', height: '50px', background: '#764ba2' }}>
                                                        <i className="bi bi-truck fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="fw-bold mb-1" style={{ color: '#764ba2' }}>Logística</h4>
                                                        <p className="text-muted mb-0">Información de transporte</p>
                                                    </div>
                                                </div>

                                                {[
                                                    { icon: '🔍', label: 'Inspección Puerto', value: shippingData.inspeccionPuerto },
                                                    { icon: '⛴️', label: 'Día de Zarpe', value: shippingData.diaZarpe },
                                                    { icon: '🏁', label: 'Llegada Destino', value: shippingData.diaLlegada },
                                                    { icon: '📍', label: 'Puerto Destino', value: shippingData.puertoDestino },
                                                    { icon: '⏱️', label: 'Tránsito', value: shippingData.transito }
                                                ].map((item, index) => (
                                                    <div key={index} className="mb-4 pb-3 border-bottom border-light">
                                                        <div className="d-flex align-items-start">
                                                            <span className="fs-4 me-3">{item.icon}</span>
                                                            <div className="flex-grow-1">
                                                                <div className="fw-semibold text-dark mb-1">{item.label}</div>
                                                                <div className="fs-5 fw-bold" style={{ color: '#764ba2' }}>{item.value}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumen con estadísticas */}
                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="rounded-4 p-4 text-white shadow" style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            }}>
                                                <h5 className="fw-bold mb-4 d-flex align-items-center">
                                                    <i className="bi bi-graph-up-arrow me-2"></i>
                                                    Resumen del Envío
                                                </h5>
                                                <div className="row g-3">
                                                    {[
                                                        { label: 'Origen', value: shippingData.paisOrigen, icon: '🌎' },
                                                        { label: 'Destino', value: shippingData.puertoDestino, icon: '🎯' },
                                                        { label: 'Duración', value: shippingData.transito, icon: '⏰' },
                                                        { label: 'Tipos de Producto', value: `${shippingData.productos.split(',').length} tipos`, icon: '📊' }
                                                    ].map((stat, index) => (
                                                        <div key={index} className="col-6 col-md-3">
                                                            <div className="text-center p-3 rounded-3" style={{
                                                                background: 'rgba(255, 255, 255, 0.2)',
                                                                backdropFilter: 'blur(10px)'
                                                            }}>
                                                                <div className="fs-2 mb-2">{stat.icon}</div>
                                                                <div className="fw-bold fs-5">{stat.value}</div>
                                                                <div className="small opacity-90">{stat.label}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones de Acción */}
                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="d-flex flex-column flex-lg-row gap-3 justify-content-center">
                                                <button
                                                    className="btn btn-primary btn-lg fw-semibold px-5 py-3 rounded-pill shadow flex-fill d-flex align-items-center justify-content-center"
                                                    onClick={() => window.print()}
                                                >
                                                    <i className="bi bi-printer me-2"></i>
                                                    Imprimir Información
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mensaje informativo */}
                            {!containerId && (
                                <div className="card border-0 rounded-4 shadow-sm mb-4" style={{
                                    background: 'rgba(255, 255, 255, 0.9)'
                                }}>
                                    <div className="card-body text-center p-4">
                                        <div className="text-warning mb-3">
                                            <i className="bi bi-info-circle-fill fs-1"></i>
                                        </div>
                                        <h5 className="text-dark mb-3">Información General</h5>
                                        <p className="text-muted mb-3">
                                            Para ver información específica de un contenedor, agrega el parámetro <code>id</code> a la URL.
                                        </p>
                                        <div className="bg-light rounded-3 p-3">
                                            <code className="text-primary">/shipping?id=CTN-12345</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}