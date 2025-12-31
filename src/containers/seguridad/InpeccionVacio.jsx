import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/router';
import { FaCog, FaMinusCircle, FaRedo } from "react-icons/fa";
import { LiaUndoAltSolid } from "react-icons/lia";
import { crearListado } from "@services/api/listado";
import { useAuth } from "@hooks/useAuth";
import { encontrarUnSerial } from "@services/api/seguridad";
import { filtrarSemanaRangoMes } from "@services/api/semanas";
import { encontrarModulo } from "@services/api/configuracion";
import Loader from "@components/shared/Loader";
import InsumoInspeccVacio from "@components/seguridad/InsumoInspeccVacio";

// Configuración constante
const FIELD_CONFIG = {
    semana: {
        label: "Semana",
        type: "text",
        pattern: "^S\\d{2}-\\d{4}$",
        required: true,
        errorMsg: "Debe seguir la estructura S00-2000 (ej: S01-2023)"
    },
    fecha: {
        label: "Fecha",
        type: "date",
        required: true
    },
    contenedor: {
        label: "Contenedor",
        type: "text",
        placeholder: "DUMMY000001",
        pattern: "[A-Za-z]{4}[0-9]{7}",
        required: true,
        errorMsg: "Debe ser 4 letras seguidas de 7 números (ej: ABCD1234567)"
    }
};

const STORAGE_KEYS = {
    INSPECCION_VACIO: "inspecVacio",
    OBSERVACIONES: "observaciones",
    USUARIO: "usuario"
};

