import React from "react";

//CSS
import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";

export default function ConsultaDetallada () {

    return (
        <>
         <span className={styles.tabla_text}>
                        <table className="table mb-1 table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">Alm</th>
                                    <th scope="col"></th>
                                    <th scope="col">Cod</th>
                                    <th scope="col">Artículo</th>
                                    <th scope="col">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>BRC</td>
                                    <td>Oficina Santa Marta</td>
                                    <td>TER1</td>
                                    <td>Termógrafo</td>
                                    <td>650</td>
                                </tr>
                                <tr>
                                    <td>BRC</td>
                                    <td>Seguridad Napoles</td>
                                    <td>TER1</td>
                                    <td>Termógrafo</td>
                                    <td>650</td>
                                </tr>
                                <tr>
                                    <td>BRC</td>
                                    <td>Seguridad Napoles</td>
                                    <td>TER1</td>
                                    <td>Termógrafo</td>
                                    <td>650</td>
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