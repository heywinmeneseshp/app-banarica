import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function InspeccionLLeno() {
    const [showFields, setShowFields] = useState(false);
    const [formData, setFormData] = useState({
        fecha: '',
        sem: '',
        contenedor: '',
        bolsa: '',
        rechazos: 'No',
        ibmFinca: '',
        codigoPallet: '',
        fruta: '',
        totalCajas: '',
        observaciones: ''
    });

    useEffect(() => {
        // Efecto vacío
    }, []);

    const inputFields = [
        { label: "Fecha", id: "fecha", placeholder: "DD/MM/YYYY", type: "date" },
        { label: "Semana", id: "sem", placeholder: "30", type: "number" },
        { label: "Contenedor", id: "contenedor", placeholder: "GESU9504373", type: "text", datalist: "contenedor-options" },
        { label: "Bolsa", id: "bolsa", placeholder: "AA2L47180", type: "text", datalist: "bolsa-options" },
        { label: "Hubo Rechazos?", id: "rechazos", placeholder: "NO", type: "select" },
        { label: "IBM Finca", id: "ibmFinca", placeholder: "", type: "select", options: ["Finca1", "Finca2", "Finca3"] },
        { label: "Código Pallet", id: "codigoPallet", placeholder: "", type: "text" },
        { label: "Fruta", id: "fruta", placeholder: "", type: "select", options: ["Fruta1", "Fruta2", "Fruta3"] },
        { label: "Total Cajas", id: "totalCajas", placeholder: "", type: "number" },
        { label: "Observaciones", id: "observaciones", placeholder: "Escriba aquí sus observaciones", type: "textarea" }
    ];

    const handleRechazosChange = (e) => {
        setShowFields(e.target.value === "Sí");
        setFormData(prevData => ({ ...prevData, rechazos: e.target.value }));
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="container">
                <div className="mb-4 mt-3 text-center">
                    <h2>Ingreso de Datos</h2>
                </div>

                <div className="row">
                    {inputFields.map((field, index) => {
                        if (field.id === "rechazos") {
                            return (
                                <div className="col-md-6 mb-3" key={index}>
                                    <div className="input-group">
                                        <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                                        <select
                                            id={field.id}
                                            className="form-control"
                                            aria-label={field.label}
                                            aria-describedby={`${field.id}-addon`}
                                            onChange={handleRechazosChange}
                                            value={formData.rechazos}
                                        >
                                            <option value="No">No</option>
                                            <option value="Sí">Sí</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        }

                        if (field.type === "select") {
                            return (
                                <div className="col-md-6 mb-3" key={index}>
                                    <div className="input-group">
                                        <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                                        <select
                                            id={field.id}
                                            className="form-control"
                                            aria-label={field.label}
                                            aria-describedby={`${field.id}-addon`}
                                            onChange={handleInputChange}
                                            value={formData[field.id]}
                                        >
                                            {field.options.map((option, idx) => (
                                                <option key={idx} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        }

                        if (field.id !== "rechazos" && !showFields && (field.id === "ibmFinca" || field.id === "codigoPallet" || field.id === "fruta" || field.id === "totalCajas")) {
                            return null;
                        }

                        return (
                            <div className={`col-md-${field.type === "textarea" ? "12" : "6"} mb-3`} key={index}>
                                <div className="input-group">
                                    <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                                    {field.type === "textarea" ? (
                                        <textarea
                                            id={field.id}
                                            className="form-control"
                                            placeholder={field.placeholder}
                                            aria-label={field.label}
                                            aria-describedby={`${field.id}-addon`}
                                            value={formData[field.id]}
                                            onChange={handleInputChange}
                                        ></textarea>
                                    ) : (
                                        <input
                                            type={field.type}
                                            id={field.id}
                                            className="form-control"
                                            placeholder={field.placeholder}
                                            aria-label={field.label}
                                            aria-describedby={`${field.id}-addon`}
                                            list={field.datalist ? field.datalist : undefined}
                                            value={formData[field.id]}
                                            onChange={handleInputChange}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="row">
                    <div className="col-12 mb-2">
                        <button type="submit" className="btn btn-success w-100">Guardar</button>
                    </div>
                </div>

                <datalist id="contenedor-options">
                    <option value="GESU9504373" />
                    <option value="MAEU1234567" />
                    <option value="CSQU1234567" />
                </datalist>

                <datalist id="bolsa-options">
                    <option value="AA2L47180" />
                    <option value="BB2L47280" />
                    <option value="CC2L47380" />
                </datalist>
            </div>
        </form>
    );
}
