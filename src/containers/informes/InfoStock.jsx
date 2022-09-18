import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import * as XLSX from 'xlsx'
//Services
import endPoints from "@services/api";
import { listarCategorias } from "@services/api/categorias";
import { filtradoGeneralStock } from "@services/api/stock";
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
    const limit = 20;


    useEffect(() => {
        try {
            listar()
            listarCategorias().then((res) => setCategorias(res))
        } catch (e) {
            alert("Error al cargar items", "error")
        }
    }, [alert, pagination])

    async function listar() {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        const product_name = formData.get('articulo')
        let body = {
            "producto": {
                "name": product_name || "",
                "cons_categoria": cons_categoria
            },
            "almacen": {
                "consecutivo": cons_almacen
            },
            "pagination": {
                "offset": pagination,
                "limit": limit
            }
        }
        if (cons_almacen == 0) body.almacen.consecutivo = almacenByUser.map(item => item.consecutivo)
        const res = await filtradoGeneralStock(body)
        setTotal(res.total);
        setStock(res.data);
    }

    const onBuscar = () => {
        setPagination(1)
        listar()
    }

    const onDescargarPDF = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        const product_name = formData.get('articulo')
        let body = {
            "stock": {
                "isBlock": false
            },
            "producto": {
                "name": product_name,
                "cons_categoria": cons_categoria
            },
            "almacen": {
                "consecutivo": cons_almacen
            }
        }
        if (cons_almacen == 0) return alert("Por favor, seleccione un almacen")
        if (cons_categoria == "") return alert("Por favor, seleccione una categoria")
        axios.post(endPoints.document.stock, body)
            .then(() => axios.get(endPoints.document.pedido, { responseType: 'blob' }))
            .then((res) => {
                const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
                saveAs(pdfBlob, `Stock ${cons_almacen} ${useDate()}.pdf`);
            })

    }

    const onDescargarExcel = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        const cons_producto = formData.get('articulo')
        let body = {
            "producto": {
                "name": cons_producto,
                "cons_categoria": cons_categoria
            },
            "almacen": {
                "consecutivo": cons_almacen
            }
        }
        if (cons_almacen == 0) body.almacen.consecutivo = almacenByUser.map(item => item.consecutivo)
        console.log(body)
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
                            onClick={onBuscar}
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
                                onClick={onBuscar}
                            >
                                <option value={""}>All</option>
                                {categorias.map(item => (
                                    <option value={item?.consecutivo}>{item?.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.grupo}>
                        <label htmlFor="articulo">Artículo</label>
                        <div>
                            <input onChange={onBuscar} type="text"
                                className="form-control form-control-sm"
                                id="articulo"
                                name='articulo'
                            ></input>
                        </div>
                    </div>

                    <Button onClick={onDescargarPDF} className={styles.button} variant="warning" size="sm">
                        Descargar PDF
                    </Button>

                    <Button onClick={onDescargarExcel} className={styles.button} variant="success" size="sm">
                        Descargar Excel
                    </Button>

                    {false && <Link href="./documentos/StockPDF" className={styles.button} variant="success" size="sm">
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

