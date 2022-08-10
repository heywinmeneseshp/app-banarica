import React, { useState, useEffect, useRef, useContext } from "react";
import AppContext from "@context/AppContext";
//Services
import { listarProductos } from "@services/api/productos";
import { sumar } from "@services/api/stock";
import { agregarRecepcion } from "@services/api/recepcion";
import { agregarHistorial } from "@services/api/historialMovimientos";
import { agregarNotificaciones } from "@services/api/notificaciones";
//Hooks
import useDate from "@hooks/useDate";
import useAlert from "@hooks/useAlert";
import generarSemana from "@hooks/useSemana";
import { useAuth } from "@hooks/useAuth";
//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import { Alert } from "react-bootstrap";
//Components
import Alertas from "@assets/Alertas";
//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Recepcion() {
    const { gestionNotificacion } = useContext(AppContext);
    const formRef = useRef(null);
    const { almacenByUser } = useAuth();
    const [products, setProducts] = useState([1]);
    const [productos, setProductos] = useState([]);
    const [bool, setBool] = useState(false);
    const [date, setDate] = useState(null);
    const [prodcuctsCons, setProductsCons] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [consAlmacen, setConsAlmacen] = useState(null);
    const [consecutivo, setConsecutivo] = useState(null);

    let styleBoton = { color: "success", text: "Cargar artículos" };
    if (bool) styleBoton = { color: "warning", text: "Modificar recepción" };

    useEffect(() => {
        async function listrasItems() {
            if (!gestionNotificacion.notificacion) {
                listarProductos().then(res => {
                    setProductos(res);
                })
                setDate(useDate());
            } else {
                setConsAlmacen(gestionNotificacion.notificacion.almacen_emisor);
                setConsecutivo(gestionNotificacion.notificacion.cons_movimiento);
            }
        }
        try {
            listrasItems()
        } catch (e) {
            alert("Error al cargar los productos");
        }
    }, [bool])

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    function removeProduct() {
        const array = products.slice(0, -1)
        setProducts(array);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(formRef.current);
            const almacen = formData.get("almacen")
            const pedido = formData.get("pedido");
            setConsAlmacen(almacen);
            const week = formData.get("semana");
            const semanaR = generarSemana(week);
            const body = {
                remision: formData.get("remision"),
                fecha: formData.get("fecha"),
                cons_semana: semanaR,
                observaciones: formData.get("observaciones")
            }
            agregarRecepcion(body).then((res) => {
                const consMovimiento = res.data.consecutivo;
                setConsecutivo(consMovimiento)
                let array = []
                products.map((product, index) => {
                    const consecutiveProdcut = productos.find(producto => producto.name == formData.get(`producto-${index}`)).consecutivo
                    let dataPedido = {
                        cons_producto: consecutiveProdcut,
                        cons_almacen_destino: almacen,
                        cantidad: formData.get("cantidad-" + index)
                    }
                    const dataHistorial = {
                        cons_movimiento: consMovimiento,
                        cons_producto: consecutiveProdcut,
                        cons_almacen_gestor: almacen,
                        cons_almacen_receptor: almacen,
                        cons_lista_movimientos: "RC",
                        tipo_movimiento: "Entrada",
                        cantidad: formData.get("cantidad-" + index),
                        cons_pedido: pedido
                    }
                    sumar(almacen, consecutiveProdcut, formData.get("cantidad-" + index));
                    agregarHistorial(dataHistorial)
                    array.push(dataPedido)
                })
                const dataNotificacion = {
                    almacen_emisor: almacen,
                    almacen_receptor: "BRC",
                    cons_movimiento: consMovimiento,
                    tipo_movimiento: "Recepcion",
                    descripcion: "realizada",
                    aprobado: true,
                    visto: false
                }
                agregarNotificaciones(dataNotificacion).then(res => console.log(res))
                setProductsCons(array)
            })
            setBool(true)
            setAlert({
                active: true,
                mensaje: "Se han cargado los datos con éxito",
                color: "success",
                autoClose: false
            })
        } catch (e) {
            setAlert({
                active: true,
                mensaje: "Error al cargar datos",
                color: "danger",
                autoClose: false
            })
        }
    }
    return (
        <>
            <form ref={formRef} onSubmit={handleSubmit}>
                <Container className={styles.contenedorPadre}>

                    <Alert className={styles.alert} key="warning" variant="warning">
                        <div className={styles.alertText} >Pedido No. <b>001028</b> pendiente por recibir</div>
                        <button type="button" className="btn btn-success btn-sm">Ver pedido</button>
                    </Alert>

                    <h2>+ Recepción de artículos</h2>

                    <div className={styles.contenedor8}>

                    <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="consecutivo"
                                name="consecutivo"
                                disabled
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                            <Form.Select
                                id="almacen"
                                name="almacen"
                                className={styles.select}
                                size="sm" disabled={bool}>
                                {!bool && almacenByUser.map((item, index) => (
                                    <option key={index}>{item.consecutivo}</option>
                                ))}
                                {bool && <option>{consAlmacen}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Remisión</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="remision"
                                name="remision"
                                required
                                disabled={bool}
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Pedido</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="pedido"
                                name="pedido"
                                required
                                disabled={bool}
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Fecha</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="fecha"
                                name="fecha"
                                type="date"
                                className={styles.fecha}
                                defaultValue={date}
                                disabled={bool}
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="semana"
                                name="semana"
                                type="number"
                                required
                                disabled={bool}
                            />
                        </InputGroup>


                    </div>

                    <div className={styles.line}></div>
                    {products.map((item, key) => (
                        <div item={item} key={key}>
                            <div className={styles.contenedor2} >

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                                    <Form.Control
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        disabled
                                        id={`producto-${key}`}
                                        name={`producto-${key}`}
                                        defaultValue={prodcuctsCons[key]?.cons_producto}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={bool}>
                                        {productos.map((item, index) => {
                                            return <option key={index}>{item.name}</option>
                                        })}
                                    </Form.Select>
                                </InputGroup>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Cantidad</InputGroup.Text>
                                    <Form.Control
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        type="number"
                                        id={"cantidad-" + key}
                                        name={"cantidad-" + key}
                                        disabled={bool}
                                        required
                                    />

                                </InputGroup>
                            </div>
                        </div>
                    ))}
                    <div>
                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="observaciones"
                                name="observaciones"
                                disabled={bool}
                            />
                        </InputGroup>
                    </div>

                    {!bool &&
                        <div className={styles.contenedor6}>
                            <div>
                                <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                                    Agregar artículo
                                </Button>
                            </div>
                            <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                                Remover artículo
                            </Button>
                            <div>
                            </div>

                            <div></div>
                            <div>
                                <Button type='submit' className={styles.button} variant={!bool ? "success" : "warning"} size="sm">
                                    {!bool ? "Cargar artículos" : "Modificar recepción"}
                                </Button>
                            </div>


                        </div>
                    }
                    <div className={styles.line}></div>
                    <Alertas alert={alert} handleClose={toogleAlert} />
                </Container>
            </form>
        </>
    );
}