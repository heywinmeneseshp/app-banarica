import React, { useState, useEffect, useContext, useRef } from "react";
import AppContext from "@context/AppContext";
//Services
import { actualizarTraslado, buscarTraslado } from "@services/api/traslados";
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
import { restar, sumar } from "@services/api/stock";

export default function RecibirTraslado({ movimiento }) {
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
    const [observaciones, setObservaciones] = useState(null);
    const [traslado, setTraslado] = useState({});
    const formRef = useRef();

    useEffect(() => {
        buscarTraslado(movimiento.consecutivo).then(res => {
            const traslado = res[0].traslado;
            setIdTraslado(traslado?.id);
            setTransportadora(traslado?.transportadora);
            setConductor(traslado?.conductor);
            setOrigen(traslado?.origen);
            setDestino(traslado?.destino);
            setConsTraslado(traslado?.consecutivo);
            setSemana(traslado?.semana);
            setVehiculo(traslado?.vehiculo);
            setProducts(res);
            let title = "+ Recibir traslado";
            if (traslado.estado == "Completado") title = `+ Traslado`;
            setTraslado({...traslado, title: title});
            setObservaciones(traslado.observaciones);
        });
        setDate(generarFecha());
    }, [movimiento?.consecutivo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(formRef.current);
            const respuesta = formData.get("observaciones");
            const data = { estado: "Completado", fecha_entrada: date, observaciones: respuesta };
            setObservaciones(respuesta);
            actualizarTraslado(idTraslado, data);
            products.map((product) => {
                restar(origen, product.cons_producto, product.cantidad);
                sumar(destino, product.cons_producto, product.cantidad);
            });
            const dataNotificacion = { descripcion: "Traslado compledado con exito", aprobado: true };
            actualizarNotificaciones(gestionNotificacion.notificacion.id, dataNotificacion);
            setBool(true);
            setAlert({
                active: true,
                mensaje: "Se ha realizado el traslado con éxito",
                color: "success",
                autoClose: false
            });
        } catch (e) {
            console.log(e);
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
                <form ref={formRef} onSubmit={handleSubmit}>
                    <h2>{traslado.title}</h2>
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
                                        defaultValue={item?.cons_producto}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled>

                                        <option >{item?.Producto?.name}</option>

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

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                        <Form.Control
                            id="observaciones"
                            name="observaciones"
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            defaultValue={observaciones}
                            required
                            disabled={(traslado?.estado == "Completado") || bool}
                        />
                    </InputGroup>
                    {!bool && (traslado?.estado != "Completado") &&
                        <div className={styles.contenedor6}>
                            <div>
                            </div>
                            <div>
                            </div>
                            <div></div>
                            <div></div>
                            <div>
                                <Button type="submit" className={styles.button} variant="success" size="sm">
                                    Recibir traslado
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