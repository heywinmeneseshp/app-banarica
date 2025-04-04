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
      const alamcenes = JSON.parse(localStorage.getItem("almacenByUser")).map(item => item.consecutivo);
        data.cons_almacen = data.cons_almacen == "" ? alamcenes : data.cons_almacen;
        console.log(data);
        listarSeriales(pagination, limit, data).then(res => {
            setTabla(res.data);
            setTotal(res.total);
            setResults(res.total);
        });
    }, [data, pagination, limit]);

    return (
        <>
            <span className={styles.tabla_text}>
                <table className="table table-striped table-bordered table-sm mb-1">
                    <thead>
                        <tr>
                            <th className="text-custom-small text-center">Alm</th>
                            <th className="text-custom-small text-center">Artículo</th>
                            <th className="text-custom-small text-center">Serial</th>
                            <th className="text-custom-small text-center">Bag Pack</th>
                            <th className="text-custom-small text-center">S Pack</th>
                            <th className="text-custom-small text-center">M Pack</th>
                            <th className="text-custom-small text-center">L Pack</th>
                            <th  className="text-custom-small text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((item, index) => (
                            <tr key={index}>
                                <td className="text-custom-small text-center">{item.cons_almacen}</td>
                                <td className="text-custom-small text-center">{item.cons_producto}</td>
                                <td className="text-custom-small text-center">{item.serial}</td>
                                <td className="text-custom-small text-center">{item.bag_pack}</td>
                                <td className="text-custom-small text-center">{item.s_pack}</td>
                                <td className="text-custom-small text-center">{item.m_pack}</td>
                                <td className="text-custom-small text-center">{item.l_pack}</td>
                                <td className="text-custom-small text-center">{item.available == true ? "Disponible" : "Usado"}</td>
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