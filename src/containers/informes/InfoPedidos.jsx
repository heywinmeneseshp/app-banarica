import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
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
import { filtrarPedidos } from "@services/api/pedidos";
import { listarCategorias } from "@services/api/categorias";
import useExcel from "@hooks/useExcel";
import useDate from "@hooks/useDate";


export default function InfoPedidos() {
    const formRef = useRef();
    const { almacenByUser } = useAuth();
    const [pedidos, setPedidos] = useState([1]);
    const [categorias, setCategorias] = useState([])
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        try {
            listarCategorias().then(res => setCategorias(res))
            listarItems(pagination, limit)


        } catch (e) {
            alert("Error al cargar los pedidos en la tabla", "error")
        }
    }, [pagination])

    const listarItems = async (page, limit) => {
        const formData = new FormData(formRef.current)
        const categoria = formData.get("categoria")
        const producto = formData.get("articulo")
        const semana = formData.get("semana")
        let almacen = formData.get("almacen")
        if (almacen == "All") almacen = almacenByUser.map(item => item.consecutivo)
        if (page && limit) {
            const { total, data } = await filtrarPedidos(page, limit, almacen, categoria, producto, semana)
            setTotal(total)
            setPedidos(data)
        } else {
            return await filtrarPedidos(null, null, almacen, categoria, producto, semana)
        }
    }

    const onDescargar = async () => {
        const formData = new FormData(formRef.current)
        const consecutivo = formData.get("consecutivo")
        axios.post(endPoints.document.pedido, { consecutivo: consecutivo })
            .then(() => axios.get(endPoints.document.pedido, { responseType: 'blob' }))
            .then((res) => {
                const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
                saveAs(pdfBlob, `Pedido ${consecutivo}.pdf`);
            })
    }

    const onDescargarExcel = async () => {
        const data = await listarItems()
        const newData = data.map(item => {
            return {
                "Consecutivo": item?.tabla?.consecutivo,
                "Destino": item?.cons_almacen_destino,
                "Cod": item?.cons_producto,
                "Artículo": item?.producto?.name,
                "Cantidad": item?.cantidad,
                "Semana": item?.tabla.cons_semana,
                "Fecha": item?.tabla?.fecha,
                "Estado": item?.tabla?.pendiente ? "Abierto" : "Cerrado",
                "Realizado por": item?.tabla?.usuario
            }
        })
        useExcel(newData,"Pedidos", `Historial de pedidos`)
    }

    return (
        <>

            <Container>
                <h2>Informe de pedidos</h2>
                <div className="line"></div>
                <form ref={formRef}>

                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Almacen</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id="almacen"
                                    name="almacen"
                                    onChange={() => listarItems(1, limit)}
                                >
                                    <option value="All">All</option>
                                    {almacenByUser.map((almacen, index) => (
                                        <option value={almacen.consecutivo} key={index}>{almacen.nombre}</option>
                                    ))}

                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="categoria">Categoría</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id="categoria"
                                    name="categoria"
                                    onChange={() => listarItems(1, limit)}
                                >
                                    <option value="">All</option>
                                    {categorias.map((categoria, index) => (
                                        <option value={categoria.consecutivo} key={index}>{categoria.nombre}</option>
                                    ))}

                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="articulo">Artículo</label>
                            <div>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    id="articulo"
                                    name="articulo"
                                    onChange={() => listarItems(1, limit)}
                                ></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="semana">Semana</label>
                            <div>
                                <input
                                    id="semana"
                                    name="semana"
                                    type="number"
                                    onChange={() => listarItems(1, limit)}
                                    className="form-control form-control-sm" ></input>
                            </div>
                        </div>

                        <Button 
                        className={styles.button} 
                        variant="success" 
                        size="sm"
                        onClick={onDescargarExcel}>
                            Descargar Excel
                        </Button>

                    </div>


                    <div className={styles.contenedor3}>

                        <div className={styles.grupo}>
                            <label htmlFor="consecutivo">Consecutivo</label>
                            <div>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    id="consecutivo"
                                    name="consecutivo"
                                ></input>
                            </div>
                        </div>

                        <Button onClick={onDescargar} className={styles.button} variant="warning" size="sm">
                            Descargar PDF
                        </Button>

                    </div>
                </form>

                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons.</th>
                            <th className={styles.display}>Cod.</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
                            <th>Destino</th>
                            <th>Semana</th>
                            <th className={styles.display}>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map((pedido, index) => (
                            <tr key={index}>
                                <td>{pedido?.cons_pedido}</td>
                                <td className={styles.display}>{pedido?.cons_producto}</td>
                                <td>{pedido?.producto?.name}</td>
                                <td>{pedido?.cantidad}</td>
                                <td>{pedido?.almacen?.nombre}</td>
                                <td>{pedido?.tabla?.cons_semana}</td>
                                <td className={styles.display}>{pedido?.tabla?.fecha}</td>
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


