import React from "react";

//CSS
import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";

export default function ConsultaResumen () {

    return (
        <>
         <span className={styles.tabla_text}>
                        <table className="table mb-1 table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">Alm</th>
                                    <th scope="col">Artículo</th>
                                    <th scope="col">Serial</th>
                                    <th scope="col">S Pack</th>
                                    <th scope="col">M Pack</th>
                                    <th scope="col">L Pack</th>
                                    <th className={styles.display} scope="col">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>BRC</td>
                                    <td>Termógrafo</td>
                                    <td>KJS234HS0</td>
                                    <td>CP.235234</td>
                                    <td>CM.235234</td>
                                    <td>CL.235234</td>
                                    <td className={styles.display}>Disponible</td>
                                </tr>
                                <tr>
                                    <td>SEG</td>
                                    <td>Termógrafo</td>
                                    <td>KJS234HS0</td>
                                    <td>CP.235234</td>
                                    <td>CM.235234</td>
                                    <td>CL.235234</td>
                                    <td className={styles.display}>No disponible</td>
                                </tr>
                                <tr>
                                    <td>SEG</td>
                                    <td>Termógrafo</td>
                                    <td>KJS234HS0</td>
                                    <td>CP.235234</td>
                                    <td>CM.235234</td>
                                    <td>CL.235234</td>
                                    <td className={styles.display}>No disponible</td>
                                </tr>
                            </tbody>
                        </table>
                        <span className="container">
                            <Paginacion />
                        </span>

                    </span>
        </>
    );
}