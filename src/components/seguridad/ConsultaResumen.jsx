import React from "react";
import { GrUpdate } from "react-icons/gr";
//CSS
import styles from "@styles/Seguridad.module.css";
import Paginacion from "@components/Paginacion";
import { useEffect } from "react";
import { useState } from "react";
import { filtrarCategorias } from "@services/api/categorias";
import { useAuth } from "@hooks/useAuth";
import { actualizarStockAlmacen, filtradoGeneralStock } from "@services/api/stock";
import { listarSeriales } from "@services/api/seguridad";

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
            return 0;
        });
        setTotal(res.total);
        setTabla(result);
        setResults(res.total);
    }

    const ajustarInventario = async (cons_almacen, cons_producto, index) => {
        try {
            // Mostrar loading en el botón específico
        

            // 1. Obtener cantidad real de seriales disponibles
            const res = await listarSeriales(1, 10, { cons_almacen, cons_producto, available: true });
            const cantidadReal = res.total;
            console.log(`Cantidad real de ${cons_producto} en ${cons_almacen}: ${cantidadReal}`);

            // 2. Actualizar el stock en la base de datos
            await actualizarStockAlmacen(cons_almacen, cons_producto, { cantidad: cantidadReal });

            // 3. Actualizar la tabla localmente (sin recargar toda la página)
            setTabla(prevTabla => {
                const nuevaTabla = [...prevTabla];
                if (nuevaTabla[index]) {
                    nuevaTabla[index] = {
                        ...nuevaTabla[index],
                        cantidad: cantidadReal
                    };
                }
                return nuevaTabla;
            });

            // 4. Opcional: Mostrar mensaje de éxito
            console.log(`✅ Inventario ajustado: ${cons_producto} en ${cons_almacen} = ${cantidadReal}`);

            // 5. Opcional: Recargar datos completos si prefieres
            // await listar(data);

        } catch (error) {
            console.error("❌ Error al ajustar inventario:", error);
            // Puedes mostrar un mensaje de error aquí
        } finally {
            // Quitar el loading
            window.alert("Datos actualizados");
        }
    };

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
                            <th className="text-custom-small text-center">Actualizar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((item, index) => (
                            <tr key={index}>
                                <td className="text-custom-small text-center">{item.cons_almacen}</td>
                                <td className="text-custom-small text-center">{item.almacen.nombre}</td>
                                <td className="text-custom-small text-center">{item.cons_producto}</td>
                                <td className="text-custom-small text-center">{item.producto.name}</td>
                                <td className="text-custom-small text-center">
                                    <span className={item.cantidad < 0 ? "text-danger fw-bold" : ""}>
                                        {item.cantidad}
                                    </span>
                                </td>
                                <td className="text-custom-small text-center">
                                    <GrUpdate
                                        size={14}
                                        title="Actualizar inventario"
                                        onClick={() =>
                                            ajustarInventario(item.cons_almacen, item.cons_producto, index)
                                        }
                                        style={{
                                            color: "#0d6efd",
                                            cursor: "pointer",
                                            transition: "transform 0.15s ease, color 0.15s ease",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = "#0b5ed7";
                                            e.currentTarget.style.transform = "scale(1.15)";
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = "#0d6efd";
                                            e.currentTarget.style.transform = "scale(1)";
                                        }}
                                    />
                                </td>
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