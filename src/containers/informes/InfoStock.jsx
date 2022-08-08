import React, { useState, useEffect } from "react";
import axios from "axios";
//Services
import endPoints from "@services/api";


//Bootstrap
import Table from 'react-bootstrap/Table';
import { Button } from "react-bootstrap";
import { Container } from "react-bootstrap";
//Components
import Paginacion from "@components/Paginacion";
//CSS
import styles from '@styles/informes/informes.module.css';
export default function InfoStock() {
    const [stock, setStock] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;


    useEffect(() => {
        async function listarUsurios() {
            const res = await axios.get(endPoints.stock.pagination(pagination, limit));
            const total = await axios.get(endPoints.stock.list);
            setTotal(total.data.length);
            setStock(res.data.reverse())
        }
        try {
            listarUsurios()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    const data = {
        cod_almacen: "504",
        cod_producto: "001",
        producto: "Tapa OT 18KG",
        categoria: "Carton",
        cantidad: 1116,
        costo_unidad: 3400
    }

    return (
        <>
            <Container >
                <h2>Stock</h2>
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

                    <Button className={styles.button} variant="primary" size="sm">
                        Buscar
                    </Button>

                    <Button className={styles.button} variant="success" size="sm">
                        Descargar documento
                    </Button>

                </div>

                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Almacen</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
            
                        </tr>
                    </thead>
                    <tbody>
                    {stock.map((item, index) => (
                        <tr key={index}>
                            <td>{item.cons_almacen}</td>
                            <td>{item.cons_producto}</td>
                            <td>{item.cantidad}</td>
                 
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

