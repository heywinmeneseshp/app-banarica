import React from "react";

//CSS
import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { useEffect } from "react";
import { listarSeriales } from "@services/api/seguridad";
import { useState } from "react";
import { encontrarModulo } from "@services/api/configuracion";
import { useAuth } from "@hooks/useAuth";

export default function ConsultaResumen({ data, setPagination, limit, pagination, setResults }) {
    const { user, almacenByUser } = useAuth();
    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);
    const [configBotons, setConfigBotons] = useState([]);

    useEffect(() => {
        const alamcenes = almacenByUser.map(item => item.consecutivo);
        data.cons_almacen = data.cons_almacen == "" ? alamcenes : data.cons_almacen;
        listarSeriales(pagination, limit, { ...data, serial: data.serial ? data.serial : "" }).then(res => {
            setTabla(res.data ? res.data : []);
            console.log(res.data);
            setTotal(res);
            setResults(res.total);
        });
        const usuario = user;
        encontrarModulo(usuario.username).then(res => {
            const config = JSON.parse(res[0].detalles);
            setConfigBotons(config?.botones || []);
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
                            {configBotons.includes("disponibles_serial") && <th className="text-custom-small text-center">Serial Interno</th>}
                            <th className="text-custom-small text-center">Serial Externo</th>
                            <th className="text-custom-small text-center">S Pack</th>
                            <th className="text-custom-small text-center">M Pack</th>
                            <th className="text-custom-small text-center">L Pack</th>
                            <th className="text-custom-small text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((item, index) => {
                            return (
                                <tr key={index}>
                                    <td className="text-custom-small text-center">{item.cons_almacen}</td>
                                    <td className="text-custom-small text-center">{item.producto.name}</td>
                                    {configBotons.includes("disponibles_serial") && <td className="text-custom-small text-center">{item.serial}</td>}
                                    <td className="text-custom-small text-center">{item.bag_pack}</td>
                                    <td className="text-custom-small text-center">{item.s_pack}</td>
                                    <td className="text-custom-small text-center">{item.m_pack}</td>
                                    <td className="text-custom-small text-center">{item.l_pack}</td>
                                    <td className="text-custom-small text-center">{item.available == true ? "Disponible" : "Usado"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <span className="container">
                    <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                </span>

            </span>
        </>
    );
}