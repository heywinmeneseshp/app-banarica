import React, { useEffect, useState } from "react";
import endPoints from "@services/api";
import axios from "axios";
//CSS
import styles from "@styles/Seguridad.module.css"
import ConsultaResumen from "@components/seguridad/ConsultaDetallada";
import ConsultaDetallada from "@components/seguridad/ConsultaResumen";
import { useAuth } from "@hooks/useAuth";
import { listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import { useRef } from "react";
import useExcel from "@hooks/useExcel";
import { filtrarCategorias } from "@services/api/categorias";
import { buscarProducto } from "@services/api/productos";

export default function Disponibles() {
    const { almacenByUser, user } = useAuth()
    const formRef = useRef()
    const [tablaConsulta, setTablaConsultal] = useState(true);
    const [productos, setProductos] = useState([])
    const [data, setData] = useState({})
    const [pagination, setPagination] = useState(1);
    const [limit, setLimit] = useState(10);
    const [results, setResults] = useState(0);

    useEffect(() => {
        if (!tablaConsulta) {
            listarProductosSeguridad().then(res => {
                setProductos(res.filter(item => item.serial == true))
            })
            buscarArticulos()
        } else {
            listarProductosSeguridad().then(res => {
                setProductos(res)
            })
            buscarArticulos()
        }
    }, [tablaConsulta])

    const handleTableConsulta = (bool) => {
        setTablaConsultal(bool)
        setLimit(10)
        setPagination(1)
        setResults(0)
    }

    const buscarArticulos = () => {
        setPagination(1)
        const formData = new FormData(formRef.current)
        let estado = formData.get("estado")
        if (estado == "All") {
            estado = [true, false]
        } else {
            estado = estado == 1 ? [true] : [false]
        }
        const almacen = formData.get("almacen");
        const producto = formData.get("producto");
        const data = {
            cons_producto: producto,
            serial: formData.get("serial"),
            bag_pack: formData.get("bag_pack"),
            s_pack: formData.get("s_pack"),
            m_pack: formData.get("m_pack"),
            l_pack: formData.get("l_pack"),
            cons_almacen: almacen == 0 ? "" : almacen,
            available: estado
        }
        setData(data)
    }

    const onChangeLimit = (e) => {
        setLimit(e.target.value)
        setPagination(1)
    }

    const descargarExcel = async () => {
        if (!tablaConsulta) {
            console.log(data)
            const response = await listarSeriales(false, false, data);
            useExcel(response, "seriales", "Artículos de seguridad")
        } else {
            const formData = new FormData(formRef.current);
            const cons_almacen = formData.get('almacen');
            const categoria = await filtrarCategorias(1, 1, "Seguridad");
            const producto = formData.get('producto') == "" ? "" : await buscarProducto(formData.get('producto'));
            let body = {
                "producto": {
                    "name": formData.get('producto') == "" ? "" : producto?.name,
                    "cons_categoria": categoria?.data[0].consecutivo
                },
                "almacen": {
                    "consecutivo": cons_almacen == 0 ? almacenByUser.map(item => item.consecutivo) : cons_almacen
                }
            }
            const { data } = await axios.post(endPoints.stock.filter, body);
            const newData = data.map((item) => {
                return {
                    "Cod almacen": item.cons_almacen,
                    "Almacen": item.almacen?.nombre,
                    "Cod categoria": item.producto.cons_categoria,
                    "Cod artículo": item.cons_producto,
                    "Artículo": item.producto.name,
                    "Cantidad": item.cantidad
                }
            })
            useExcel(newData, "Seguridad", "Stock seguridad")
        }

    }

    return (
        <>
            <section>
                <h2>Consulta de disponibles</h2>
                <form ref={formRef} className={styles.grid_tranferencias}>
                    <div className="input-group input-group-sm ">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Almacen</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="almacen"
                            onChange={buscarArticulos}
                            name="almacen">
                            <option value={0}>All</option>
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group input-group-sm ">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="producto"
                            onChange={buscarArticulos}
                            name="producto">
                            <option value={""}>{"All"}</option>
                            {productos.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    {!tablaConsulta &&
                        <div className="input-group input-group-sm ">
                            <span className="input-group-text" id="inputGroup-sizing-sm">Estado</span>
                            <select
                                className="form-select form-select-sm"
                                aria-label=".form-select-sm example"
                                id="estado"
                                onChange={buscarArticulos}
                                name="estado">
                                <option value={1}>Disponible</option>
                                <option value={0}>No disponible</option>
                                <option value={"All"}>All</option>

                            </select>
                        </div>
                    }
                    {!tablaConsulta &&
                        <div className="input-group input-group-sm">
                            <span className="input-group-text" id="inputGroup-sizing-sm">Serial</span>
                            <input type="text"
                                className="form-control"
                                aria-label="Sizing example input"
                                id="serial"
                                name="serial"
                                onChange={buscarArticulos}
                                aria-describedby="inputGroup-sizing-sm"></input>
                        </div>
                    }
                    {!tablaConsulta &&
                        <div className="input-group input-group-sm">
                            <span className="input-group-text" id="inputGroup-sizing-sm">Bag Pack</span>
                            <input type="text"
                                className="form-control"
                                aria-label="Sizing example input"
                                aria-describedby="inputGroup-sizing-sm"
                                id="bag_pack"
                                onChange={buscarArticulos}
                                name="bag_pack"></input>
                        </div>
                    }
                    {!tablaConsulta &&
                        <div className="input-group input-group-sm">
                            <span className="input-group-text" id="inputGroup-sizing-sm">S Pack</span>
                            <input type="text"
                                className="form-control"
                                aria-label="Sizing example input"
                                aria-describedby="inputGroup-sizing-sm"
                                id="s_pack"
                                onChange={buscarArticulos}
                                name="s_pack"></input>
                        </div>
                    }
                    {!tablaConsulta &&
                        <div className="input-group input-group-sm">
                            <span className="input-group-text" id="inputGroup-sizing-sm">M Pack</span>
                            <input type="text"
                                className="form-control"
                                aria-label="Sizing example input"
                                aria-describedby="inputGroup-sizing-sm"
                                onChange={buscarArticulos}
                                id="m_pack"
                                name="m_pack"></input>
                        </div>
                    }
                    {!tablaConsulta &&
                        <div className="input-group input-group-sm">
                            <span className="input-group-text" id="inputGroup-sizing-sm">L Pack</span>
                            <input type="text"
                                className="form-control"
                                aria-label="Sizing example input"
                                aria-describedby="inputGroup-sizing-sm"
                                onChange={buscarArticulos}
                                id="l_pack"
                                name="l_pack"></input>
                        </div>
                    }
                    <span className={styles.lastChild}>

                        <button type="button" onClick={descargarExcel} className="btn btn-success btn-sm w-100">Descargar Excel</button>
                    </span>

                </form>

                <div className="line"></div>
                <div >

                    <div className={styles.grid_result}>
                        <div className={styles.botonesTrans}>
                            {user.id_rol == "Super seguridad" && <button type="button" onClick={() => handleTableConsulta(true)} className="btn btn-primary btn-sm">Resumen</button>}
                            {user.id_rol == "Super seguridad" && <button type="button" onClick={() => handleTableConsulta(false)} className="btn btn-primary btn-sm ">Detallado</button>}
                            {user.id_rol != "Super seguridad" && <span className="display"></span>}
                            {user.id_rol != "Super seguridad" && <span className="display"></span>}
                            <span className="display"></span>
                            <span className={styles.grid_result_child2}>
                                <input onChange={onChangeLimit}
                                    type="number" className="form-control 
                                form-control-sm" id="exampleFormControlInput1"
                                    min={0}
                                    max={results}
                                    placeholder={limit}></input>
                                <span className="mb-2 mt-2">Resultados de {results}</span>
                            </span>


                        </div>
                    </div>

                    {!tablaConsulta && <ConsultaResumen setPagination={setPagination} limit={limit} setLimit={setLimit} pagination={pagination} data={data} setResults={setResults} />}
                    {tablaConsulta && <ConsultaDetallada setPagination={setPagination} limit={limit} setLimit={setLimit} pagination={pagination} data={data} setResults={setResults} />}

                </div>
            </section>



        </>
    )
}