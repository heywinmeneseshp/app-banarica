import React, { useState, useEffect, useContext } from "react";
import AppContext from "@context/AppContext";
import axios from "axios";
//Services
import { actualizarTraslado, buscarTraslado } from "@services/api/traslados";
import { listarProductos } from "@services/api/productos";
import { actualizarNotificaciones } from "@services/api/notificaciones";
//Hooks
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
import endPoints from "@services/api";
import { restar, sumar } from "@services/api/stock";

export default function RecibirTraslado() {
    const { gestionNotificacion } = useContext(AppContext);
    const [products, setProducts] = useState([]);
    const [bool, setBool] = useState(false);
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);
    const [conductor, setConductor] = useState(null);
    const [transportadora, setTransportadora] = useState(null);
    const [date, setDate] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [consTraslado, setConsTraslado] = useState(null);
    const [semana, setSemana] = useState(null);
    const [vehiculo, setVehiculo] = useState(null);
    const [idTraslado, setIdTraslado] = useState(null);
    const [idNotificacion, setIdNotificacion] = useState(null);

    useEffect(() => {
        const movimiento = gestionNotificacion.notificacion.cons_movimiento;
        setIdNotificacion(gestionNotificacion.notificacion.id);
        const cargarDatosProductos = async () => {
            const { data } = await axios.get(endPoints.historial.filter(movimiento));
            let array = [];
            listarProductos().then(res => {
                res.map((producto) => {
                    data.map(item => {
                        if (producto.consecutivo == item.cons_producto) {
                            const element = {
                                consecutivo: producto.consecutivo,
                                nombre: producto.name,
                                cantidad: item.cantidad
                            };
                            array.push(element);
                        }
                    });
                });
            });
            setProducts(array);
            setDate(generarFecha());
        };
        const cargarDatosTraslado = () => {
            buscarTraslado(movimiento).then(res => {
                setIdTraslado(res.id);
                setTransportadora(res.transportadora);
                setOrigen(res.origen);
                setDestino(res.destino);
                setConductor(res.conductor);
                setConsTraslado(movimiento);
                setSemana(res.semana);
                setVehiculo(res.vehiculo);
            });
        };
        cargarDatosProductos();
        cargarDatosTraslado();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const data = { estado: "Completado", fecha_entrada: date };
            actualizarTraslado(idTraslado, data);
            products.map((product) => {
                restar(origen, product.consecutivo, product.cantidad);
                sumar(destino, product.consecutivo, product.cantidad);
            });
            const dataNotificacion = { descripcion: "Traslado compledado con exito", aprobado: true };
            actualizarNotificaciones(idNotificacion, dataNotificacion);
            setBool(true);
            setAlert({
                active: true,
                mensaje: "Se ha realizado el traslado con éxito",
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
        gestionNotificacion.ingresarNotificacion(null);
    };

    return (
        <>
            <Container className={styles.contTraslados} >
                <form onSubmit={handleSubmit}>
                    <h2>+ Recibir traslado</h2>
                    <div className={styles.contenedor1}>
                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                type="text"
                                disabled
                                defaultValue={consTraslado}
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Origen</InputGroup.Text>
                            <Form.Select
                                id="origen"
                                name="origen"
                                size="sm"
                                disabled>
                                <option>{origen}</option>
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Destino</InputGroup.Text>
                            <Form.Select
                                id="destino"
                                name="destino"
                                size="sm"
                                disabled>
                                <option>{destino}</option>
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Recibido</InputGroup.Text>
                            <Form.Control
                                id="fecha"
                                name="fecha"
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                type="date"
                                defaultValue={date}
                                disabled
                            />
                        </InputGroup>

                    </div>

                    <div className={styles.contenedor0}>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="semana"
                                name="semana"
                                defaultValue={semana}
                                disabled
                            />
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Transportadora</InputGroup.Text>
                            <Form.Select
                                id="transportadora"
                                name="transportadora"
                                className={styles.select}
                                size="sm"
                                disabled>
                                <option>{transportadora}</option>
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Conductor</InputGroup.Text>
                            <Form.Select
                                id="conductor"
                                name="conductor"
                                className={styles.select}
                                size="sm" disabled>
                                <option>{conductor}</option>
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Vehículo</InputGroup.Text>
                            <Form.Control
                                id="vehiculo"
                                name="vehiculo"
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={vehiculo}
                                disabled
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
                                        id={`cons-producto-${key}`}
                                        name={`cons-producto-${key}`}
                                        defaultValue={item?.consecutivo}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled>

                                        <option >{item?.nombre}</option>

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
                                        disabled
                                        defaultValue={item?.cantidad}
                                        required
                                    />

                                </InputGroup>
                            </div>
                        </div>
                    ))}
                    {!bool &&
                        <div className={styles.contenedor6}>
                            <div>
                            </div>
                            <div>
                            </div>
                            <div></div>
                            <div></div>
                            <div>
                                {!bool && <Button type="submit" className={styles.button} variant="success" size="sm">
                                    Recibir traslado
                                </Button>}
                            </div>

                        </div>
                    }
                </form>
                <Alertas alert={alert} handleClose={toogleAlert} />
            </Container>
        </>
    );
}