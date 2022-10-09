import React, { useEffect, useState } from "react";

//CSS
import styles from "@styles/Seguridad.module.css"
import ConsultaResumen from "@components/seguridad/ConsultaDetallada";
import ConsultaDetallada from "@components/seguridad/ConsultaResumen";

export default function Disponibles() {

    const [tablaConsulta, setTablaConsultal] = useState(true)
    
    useEffect(() =>{
    }, [])

     const handleTableConsulta = (bool) => {
        setTablaConsultal(bool)
    }

    return (
        <>
            <section>
                <h2>Consulta de disponibles</h2>
                <div className={styles.grid_tranferencias}>
                    <div class="input-group input-group-sm ">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Almacen</span>
                        <select class="form-select form-select-sm" aria-label=".form-select-sm example">
                            <option selected>Open this select menu</option>
                            <option value="1">One</option>
                            <option value="2">Two</option>
                            <option value="3">Three</option>
                        </select>
                    </div>

                    <div class="input-group input-group-sm ">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select class="form-select form-select-sm" aria-label=".form-select-sm example">
                            <option selected>Sobrante</option>
                            <option value="1">One</option>
                            <option value="2">Two</option>
                            <option value="3">Three</option>
                        </select>
                    </div>

                    <div class="input-group input-group-sm ">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Estado</span>
                        <select class="form-select form-select-sm" aria-label=".form-select-sm example">
                            <option selected>Disponible</option>
                            <option value="1">No disponible</option>
                            <option value="1">All</option>
                        </select>
                    </div>

                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Serial</span>
                        <input type="text" class="form-control" aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">S Pack</span>
                        <input type="text" class="form-control" aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">M Pack</span>
                        <input type="text" class="form-control" aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">L Pack</span>
                        <input type="text" class="form-control" aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <button ttype="button" class="btn btn-primary btn-sm">Buscar artículos</button>

                </div>

                <div className="line"></div>
                <div >

                    <div className={styles.grid_result}>
                        <div class={styles.botonesTrans}>
                            <button type="button" onClick={() => handleTableConsulta(true)} class="btn btn-primary btn-sm">Resumen</button>
                            <button type="button" onClick={() => handleTableConsulta(false)} class="btn btn-primary btn-sm ">Detallado</button>
                            <span className={styles.grid_result_child2}>
                                <input type="number" class="form-control form-control-sm" id="exampleFormControlInput1"
                                    placeholder="80"></input>
                                <span class="mb-2 mt-2">Resultados de 100</span>
                            </span>
                            <button type="button" class="btn btn-success btn-sm w-100">Descargar Excel</button>

                        </div>
                    </div>

                    {!tablaConsulta && <ConsultaResumen />}
                    {tablaConsulta && <ConsultaDetallada />}

                </div>
            </section>



        </>
    )
}