import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from 'xlsx'
//Services
//Hooks
import { useAuth } from "@hooks/useAuth";
//Bootstrap
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
//Services 
import endPoints from '@services/api';
//Components
import Paginacion from '@components/Paginacion';
//CSS
import styles from '@styles/informes/informes.module.css';
import { Container, ToastBody } from "react-bootstrap";

export default function InfoMovimientos() {
    const { almacenByUser } = useAuth();
    const formRef = useRef();
    const [historial, setHistorial] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [excel, setExcel] = useState(null);
    const limit = 20;

    useEffect(() => {
        try {
            listarItems()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    const entradaOrSalida = (item) => {
        if (item === "Entrada") {
            return <td className="text-success">{item}</td>
        } else {
            return <td className="text-danger">{item}</td>
        }
    }

    async function listarItems() {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_movimiento = formData.get('movimiento');
        const cons_semana = formData.get('semana');
        let url = `${endPoints.historial.list}/filter`
        let body = {}
        const anho = new Date().getFullYear()
        if (cons_semana) body.movimiento = { cons_semana: `S${cons_semana}-${anho}` }
        if (cons_almacen != 0) body.historial = { cons_almacen_gestor: cons_almacen };
        if (cons_movimiento != 0) body.historial = { ...body.historial, cons_lista_movimientos: cons_movimiento };
        body.pagination = { limit: limit, offset: pagination }
        const res = await axios.post(url, body)
        setTotal(res.data.total);
        setHistorial(res.data.data)
    }

    const onBuscar = async () => {
        setPagination(1)
        listarItems()
    }

    const onDescargar = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_movimiento = formData.get('movimiento');
        const cons_semana = formData.get('semana');
        if (cons_semana == "" || null ) return alert("Debe ingresar la semana")
        let url = `${endPoints.historial.list}/filter`
        let body = {}
        const anho = new Date().getFullYear()
        if (cons_semana) body.movimiento = { cons_semana: `S${cons_semana}-${anho}` }
        if (cons_almacen != 0) body.historial = { cons_almacen_gestor: cons_almacen };
        if (cons_movimiento != 0) body.historial = { ...body.historial, cons_lista_movimientos: cons_movimiento };
        const { data } = await axios.post(url, body)
        const newData = data.map(item => {
            const body = {
                "Cons": item.cons_movimiento,
                "Almacén": item.cons_almacen_gestor,
                "Artículo": item.Producto.name,
                "Unidades": item.cantidad,
                "Movimiento": item.cons_lista_movimientos,
                "Tipo de movimiento": item.tipo_movimiento,
                "Razón": item.razon_movimiento,
                "Observaciones": item.movimiento.observaciones,
                "Semana": item.movimiento.cons_semana,
                "Fecha": item.movimiento.fecha
            }
            return body
        })
        const book = XLSX.utils.book_new();
        const sheet =  XLSX.utils.json_to_sheet(newData)
         XLSX.utils.book_append_sheet(book, sheet, "Movimientos")
         XLSX.writeFile(book, "Historial de movimientos.xlsx")

    }

    return (
        <>
            <Container >
                <div>
                    <h2>Informe de movimientos</h2>
                    <div className="line"></div>
                    <form ref={formRef} className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Almacen</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id="almacen"
                                    name="almacen"
                                >
                                    <option value={0}>All</option>
                                    {almacenByUser.map(almacen => (
                                        <option key={almacen.consecutivo} value={almacen.consecutivo} >{almacen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="movimiento">Movimiento</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id='movimiento'
                                    name='movimiento'
                                >
                                    <option value={0}>All</option>
                                    <option value={'RC'}>Recepción</option>
                                    <option value={'AJ'}>Ajuste</option>
                                    <option value={'DV'}>Devolución</option>
                                    <option value={'LQ'}>Liquidación</option>
                                    <option value={'EX'}>Exportación</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="semana">Semana</label>
                            <div>
                                <input type="number"
                                    className="form-control form-control-sm"
                                    id="semana"
                                    name='semana'
                                ></input>
                            </div>
                        </div>

                        <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                            Buscar
                        </Button>
                        <Button onClick={onDescargar} className={styles.button} variant="success" size="sm">
                            Descargar
                        </Button>
                      

                    </form>
                </div>
                {false &&
                    <div className={styles.contenedor3}>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                            Buscar
                        </Button>
                    </div>}


                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons</th>
                            <th>Almacen</th>
                            <th>Artículo</th>
                            <th>Unidades</th>
                            <th>Movimiento</th>
                            <th>Tipo</th>
                            <th>Motivo</th>
                            <th>Semana</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historial.map((item, index) => (
                            <tr key={index}>
                                <td>{item?.cons_movimiento}</td>
                                <td>{item?.cons_almacen_gestor}</td>
                                <td>{item?.Producto?.name}</td>
                                <td>{item?.cantidad}</td>
                                <td>{item?.cons_lista_movimientos}</td>
                                {entradaOrSalida(item?.tipo_movimiento)}
                                <td>{item?.razon_movimiento}</td>
                                <td>{item?.movimiento?.cons_semana}</td>
                                <td>{item?.movimiento?.fecha}</td>
                            </tr>)
                        )}
                    </tbody>
                </Table>

                <div className={styles.pagination}>
                    <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                </div>

            </Container>
        </>
    );
}

