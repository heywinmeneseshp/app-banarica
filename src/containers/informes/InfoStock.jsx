import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
//Services
import endPoints from "@services/api";
//Hooks
import { useAuth } from "@hooks/useAuth";
//Bootstrap
import Table from 'react-bootstrap/Table';
import { Button } from "react-bootstrap";
import { Container } from "react-bootstrap";
//Components
import Paginacion from "@components/Paginacion";
//CSS
import styles from '@styles/informes/informes.module.css';
export default function InfoStock() {
    const almacenRef = useRef();
    const { almacenByUser } = useAuth();
    const [stock, setStock] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;


    useEffect(() => {
        try {
            listar()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    async function listar() {
        const almacen = almacenRef.current.value;
        if (almacen === "All") {
            const res = await axios.post(endPoints.stock.pagination(pagination, limit), { almacenes: almacenByUser });
            setTotal(res.data.total);
            setStock(res.data.data);
        } else {
            const almacenes = almacenByUser.filter(almacen => almacen.nombre === almacenRef.current.value);
            const res = await axios.post(endPoints.stock.pagination(pagination, limit), { almacenes: almacenes });
            setTotal(res.data.total);
            setStock(res.data.data);
        }
    }

    const onBuscar = () => {
        listar()
    }

    const onDescargar = () => {
        alert("Esta opción no esta habilitada")
    }

    return (
        <>
            <Container >
                <h2>Stock</h2>
                <div className="line"></div>

                <div className={styles.contenedor3}>

                    <div className={styles.grupo}>
                        <label htmlFor="alamcen">Almacen</label>
                        <select
                            className="form-select form-select-sm"
                            id="almacen"
                            name="almacen"
                            ref={almacenRef}
                        >
                            <option>All</option>
                            {almacenByUser.map((almacen, index) => (
                                <option key={index} >{almacen.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.grupo}>
                        <label htmlFor="Username">Categoría</label>
                        <div>
                            <select className="form-select form-select-sm" disabled>
                                <option>All</option>
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

                    <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                        Buscar
                    </Button>

                    <Button onClick={onDescargar} className={styles.button} variant="success" size="sm">
                        Descargar documento
                    </Button>

                </div>

                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cod. Al</th>
                            <th>Almacen</th>
                            <th>Cod. Cat</th>
                            <th>Cod. Art</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.map((item, index) => (
                            <tr key={index}>
                                <td>{item?.cons_almacen}</td>
                                <td>{item?.almacen?.nombre}</td>
                                <td>{item?.producto?.cons_categoria}</td>
                                <td>{item?.cons_producto}</td>
                                <td>{item?.producto?.name}</td>
                                <td>{item?.cantidad}</td>
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

