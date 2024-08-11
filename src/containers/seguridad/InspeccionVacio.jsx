import React, { useEffect, useRef, useState } from "react";
import BarcodeReader from 'react-barcode-reader';

import '@fortawesome/fontawesome-free/css/all.min.css'; // Importar los estilos de Font Awesome
import 'bootstrap/dist/css/bootstrap.min.css'; // Importar los estilos de Bootstrap

export default function Lector() {

    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    // Maneja el código de barras leído
    const handleScan = (data) => {
        if (data) {
            setBarcode(data);
            setIsScanning(false); // Detener el escaneo después de capturar el código
            console.log('Código de barras capturado:', data);
        }
    };

    // Maneja el error de lectura
    const handleError = (err) => {
        console.error('Error de lectura de código de barras:', err);
    };

    // Maneja el cambio en el input manual
    const handleManualChange = (event) => {
        setBarcode(event.target.value);
    };

    // Inicia el escaneo
    const startScanning = () => {
        setIsScanning(true);
    };

    // Detiene el escaneo
    const stopScanning = () => {
        setIsScanning(false);
    };

    const formRef = useRef();

    // Estado de los campos del formulario
    const [inputFields, setInputFields] = useState([
        { label: "Fecha", id: "fecha", placeholder: "Seleccione la fecha", type: "date", required: true },
        { label: "Contenedor", id: "contenedor", placeholder: "DUMMY000001", type: "text", pattern: "[A-Za-z]{4}[0-9]{7}", title: "Debe ser 4 letras seguidas de 7 números", required: true },
        { label: "Kit", id: "kit", placeholder: "ABC0000", type: "text" },
        { label: "Termógrafo", id: "termografo", placeholder: "ABC0000", type: "text" },
        { label: "Sello cable", id: "selloCable", placeholder: "TERM20000", type: "text" },
        { label: "Sello plástico", id: "selloPlastico", placeholder: "TERM20000", type: "text" }
    ]);

    // Estado de los campos dinámicos
    const [laminaInterna, setLaminaInterna] = useState([]);
    const [parteFrontal, setParteFrontal] = useState([]);

    useEffect(() => {
        const inputs = JSON.parse(localStorage.getItem("inspecVacio"));
        if (inputs) {
            setInputFields(prevFields => prevFields.map(item => ({
                ...item,
                defaultValue: inputs[item.id]
            })));
        }
        const interna = JSON.parse(localStorage.getItem("interna"));
        if (interna) setLaminaInterna(interna);     
        const frontal = JSON.parse(localStorage.getItem("frontal"));
        if (frontal) setParteFrontal(frontal);
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
            observaciones: formData.get('observaciones')
        };

        // Guardar los valores de los campos dinámicos
        const interna = laminaInterna.map((_, index) => ({
            defaultValue: formData.get(`laminaInterna${index}`)
        }));

        const frontal = parteFrontal.map((_, index) => ({
            defaultValue: formData.get(`parteFrontal${index}`)
        }));

        localStorage.setItem('inspecVacio', JSON.stringify(inputs));
        localStorage.setItem('interna', JSON.stringify(interna));
        localStorage.setItem('frontal', JSON.stringify(frontal));
    };

    // Maneja el envío del formulario
    const handleSubmit = (event) => {
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
            observaciones: formData.get('observaciones')
        };

        const interna = laminaInterna.map((_, index) => ({
            defaultValue: formData.get(`laminaInterna${index}`)
        }));

        const frontal = parteFrontal.map((_, index) => ({
            defaultValue: formData.get(`parteFrontal${index}`)
        }));

        console.log(inputs, interna, frontal);
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
                                value={barcode}
                                onChange={handleManualChange}
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mb-2">
                        <button type="submit" className="btn btn-success w-100">Guardar</button>
                    </div>
                </div>
            </div>

            {/* Escaneo */}
            <div className="text-center mb-3">
                {isScanning ? (
                    <button type="button" className="btn btn-danger" onClick={stopScanning}>
                        <i className="fas fa-stop"></i> Detener Escaneo
                    </button>
                ) : (
                    <button type="button" className="btn btn-primary" onClick={startScanning}>
                        <i className="fas fa-camera"></i> Escanear Código
                    </button>
                )}
            </div>

            {isScanning && (
                <BarcodeReader
                    onError={handleError}
                    onScan={handleScan}
                    style={{ display: 'none' }} // Ocultamos el video de la cámara
                />
            )}
        </form>
    );
}
