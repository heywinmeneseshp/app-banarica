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
                <div className="col-6 col-md-4 mb-2 mb-md-0">
                    <div className="input-group">
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
                </div>

                <div className="col-6 col-md-4 mb-2 mb-md-0">
                    <div className="input-group">
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

                <div className="d-none d-md-block col-12 col-md-4 d-md-flex align-items-md-end justify-content-md-end">
                    <button type="button" className="btn btn-success mb-2 col-md-12 m-1">Descargar</button>
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
