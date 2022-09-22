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


export default function InfoPedidos() {
    const formRef = useRef();
    const { user, almacenByUser } = useAuth();
    const [pedidos, setPedidos] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        async function listarItems() {
            const res = await axios.get(endPoints.pedidos.pagination(pagination, limit));
            setTotal(res.data.total);
            setPedidos(res.data.data);
        }
        try {
            listarItems()
        } catch (e) {
            alert("Error al cargar los usuarios", "error")
        }
    }, [alert, pagination])

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
                                name="almacen">
                                    <option>All</option>
                                    {almacenByUser.map((almacen, index) => (
                                        <option key={index}>{almacen.nombre}</option>
                                    ))}

                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="categoria">Categoría</label>
                            <div>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    id="categoria"
                                    name="categoria"
                                    ></input>
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
                                    ></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="Username">Semana</label>
                            <div>
                                <input type="number" className="form-control form-control-sm" id="contraseña"></input>
                            </div>
                        </div>

                        <Button className={styles.button} variant="success" size="sm">
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
                        {(user.id_rol == "Super administrador") &&
                            <Button className={styles.button} variant="warning" size="sm">
                                Editar pedido
                            </Button>
                        }

                        <Button onClick={onDescargar} className={styles.button} variant="warning" size="sm">
                            Descargar PDF
                        </Button>

                    </div>
                </form>

                <Table className={styles.tabla} striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cons.</th>
                            <th>Cod</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
                            <th>Destino</th>
                            <th>Semana</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map((pedido, index) => (
                            <tr key={index}>
                                <td>{pedido?.cons_pedido}</td>
                                <td>{pedido?.cons_producto}</td>
                                <td>{pedido?.producto?.name}</td>
                                <td>{pedido?.cantidad}</td>
                                <td>{pedido?.almacen?.nombre}</td>
                                <td>{pedido?.tabla?.cons_semana}</td>
                                <td>{pedido?.tabla?.fecha}</td>
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


