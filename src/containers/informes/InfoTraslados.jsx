import React, { useEffect, useRef, useState, useContext } from "react";
import { useRouter } from "next/router";
import AppContext from "@context/AppContext";
import axios from "axios";
import Table from 'react-bootstrap/Table';
//Services
import endPoints from "@services/api";
//Hooks
import { useAuth } from "@hooks/useAuth";
//Components
import Paginacion from '@components/Paginacion';
import Button from 'react-bootstrap/Button';
import RecibirTraslado from '@components/almacen/RecibirTraslado'
//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";



export default function InfoTraslados() {
    const almacenRef = useRef()
    const router = useRouter()
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
            setCategorias(categorias.data);
            setProductos(productos.data);
        }
        try {
            listar()
            listarItems()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    async function listarItems() {
        if (almacenRef.current.value === "All") {
            const res = await axios.post(endPoints.traslados.pagination(pagination, limit), { almacenes: almacenByUser });
            setTotal(res.data.total);
            setTraslados(res.data.data)
        } else {
            const almacenes = almacenByUser.filter(almacen => almacen.nombre === almacenRef.current.value);
            const res = await axios.post(endPoints.traslados.pagination(pagination, limit), { almacenes: almacenes });
            setTotal(res.data.total);
            setTraslados(res.data.data)
        }
    }

    const onBuscar = () => {
        listarItems()
    }

    const onBuscarDocumento = () => {
        const cons_movimiento = movimientoRef.current.value
        alert("Este boton no está habilitado", cons_movimiento)
    }

    const onDescargarDocumento = () => {
        alert("Este boton no está habilitado")
    }

    return (
        <>

            <Container>

                <h2>Informe de traslados</h2>
                <div className="line"></div>

                <div>

                    <div className={styles.contenedor3}>
                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Almacen</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id='almacen'
                                    name='almacen'
                                    ref={almacenRef}>
                                    {(user.id_rol === 'Super administrador' || "Administrador") && <option>All</option>}
                                    {almacenByUser.map(almacen => (
                                        <option key={almacen.consecutivo}>{almacen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Categoría</label>
                            <div>
                                <select className="form-select form-select-sm" disabled>
                                    <option>All</option>
                                    {categorias.map((categoria, index) => (
                                        <option key={index} >{categoria.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Artículo</label>
                            <div>
                                <select className="form-select form-select-sm" disabled>
                                    <option>All</option>
                                    {productos.map((producto, index) => (
                                        <option key={index}>{producto.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Semana</label>
                            <div>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    id="contraseña"
                                    disabled></input>
                            </div>
                        </div>

                        <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                            Buscar
                        </Button>
                    </div>

                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="cons_movimiento">Consecutivo</label>
                            <div>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    id="cons_movimiento"
                                    name="cons_movimiento"
                                    ref={movimientoRef}>
                                </input>
                            </div>
                        </div>
                        {(user.id_rol == "Administrador" || "Super administrador") &&
                            <Button onClick={onDescargarDocumento} className={styles.button} variant="success" size="sm">
                                Descargar documento
                            </Button>
                        }
                        <Button onClick={onBuscarDocumento} className={styles.button} variant="info" size="sm">
                            Buscar documento
                        </Button>
                    </div>
                </div>


                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons.</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
                            <th>Semana</th>
                            <th>Estado</th>
                            <th>Salida</th>
                            <th>Entrada</th>
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
                                <td>{traslado?.traslado?.fecha_salida}</td>
                                <td>{traslado?.traslado?.fecha_entrada}</td>
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

