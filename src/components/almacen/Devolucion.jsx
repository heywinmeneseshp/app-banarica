import React, { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import AppContext from "@context/AppContext";
import { useRouter } from "next/router";
//Serviec
import { agregarMovimiento, actualizarMovimiento, bucarDoumentoMovimiento } from "@services/api/movimientos";
import { actualizarNotificaciones, agregarNotificaciones } from "@services/api/notificaciones";
import { actualizarHistorial, agregarHistorial } from "@services/api/historialMovimientos";
import { restar } from "@services/api/stock";
import { filtrarProductos } from "@services/api/productos";
import endPoints from "@services/api";
//Hooks
import { useAuth } from "@hooks/useAuth";
import useAlert from "@hooks/useAlert";
import generarSemana from "@hooks/useSemana";
import generarFecha from "@hooks/useDate";
//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
//Components
import Alertas from "@assets/Alertas";
//CSS
import styles from "@styles/almacen/almacen.module.css";
import { encontrarModulo } from "@services/api/configuracion";


export default function Devolucion({ movimiento, exportacion }) {
    const formRef = useRef();
    const router = useRouter();
    const { almacenByUser, user } = useAuth();
    const { gestionNotificacion } = useContext(AppContext);
    const [productos, setProductos] = useState([]);
    const [bool, setBool] = useState(false);
    const [date, setDate] = useState(null);
    const [almacen, setAlmacen] = useState(null);
    const [semana, setSemana] = useState(null);
    const [observaciones, setObservaciones] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [products, setProducts] = useState([1]);
    const [consMovimiento, setConsMovimiento] = useState(null);
    const [razonMovimiento, setRazonMovimiento] = useState(null);
    const [movimientoID, setMovimientoID] = useState(null);
    const [respuesta, setRespuesta] = useState(null);
    const [pendiente, setPendiente] = useState(null);
    const [semanaActual, setSemanaActual] = useState(null);

    useEffect(() => {
        const listarProductos = async () => {
            const almacenes = almacenByUser.map(item => item.consecutivo);
            const data = { "stock": { "isBlock": false, "cons_almacen": almacenes } };
            const productlist = await filtrarProductos(data);
            setProductos(productlist);
        };
        listarProductos();
        if (!movimiento) {
            const listar = async () => {
                const fecha = generarFecha();
                setDate(fecha);
                encontrarModulo('Semana').then(res => setSemanaActual(res[0]));
            };
            listar();
        } else {
            bucarDoumentoMovimiento(movimiento.consecutivo).then(res => {
                setMovimientoID(res.movimiento.id);
                setConsMovimiento(res.movimiento.consecutivo);
                setAlmacen(res.almacen);
                setRazonMovimiento(res.razon_movimiento);
                setDate(res.movimiento.fecha);
                setSemana(res.movimiento.cons_semana);
                setProducts(res.lista);
                setObservaciones(res.movimiento.observaciones);
                setRespuesta(res.movimiento.respuesta);
                setPendiente(res.movimiento.pendiente);
            });
            setBool(true);
        };
    }, [movimiento?.consecutivo]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    };

    function removeProduct() {
        const array = products.slice(0, -1);
        setProducts(array);
    };

    async function rechazarAjuste() {
        const formData = new FormData(formRef.current);
        const IdNoti = gestionNotificacion.notificacion.id;
        const cons_movimiento = gestionNotificacion.notificacion.cons_movimiento;
        const respuesta = formData.get("respuesta");
        if (!respuesta) return window.alert("Por favor rellenar todos los campos");
        const aprobado_por = user.username;
        actualizarMovimiento(movimientoID, { pendiente: false, respuesta: respuesta, aprobado_por: aprobado_por });
        actualizarNotificaciones(IdNoti, { aprobado: true, visto: true });
        const { data } = await axios.get(endPoints.historial.filter(cons_movimiento));
        data.forEach(element => {
            actualizarHistorial(element.id, { razon_movimiento: "Rechazado" });
        });
        const dataNotificacion = {
            almacen_emisor: gestionNotificacion.notificacion.almacen_emisor,
            almacen_receptor: gestionNotificacion.notificacion.almacen_receptor,
            cons_movimiento: cons_movimiento,
            tipo_movimiento: "Devolucion",
            descripcion: "rechazada",
            aprobado: true,
            visto: false
        };
        setRespuesta(respuesta);
        setPendiente(false);
        agregarNotificaciones(dataNotificacion);
        gestionNotificacion.ingresarNotificacion(null);
        setAlert({
            active: true,
            mensaje: "Devolución rechazada",
            color: "warning",
            autoClose: false
        });
    };

    async function modificarMovimiento() {
        if (!bool) {
            const formData = new FormData(formRef.current);
            const week = formData.get("semana");
            const anho = formData.get("anho_actual");
            actualizarMovimiento(movimientoID, {
                "fecha": formData.get("fecha"),
                "cons_semana": `S${week}-${anho}`,
            });
        };
        setBool(!bool);
    };

    function cancelarActualizacion() {
        router.push(`/`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        try {
            if (user?.id_rol == "Super administrador" && movimiento) {
                const consAlmacen = almacenByUser.find((item) => item.nombre == almacen).consecutivo;
                const respuesta = formData.get("respuesta");
                const changes = { "pendiente": false, "respuesta": respuesta, 'aprobado_por': user.username };
                setRespuesta(respuesta);
                actualizarMovimiento(movimientoID, changes);
                products.forEach(item => {
                    const { cons_producto, cantidad } = item;
                    restar(consAlmacen, cons_producto, cantidad);
                });
                const notiChange = {
                    "descripcion": "Devolución aprobada",
                    "aprobado": true
                };
                actualizarNotificaciones(gestionNotificacion.notificacion.id, notiChange);
                const dataNotificacion = {
                    almacen_emisor: gestionNotificacion.notificacion.almacen_emisor,
                    almacen_receptor: gestionNotificacion.notificacion.almacen_receptor,
                    cons_movimiento: gestionNotificacion.notificacion.cons_movimiento,
                    tipo_movimiento: "Devolucion",
                    descripcion: "aprobada",
                    aprobado: true,
                    visto: false
                };
                agregarNotificaciones(dataNotificacion);
                setPendiente(false);
                setRespuesta(formData.get("respuesta"));
                gestionNotificacion.ingresarNotificacion(null);
            } else {
                const almacenR = formData.get('almacen');
                const tipoDeMovimiento = formData.get('tipo-movimiento');
                const fecha = formData.get("fecha");
                const observacionesR = formData.get("observaciones");
                const consAlmacen = almacenByUser.find((item) => item.nombre == almacenR).consecutivo;
                const week = formData.get("semana");
                const semanaR = await generarSemana(week);
                setRazonMovimiento(tipoDeMovimiento);
                setDate(fecha);
                setSemana(semanaR);
                setObservaciones(observacionesR);
                setAlmacen(almacenR);
                const data = {
                    "prefijo": "DV",
                    "pendiente": true,
                    "observaciones": observacionesR,
                    "cons_semana": semanaR,
                    "fecha": fecha,
                    "realizado_por": user.username
                };
                agregarMovimiento(data).then(res => {
                    const consMovimientoR = res.data.consecutivo;
                    setConsMovimiento(consMovimientoR);
                    const dataNotificacion = {
                        almacen_emisor: consAlmacen,
                        almacen_receptor: consAlmacen,
                        cons_movimiento: consMovimientoR,
                        tipo_movimiento: "Devolucion",
                        descripcion: "pendiente por aprobación",
                        aprobado: false,
                        visto: true
                    };
                    agregarNotificaciones(dataNotificacion);
                    let array = [];
                    products.map((product, index) => {
                        const consecutiveProdcut = productos.find(producto => producto.name == formData.get(`producto-${index}`)).consecutivo;
                        const dataProducto = {
                            "cantidad": formData.get("cantidad-" + index),
                            "cons_producto": consecutiveProdcut,
                            "nombre": formData.get(`producto-${index}`)
                        };
                        array.push(dataProducto);
                        const dataHistorial = {
                            cons_movimiento: consMovimientoR,
                            cons_producto: consecutiveProdcut,
                            cons_almacen_gestor: consAlmacen,
                            cons_lista_movimientos: "DV",
                            tipo_movimiento: "Salida",
                            razon_movimiento: tipoDeMovimiento,
                            cantidad: formData.get("cantidad-" + index),
                        };
                        agregarHistorial(dataHistorial);
                    });
                    setProducts(array);
                });
            };
            setBool(true);
            let message = "Devolucion cargada, pendiente por aprobación";
            if (user?.id_rol == "Super administrador" && gestionNotificacion.notificacion) message = "Devolución aprobada";
            setAlert({
                active: true,
                mensaje: message,
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
        };
    };
    return (
        <>
            <Container>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <h2 className="mb-3">{exportacion ? exportacion : `Devolución`}</h2>
                    <div className={styles.contenedor7}>

                        <span className={styles.display}>
                            <InputGroup size="sm" className="mb-3">
                                <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                                <Form.Control
                                    id="consecutivo"
                                    name="consecutivo"
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                    defaultValue={consMovimiento}
                                    disabled={true}
                                />
                            </InputGroup>
                        </span>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                            <Form.Select
                                id="almacen"
                                name="almacen"
                                size="sm"
                                disabled={consMovimiento}>
                                {almacenByUser.map((item, index) => (
                                    <option selected={almacen == item.nombre} key={index}>{item.nombre}</option>
                                ))}
                            </Form.Select>
                        </InputGroup>

                        <Form.Select className={styles.select}
                            id="tipo-movimiento"
                            name="tipo-movimiento"
                            disabled={consMovimiento}
                            size="sm">
                            <option selected={razonMovimiento == 'Mal estado'}>Mal estado</option>
                            <option selected={razonMovimiento == 'Bulto incompleto'}>Bulto incompleto</option>
                            <option selected={razonMovimiento == 'Pedido incompleto'}>Pedido incompleto</option>
                            <option selected={razonMovimiento == 'Sobrante'}>Sobrante</option>
                            <option selected={razonMovimiento == 'Error en registro'}>Error en registro</option>
                        </Form.Select>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Fecha</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                type="date"
                                className={styles.fecha}
                                defaultValue={date}
                                id="fecha"
                                name="fecha"
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
                                min={semanaActual?.semana_actual * 1 - semanaActual?.semana_previa}
                                max={semanaActual?.semana_actual * 1 + semanaActual?.semana_siguiente}
                                required
                                disabled={bool}
                                defaultValue={semana?.split('-')[0].slice(1, semana.split('-')[0].length)}
                            />

                            <Form.Control
                                className={styles.anho}
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="anho_actual"
                                name="anho_actual"
                                type="text"
                                required
                                disabled={semana ? bool : true}
                                defaultValue={semanaActual?.anho_actual || semana?.split('-')[1]}
                            />
                        </InputGroup>


                    </div>

                    <div className={styles.line}></div>

                    {products.map((product, key) => (
                        <div key={key}>
                            <div className={styles.contenedor2} >
                                <span className={styles.display}>
                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                                        <Form.Control
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            disabled
                                            id={`cons-producto-${key}`}
                                            name={`cons-producto-${key}`}
                                            defaultValue={product?.cons_producto}
                                        />
                                    </InputGroup>
                                </span>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={consMovimiento}>
                                        {productos.map((item, index) => {
                                            return <option selected={product?.nombre == item.name} key={index}>{item.name}</option>;
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
                                        disabled={consMovimiento}
                                        required
                                        defaultValue={product?.cantidad}
                                    />
                                </InputGroup>
                            </div>
                        </div>
                    ))}

                    <div className={styles.contenedor3}>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                            <Form.Control
                                id="observaciones"
                                name="observaciones"
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={observaciones}
                                required
                                maxlength="120"
                                disabled={movimiento}
                            />
                        </InputGroup>

                    </div>

                    {bool && movimiento && (user.id_rol == "Super administrador") && <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Respuesta</InputGroup.Text>
                        <Form.Control
                            id="respuesta"
                            name="respuesta"
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            defaultValue={respuesta}
                            required
                            maxlength="120"
                            disabled={respuesta}
                        />
                    </InputGroup>}

                    {!bool && !movimiento &&
                        <div className={styles.contenedor6}>
                            <div>
                                <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                                    Añadir artículo
                                </Button>
                            </div>
                            <div>
                                <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                                    Remover artículo
                                </Button>
                            </div>
                            <div className={styles.display}></div>
                            <div className={styles.display}></div>
                            <div>
                                <Button type="submit" className={styles.button} variant="success" size="sm">
                                    Enviar devolución
                                </Button>
                            </div>
                        </div>
                    }
                    {pendiente && (user.id_rol == "Super administrador") &&
                        <div className={styles.contenedor7}>
                            <div>
                            </div>
                            <div>
                            </div>
                            <div>
                                {bool &&
                                    <Button className={styles.button} onClick={modificarMovimiento} variant="warning" size="sm">
                                        Modificar movimiento
                                    </Button>
                                }
                            </div>
                            <div>
                                {bool && <Button className={styles.button} onClick={rechazarAjuste} variant="danger" size="sm">
                                    Rechazar devolución
                                </Button>}
                                {!bool &&
                                    <Button className={styles.button} onClick={cancelarActualizacion} variant="danger" size="sm">
                                        Cancelar actualización
                                    </Button>
                                }
                            </div>

                            <div>
                                {bool && <Button type="submit" className={styles.button} variant="success" size="sm">
                                    Cargar devolución
                                </Button>}
                                {!bool &&
                                    <Button className={styles.button} onClick={modificarMovimiento} variant="warning" size="sm">
                                        Actualizar movimiento
                                    </Button>
                                }
                            </div>

                        </div>
                    }
                </form>
                <Alertas alert={alert} handleClose={toogleAlert} />
            </Container>
        </>
    );
}