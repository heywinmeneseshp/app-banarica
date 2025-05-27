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
    }, [data, limit, pagination]);

    async function listar(data) {
        let categoria = await filtrarCategorias(1, 1, "Seguridad");
        let body = {
            "producto": {
                "cons_categoria": categoria?.data[0]?.consecutivo,
                "consecutivo": data?.cons_producto ? data?.cons_producto : ""
            },
            "almacen": {
                "consecutivo": data?.cons_almacen ? data?.cons_almacen : ""
            },
            "pagination": {
                "offset": pagination,
                "limit": limit
            },
            "stock": {
                "isBlock": false
            }
        };
        if (data.cons_almacen == "") body.almacen.consecutivo = almacenByUser.map(item => item.consecutivo);
        const res = await filtradoGeneralStock(body);
        const result = res.data.sort((a, b) => {
            if (a.cantidad > b.cantidad) return 1;
            if (a.cantidad < b.cantidad) return -1;
        });
        setTotal(res.total);
        setTabla(result);
        setResults(res.total);
    }

    return (
        <>
            <span className={styles.tabla_text}>
                <table className="table table-striped table-bordered table-sm mb-1">
                    <thead>
                        <tr>
                            <th className="text-custom-small text-center" scope="col">Alm</th>
                            <th className="text-custom-small text-center"></th>
                            <th className="text-custom-small text-center">Cod</th>
                            <th className="text-custom-small text-center">Artículo</th>
                            <th className="text-custom-small text-center">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((item, index) => (
                            <tr key={index} >
                                <td className="text-custom-small text-center">{item.cons_almacen}</td>
                                <td className="text-custom-small text-center">{item.almacen.nombre}</td>
                                <td className="text-custom-small text-center">{item.cons_producto}</td>
                                <td className="text-custom-small text-center">{item.producto.name}</td>
                                <td className="text-custom-small text-center">{item.cantidad}</td>
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