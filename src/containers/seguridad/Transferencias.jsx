import React from "react";

//CSS
import styles from "@styles/Seguridad.module.css"

export default function Transferencias() {

    return (
        <>
            <section>
                <h2>Transferencias</h2>
                <div className={styles.grid_tranferencias}>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Orígen</span>
                        <select class="form-select form-select-sm" aria-label=".form-select-sm example">
                            <option selected>Open this select menu</option>
                            <option value="1">One</option>
                            <option value="2">Two</option>
                            <option value="3">Three</option>
                        </select>
                    </div>

                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Destino</span>
                        <select class="form-select form-select-sm" aria-label=".form-select-sm example">
                            <option selected>Open this select menu</option>
                            <option value="1">One</option>
                            <option value="2">Two</option>
                            <option value="3">Three</option>
                        </select>
                    </div>

                    <div class="input-group input-group-sm">
                        <span class="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select class="form-select form-select-sm" aria-label=".form-select-sm example">
                            <option selected>Sobrante</option>
                            <option value="1">One</option>
                            <option value="2">Two</option>
                            <option value="3">Three</option>
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

                    <div class="input-group input-group-sm">
                        <button ttype="button" class="btn btn-primary btn-sm w-100">Buscar artículos</button>
                    </div>

                </div>
                <div className="line"></div>

                <div>

                    <div className={styles.grid_result}>
                        <div class={styles.botonesTrans}>
                            <span className={styles.grid_result_child2}>
                                <input type="number" class="form-control form-control-sm" id="exampleFormControlInput1"
                                    placeholder="80"></input>
                                <span class="mb-2 mt-2">Resultados de 100</span>
                            </span>
                            <span></span>
                            <span></span>
                            <button type="button" class="btn btn-success btn-sm w-100">Descargar Excel</button>
                        </div>
                    </div>

                    <span className={styles.tabla_text}>
                   
                        <table class="table mb-4 table-striped cont_tabla">
                            <thead>
                                <tr>
                                    <th scope="row">
                                        <input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1"></input>
                                    </th>
                                    <th scope="col">Artículo</th>
                                    <th scope="col">Serial</th>
                                    <th scope="col">S Pack</th>
                                    <th scope="col">M Pack</th>
                                    <th scope="col">L Pack</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">
                                        <input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1"></input>
                                    </th>
                                    <td>Termógrafo</td>
                                    <td>KJS234HS0</td>
                                    <td>CP.235234</td>
                                    <td>CM.235234</td>
                                    <td>CL.235234</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1"></input>
                                    </th>
                                    <td>Termógrafo</td>
                                    <td>KJS234HS0</td>
                                    <td>CP.235234</td>
                                    <td>CM.235234</td>
                                    <td>CL.235234</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1"></input>
                                    </th>
                                    <td>Termógrafo</td>
                                    <td>KJS234HS0</td>
                                    <td>CP.235234</td>
                                    <td>CM.235234</td>
                                    <td>CL.235234</td>
                                </tr>
                            </tbody>
                        </table>

                    </span>
                </div>
            </section>
        </>
    )
}