import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import * as XLSX from 'xlsx'
//Services
import endPoints from "@services/api";
import { listarProductos } from "@services/api/productos";
import { listarCategorias } from "@services/api/categorias";
//Hooks
import { useAuth } from "@hooks/useAuth";
import useDate from "@hooks/useDate";
//Bootstrap
import Table from 'react-bootstrap/Table';
import { Button } from "react-bootstrap";
import { Container } from "react-bootstrap";
//Components
import Paginacion from "@components/Paginacion";
//CSS
import styles from '@styles/informes/informes.module.css';

export default function InfoStock() {
    const formRef = useRef();
    const { almacenByUser } = useAuth();
    const [stock, setStock] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [categorias, setCategorias] = useState([])
    const [productos, setProductos] = useState([])
    const limit = 20;


    useEffect(() => {
        try {
            listar()
            listarCategorias().then((res) => setCategorias(res))
            listarProductos().then((res) => setProductos(res))
        } catch (e) {
            alert("Error al cargar items", "error")
        }
    }, [alert, pagination])

    async function listar() {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        const cons_producto = formData.get('articulo')
        let body = { pagination: { offset: pagination, limit: limit } }
        if (cons_almacen != 0) {
            body = { ...body, stock: { cons_almacen: cons_almacen } }
        } else {
            const list = almacenByUser.map((item) => item.consecutivo)
            body = { ...body, stock: { cons_almacen: list } }
        }
        if (cons_categoria != 0) body = { ...body, producto: { cons_categoria: cons_categoria } }
        if (cons_producto != 0) body.stock = { ...body.stock, cons_producto: cons_producto }
        const res = await axios.post(endPoints.stock.filter, body);
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
        const cons_producto = formData.get('articulo')
        let body = {}
        if (cons_almacen != 0) {
            body = { ...body, stock: { cons_almacen: cons_almacen } }
        } else {
            const list = almacenByUser.map((item) => item.consecutivo)
            body = { ...body, stock: { cons_almacen: list } }
        }
        if (cons_categoria != 0) body = { ...body, producto: { cons_categoria: cons_categoria } }
        if (cons_producto != 0) body.producto = { ...body.producto, consecutivo: cons_producto }
        const { data } = await axios.post(endPoints.stock.filter, body);
        const newData = data.map((item) => {
            return {
                "Cod almacen": item.cons_almacen,
                "Almacen": item.almacen?.nombre,
                "Cod categoria": item.producto.cons_categoria,
                "Cod artículo": item.cons_producto,
                "Artículo": item.producto.name,
                "Cantidad": item.cantidad
            }
        })
        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData)
        XLSX.utils.book_append_sheet(book, sheet, "Stock")
        XLSX.writeFile(book, `Stock ${cons_almacen == 0 ? "" : cons_almacen} ${useDate()}.xlsx`)
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

                    <div className={styles.grupo}>
                        <label htmlFor="articulo">Artículo</label>
                        <div>
                            <select className="form-select form-select-sm"
                                id="articulo"
                                name="articulo"
                            >
                                <option value={0}>All</option>
                                {productos.map(item => (
                                    <option value={item?.consecutivo}>{item?.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button onClick={onBuscar} className={styles.button} variant="primary" size="sm">
                        Buscar
                    </Button>

                    <Button onClick={onDescargar} className={styles.button} variant="success" size="sm">
                        Descargar Exel
                    </Button>

                 {false &&   <Link href="./documentos/StockPDF" className={styles.button} variant="success" size="sm">
                        <a target="_blank" rel="noopener noreferrer">
                            Descargar PDF
                        </a>
                    </Link>}

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

