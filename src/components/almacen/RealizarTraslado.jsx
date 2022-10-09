import React, { useState, useEffect } from "react";
import { useRef } from "react";
//Services
import { filtrarProductos } from "@services/api/productos";
import { listarAlmacenes } from "@services/api/almacenes";
import { listarConductores } from "@services/api/conductores";
import { listarTransportadoras } from "@services/api/transportadoras";
import { agregarTraslado } from "@services/api/traslados";
import { agregarNotificaciones } from "@services/api/notificaciones";
import { agregarHistorial } from "@services/api/historialMovimientos";
//Hooks
import { useAuth } from "@hooks/useAuth";
import generarSemana from "@hooks/useSemana";
import useAlert from "@hooks/useAlert";
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


export default function RealizarTraslado() {
    const formRef = useRef();
    const { almacenByUser } = useAuth();
    const [products, setProducts] = useState([1]);
    const [productos, setProductos] = useState([]);
    const [prodcuctsCons, setProductsCons] = useState([]);
    const [bool, setBool] = useState(false);
    const [origen, setOrigen] = useState(null);
    const [destinos, setDestinos] = useState([]);
    const [destino, setDestino] = useState(null);
    const [conductor, setConductor] = useState(null);
    const [conductores, setConductores] = useState([]);
    const [transportadora, setTransportadora] = useState(null);
    const [transportadoras, setTransportadoras] = useState([]);
    const [dates, setDate] = useState();
    const { alert, setAlert, toogleAlert } = useAlert();
    const [consTraslado, setConsTraslado] = useState(null);

    useEffect(() => {
        const listar = async () => {
            const almacenes = almacenByUser.map(item => item.consecutivo);
            const data = { "stock": { "isBlock": false, "cons_almacen": almacenes } };
            const productlist = await filtrarProductos(data);
            setProductos(productlist);
            listarAlmacenes().then(res => setDestinos(res));
            listarConductores().then(res => setConductores(res));
            listarTransportadoras().then(res => setTransportadoras(res));
            setDate(generarFecha());
        };
        listar();
    }, []);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    function removeProduct() {
        const array = products.slice(0, -1);
        setProducts(array);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const fecha = formData.get("fecha");
        const transportadora0 = formData.get("transportadora");
        const conductor0 = formData.get("conductor");
        const vehiculo = formData.get("vehiculo");
        const week = formData.get("semana");
        const semanaR = generarSemana(week);
        const origen0 = destinos.find((item) => item.nombre == formData.get("origen")).consecutivo;
        const destino0 = destinos.find((item) => item.nombre == formData.get("destino")).consecutivo;
        if (origen0 == destino0) {
            setAlert({
                active: true,
                mensaje: "El almacén de origen y destino no puede ser el mismo",
                color: "danger",
                autoClose: true
            });
        } else {
            try {
                setTransportadora(transportadora0);
                setConductor(conductor0);
                setDestino(destino0);
                setOrigen(origen0);
                const data = {
                    transportadora: transportadora0,
                    conductor: conductor0,
                    vehiculo: vehiculo,
                    origen: origen0,
                    destino: destino0,
                    estado: "Pendiente",
                    fecha_salida: fecha,
                    semana: semanaR
                };
                agregarTraslado(data).then(res => {
                    const consMovimiento = res.data.consecutivo;
                    setConsTraslado(consMovimiento);
                    const dataNotificacion = {
                        almacen_emisor: origen0,
                        almacen_receptor: destino0,
                        cons_movimiento: consMovimiento,
                        tipo_movimiento: "Traslado",
                        descripcion: "pendiente por recibir",
                        aprobado: false,
                        visto: false
                    };
                    agregarNotificaciones(dataNotificacion);
                    let array = [];
                    products.map((product, index) => {
                        const consecutiveProdcut = productos.find(producto => producto.name == formData.get(`producto-${index}`)).consecutivo;
                        array.push(consecutiveProdcut);
                        const dataHistorial = {
                            cons_movimiento: consMovimiento,
                            cons_producto: consecutiveProdcut,
                            cons_almacen_gestor: origen0,
                            cons_almacen_receptor: destino0,
                            cons_lista_movimientos: "TR",
                            tipo_movimiento: "Traslado",
                            cantidad: formData.get("cantidad-" + index)
                        };
                        //sumar(almacen, consecutiveProdcut, formData.get("cantidad-" + index));
                        agregarHistorial(dataHistorial);
                    });
                    setProductsCons(array);
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
            setBool(true);
        }
    };

    return (
        <>

            <Container>
               
                <form ref={formRef} onSubmit={handleSubmit}>
                    <h2>+ Realizar traslado</h2>
                    <div className={styles.contenedor1}>
                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                type="text"
                                className={styles.fecha}
                                disabled
                                defaultValue={consTraslado}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Origen</InputGroup.Text>
                            <Form.Select
                                id="origen"
                                name="origen"
                                className={styles.select}
                                size="sm"
                                disabled={bool}>
                                {!bool && almacenByUser.map((item, index) => (
                                    <option key={index}>{item.nombre}</option>
                                ))}
                                {bool && <option>{origen}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Destino</InputGroup.Text>
                            <Form.Select
                                id="destino"
                                name="destino"
                                className={styles.select}
                                size="sm"
                                disabled={bool}>
                                {!bool && destinos.map((item, index) => (
                                    <option key={index}>{item.nombre}</option>
                                ))}
                                {bool && <option>{destino}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Fecha de envío</InputGroup.Text>
                            <Form.Control
                                id="fecha"
                                name="fecha"
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                type="date"
                                className={styles.fecha}
                                defaultValue={dates}
                                disabled={bool}
                            />
                        </InputGroup>



                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="semana"
                                name="semana"
                                type="number"
                                min="1"
                                max="52"
                                required
                                disabled={bool}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Transportadora</InputGroup.Text>
                            <Form.Select
                                id="transportadora"
                                name="transportadora"
                                className={styles.select}
                                size="sm" disabled={bool}>
                                {!bool && transportadoras.map((item, index) => (
                                    <option key={index}>{item.razon_social}</option>
                                ))}
                                {bool && <option>{transportadora}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Conductor</InputGroup.Text>
                            <Form.Select
                                id="conductor"
                                name="conductor"
                                className={styles.select}
                                size="sm" disabled={bool}>
                                {!bool && conductores.map((item, index) => (
                                    <option key={index}>{item.conductor}</option>
                                ))}
                                {bool && <option>{conductor}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Vehículo</InputGroup.Text>
                            <Form.Control
                                id="vehiculo"
                                name="vehiculo"
                                minLength="6"
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                required
                                disabled={bool}
                            />
                        </InputGroup>

                    </div>

                    <div className={styles.line}></div>

                    {products.map((item, key) => (
                        <div item={item} key={key}>
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
                                            defaultValue={prodcuctsCons[key]}
                                        />
                                    </InputGroup>
                                </span>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={bool}>
                                        {productos.map((item, index) => {
                                            return <option key={index}>{item.name}</option>;
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
                    {!bool &&
                        <div className={styles.contenedor6}>
                            <div>
                                <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                                    Añadir artículo
                                </Button>
                            </div>
                            <div>
                                <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                                    Remover producto
                                </Button>
                            </div>
                            <div className={styles.display}></div>
                            <div className={styles.display}></div>
                            <div>
                                <Button type="submit" className={styles.button} variant="success" size="sm">
                                    Enviar artículos
                                </Button>
                            </div>

                        </div>
                    }
                </form>
                <Alertas alert={alert} handleClose={toogleAlert} />
            </Container>
        </>
    );
}