export default function InspeccionVacio() {
    // Hooks y refs
    const { getUser } = useAuth();
    const router = useRouter();
    const formRef = useRef();
    const user = getUser();

    // Estados
    const [state, setState] = useState({
        observaciones: null,
        verificado: false,
        semana: "",
        inputFields: [],
        loading: false,
        openConfig: false,
        semanas: [],
        fieldErrors: {},
        // Nuevo estado para manejar los valores de los inputs
        formValues: {}
    });

    // Derivar estados para facilitar el acceso
    const {
        observaciones,
        verificado,
        semana,
        inputFields,
        loading,
        openConfig,
        semanas,
        fieldErrors,
        formValues
    } = state;

    // Utilidades
    const setStateValue = (key, value) => setState(prev => ({ ...prev, [key]: value }));
    const capitalizarPrimeraLetra = useCallback(text => text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "", []);
    const getCurrentDate = useCallback(() => new Date().toISOString().split('T')[0], []);

    // Carga inicial de datos
    const resetInsumos = useCallback(async () => {
        try {
            setStateValue('loading', true);

            const [semanasData, moduloSemana, moduloInsumos, inputsGuardados] = await Promise.all([
                filtrarSemanaRangoMes(1, 1),
                encontrarModulo("Semana"),
                encontrarModulo("Insumos_inspeccion_vacio"),
                JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECCION_VACIO) || "{}")
            ]);

            const semanaActual = moduloSemana[0]?.semana_actual;
            const semanaSeleccionada = semanasData.find(item => item.semana == semanaActual);

            const insumos = JSON.parse(moduloInsumos[0]?.detalles || "[]").map(item => ({
                label: capitalizarPrimeraLetra(item.name),
                id: item.id,
                placeholder: `${item.consecutivo}00000`,
                type: "text",
                eliminar: true,
                required: true,
                errorMsg: "Debe completar el campo"
            }));

            const camposBase = Object.entries(FIELD_CONFIG).map(([id, config]) => ({
                id,
                ...config,
                defaultValue: id === "fecha" ? getCurrentDate() : (inputsGuardados?.[id] || "")
            }));

            // Inicializar valores del formulario
            const initialFormValues = {};
            camposBase.forEach(field => {
                if (field.id === "semana") {
                    initialFormValues[field.id] = semanaSeleccionada?.consecutivo || "";
                } else if (field.id === "fecha") {
                    initialFormValues[field.id] = getCurrentDate();
                } else {
                    initialFormValues[field.id] = inputsGuardados?.[field.id] || "";
                }
            });

            // Inicializar valores para los insumos
            insumos.forEach(insumo => {
                initialFormValues[insumo.id] = "";
            });

            setState(prev => ({
                ...prev,
                semanas: semanasData,
                semana: semanaSeleccionada?.consecutivo || "",
                inputFields: [...camposBase, ...insumos],
                formValues: initialFormValues,
                loading: false
            }));

        } catch (error) {
            console.error("Error al resetear insumos:", error);
            setStateValue('loading', false);
        }
    }, [capitalizarPrimeraLetra, getCurrentDate]);

    // Efectos
    useEffect(() => {
        const loadData = async () => {
            try {
                await resetInsumos();
                const savedObservaciones = localStorage.getItem(STORAGE_KEYS.OBSERVACIONES);
                if (savedObservaciones) setStateValue('observaciones', savedObservaciones);
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
            }
        };

        loadData();
    }, [resetInsumos]);

    // Manejadores
    const handleRemove = useCallback(id => {
        setState(prev => ({
            ...prev,
            inputFields: prev.inputFields.filter(item => item.id !== id)
        }));
    }, []);

    const handleInvalid = useCallback(event => {
        event.preventDefault();
        const field = event.target;
        const fieldConfig = FIELD_CONFIG[field.id];
        const isEmpty = !field.value.trim();

        // Mensajes de error personalizados
        const errorMessages = {
            required: 'Este campo es obligatorio',
            pattern: fieldConfig?.errorMsg || 'Formato inválido',
            default: 'Valor inválido'
        };

        // Determinar tipo de error
        let errorType = 'default';
        if (isEmpty && field.required) {
            errorType = 'required';
        } else if (field.validity.patternMismatch) {
            errorType = 'pattern';
        }

        // Establecer mensaje de error apropiado
        field.setCustomValidity(errorMessages[errorType]);
        field.reportValidity();

        // Actualizar estado de errores
        setState(prev => ({
            ...prev,
            fieldErrors: {
                ...prev.fieldErrors,
                [field.id]: {
                    hasError: true,
                    message: errorMessages[errorType]
                }
            }
        }));

    }, []);

    const handleChange = useCallback(event => {
        const { id, value } = event.target;

        // Actualizar valor en el estado
        setState(prev => ({
            ...prev,
            formValues: {
                ...prev.formValues,
                [id]: value
            }
        }));

        // Limpiar errores al cambiar
        if (state.fieldErrors[id]) {
            setState(prev => ({
                ...prev,
                fieldErrors: { ...prev.fieldErrors, [id]: false }
            }));
        }

        event.target.setCustomValidity('');

        // Guardar cambios en localStorage (solo para campos específicos)
        if (id === 'contenedor' || id === 'fecha') {
            const formData = new FormData(formRef.current);
            localStorage.setItem(STORAGE_KEYS.INSPECCION_VACIO, JSON.stringify({
                contenedor: formData.get('contenedor'),
                fecha: formData.get('fecha')
            }));
        }
        
        if (id === 'observaciones') {
            localStorage.setItem(STORAGE_KEYS.OBSERVACIONES, value);
        }
    }, [state.fieldErrors]);

    const verificarSeriales = useCallback(async (serialesList) => {
        const existingSerials = new Map();
        const duplicates = new Map();
        let isVerified = true;

        for (const { serial, label } of serialesList) {
            try {
                const [res] = await encontrarUnSerial({ serial, available: [true] });

                if (!res) {
                    isVerified = false;
                    const proceed = confirm(`El campo "${label}" no existe.`);
                    if (!proceed) return { success: false };
                } else if (existingSerials.has(serial)) {
                    duplicates.set(serial, [...(duplicates.get(serial) || []), label]);
                } else {
                    existingSerials.set(serial, label);
                }
            } catch (error) {
                alert(`Error al verificar el serial ${serial} (${label}): ${error.message}`);
                return { success: false, error };
            }
        }

        if (duplicates.size > 0) {
            const duplicatesMsg = Array.from(duplicates.entries())
                .map(([serial, labels]) => `Serial: ${serial} se repite en: ${labels.join(', ')}`)
                .join('\n');
            alert(`Seriales duplicados:\n${duplicatesMsg}`);
            return { success: false };
        }

        return {
            success: isVerified,
            seriales: Array.from(existingSerials.keys())
        };
    }, []);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        setStateValue('loading', true);
        setStateValue('verificado', false);

        if (!formRef.current) {
            setStateValue('loading', false);
            return;
        }

        // Validar campos antes de enviar
        const form = formRef.current;

        if (!form.checkValidity()) {
            setStateValue('loading', false);
            return;
        }

        const semanaValue = formValues.semana || semana;
        
        const serialesList = inputFields
            .filter(({ id }) => !['contenedor', 'fecha', 'semana'].includes(id))
            .map(({ id, label }) => {
                return {
                    serial: formValues[id] || "",
                    label
                };
            });

        const { success, seriales } = await verificarSeriales(serialesList);
        if (!success) {
            setStateValue('loading', false);
            return;
        }

        try {
            const usuario = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIO));
            const itemListado = await crearListado({
                fecha: formValues.fecha || getCurrentDate(),
                contenedor: formValues.contenedor || "",
                observaciones: observaciones || "",
                usuario,
                seriales,
                semana: semanaValue
            });

            alert(itemListado.message || "Guardado exitoso.");

            // Resetear formulario
            setState(prev => ({
                ...prev,
                observaciones: null,
                verificado: false,
                formValues: Object.keys(prev.formValues).reduce((acc, key) => {
                    acc[key] = key === "fecha" ? getCurrentDate() : "";
                    return acc;
                }, {}),
                semana: ""
            }));

            localStorage.removeItem(STORAGE_KEYS.INSPECCION_VACIO);
            localStorage.removeItem(STORAGE_KEYS.OBSERVACIONES);

            if (!confirm("¿Deseas cargar otro contenedor?")) {
                router.push(`/Seguridad/Dashboard`);
            }
        } catch (error) {
            console.error("Error al crear listado:", error);
            alert("Ocurrió un error. Por favor intenta nuevamente.");
        } finally {
            setStateValue('loading', false);
        }
    }, [inputFields, semana, formValues, observaciones, verificarSeriales, router, getCurrentDate]);

    // Renderizado
    return (
        <div className="container py-4">
            <div className="text-center mb-4">
                <h2>Inspección contenedor vacío</h2>
                {user.id_rol === "Super administrador" && (
                    <button
                        onClick={() => setStateValue('openConfig', true)}
                        type="button"
                        className="btn btn-link p-0"
                        aria-label="Configuración"
                    >
                        <FaCog style={{ color: "rgba(0, 0, 0, 0.3)" }} size={20} />
                    </button>
                )}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <Loader loading={loading} />

                <div className="row g-3">
                    {inputFields.map((field) => {
                        return (
                            <div className="col-md-6 mb-1" key={field.id}>
                                <div className="input-group has-validation">
                                    <span className="input-group-text">{field.label}:</span>

                                    {field.id === "semana" ? (
                                        <>
                                            <input
                                                id={field.id}
                                                name={field.id}
                                                type={field.type}
                                                pattern={field.pattern}
                                                required={field.required}
                                                className={`form-control ${fieldErrors[field.id] ? 'is-invalid' : ''}`}
                                                onInvalid={handleInvalid}
                                                onChange={handleChange}
                                                value={formValues[field.id] || ""}
                                                list={`${field.id}-list`}
                                                autoComplete="off"
                                                placeholder={field.placeholder}
                                            />
                                            <datalist id={`${field.id}-list`}>
                                                {semanas.map(s => (
                                                    <option key={s.consecutivo} value={s.consecutivo} />
                                                ))}
                                            </datalist>
                                        </>
                                    ) : (
                                        <input
                                            id={field.id}
                                            name={field.id}
                                            type={field.type}
                                            pattern={field.pattern}
                                            required={field.required}
                                            className={`form-control ${fieldErrors[field.id] ? 'is-invalid' : ''}`}
                                            onInvalid={handleInvalid}
                                            onChange={handleChange}
                                            value={formValues[field.id] || ""}
                                            placeholder={field.placeholder}
                                            autoComplete="off"
                                        />
                                    )}

                                    {field.eliminar && (
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => handleRemove(field.id)}
                                            aria-label={`Eliminar ${field.label}`}
                                            style={{ minWidth: '40px' }}
                                        >
                                            <FaMinusCircle
                                                size={20}
                                                color="#dc3545"
                                                style={{
                                                    cursor: "pointer",
                                                    margin: "0px 0px 0px 10px"
                                                }}
                                                onClick={() => handleRemove(field.id)}
                                                title="Eliminar este campo"
                                                aria-label={`Eliminar ${field.label}`}
                                            />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {inputFields.length === 3 && (
                        <div className="col-md-6 mb-1 text-center" >
                            <button
                                type="button"
                                className="btn btn-link"
                                onClick={resetInsumos}
                                aria-label="Restaurar valores"
                            >
                                <FaRedo size={24} color="#0d6efd" />
                            </button>
                        </div>
                    )}

                    {inputFields.length === 2 && (
                        <div className="col-12 text-center">
                            <button
                                type="button"
                                className="btn btn-link"
                                onClick={resetInsumos}
                                title="Restaurar valores"
                            >
                                <LiaUndoAltSolid size={24} color="#0d6efd" />
                            </button>
                        </div>
                    )}

                    <div className="col-12">
                        <div className="form-floating">
                            <textarea
                                id="observaciones"
                                name="observaciones"
                                className="form-control"
                                value={observaciones || ''}
                                onChange={e => {
                                    setStateValue('observaciones', e.target.value);
                                    localStorage.setItem(STORAGE_KEYS.OBSERVACIONES, e.target.value);
                                }}
                                style={{ height: '100px' }}
                                placeholder=" "
                            />
                            <label htmlFor="observaciones">Observaciones</label>
                        </div>
                    </div>

                    <div className="col-12">
                        <button
                            type="submit"
                            className={`btn btn-${verificado ? "success" : "warning"} w-100 py-2`}
                            disabled={loading}
                        >
                            {loading && (
                                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                            )}
                            {verificado ? "Guardar" : "Verificar"}
                        </button>
                    </div>
                </div>
            </form>

            {openConfig && <InsumoInspeccVacio setOpenConfig={val => setStateValue('openConfig', val)} />}
        </div>
    );
}