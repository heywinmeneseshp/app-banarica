import React, { useEffect } from "react";

export default function Lector() {
    useEffect(() => {
        // Efecto vacío
    }, []);

    const inputFields = [
        { label: "Contenedor", id: "contenedor", placeholder: "DUMMY000001" }, //restriccion de caranteres 4 letras 7 numeros
        { label: "Kit", id: "kit", placeholder: "ABC0000" },
        { label: "Termógrafo", id: "termografo1", placeholder: "ABC0000" },
        { label: "Sello cable", id: "selloCable", placeholder: "TERM20000" },
        { label: "Sello plástico", id: "selloPlastico", placeholder: "TERM20000" },
    ];

    const laminaFields = [
        { label: "Inicial", id: "laminaInternaInicial", placeholder: "ETI00001" },
        { label: "Final", id: "laminaInternaFinal", placeholder: "ETI00010" }
    ];

    const parteFrontal = [
        { label: "Inicial", id: "laminaFrontalInicial", placeholder: "ETI00001" },
        { label: "Final", id: "laminaFrontalFinal", placeholder: "ETI00010" }
    ];

    return (
        <form action="">
            <div className="container">
                <div className="mb-4 mt-3 text-center">
                    <h2>Inspección de Contenedores</h2>
                </div>

                {inputFields.map((field, index) => (
                    <div className="input-group mb-3" key={index}>
                        <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                        <input
                            type="text"
                            id={field.id}
                            className="form-control"
                            placeholder={field.placeholder}
                            aria-label={field.label}
                            aria-describedby={`${field.id}-addon`}
                        />
                    </div>
                ))}

                <div className="mt-4 mb-2">
                    <h6>Etiquetas lámina interna</h6>
                </div>
                <div className="d-flex flex-wrap">
                    {laminaFields.map((field, index) => (
                        <div className="input-group mb-2 col-md-6 m-1" key={index}>
                            <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                            <input
                                type="text"
                                id={field.id}
                                className="form-control"
                                placeholder={field.placeholder}
                                aria-label={`Lámina interna ${field.label}`}
                                aria-describedby={`${field.id}-addon`}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-4 mb-2">
                    <h6>Etiquetas parte frontal</h6>
                </div>
                <div className="d-flex flex-wrap">
                    {parteFrontal.map((field, index) => (
                        <div className="input-group mb-2 col-md-6 m-1" key={index}>
                            <span className="input-group-text" id={`${field.id}-addon`}>{field.label}:</span>
                            <input
                                type="text"
                                id={field.id}
                                className="form-control"
                                placeholder={field.placeholder}
                                aria-label={`Parte frontal ${field.label}`}
                                aria-describedby={`${field.id}-addon`}
                            />
                        </div>
                    ))}
                </div>

            </div>

            <div className="input-group mb-3 col-md-12 m-1 container">
                <textarea
                    id="observaciones"
                    className="form-control"
                    placeholder="Escriba aquí sus observaciones"
                    aria-label="Observaciones"
                    aria-describedby="observaciones-addon"
                ></textarea>
            </div>

       
                <button type="button" className="btn btn-success mb-2 col-md-12 m-1 container">Guardar</button>
       
        </form>

    );
}
