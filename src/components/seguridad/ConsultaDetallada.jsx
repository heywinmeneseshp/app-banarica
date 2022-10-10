import React from "react";

//CSS
import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { useEffect } from "react";
import { listarSeriales } from "@services/api/seguridad";
import { useState } from "react";

export default function ConsultaResumen({ data, setPagination, limit, pagination, setResults }) {

    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        listarSeriales(pagination, limit, data).then(res =>{
            setTabla(res.data);
            setTotal(res.total);
            setResults(res.total);
        } );
    }, [data, pagination, limit]);

    return (
        <>
            <span className={styles.tabla_text}>
                <table className="table mb-1 table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Alm</th>
                            <th scope="col">Artículo</th>
                            <th scope="col">Serial</th>
                            <th scope="col">Bag Pack</th>
                            <th scope="col">S Pack</th>
                            <th scope="col">M Pack</th>
                            <th scope="col">L Pack</th>
                            <th className={styles.display} scope="col">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((item, index) => (
                            <tr key={index}>
                                <td>{item.cons_almacen}</td>
                                <td>{item.cons_producto}</td>
                                <td>{item.serial}</td>
                                <td>{item.bag_pack}</td>
                                <td>{item.s_pack}</td>
                                <td>{item.m_pack}</td>
                                <td>{item.l_pack}</td>
                                <td className={styles.display}>{item.available == true ? "Disponible" : "Usado"}</td>
                            </tr>
                        ))}

                    </tbody>
                </table>
                <span className="container">
                    <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                </span>

            </span>
        </>
    );
}