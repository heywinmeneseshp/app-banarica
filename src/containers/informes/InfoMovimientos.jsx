import React, { useEffect, useState } from "react";
import axios from "axios";
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
    const [historial, setHistorial] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        async function listarItems() {
            const res = await axios.get(endPoints.historial.pagination(pagination, limit));
            const total = await axios.get(endPoints.historial.list);
            setTotal(total.data.length);
            setHistorial(res.data.reverse())
        }
        try {
            listarItems()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    return (
        <>
            <Container >
                <div>
                    <h2>Informe de movimientos</h2>
                    <div className="line"></div>
                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Almacen</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    <option>All</option>
                                    <option>Macondo</option>
                                    <option>Maria Luisa</option>
                                    <option>Lucia</option>
                                    <option>Florida</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Categoría</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    <option>All</option>
                                    <option>Cartón</option>
                                    <option>Insumos</option>
                                    <option>Papelería</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Artículo</label>
                            <div>
                                <input type="text" className="form-control form-control-sm" id="contraseña"></input>
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
                            <label htmlFor="Username">Movimiento</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    <option>All</option>
                                    <option>Recepción</option>
                                    <option>Ajuste</option>
                                    <option>Devolución</option>
                                    <option>Liquidación</option>
                                    <option>Exportación</option>
                                </select>
                            </div>
                        </div>

                        <Button className={styles.button} variant="success" size="sm">
                            Descargar
                        </Button>
                    </div>
                </div>


                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons</th>
                            <th>Almacen</th>
                            <th>Artículo</th>
                            <th>Unidades</th>
                            <th>Tipo Movimiento</th>
                            <th>Movimiento</th>
                            <th>Motivo</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historial.map((item, index) => (
                            <tr key={index}>
                                <td>{item?.cons_movimiento}</td>
                                <td>{item?.cons_almacen_gestor}</td>
                                <td>{item?.cons_producto}</td>
                                <td>{item?.cantidad}</td>
                                <td>{item?.cons_lista_movimientos}</td>
                                <td>{item?.tipo_movimiento}</td>
                                <td>{item?.razon_movimiento}</td>
                                <td>{item?.updatedAt}</td>
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

