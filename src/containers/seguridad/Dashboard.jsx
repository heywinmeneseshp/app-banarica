import React, { useEffect } from "react";
import Paginacion from "@components/shared/Tablas/Paginacion";

export default function Dashboard() {
    useEffect(() => {
        // Efecto vacío
    }, []);

    return (
        <div className="container">
            <h2>Resumen diario</h2>

            <div className="row mt-3 align-items-center">
                <div className="col-12 col-md-6 d-flex align-items-center">
                    <div className="input-group me-2">
                        <span className="input-group-text" id="date-addon">Desde:</span>
                        <input
                            type="date"
                            id="fechaInicial"
                            className="form-control"
                            placeholder=""
                            aria-label="Fecha-inicial"
                            aria-describedby="date-addon"
                        />
                    </div>

                    <div className="input-group ms-2">
                        <span className="input-group-text" id="date-addon">Hasta:</span>
                        <input
                            type="date"
                            id="fechaFinal"
                            className="form-control"
                            placeholder=""
                            aria-label="Fecha-final"
                            aria-describedby="date-addon"
                        />
                    </div>
                </div>

                <div className="col-12 col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                    <div className="d-flex flex-column flex-md-row">
                        <button type="button" className="btn btn-primary mb-2 mb-md-0 me-md-2">Descargar Carrusel</button>
                        <button type="button" className="btn btn-secondary mb-2 mb-md-0">Descargar Relación</button>
                    </div>
                </div>
            </div>

            <table className="mt-3 table table-bordered">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Contenedor</th>
                        <th scope="col">Bolsa</th>
                        <th scope="col">Termógrafo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">1</th>
                        <td>Mark</td>
                        <td>Otto</td>
                        <td>@mdo</td>
                    </tr>
                    <tr>
                        <th scope="row">2</th>
                        <td>Jacob</td>
                        <td>Thornton</td>
                        <td>@fat</td>
                    </tr>
                    <tr>
                        <th scope="row">3</th>
                        <td>Larry</td>
                        <td>the Bird</td>
                        <td>@twitter</td>
                    </tr>
                </tbody>
            </table>

            <Paginacion />
        </div>
    );
}

