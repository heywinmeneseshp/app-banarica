import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";
import { useState, useEffect, useCallback, useRef } from "react";

const DATOS_INICIALES = {
    empresa: {
        exportador: 'EMPRESA EJEMPLO S.A.S.',
        nit: '800.000.000-0',
        direccionExportador: 'Calle Falsa 123, Edificio Empresarial',
        telefonoExportador: '6051234567',
        ciudadEmision: 'Ciudad de Origen',
    },
    destinatario: {
        destinatarioPrincipal: 'ENTIDAD RECEPTORA DE EJEMPLO',
        departamento: 'DIVISIÓN DE CONTROL Y VIGILANCIA PORTUARIA',
    },
    signatory: {
        nombreRepresentante: 'NOMBRE DEL FIRMANTE',
        cedula: '1.000.000.000',
        cargo: 'CARGO DEL FIRMANTE',
        celular: '3000000000',
    },
    embarque: {
        numAnuncio: '000000',
        motonave: 'NOMBRE DE LA MOTONAVE',
        viaje: '000X',
        puertoDestino: 'PUERTO DE DESTINO',
        cantCajas: '0',
        cantContenedores: '0',
        bl: '00000000',
        pesoNeto: '0',
        pesoBruto: '0',
        nombreImportador: 'NOMBRE DEL IMPORTADOR',
        mercanciaCantidad: '0 pallets conteniendo producto.',
        agenciaAduanas: 'AGENCIA DE ADUANAS',
        ciudadOrigenMercancia: 'REGIÓN DE ORIGEN',
    },
    urlLogo: 'https://via.placeholder.com/150x70.png?text=LOGO+EMPRESA'
};

const formatFecha = (date = new Date()) =>
    date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

const useCartaAntinarcoticos = () => {
    const [state, setState] = useState({
        datos: DATOS_INICIALES,
        error: null,
        loading: false,
        fechaActual: formatFecha(),
        isInitialized: false
    });

    const abortControllerRef = useRef(null);

    const parseAndValidateDetalles = (detallesString) => {
        try {
            if (!detallesString) return null;
            const detalles = JSON.parse(detallesString);
            // Validamos que existan las secciones principales
            return (detalles.datosEmpresa || detalles.empresa) ? detalles : null;
        } catch (e) { return null; }
    };

    const initialization = useCallback(async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await encontrarModulo("cartaAntinarcoticos");
            const data = response?.[0];

            if (data?.detalles) {
                const detalles = parseAndValidateDetalles(data.detalles);
                if (detalles) {
                    setState(prev => ({
                        ...prev,
                        datos: {
                            empresa: { ...DATOS_INICIALES.empresa, ...detalles.datosEmpresa },
                            destinatario: { ...DATOS_INICIALES.destinatario, ...detalles.datosDestinatario },
                            signatory: { ...DATOS_INICIALES.signatory, ...detalles.datosSignatory },
                            embarque: { ...DATOS_INICIALES.embarque, ...detalles.datosEmbarque },
                            urlLogo: detalles.urlLogo || DATOS_INICIALES.urlLogo
                        },
                        isInitialized: true
                    }));
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                setState(prev => ({ ...prev, error: "Error al cargar configuración" }));
            }
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    const updateSeccion = useCallback(async (seccion, nuevosDatos) => {
        let rollbackState;

        setState(prev => {
            rollbackState = prev; // Guardamos el estado completo para rollback
            
            const nuevosDatosActualizados = seccion === 'urlLogo' 
                ? { ...prev.datos, urlLogo: nuevosDatos }
                : { ...prev.datos, [seccion]: { ...prev.datos[seccion], ...nuevosDatos } };

            // Disparamos la actualización a la API
            const payload = {
                modulo: "cartaAntinarcoticos",
                detalles: JSON.stringify({
                    datosEmpresa: nuevosDatosActualizados.empresa,
                    datosDestinatario: nuevosDatosActualizados.destinatario,
                    datosSignatory: nuevosDatosActualizados.signatory,
                    datosEmbarque: nuevosDatosActualizados.embarque,
                    urlLogo: nuevosDatosActualizados.urlLogo
                })
            };

            actualizarModulo(payload).catch(err => {
                console.error("Fallo persistencia:", err);
                setState(rollbackState);
            });

            return { ...prev, datos: nuevosDatosActualizados };
        });
    }, []);

    const updateDatosEmpresa = useCallback((d) => updateSeccion('empresa', d), [updateSeccion]);
    const updateDatosDestinatario = useCallback((d) => updateSeccion('destinatario', d), [updateSeccion]);
    const updateDatosSignatory = useCallback((d) => updateSeccion('signatory', d), [updateSeccion]);
    const updateDatosEmbarque = useCallback((d) => updateSeccion('embarque', d), [updateSeccion]);
    const setLogoUrl = useCallback((url) => updateSeccion('urlLogo', url), [updateSeccion]);

    const resetToInitial = useCallback(() => {
        updateSeccion('empresa', DATOS_INICIALES.empresa); // Esto forzaría guardado de los iniciales
        setState(prev => ({ ...prev, datos: DATOS_INICIALES }));
    }, [updateSeccion]);

    useEffect(() => {
        if (!state.isInitialized) initialization();
        return () => abortControllerRef.current?.abort();
    }, [initialization, state.isInitialized]);

    return {
        // Datos (Ahora urlLogo viene dentro de los datos de forma consistente)
        ...state.datos,
        logoUrl: state.datos.urlLogo, // Alias para compatibilidad con tu form
        
        // UI State
        loading: state.loading,
        error: state.error,
        fechaActual: state.fechaActual,
        isInitialized: state.isInitialized,

        // Acciones
        updateDatosEmpresa,
        updateDatosDestinatario,
        updateDatosSignatory,
        updateDatosEmbarque,
        setLogoUrl,
        initialization,
        resetToInitial
    };
};

export default useCartaAntinarcoticos;