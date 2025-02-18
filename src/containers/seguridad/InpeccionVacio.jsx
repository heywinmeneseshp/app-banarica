import React, { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/router';


import '@fortawesome/fontawesome-free/css/all.min.css'; // Importar los estilos de Font Awesome
import 'bootstrap/dist/css/bootstrap.min.css'; // Importar los estilos de Bootstrap
import { crearListado } from "@services/api/listado";
import { encontrarUnSerial } from "@services/api/seguridad";
import { filtrarSemanaRangoMes } from "@services/api/semanas";
import { encontrarModulo } from "@services/api/configuracion";
import { FaMinusCircle } from "react-icons/fa";
import { LiaUndoAltSolid } from "react-icons/lia";
import Loader from "@components/shared/Loader";

export default function InspeccionVacio() {

    const formRef = useRef();
    const router = useRouter();


    const today = new Date();
    const now = today.toISOString().split('T')[0];

    const fields = [
        { label: "Fecha", id: "fecha", defaultValue: now, type: "date", required: true, eliminar: false },
        { label: "Contenedor", id: "contenedor", placeholder: "DUMMY000001", type: "text", pattern: "[A-Za-z]{4}[0-9]{7}", title: "Debe ser 4 letras seguidas de 7 números", required: true, eliminar: false },
        { label: "Kit", id: "kit", placeholder: "ABC0000", type: "text", eliminar: true },
        { label: "Termógrafo", id: "termografo", placeholder: "TERM0000", type: "text", eliminar: true },
        { label: "Sello cable", id: "selloCable", placeholder: "CABL20000", type: "text", eliminar: true },
        { label: "Sello plástico", id: "selloPlastico", placeholder: "PREC20000", type: "text", eliminar: true }
    ];
    // Estado de los campos del formulario
    // Estado de los campos dinámicos
    const [laminaInterna, setLaminaInterna] = useState([]);
    const [parteFrontal, setParteFrontal] = useState([]);
    const [observaciones, setObservaciones] = useState(null);
    const [verificado, setVerificado] = useState(false);
    const [semana, setSemana] = useState();
    const [inputFields, setInputFields] = useState(fields);
    const [loading, setLoading] = useState(false);




    useEffect(() => {
        filtrarSemanaRangoMes(1, 1).then(res => {
            encontrarModulo("Semana").then(res2 => {
                const sem = res.filter(item => item.semana == res2[0].semana_actual);
                setSemana(sem[0].consecutivo);
            });
        });

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

    const handleRemove = (id) => {
        const newInputFields = inputFields.filter(item => item.id != id);
        setInputFields(newInputFields);
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
        setLoading(true);
        let isVerified = true;
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


        const kit = await encontrarUnSerial({
            bag_pack: inputs.kit,
            available: [true],
        });

        if (inputs.kit != null && !kit[0]) {
            isVerified = false;
            const proceed = confirm(`El serial ${inputs.kit} en el campo Kit no existe. ¿Deseas continuar?`);
            if (!proceed) {
                setLoading(false);
                return;
            }
        }


        const newKits = kit.map(item => {
            return { label: 'Kit', value: item.serial, ubicacion_en_contenedor: "Exterior" };
        });


        let allItems = [
            ...newKits,
            { label: 'Termógrafo', value: inputs.termografo, ubicacion_en_contenedor: "Interior" },
            { label: 'Sello de Cable', value: inputs.selloCable, ubicacion_en_contenedor: "Exterior" },
            { label: 'Sello Plástico', value: inputs.selloPlastico, ubicacion_en_contenedor: "Exterior" },
            ...interna.map((item, index) => ({ label: `Lámina Interna ${index + 1}`, value: item, ubicacion_en_contenedor: "Interior" })),
            ...frontal.map((item, index) => ({ label: `Parte Frontal ${index + 1}`, value: item, ubicacion_en_contenedor: "Exterior" }))
        ];

        allItems = allItems.filter(item => item.value != null);

        const existingItemsMap = new Map();
        const duplicatesMap = new Map();
        for (const item of allItems) {
            try {
                const res = await encontrarUnSerial({ serial: item.value, available: [true] });
                if (!res[0]) {
                    isVerified = false;
                    const proceed = confirm(`El serial ${item.value} en el campo "${item.label}" no existe. ¿Deseas continuar?`);
                    if (!proceed) {
                        setLoading(false);
                        return;
                    } // Exit the function if the user chooses not to continue
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
                setLoading(false);
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
            ubicacion_en_contenedor,
        }));
        setVerificado(isVerified);

        if (isVerified) {
            try {
                const usuarioString = localStorage.getItem("usuario");
                const usuario = JSON.parse(usuarioString);
                //Crear listado
                const itemListado = await crearListado({
                    fecha: inputs.fecha,
                    contenedor: inputs.contenedor,
                    observaciones: inputs.observacion,
                    usuario: usuario,
                    seriales,
                    semana
                });
                setLoading(false);
                window.alert(itemListado.message || "Error");

                const resetForm = formRef.current.elements; // Obtener todos los elementos del formulario
                for (let i = 0; i < resetForm.length; i++) {
                    if (resetForm[i].id !== "fecha") {
                        resetForm[i].value = ""; // Restablecer solo los que no sean "fecha"
                    }
                }
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
                setLoading(false);
                setVerificado(false);
                alert("Lo siento, ocurrió un problema inesperado. Por favor, inténtalo de nuevo.");
            }

        } else {
            setLoading(false);
            alert("Corrija todos los errores para poder continuar");
        }
    };




    return (
        <>
          <div className="mb-4 mt-3 text-center">
                <h2>Inspección contenedor vacío</h2>
            </div>
            <form ref={formRef} onSubmit={handleSubmit}>
            <Loader loading={loading} />
            <div className="container">

                <div className="row">
                    {inputFields.map((field, index) => (
                        <div className="col-md-6 mb-3" key={index}>
                            <div className="input-group d-flex justify-content-center align-items-center">

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
                                {field.eliminar && <FaMinusCircle
                                    size={20} // Tamaño del icono
                                    color="#dc3545" // Color del icono
                                    style={{
                                        cursor: "pointer", // Hace que sea clickeable
                                        borderRadius: "50%", // Lo hace circular visualmente
                                        margin: "0px 0px 0px 10px"
                                    }}
                                    onClick={() => handleRemove(field.id)} // Acción al hacer clic
                                    title="Eliminar este campo" // Tooltip al pasar el mouse
                                />}
                            </div>

                        </div>
                    ))}

                    {(inputFields.length == 2) && <LiaUndoAltSolid
                        size={30} // Tamaño del icono
                        color="#0b5ed7" // Color del icono
                        style={{
                            cursor: "pointer", // Hace que sea clickeable
                            borderRadius: "50%", // Botón circular
                            padding: "5px", // Espaciado interno

                        }}
                        onClick={() => setInputFields(fields)} // Función al hacer clic
                        title="Restaurar valores" // Tooltip
                    />}
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
        </>
       
    );
}