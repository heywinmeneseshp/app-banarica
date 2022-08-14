import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
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
import { Container } from "react-bootstrap";



export default function InfoMovimientos() {
    const { almacenByUser } = useAuth();
    const almacenRef = useRef();
    const [historial, setHistorial] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
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
        if (almacenRef.current.value === "All") {
            const res = await axios.post(endPoints.historial.pagination(pagination, limit), { almacenes: almacenByUser });
            setTotal(res.data.total);
            setHistorial(res.data.data)
        } else {
            const almacenes = almacenByUser.filter(almacen => almacen.nombre === almacenRef.current.value);
            const res = await axios.post(endPoints.historial.pagination(pagination, limit), { almacenes: almacenes });
            setTotal(res.data.total);
            setHistorial(res.data.data)
        }
    }

    const onBuscar = () => {
        listarItems()
    }

    return (
        <>
            <Container >
                <div>
                    <h2>Informe de movimientos</h2>
                    <div className="line"></div>
                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Almacen</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    ref={almacenRef}
                                >
                                    <option>All</option>
                                    {almacenByUser.map(almacen => (
                                        <option key={almacen.consecutivo} >{almacen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {false && <span>
                            <div className={styles.grupo}>
                                <label htmlFor="Username">Categoría</label>
                                <div>
                                    <select className="form-select form-select-sm" disabled>
                                        <option>All</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="Username">Movimiento</label>
                                <div>
                                    <select
                                        className="form-select form-select-sm"
                                        disabled>
                                        <option>All</option>
                                        <option>Recepción</option>
                                        <option>Ajuste</option>
                                        <option>Devolución</option>
                                        <option>Liquidación</option>
                                        <option>Exportación</option>
                                    </select>
                                </div>
                            </div>


                            <div className={styles.grupo}>
                                <label htmlFor="Username">Artículo</label>
                                <div>
                                    <input type="text"
                                        className="form-control form-control-sm"
                                        id="contraseña"
                                        disabled></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="Username">Semana</label>
                                <div>
                                    <input type="number"
                                        className="form-control form-control-sm"
                                        id="contraseña"
                                        disabled></input>
                                </div>
                            </div>
                        </span>}
                        <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                            Buscar
                        </Button>
                    </div>
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

