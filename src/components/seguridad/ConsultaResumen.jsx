import React from "react";

//CSS
import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { useEffect } from "react";
import { useState } from "react";
import { filtrarCategorias } from "@services/api/categorias";
import { useAuth } from "@hooks/useAuth";
import { filtradoGeneralStock } from "@services/api/stock";

export default function ConsultaDetallada({ data, setPagination, limit, pagination, setResults }) {

    const [total, setTotal] = useState(0);
    const [tabla, setTabla] = useState([]);
    const { almacenByUser } = useAuth();

    useEffect(() => {

        listar(data);

    }, [data, limit]);

    async function listar(data) {
        let categoria = await filtrarCategorias(1, 1, "Seguridad");
        let body = {
            "producto": {
                "cons_categoria": categoria?.data[0].consecutivo,
                "consecutivo": data?.cons_producto ? data?.cons_producto : ""
            },
            "almacen": {
                "consecutivo": data?.cons_almacen ? data?.cons_almacen : ""

            },
            "pagination": {
                "offset": pagination,
                "limit": limit
            }
        };
        if (data.cons_almacen == "") body.almacen.consecutivo = almacenByUser.map(item => item.consecutivo);
        const res = await filtradoGeneralStock(body);
        setTotal(res.total);
        setTabla(res.data);
        setResults(res.total);
       
    }

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
                        {tabla.map((item, index) => (
                            <tr key={index} >
                                <td>{item.cons_almacen}</td>
                                <td>{item.almacen.nombre}</td>
                                <td>{item.cons_producto}</td>
                                <td>{item.producto.name}</td>
                                <td>{item.cantidad}</td>
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