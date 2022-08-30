import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from 'xlsx'
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
import { listarCategorias } from "@services/api/categorias";
export default function InfoStock() {
    const formRef = useRef();
    const { almacenByUser } = useAuth();
    const [stock, setStock] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [categorias, setCategorias] = useState([])
    const limit = 20;


    useEffect(() => {
        try {
            listar()
            listarCategorias().then((res) => setCategorias(res))
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

    async function listar() {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        let body = { pagination: { offset: pagination, limit: limit } }
        if (cons_almacen != 0) {
            body = { ...body, stock: { cons_almacen: cons_almacen } }
        } else {
            const list = almacenByUser.map((item) => item.consecutivo)
            console.log(list)
            body = { ...body, stock: { cons_almacen: list } } 
        }
        if (cons_categoria != 0) body = { ...body, producto: { cons_categoria: cons_categoria } }
        console.log(body)
        const res = await axios.post(endPoints.stock.filter, body);
        console.log(res.data)
        setTotal(res.data.total);
        setStock(res.data.data);
    }

    const onBuscar = () => {
        setPagination(1)
        listar()
    }

    const onDescargar = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        let body = {}
        if (cons_almacen != 0) {
            body = { ...body, stock: { cons_almacen: cons_almacen } }
        } else {
            const list = almacenByUser.map((item) => item.consecutivo)
            body = { ...body, stock: { cons_almacen: list } } 
        }
        if (cons_categoria != 0) body = { ...body, producto: { cons_categoria: cons_categoria } }
        const res = await axios.post(endPoints.stock.filter, body);
        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(res.data)
        XLSX.utils.book_append_sheet(book, sheet, "Stock")
        XLSX.writeFile(book, "Stock.xlsx")
    }

    return (
        <>
            <Container >
                <h2>Stock</h2>
                <div className="line"></div>

                <form ref={formRef} className={styles.contenedor3}>

                    <div className={styles.grupo}>
                        <label htmlFor="alamcen">Almacen</label>
                        <select
                            className="form-select form-select-sm"
                            id="almacen"
                            name="almacen"
                        >
                            <option value={0}>All</option>
                            {almacenByUser.map((almacen, index) => (
                                <option key={index} value={almacen.consecutivo}>{almacen.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.grupo}>
                        <label htmlFor="categoria">Categoría</label>
                        <div>
                            <select className="form-select form-select-sm"
                                id="categoria"
                                name="categoria"
                            >
                                <option value={0}>All</option>
                                {categorias.map(item => (
                                    <option value={item?.consecutivo}>{item?.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                        Buscar
                    </Button>

                    <Button onClick={onDescargar} className={styles.button} variant="success" size="sm">
                        Descargar documento
                    </Button>

                </form>

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

