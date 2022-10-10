import React, { useEffect, useState } from "react";
import readXlsxFile from "read-excel-file";
import { useRef } from "react";


//CSS
import styles from "@styles/Seguridad.module.css";
import { useAuth } from "@hooks/useAuth";
import { cargarSeriales, listarProductosSeguridad } from "@services/api/seguridad";
import useFile from "@hooks/useFile";
import useExcel from "@hooks/useExcel";
import Alertas from "@assets/Alertas";
import useAlert from "@hooks/useAlert";



export default function Recepcion() {
    const almacenRef = useRef()
    const articuloRef = useRef()
    const { almacenByUser } = useAuth()
    const [archivoExcel, setArchivoExcel] = useState([])
    const [tabla, setTabla] = useState([])
    const [productos, setProductos] = useState([])
    const [limit, setLimit] = useState(0)
    const { alert, setAlert, toogleAlert } = useAlert();

    useEffect(() => {
        listarProductosSeguridad().then(res => {
            setProductos(res.filter(item => item.serial == true))
        })
    }, [])

    function subirExcel(e) {
        readXlsxFile(e.target.files[0]).then((rows) => {
            const cons_almacen = almacenRef.current.value;
            const cons_prodcuto = articuloRef.current.value;
            const response = useFile().ordenarExcelSerial(rows, cons_almacen, cons_prodcuto)
            setArchivoExcel(response)
            let tabla = response
            const res = tabla.slice(0, 5)
            setTabla(res)
        })
        setLimit(5)
    }

    function decargarPlantilla() {
        const data = {
            "Consecutivo artículo": null,
            "Serial artículo": null,
            "Serial bag pack": null,
            "Serial s_pack": null,
            "Serial m_pack": null,
            "Serial l_pack": null,
        }
        useExcel([data], "Plantilla", "Plantilla seriales")
    }

    function limitPaginacion(e) {
        setLimit(e.target.value)
        let tabla = archivoExcel
        const res = tabla.slice(0, e.target.value)
        setTabla(res)
    }

    async function cargarDatos() {
        try {
            await cargarSeriales(archivoExcel);
            setAlert({
                active: true,
                mensaje: "Se han cargado los datos con éxito",
                color: "success",
                autoClose: false
            })
        } catch (e) {
            setAlert({
                active: true,
                mensaje: e,
                color: "danger",
                autoClose: false
            })
        }
    }


    return (
        <>
            <section>
                <h2>Recepción</h2>

                <div className={styles.grid_recepcion}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Alamcén</span>
                        <select className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="almacen"
                            name="almacen"
                            ref={almacenRef}>
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            ref={articuloRef}>
                            <option value={0}>{"Varios"}</option>
                            {productos.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <input className="form-control form-control-sm"
                            onChange={subirExcel}
                            id="archivo-excel"
                            type="file"
                        ></input>
                    </div>
                    <button type="button" onClick={cargarDatos} className="btn btn-success btn-sm">Cargar datos</button>
                </div>

                <Alertas className="mt-3" alert={alert} handleClose={toogleAlert} />

                <div className="line"></div>
                <div className="mt-3">


                    <div className={styles.grid_result}>
                        <div className={styles.botonesTrans}>
                            <span className={styles.grid_result_child2}>
                                <input type="number"
                                    className="form-control form-control-sm"
                                    id="limit"
                                    min="1"
                                    max={archivoExcel.length}
                                    onChange={limitPaginacion}
                                    placeholder={limit}
                                    defaultValue={limit}
                                ></input>
                                <span className="mb-2 mt-2">Resultados de {archivoExcel.length}</span>
                            </span>
                            <span className={styles.display}></span>
                            <span className={styles.display}></span>
                            <button type="button" onClick={decargarPlantilla} className="btn btn-warning btn-sm w-100">Descargar Plantilla</button>
                        </div>
                    </div>

                    <span className={styles.tabla_text}>
                        <table className="table mb-4 table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">Alm</th>
                                    <th scope="col">Artículo</th>
                                    <th scope="col">Serial</th>
                                    <th scope="col">Bag pack</th>
                                    <th scope="col">S Pack</th>
                                    <th scope="col">M Pack</th>
                                    <th scope="col">L Pack</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabla.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item?.cons_almacen}</td>
                                        <td>{item?.cons_producto}</td>
                                        <td>{item?.serial}</td>
                                        <td>{item?.bag_pack}</td>
                                        <td>{item?.s_pack}</td>
                                        <td>{item?.m_pack}</td>
                                        <td>{item?.l_pack}</td>
                                    </tr>))}
                            </tbody>
                        </table>
                    </span>


                </div>


            </section>

        </>
    )
}