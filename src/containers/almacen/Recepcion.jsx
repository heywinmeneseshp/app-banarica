import React, { useState, useEffect, useRef, useContext } from "react";
import AppContext from "@context/AppContext";
//Services
import { filtrarProductos } from "@services/api/productos";
import { sumar } from "@services/api/stock";
import { agregarRecepcion } from "@services/api/recepcion";
import { agregarHistorial, filterHistorial } from "@services/api/historialMovimientos";
import { agregarNotificaciones, filtrarNotificaciones } from "@services/api/notificaciones";
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
//Components
import Alertas from "@assets/Alertas";
import AlertaPedido from "@assets/AlertaPedido";
//CSS
import styles from "@styles/almacen/almacen.module.css";
import { encontrarModulo } from "@services/api/configuracion";

export default function Recepcion({ movimiento }) {
    const formRef = useRef(null);
    const { almacenByUser, user } = useAuth();
    const [products, setProducts] = useState([1]);
    const [productos, setProductos] = useState([]);
    const [bool, setBool] = useState(false);
    const [date, setDate] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [consAlmacen, setConsAlmacen] = useState(null);
    const [consecutivo, setConsecutivo] = useState(null);
    const [semana, setSemana] = useState(null);
    const [observaciones, setObservaciones] = useState(null);
    const [remision, setRemision] = useState(null);
    const [pedido, setPedido] = useState(null);
    const [notificaciones, setNotificaciones] = useState([]);
    const [change, setChange] = useState(false);
    const [semanaActual, setSemanaActual] = useState(null);

    useEffect(() => {
        async function listrasItems() {
            const almacenes = almacenByUser.map(item => item.consecutivo);
            const notiData = {
                "almacen_receptor": almacenes,
                "tipo_movimiento": "Pedido",
                "aprobado": false
            };
            const result = await filtrarNotificaciones(notiData);
            setNotificaciones(result);
            if (!movimiento) {
                const data = { "stock": { "isBlock": false, "cons_almacen": almacenes } };
                const productlist = await filtrarProductos(data);
                setProductos(productlist);
                setDate(useDate());
                encontrarModulo('Semana').then(res => setSemanaActual(res[0]));
            } else {
                setBool(true);
                filterHistorial(movimiento.consecutivo).then(res => {
                    setProducts(res);
                    const movimiento = res[0].movimiento;
                    setConsecutivo(movimiento.consecutivo);
                    setSemana(movimiento.cons_semana);
                    setObservaciones(movimiento.observaciones);
                    setRemision(movimiento.remision);
                    setPedido(res[0].cons_pedido);
                    setConsAlmacen(res[0].cons_almacen_receptor);
                    setDate(movimiento.fecha);
                });
            }
        }
        try {
            listrasItems();
        } catch (e) {
            alert("Error al cargar los productos");
        }
    }, [bool, change, movimiento?.consecutivo]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    function removeProduct() {
        const array = products.slice(0, -1);
        setProducts(array);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {


            const formData = new FormData(formRef.current);

            let existe = [];
            products.map((product, index) => {

                let res = existe.find(item => formData.get(`producto-${index}`) == item);
                if (res) {
                    existe.push("Stop");
                }
                existe.push(formData.get(`producto-${index}`));
            });

            if (existe.find(item => item == "Stop") ) return window.alert("No puede seleccionar más de 1 vez el mismo artículo");


            const nombreAlmacen = formData.get("almacen");
            const almacen = almacenByUser.find((almacen) => almacen.nombre == nombreAlmacen).consecutivo;
            const pedido = formData.get("pedido");
            setConsAlmacen(nombreAlmacen);
            const week = formData.get("semana");
            const semanaR = await generarSemana(week);
            setSemana(semanaR);
            const body = {
                remision: formData.get("remision"),
                fecha: formData.get("fecha"),
                cons_semana: semanaR,
                observaciones: formData.get("observaciones"),
                aprobado_por: user.username,
                realizado_por: user.username
            };
            agregarRecepcion(body).then((res) => {
                const consMovimiento = res.data.consecutivo;
                setConsecutivo(consMovimiento);
                let array = [];
                products.map((product, index) => {
                    const consecutiveProdcut = formData.get(`producto-${index}`);
                    let dataPedido = {
                        cons_producto: consecutiveProdcut,
                        cons_almacen_destino: almacen,
                        cantidad: formData.get("cantidad-" + index)
                    };
                    const dataHistorial = {
                        cons_movimiento: consMovimiento,
                        cons_producto: consecutiveProdcut,
                        cons_almacen_gestor: almacen,
                        cons_almacen_receptor: almacen,
                        cons_lista_movimientos: "RC",
                        tipo_movimiento: "Entrada",
                        cantidad: formData.get("cantidad-" + index),
                        cons_pedido: pedido
                    };
                    sumar(almacen, dataHistorial.cons_producto, dataHistorial.cantidad);
                    agregarHistorial(dataHistorial);
                    array.push(dataPedido);
                });
                const dataNotificacion = {
                    almacen_emisor: almacen,
                    almacen_receptor: "BRC",
                    cons_movimiento: consMovimiento,
                    tipo_movimiento: "Recepcion",
                    descripcion: "realizada",
                    aprobado: true,
                    visto: false
                };
                agregarNotificaciones(dataNotificacion);
                setProducts(array);
            });
            setBool(true);
            setAlert({
                active: true,
                mensaje: "Se han cargado los datos con éxito",
                color: "success",
                autoClose: false
            });
        } catch (e) {
            setAlert({
                active: true,
                mensaje: "Error al cargar datos",
                color: "danger",
                autoClose: false
            });
        }
    };

    const nuevoMovimiento = () => {
        setProducts([1]);
        setBool(false);
        setConsAlmacen(null);
        setConsecutivo(null);
        setSemana(null);
        setObservaciones(null);
        setRemision(null);
        setPedido(null);
        setAlert({
            active: false,
        });
    };
    return (
        <>
            <form ref={formRef} onSubmit={handleSubmit}>
                <Container className={styles.contenedorPadre}>
                    <span className={styles.alertContainer}>
                        {!bool && notificaciones.map((noti, index) => (
                            <AlertaPedido key={index} data={noti} setChange={setChange} change={change}></AlertaPedido>
                        ))}
                    </span>
                    <h2>+ Recepción de artículos</h2>

                    <div className={styles.contenedor8}>


                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="consecutivo"
                                name="consecutivo"
                                defaultValue={consecutivo}
                                disabled
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                            <Form.Select
                                id="almacen"
                                name="almacen"
                                className={styles.select}
                                size="sm" disabled={bool}>
                                {!bool && almacenByUser.map((item, index) => (
                                    <option key={index}>{item.nombre}</option>
                                ))}
                                {bool && <option>{consAlmacen}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Remisión</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="remision"
                                name="remision"
                                required
                                defaultValue={remision}
                                disabled={bool}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Pedido</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="pedido"
                                name="pedido"
                                required
                                defaultValue={pedido}
                                disabled={bool}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
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

                        {!bool &&
                            <InputGroup size="sm">
                                <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                                <Form.Control
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                    min={semanaActual?.semana_actual * 1 - semanaActual?.semana_previa}
                                    max={semanaActual?.semana_actual * 1 + semanaActual?.semana_siguiente}
                                    id="semana"
                                    name="semana"
                                    type="number"
                                    required
                                    defaultValue={semana}
                                    disabled={bool}
                                />

                                <Form.Control
                                    className={styles.anho}
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                    id="anho_actual"
                                    name="anho_actual"
                                    type="text"
                                    required
                                    disabled
                                    defaultValue={semanaActual?.anho_actual}
                                />
                            </InputGroup>
                        }

                        {bool &&
                            <InputGroup size="sm">
                                <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                                <Form.Control
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                    id="semana"
                                    name="semana"
                                    type="text"
                                    required
                                    defaultValue={semana}
                                    disabled={bool}
                                />
                            </InputGroup>
                        }


                    </div>

                    <div className={styles.line}></div>
                    {products.map((product, key) => {
                        return (
                            <div key={key}>
                                <div className={styles.contenedor2} >

                                    <span className={styles.display}>
                                        <InputGroup size="sm" className="mb-3">
                                            <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                                            <Form.Control
                                                aria-label="Small"
                                                aria-describedby="inputGroup-sizing-sm"
                                                disabled
                                                id={`producto-${key}`}
                                                name={`producto-${key}`}
                                                defaultValue={product?.cons_producto}
                                            />
                                        </InputGroup>
                                    </span>

                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                        <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={bool}>
                                            {productos.map((item, index) => {
                                                return <option key={index} value={item.consecutivo}>{item.name}</option>;
                                            })}
                                            {bool && <option >{product?.Producto?.name ? product?.Producto?.name : product?.name}</option>}
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
                                            defaultValue={product?.cantidad}
                                            required
                                        />

                                    </InputGroup>
                                </div>
                            </div>
                        );
                    })}
                    <div>
                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="observaciones"
                                name="observaciones"
                                defaultValue={observaciones}
                                disabled={bool}
                                required
                            />
                        </InputGroup>
                    </div>


                    <div className={styles.contenedor6}>
                        <div>
                            {!bool && <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                                Agregar artículo
                            </Button>}
                        </div>
                        {!bool && <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                            Remover artículo
                        </Button>}
                        <div className={styles.display}></div>
                        <div className={styles.display}></div>
                        {bool && <div className={styles.display}></div>}
                        <div>

                            <div>
                                {!bool && <Button type='submit' className={styles.button} variant="success" size="sm">
                                    Cargar artículos
                                </Button>}
                                {bool && <Button type='submit' onClick={nuevoMovimiento} className={styles.button} variant="primary" size="sm">
                                    Nueva recepción
                                </Button>}
                            </div>

                        </div>
                    </div>

                    <div className={styles.line}></div>
                    <Alertas alert={alert} handleClose={toogleAlert} />
                </Container>
            </form>
        </>
    );
}