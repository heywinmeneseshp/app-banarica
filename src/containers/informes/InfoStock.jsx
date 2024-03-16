import React, { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import editarPick from '@public/images/editar.png';
import guardarPick from '@public/images/guardar.png';
import Link from "next/link";
import axios from "axios";
import * as XLSX from 'xlsx';
//Services
import endPoints from "@services/api";
import { listarCategorias } from "@services/api/categorias";
import { actualizarNoDisponibles, filtradoGeneralStock } from "@services/api/stock";
//Hooks
import { useAuth } from "@hooks/useAuth";
import dateUse from "@hooks/useDate";
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
    const formEdit = useRef();
    const { almacenByUser, user } = useAuth();
    const [stock, setStock] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [categorias, setCategorias] = useState([]);
    const [bools, setBools] = useState([]);
    const limit = 20;


    useEffect(() => {
        try {
            listarCategorias().then((res) => {
                if (user.id_rol == "Super seguridad" || user.id_rol == "Seguridad") {
                    setCategorias(res.filter(item => item.nombre == "Seguridad"));
                } else {
                    setCategorias(res);
                }
            });
            listar();
        } catch (e) {
            alert("Error al cargar items", "error");
        }
    }, [alert, pagination, setStock]);

    async function listar() {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_cat_rol = user.id_rol == "Seguridad" || user.id_rol == "Super seguridad" ? await listarCategorias() : false;
        const cons_categoria = cons_cat_rol ? cons_cat_rol.find(item => item.nombre == "Seguridad").consecutivo : formData.get('categoria');
        const product_name = formData.get('articulo');
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
        };
        if (cons_almacen == 0) body.almacen.consecutivo = almacenByUser.map(item => item.consecutivo);
        const res = await filtradoGeneralStock(body);
        setTotal(res.total);
        setStock(res.data);
        setBools(new Array(res.data.length).fill(false));

    }

    const onBuscar = () => {
        setPagination(1);
        listar();
    };

    const onDescargarPDF = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        if (cons_almacen == 0) return alert("Por favor, seleccione un almacen");
        if (cons_categoria == "") return alert("Por favor, seleccione una categoria");
        window.open(endPoints.document.stock(cons_almacen, cons_categoria));
    };

    const onDescargarExcel = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_categoria = formData.get('categoria');
        const cons_producto = formData.get('articulo');
        let body = {
            "producto": {
                "name": cons_producto,
                "cons_categoria": cons_categoria
            },
            "almacen": {
                "consecutivo": cons_almacen
            }
        };
        if (cons_almacen == 0) body.almacen.consecutivo = almacenByUser.map(item => item.consecutivo);
        const { data } = await axios.post(endPoints.stock.filter, body);
        const newData = data.map((item) => {
            return {
                "Cod almacen": item.cons_almacen,
                "Almacen": item.almacen?.nombre,
                "Cod categoria": item.producto.cons_categoria,
                "Cod artículo": item.cons_producto,
                "Artículo": item.producto.name,
                "No disponible": item?.no_disponible || 0,
                "Disponible": item.cantidad - (item?.no_disponible || 0),
                "Cantidad Total": item.cantidad
            };
        });
        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData);
        XLSX.utils.book_append_sheet(book, sheet, "Stock");
        XLSX.writeFile(book, `Stock ${cons_almacen == 0 ? "" : cons_almacen} ${dateUse()}.xlsx`);
    };

    const editarNoDisponible = async (index, cons_almacen, cons_producto) => {
        let newBools = [...bools];
        if (newBools[index] == true) {
            try {
                const formData = new FormData(formEdit.current);
                const no_disponible = formData.get(`no-disponible-${index}`);
                await actualizarNoDisponibles(cons_almacen, cons_producto, parseFloat(no_disponible));
                let newStock = [...stock];
                newStock[index] = { ...newStock[index], no_disponible: no_disponible };
                setStock(newStock);
            }
            catch {
                window.alert("Se ha presentado un error al guardar no disponibles");
            }
        }
        newBools[index] = !newBools[index];
        setBools(newBools);
    };

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
                                onChange={onBuscar}
                            >
                                {!(user.id_rol == "Seguridad" || user.id_rol == "Super seguridad") &&
                                    <option value={""}>All</option>
                                }

                                {categorias.map((item, index) => (
                                    <option key={index} value={item?.consecutivo}>{item?.nombre}</option>
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
                                               Descargar PDF
                        </Link>}

                </form>

                <form ref={formEdit}>
                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr >
                            <th>Cod. Al</th>
                            <th className={styles.display}>Almacén</th>
                            <th>Cod. Cat</th>
                            <th>Cod. Art</th>
                            <th>Artículo</th>
                            <th className="col-1">No disponible</th>
                            <th>Disponible</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.map((item, index) => {
                            console.log(bools[index]);
                            return (
                                <tr key={index}>
                                    <td>{item?.cons_almacen}</td>
                                    <td className={styles.display}>{item?.almacen?.nombre}</td>
                                    <td>{item?.producto?.cons_categoria}</td>
                                    <td>{item?.cons_producto}</td>
                                    <td>{item?.producto?.name}</td>
                                    {!bools[index] && <td className={styles.no_diponible} >
                                        <span>{item?.no_disponible || 0}</span>
                                        <span>
                                            <Image onClick={() => editarNoDisponible(index)} className={styles.imagenEditar} width="20" height="20" src={editarPick} alt="editar" />
                                        </span>
                                    </td>}
                                    {bools[index] && < td className={styles.no_diponible}>
                                        <input
                                            id={`no-disponible-${index}`}
                                            name={`no-disponible-${index}`}
                                            type="number"
                                            defaultValue={item?.no_disponible || 0}
                                            required
                                            className={styles.inputEditar}
                                        ></input>
                                        <span>
                                            <Image onClick={() => editarNoDisponible(index, item?.cons_almacen, item?.cons_producto)} className={styles.imagenEditar} width="20" height="20" src={guardarPick} alt="editar" />
                                        </span>
                                    </td>}
                                    <td>{item?.cantidad - item?.no_disponible || 0 }</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                </form>

                

                <div className={styles.pagination}>
                    <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                </div>

            </Container>
        </>
    );
}

