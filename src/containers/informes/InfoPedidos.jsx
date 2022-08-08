import React, { useEffect, useState } from "react";
import axios from "axios";
//Services
import endPoints from "@services/api";
//Hooks
import { useAuth } from "@hooks/useAuth";
//Components
import Paginacion from "@components/Paginacion";
//Bootstrap
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";


export default function InfoPedidos() {
    const { user, almacenByUser } = useAuth();
    const [pedidos, setPedidos] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        async function listarItems() {
            const res = await axios.get(endPoints.pedidos.pagination(pagination, limit));
            const total = await axios.get(endPoints.pedidos.list);
            setTotal(total.data.length);
            setPedidos(total.data.reverse());
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
                <h2>Informe de pedidos</h2>
                <div className="line"></div>
                <div>

                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Almacen</label>
                            <div>
                                <select className="form-select form-select-sm">
                                    <option>All</option>
                                    {almacenByUser.map(almacen => (
                                        <option>{almacen.nombre}</option>
                                    ))}

                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Semana</label>
                            <div>
                                <input type="number" className="form-control form-control-sm" id="contraseña"></input>
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


                        <Button className={styles.button} variant="primary" size="sm">
                            Buscar
                        </Button>

                    </div>


                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Consecutivo</label>
                            <div>
                                <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                            </div>
                        </div>
                        {(user.id_rol == "Super administrador") &&
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
                            <th>Artículo</th>
                            <th>Cantidad</th>
                            <th>Destino</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map((pedido, index) => (
                            <tr key={index}>
                                <td>{pedido.cons_pedido}</td>
                                <td>{pedido.cons_producto}</td>
                                <td>{pedido.cantidad}</td>
                                <td>{pedido.cons_almacen_destino}</td>
                                <td>{pedido.updatedAt}</td>
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

