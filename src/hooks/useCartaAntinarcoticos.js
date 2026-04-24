import { useCallback, useEffect, useRef, useState } from "react";

import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";

const DATOS_INICIALES = {
    empresa: {
        exportador: "EMPRESA EJEMPLO S.A.S.",
        nit: "800.000.000-0",
        direccionExportador: "Calle Falsa 123, Edificio Empresarial",
        telefonoExportador: "6051234567",
        ciudadEmision: "Ciudad de Origen",
    },
    destinatario: {
        destinatarioPrincipal: "ENTIDAD RECEPTORA DE EJEMPLO",
        departamento: "DIVISION DE CONTROL Y VIGILANCIA PORTUARIA",
    },
    signatory: {
        nombreRepresentante: "NOMBRE DEL FIRMANTE",
        cedula: "1.000.000.000",
        cargo: "CARGO DEL FIRMANTE",
        celular: "3000000000",
    },
    embarque: {
        numAnuncio: "000000",
        motonave: "NOMBRE DE LA MOTONAVE",
        viaje: "000X",
        puertoDestino: "PUERTO DE DESTINO",
        cantCajas: "0",
        cantContenedores: "0",
        bl: "00000000",
        pesoNeto: "0",
        pesoBruto: "0",
        nombreImportador: "NOMBRE DEL IMPORTADOR",
        nitAgenciaAduanas: "",
        mercanciaCantidad: "0 pallets conteniendo producto.",
        agenciaAduanas: "AGENCIA DE ADUANAS",
        ciudadOrigenMercancia: "REGION DE ORIGEN",
    },
    urlLogo: "https://via.placeholder.com/150x70.png?text=LOGO+EMPRESA",
    logoDataUrl: "",
};

const formatFecha = (date = new Date()) =>
    date.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

const normalizarDetalles = (detallesString) => {
    try {
        if (!detallesString) {
            return null;
        }

        const detalles = JSON.parse(detallesString);
        if (!detalles?.datosEmpresa && !detalles?.empresa) {
            return null;
        }

        return detalles;
    } catch (error) {
        return null;
    }
};

const construirDatos = (detalles = {}) => ({
    empresa: { ...DATOS_INICIALES.empresa, ...(detalles.datosEmpresa || detalles.empresa || {}) },
    destinatario: { ...DATOS_INICIALES.destinatario, ...(detalles.datosDestinatario || detalles.destinatario || {}) },
    signatory: { ...DATOS_INICIALES.signatory, ...(detalles.datosSignatory || detalles.signatory || {}) },
    embarque: { ...DATOS_INICIALES.embarque, ...(detalles.datosEmbarque || detalles.embarque || {}) },
    urlLogo: detalles.urlLogo || DATOS_INICIALES.urlLogo,
    logoDataUrl: detalles.logoDataUrl || DATOS_INICIALES.logoDataUrl,
});

const construirPayload = (datos) => ({
    modulo: "cartaAntinarcoticos",
    detalles: JSON.stringify({
        datosEmpresa: datos.empresa,
        datosDestinatario: datos.destinatario,
        datosSignatory: datos.signatory,
        datosEmbarque: datos.embarque,
        urlLogo: datos.urlLogo,
        logoDataUrl: datos.logoDataUrl,
    }),
});

const useCartaAntinarcoticos = () => {
    const [state, setState] = useState({
        datos: DATOS_INICIALES,
        error: null,
        loading: false,
        fechaActual: formatFecha(),
        isInitialized: false,
    });

    const abortControllerRef = useRef(null);

    const initialization = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const response = await encontrarModulo("cartaAntinarcoticos");
            const data = response?.[0];
            const detalles = normalizarDetalles(data?.detalles);

            setState((prev) => ({
                ...prev,
                datos: detalles ? construirDatos(detalles) : DATOS_INICIALES,
                isInitialized: true,
            }));
        } catch (error) {
            if (error.name !== "AbortError") {
                setState((prev) => ({
                    ...prev,
                    error: "Error al cargar configuracion",
                    isInitialized: true,
                }));
            }
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    }, []);

    const guardarConfiguracion = useCallback(async (datosCompletos) => {
        const nuevosDatos = construirDatos(datosCompletos);

        try {
            // Asegura que el modulo exista antes de intentar actualizarlo.
            await encontrarModulo("cartaAntinarcoticos");
            const response = await actualizarModulo(construirPayload(nuevosDatos));

            if (Array.isArray(response) && response[0] === 0) {
                throw new Error("No se encontro la configuracion para actualizar.");
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "No fue posible guardar la configuracion de la carta.";

            throw new Error(message);
        }

        setState((prev) => ({
            ...prev,
            datos: nuevosDatos,
        }));
    }, []);

    useEffect(() => {
        if (!state.isInitialized) {
            initialization();
        }

        return () => abortControllerRef.current?.abort();
    }, [initialization, state.isInitialized]);

    return {
        ...state.datos,
        logoUrl: state.datos.urlLogo,
        logoDataUrl: state.datos.logoDataUrl,
        loading: state.loading,
        error: state.error,
        fechaActual: state.fechaActual,
        isInitialized: state.isInitialized,
        guardarConfiguracion,
        initialization,
    };
};

export default useCartaAntinarcoticos;
