import React, { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/router';

import '@fortawesome/fontawesome-free/css/all.min.css'; // Importar los estilos de Font Awesome
import 'bootstrap/dist/css/bootstrap.min.css'; // Importar los estilos de Bootstrap
import { crearListado } from "@services/api/listado";
import { encontrarUnSerial } from "@services/api/seguridad";

export default function Lector() {

    const formRef = useRef();
    const router = useRouter();

    // Estado de los campos del formulario
    // Estado de los campos dinámicos
    const [laminaInterna, setLaminaInterna] = useState([]);
    const [parteFrontal, setParteFrontal] = useState([]);
    const [observaciones, setObservaciones] = useState(null);
    const [verificado, setVerificado] = useState(false);
    const [inputFields, setInputFields] = useState([
        { label: "Fecha", id: "fecha", placeholder: "Seleccione la fecha", type: "date", required: true },
        { label: "Contenedor", id: "contenedor", placeholder: "DUMMY000001", type: "text", pattern: "[A-Za-z]{4}[0-9]{7}", title: "Debe ser 4 letras seguidas de 7 números", required: true },
        { label: "Kit", id: "kit", placeholder: "ABC0000", type: "text" },
        { label: "Termógrafo", id: "termografo", placeholder: "ABC0000", type: "text" },
        { label: "Sello cable", id: "selloCable", placeholder: "TERM20000", type: "text" },
        { label: "Sello plástico", id: "selloPlastico", placeholder: "TERM20000", type: "text" }
    ]);



    useEffect(() => {
        //2024-08-14
        const date = new Date();
        const mes = (date.getMonth() + 1) < 10 ? "0"+(date.getMonth() + 1)  : (date.getMonth() + 1);
        const dia = (date.getDate() + 1) < 10 ? "0"+(date.getDate() + 1)  : (date.getDate() + 1) ;
        const now = `${date.getFullYear()}-${mes}-${dia}`;
        let inputStatic = inputFields;
        inputStatic[0] = { ...inputStatic[0], defaultValue: now };
        const inputs = JSON.parse(localStorage.getItem("inspecVacio"));
        if (inputs) {
            setInputFields(prevFields => prevFields.map(item => ({
                ...item,
                defaultValue: item.id == "fecha" ? now : inputs[item.id]
            })));
        } else {
            setInputFields(inputStatic);
        };
        const interna = JSON.parse(localStorage.getItem("interna"));
        if (interna) setLaminaInterna(interna);
        const frontal = JSON.parse(localStorage.getItem("frontal"));
        if (frontal) setParteFrontal(frontal);
        const observaciones = localStorage.getItem("observaciones");
        if (observaciones) setObservaciones(observaciones);
    }, []);

    // Añade un nuevo campo dinámico
    const addField = (type) => {
        const setter = type === 'laminaInterna' ? setLaminaInterna : setParteFrontal;
        setter(prevFields => [...prevFields, { defaultValue: null }]);
    };

    // Elimina el último campo dinámico
    const removeField = (type) => {
        const setter = type === 'laminaInterna' ? setLaminaInterna : setParteFrontal;
        setter(prevFields => prevFields.slice(0, -1));
    };

    // Maneja el evento de invalidación
    const handleInvalid = (event) => {
        event.preventDefault();
        alert('El contenedor debe ser 4 letras seguidas de 7 números');
    };

    // Maneja los cambios en el formulario
    const handleChanges = () => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const inputs = {
            contenedor: formData.get('contenedor'),
            fecha: formData.get('fecha'),
            kit: formData.get('kit'),
            termografo: formData.get('termografo'),
            selloCable: formData.get('selloCable'),
            selloPlastico: formData.get('selloPlastico'),
        };

        // Guardar los valores de los campos dinámicos
        const interna = laminaInterna.map((_, index) => ({
            defaultValue: formData.get(`laminaInterna${index}`)
        }));

        const frontal = parteFrontal.map((_, index) => ({
            defaultValue: formData.get(`parteFrontal${index}`)
        }));

        localStorage.setItem('observaciones', formData.get('observaciones'));
        localStorage.setItem('inspecVacio', JSON.stringify(inputs));
        localStorage.setItem('interna', JSON.stringify(interna));
        localStorage.setItem('frontal', JSON.stringify(frontal));
    };

    // Maneja el envío del formulario
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const inputs = {
            contenedor: formData.get('contenedor'),
            fecha: formData.get('fecha'),
            kit: formData.get('kit'),
            termografo: formData.get('termografo'),
            selloCable: formData.get('selloCable'),
            selloPlastico: formData.get('selloPlastico'),
            observacion: formData.get('observaciones')
        };

        const interna = laminaInterna.map((_, index) => formData.get(`laminaInterna${index}`));
        const frontal = parteFrontal.map((_, index) => formData.get(`parteFrontal${index}`));

        const allItems = [
            { label: 'Kit', value: inputs.kit, ubicacion_en_contenedor: "Exterior" },
            { label: 'Termógrafo', value: inputs.termografo, ubicacion_en_contenedor: "Interior" },
            { label: 'Sello de Cable', value: inputs.selloCable, ubicacion_en_contenedor: "Exterior" },
            { label: 'Sello Plástico', value: inputs.selloPlastico, ubicacion_en_contenedor: "Exterior" },
            ...interna.map((item, index) => ({ label: `Lámina Interna ${index + 1}`, value: item, ubicacion_en_contenedor: "Interior" })),
            ...frontal.map((item, index) => ({ label: `Parte Frontal ${index + 1}`, value: item, ubicacion_en_contenedor: "Exterior" }))
        ];

        const existingItemsMap = new Map();
        const duplicatesMap = new Map();
        let isVerified = true;

        for (const item of allItems) {
            try {
                const res = await encontrarUnSerial({ bag_pack: item.value });

                if (!res) {
                    isVerified = false;
                    const proceed = confirm(`El serial ${item.value} en el campo "${item.label}" no existe. ¿Deseas continuar?`);
                    if (!proceed) return; // Exit the function if the user chooses not to continue
                } else {
                    if (existingItemsMap.has(item.value)) {
                        if (!duplicatesMap.has(item.value)) {
                            duplicatesMap.set(item.value, []);
                        }
                        duplicatesMap.get(item.value).push(item.label);
                    } else {
                        existingItemsMap.set(item.value, item.ubicacion_en_contenedor);
                    }
                }
            } catch (error) {
                isVerified = false;
                alert(`Error al verificar el serial ${item.value} en el campo "${item.label}": ${error.message}`);
                return;
            }
        }

        if (duplicatesMap.size > 0) {
            const duplicatesMessage = Array.from(duplicatesMap).map(([value, labels]) =>
                `Serial: ${value} se repite en los siguientes campos: ${labels.join(', ')}`
            ).join('\n');
            isVerified = false;
            alert(`Los siguientes seriales se repiten:\n${duplicatesMessage}`);
            return; // Exit the function if there are duplicates
        }

        const seriales = Array.from(existingItemsMap, ([value, ubicacion_en_contenedor]) => ({
            value,
            ubicacion_en_contenedor
        }));

        setVerificado(isVerified);

        if (isVerified) {
            try {
                crearListado({
                    fecha: inputs.fecha,
                    contenedor: inputs.contenedor,
                    observaciones: inputs.observacion,
                    seriales
                });
                formRef.current.reset(); // Clear the form fields
                setLaminaInterna([]); // Clear dynamic fields
                setParteFrontal([]);
                setObservaciones(null);
                setInputFields(prevFields => prevFields.map(field => ({
                    ...field,
                    defaultValue: ''
                })));
                localStorage.removeItem("inspecVacio");
                localStorage.removeItem("interna");
                localStorage.removeItem("frontal");
                localStorage.removeItem("observaciones");
                setVerificado(false); // Reset verification state
                const continuar = confirm(`Desea cargar otro contenedor?`);
                if (!continuar) router.push(`/Seguridad/Dashboard`);
            } catch {
                setVerificado(false);
                alert("Lo siento, ocurrió un problema inesperado. Por favor, inténtalo de nuevo.");
            }

        } else {
            alert("Corrija todos los errores para poder continuar");
        }
    };




    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="container">
                <div className="mb-4 mt-3 text-center">
                    <h2>Inspección de Contenedores</h2>
                </div>

                <div className="row">
                    {inputFields.map((field, index) => (
                        <div className="col-md-6 mb-3" key={index}>
                            <div className="input-group">
                                <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                                <input
                                    type={field.type}
                                    id={field.id}
                                    name={field.id}
                                    className="form-control"
                                    placeholder={field.placeholder}
                                    aria-label={field.label}
                                    aria-describedby={`${field.id}-addon`}
                                    pattern={field.pattern || undefined}
                                    title={field.title || undefined}
                                    onInvalid={handleInvalid}
                                    onChange={handleChanges}
                                    required={field.required || false}
                                    defaultValue={field?.defaultValue || ''}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 mb-2">
                    <h6>Etiquetas lámina interna</h6>
                </div>
                <div className="row">
                    {laminaInterna.map((field, index) => (
                        <div className="col-md-6 mb-2" key={`laminaInterna${index}`}>
                            <div className="input-group">
                                <span className="input-group-text" id={`laminaInterna${index}-addon`}>{`Etiqueta ${index + 1}`}</span>
                                <input
                                    type="text"
                                    id={`laminaInterna${index}`}
                                    name={`laminaInterna${index}`}
                                    className="form-control"
                                    placeholder="ETI000"
                                    aria-label={`Lámina interna ${index + 1}`}
                                    aria-describedby={`laminaInterna${index}-addon`}
                                    defaultValue={field.defaultValue}
                                    onChange={handleChanges}
                                    required
                                />
                            </div>
                        </div>
                    ))}
                    <div className="col-12 mb-4 mt-1 text-center">
                        <button type="button" className="btn btn-primary px-5 py-1 mx-3" onClick={() => addField('laminaInterna')}>
                            <i className="fas fa-plus"></i>
                        </button>
                        <button type="button" className="btn btn-danger px-5 py-1 mx-3" onClick={() => removeField('laminaInterna')} disabled={laminaInterna.length === 0}>
                            <i className="fas fa-minus"></i>
                        </button>
                    </div>
                </div>

                <div className="mt-4 mb-2">
                    <h6>Etiquetas parte frontal</h6>
                </div>
                <div className="row">
                    {parteFrontal.map((field, index) => (
                        <div className="col-md-6 mb-2" key={`parteFrontal${index}`}>
                            <div className="input-group">
                                <span className="input-group-text" id={`parteFrontal${index}-addon`}>{`Etiqueta ${index + 1}`}</span>
                                <input
                                    type="text"
                                    id={`parteFrontal${index}`}
                                    name={`parteFrontal${index}`}
                                    className="form-control"
                                    placeholder="ETI000"
                                    aria-label={`Parte frontal ${index + 1}`}
                                    aria-describedby={`parteFrontal${index}-addon`}
                                    defaultValue={field.defaultValue}
                                    onChange={handleChanges}
                                    required
                                />
                            </div>
                        </div>
                    ))}
                    <div className="col-12 mb-4 mt-1 text-center">
                        <button type="button" className="btn btn-primary px-5 py-1 mx-3" onClick={() => addField('parteFrontal')}>
                            <i className="fas fa-plus"></i>
                        </button>
                        <button type="button" className="btn btn-danger px-5 py-1 mx-3" onClick={() => removeField('parteFrontal')} disabled={parteFrontal.length === 0}>
                            <i className="fas fa-minus"></i>
                        </button>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mb-3">
                        <div className="input-group">
                            <textarea
                                id="observaciones"
                                name="observaciones"
                                className="form-control"
                                placeholder="Escriba aquí sus observaciones"
                                aria-label="Observaciones"
                                aria-describedby="observaciones-addon"
                                defaultValue={observaciones}
                                onChange={handleChanges}
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mb-2">
                        <button type="submit" className={`btn btn-${verificado ? "success" : "warning"} w-100`}>{verificado ? "Guardar" : "Verificar"}</button>
                    </div>
                </div>
            </div>
        </form>
    );
}
