import React, { useEffect, useState } from "react";
import readXlsxFile from "read-excel-file";
import { useRef } from "react";

import useDate from "@hooks/useDate";


//CSS
import styles from "@styles/Seguridad.module.css";
import { useAuth } from "@hooks/useAuth";
import { cargarSeriales, listarProductosSeguridad } from "@services/api/seguridad";
import useFile from "@hooks/useFile";
import useExcel from "@hooks/useExcel";
import Alertas from "@assets/Alertas";
import useAlert from "@hooks/useAlert";
import { InputGroup, Form } from "react-bootstrap";
import useSemana from "@hooks/useSemana";



export default function Recepcion() {
    const almacenRef = useRef()
    const articuloRef = useRef()
    const formRef = useRef()
    const { almacenByUser } = useAuth()
    const [archivoExcel, setArchivoExcel] = useState([])
    const [tabla, setTabla] = useState([])
    const [productos, setProductos] = useState([])
    const [limit, setLimit] = useState(0)
    const { alert, setAlert, toogleAlert } = useAlert();
    const [archivoBruto, setArchivoBruto] = useState(null);
    const [bool, setBool] = useState(false)

    useEffect(() => {
        listarProductosSeguridad().then(res => {
            setProductos(res.filter(item => item.serial == true))
        })
    }, [])

    function subirExcel(e) {
        const archivo = e.target.files[0]
        readXlsxFile(archivo).then((rows) => {
            setArchivoBruto(rows)
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

    function previsualizar() {
        if (archivoExcel.length != 0) {
            const cons_almacen = almacenRef.current.value;
            const cons_prodcuto = articuloRef.current.value;
            const file = ["0"].concat(archivoBruto)
            const response = useFile().ordenarExcelSerial(file, cons_almacen, cons_prodcuto)
            setArchivoExcel(response)
            let tabla = response
            const res = tabla.slice(0, limit)
            setTabla(res)
        }
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

    async function cargarDatos(e) {
        e.preventDefault();
        try {
            const formData = new FormData(formRef.current);
            const remision = formData.get("remision");
            const pedido = formData.get("pedido");
            const semana = useSemana(formData.get("semana"));
            const fecha = formData.get("fecha");
            const observaciones = formData.get("observaciones");
            const res = await cargarSeriales(archivoExcel, remision, pedido, semana, fecha, observaciones);
            if (res.bool == true) {
                setBool(true)
                setAlert({
                    active: true,
                    mensaje: res.message,
                    color: "success",
                    autoClose: false
                })
            } else {
                setAlert({
                    active: true,
                    mensaje: res.message,
                    color: "danger",
                    autoClose: false
                })
            }
            
           
        } catch (e) {
           return setAlert({
                active: true,
                mensaje: "Error, quizá existan seriales repetidos.",
                color: "danger",
                autoClose: false
            })
        }
    }


    return (
        <>
            <section>
                <h2>Recepción</h2>

                <form ref={formRef} onSubmit={cargarDatos} className={styles.grid_recepcion}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Alamcén</span>
                        <select className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="almacen"
                            name="almacen"
                            onChange={previsualizar}
                            disabled={bool}
                            ref={almacenRef}>
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <InputGroup size="sm">
                        <InputGroup.Text id="inputGroup-sizing-sm">Remisión</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            id="remision"
                            name="remision"
                            required
                            disabled={bool}
                        />
                    </InputGroup>

                    <InputGroup size="sm">
                        <InputGroup.Text id="inputGroup-sizing-sm">Pedido</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            id="pedido"
                            name="pedido"
                            required
                            disabled={bool}
                        />
                    </InputGroup>

                    <InputGroup size="sm">
                        <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            min="1"
                            max="52"
                            id="semana"
                            name="semana"
                            type="number"
                            required
                            disabled={bool}
                        />
                    </InputGroup>

                    <InputGroup size="sm">
                        <InputGroup.Text id="inputGroup-sizing-sm">Fecha</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            id="fecha"
                            name="fecha"
                            type="date"
                            defaultValue={useDate()}
                            disabled={bool}
                        />
                    </InputGroup>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            onChange={previsualizar}
                            ref={articuloRef}
                            disabled={bool}>
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
                            required
                            disabled={bool}
                        ></input>
                    </div>

                    <InputGroup size="sm">
                        <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            id="observaciones"
                            name="observaciones"
                            required
                            disabled={bool}
                        />
                    </InputGroup>
                    {!bool &&
                        <button type="submit" className="btn btn-success btn-sm">Cargar datos</button>
                    }
                </form>

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