import React, { useEffect, useRef, useState, useContext } from "react";
import { useRouter } from "next/router";
import AppContext from "@context/AppContext";
import axios from "axios";
import * as XLSX from 'xlsx'
//Services
import endPoints from "@services/api";
import { filtrarTraslados, buscarTraslado } from "@services/api/traslados";
//Hooks
import { useAuth } from "@hooks/useAuth";
import useDate from "@hooks/useDate";
//Components
import Paginacion from '@components/Paginacion';
//Bootstrap
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { Container } from "react-bootstrap";
//CSS
import styles from '@styles/informes/informes.module.css';





export default function InfoTraslados() {
    const router = useRouter()
    const formRef = useRef()
    const movimientoRef = useRef()
    const { gestionNotificacion } = useContext(AppContext);
    const { user, almacenByUser } = useAuth();
    const [traslados, setTraslados] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [productos, setProductos] = useState([1]);
    const [categorias, setCategorias] = useState([1]);
    const limit = 20;

    useEffect(() => {
        async function listar() {
            const productos = await axios.get(endPoints.productos.list);
            const categorias = await axios.get(endPoints.categorias.list);
            const almacenes = almacenByUser.map(item => item.consecutivo)
            const categoria_lis = user.id_rol == "Seguridad" || user.id_rol == "Super seguridad" ? categorias.data.filter(item => item.nombre == "Seguridad") : categorias.data
            setCategorias(categoria_lis);
            setProductos(productos.data);
            onBuscar()
        }
        try {
            listar()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    const onBuscar = async () => {
        const formData = new FormData(formRef.current)
        let almacenes = formData.get("almacen")
        const semana = formData.get("semana")
        const producto = formData.get("articulo")
        const categoria = formData.get("categoria")
        if (almacenes == 0) almacenes = almacenByUser.map(item => item.consecutivo)
        if (almacenes != 0) almacenes = [almacenes]
        const res = await filtrarTraslados(almacenes, semana, producto, categoria, pagination, limit)
        setTotal(res.total);
        setTraslados(res.data)
    }

    const onVerPDF = async () => {
        const formData = new FormData(formRef.current)
        const traslado = formData.get("movimiento")
        if (traslado == "") return alert("Por favor, introduzca el consecutivo del traslado")
        const res  = await buscarTraslado(traslado)
        if(res.length == 0) return alert("El traslado no existe")
        window.open(endPoints.document.traslados(traslado))
    }

    const onDescargarExcel = async () => {
        const formData = new FormData(formRef.current)
        let almacenes = formData.get("almacen")
        const semana = formData.get("semana")
        const producto = formData.get("articulo")
        const categoria = formData.get("categoria")
        if (almacenes == 0) almacenes = almacenByUser.map(item => item.consecutivo)
        if (almacenes != 0) almacenes = [almacenes]
        const res = await filtrarTraslados(almacenes, semana, producto, categoria, null, null)
        const newData = res.map(item => {
            return {
                "Consecutivo": item?.traslado?.consecutivo,
                "Origen": item?.traslado?.origen,
                "Destino": item?.traslado?.destino,
                "Producto": item?.Producto?.name,
                "Categoria": item?.Producto?.cons_categoria,
                "Cantidad": item?.cantidad,
                "Transportadora": item?.traslado?.transportadora,
                "Conductor": item?.traslado?.conductor,
                "Vehículo": item?.traslado?.vehiculo,
                "Observaciones":item?.traslado?.observaciones,
                "Estado": item?.traslado?.estado,
                "Semana": item?.traslado?.semana,
                "Fecha salida": item?.traslado?.fecha_salida,
                "Fecha entrada": item?.traslado?.fecha_entrada
            }
        })
        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData)
        XLSX.utils.book_append_sheet(book, sheet, "Traslados")
        XLSX.writeFile(book, `Historial de traslados ${useDate()}.xlsx`)
    }

    return (
        <>

            <Container>

                <h2>Informe de traslados</h2>
                <div className="line"></div>

                <form ref={formRef}>

                    <div className={styles.contenedor3}>
                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Almacen</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id='almacen'
                                    name='almacen'
                                    onChange={onBuscar}>
                                    <option value={0}>All</option>
                                    {almacenByUser.map(almacen => (
                                        <option value={almacen.consecutivo} key={almacen.consecutivo}>{almacen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="categoria">Categoría</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id="categoria"
                                    name="categoria"
                                    onChange={onBuscar}
                                >
                                    {!(user.id_rol == "Seguridad" || user.id_rol == "Super seguridad") &&
                                    <option value={""}>All</option>
                                    }
                                    {categorias.map((categoria, index) => (
                                        <option value={categoria.consecutivo} key={index} >{categoria.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="articulo">Artículo</label>
                            <div>
                                <input type="text"
                                    className="form-control form-control-sm"
                                    id="articulo"
                                    name='articulo'
                                    onChange={onBuscar}
                                ></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="semana">Semana</label>
                            <div>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    id="semana"
                                    name="semana"
                                    onChange={onBuscar}
                                ></input>
                            </div>
                        </div>


                        <Button onClick={onDescargarExcel} className={styles.button} variant="success" size="sm">
                            Descargar Excel
                        </Button>
                    </div>

                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="movimiento">Consecutivo</label>
                            <div>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    id="movimiento"
                                    name="movimiento"
                                >
                                </input>
                            </div>
                        </div>

                        <Button onClick={onVerPDF} className={styles.button} variant="warning" size="sm">
                            Ver documento
                        </Button>


                    </div>
                </form>


                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons.</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Artículo</th>
                            <th className={styles.display}>Cantidad</th>
                            <th className={styles.display_desktop}>Cant.</th>
                            <th>Semana</th>
                            <th>Estado</th>
                            <th className={styles.display}>Salida</th>
                            <th className={styles.display}>Entrada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {traslados.map((traslado, index) => (
                            <tr key={index}>
                                <td>{traslado?.traslado?.consecutivo}</td>
                                <td>{traslado?.traslado?.origen}</td>
                                <td>{traslado?.traslado?.destino}</td>
                                <td>{traslado?.Producto?.name}</td>
                                <td>{traslado?.cantidad}</td>
                                <td>{traslado?.traslado?.semana}</td>
                                <td>{traslado?.traslado?.estado}</td>
                                <td className={styles.display}>{traslado?.traslado?.fecha_salida}</td>
                                <td className={styles.display}>{traslado?.traslado?.fecha_entrada}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <div className={styles.pagination}>
                    <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                </div>
            </Container>
        </>
    );
}

