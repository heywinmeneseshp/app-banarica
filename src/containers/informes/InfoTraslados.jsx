import React, { useEffect, useState } from "react";
import axios from "axios";
import Table from 'react-bootstrap/Table';
//Services
import endPoints from "@services/api";
//Hooks
import { useAuth } from "@hooks/useAuth";
//Components
import Paginacion from '@components/Paginacion';
import Button from 'react-bootstrap/Button';
//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";



export default function InfoTraslados() {
    const { user, almacenByUser } = useAuth();
    const [traslados, setTraslados] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [productos, setProductos] = useState([1]);
    const [categorias, setCategorias] = useState([1]);
    const limit = 20;

    useEffect(() => {
        async function listarItems() {
            const res = await axios.get(endPoints.traslados.pagination(pagination, limit));
            const total = await axios.get(endPoints.traslados.list);
            const productos = await axios.get(endPoints.productos.list);
            const categorias = await axios.get(endPoints.categorias.list);
            setCategorias(categorias.data);
            setProductos(productos.data);
            setTotal(total.data.length);
            setTraslados(res.data.reverse())
        }
        try {
            listarItems()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])
    
    return (
        <>

            <Container>

                <h2>Informe de traslados</h2>
                <div className="line"></div>

                <div>

                    <div className={styles.contenedor3}>
                        <div className={styles.grupo}>
                            <label htmlFor="Username">Almacen</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    {(user.id_rol === 'Super administrador') && <option>All</option>}
                                    {almacenByUser.map(almacen => (
                                        <option key={almacen.id} value={almacen.id}>{almacen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Categoría</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    <option>All</option>
                                    {categorias.map(producto => (
                                        <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Artículo</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    <option>All</option>
                                    {productos.map(producto => (
                                        <option key={producto.id} value={producto.id}>{producto.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Fecha Inicial</label>
                            <div>
                                <input type="date" className="form-control form-control-sm" id="contraseña"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Fecha Final</label>
                            <div>
                                <input type="date" className="form-control form-control-sm" id="contraseña"></input>
                            </div>
                        </div>

                    </div>

                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Consecutivo</label>
                            <div>
                                <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                            </div>
                        </div>
                        {(user.id_rol === 'Super administrador') &&
                            <Button className={styles.button} variant="warning" size="sm">
                                Editar documento
                            </Button>
                        }
                        {(user.id_rol == "Administrador" || "Super administrador") &&
                            <Button className={styles.button} variant="success" size="sm">
                                Descargar documento
                            </Button>
                        }
                    </div>
                </div>


                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons.</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Transportadora</th>
                            <th>Conductor</th>
                            <th>Semana</th>
                            <th>Estado</th>
                            <th>Salida</th>
                            <th>Entrada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {traslados.map((traslado, index) => (
                            <tr>
                                <td>{traslado.consecutivo}</td>
                                <td>{traslado.origen}</td>
                                <td>{traslado.destino}</td>
                                <td>{traslado.transportadora}</td>
                                <td>{traslado.conductor}</td>
                                <td>{traslado.semana}</td>
                                <td>{traslado.estado}</td>
                                <td>{traslado.fecha_salida}</td>
                                <td>{traslado.fecha_entrada}</td>
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

