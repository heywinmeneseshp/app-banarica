import React, { useState, useEffect, useContext } from "react";
import AppContext from "@context/AppContext";
//Serviec
import { buscarDocumetoPedido } from "@services/api/pedidos";
import { listarProductos } from "@services/api/productos";
//Hooks
import useDate from "@hooks/useDate";
//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

//Components
import ThirdLayout from 'layout/ThirdLayout';
//CSS
import styles from "@styles/almacen/almacen.module.css";


export default function RPedido() {
    const { gestionNotificacion } = useContext(AppContext);

    const [productos, setProductos] = useState([]);
    const [bool, setBool] = useState(false);
    const [consMovimiento, setConsMovimiento] = useState([]);
    const [date, setDate] = useState(useDate());
    const [semana, setSemana] = useState(null);
    const [observaciones, setObservaciones] = useState(null);

    useEffect(() => {
        if (!gestionNotificacion.notificacion) {
            listarProductos().then(res => setProductos(res));
        } else {
            const { cons_movimiento } = gestionNotificacion.notificacion;
            buscarDocumetoPedido(cons_movimiento).then((res) => {
                setConsMovimiento(cons_movimiento);
                setDate(res.fecha);//Listo
                setSemana(res.cons_semana);//Listo
                setProducts(res.pedido);//Listo
                setObservaciones(res.observaciones); //Listo
            });
            setBool(true);
        }
    }, []);


    const [products, setProducts] = useState([1]);



    return (
        <>
            <ThirdLayout>
                <Container>
                    <form>
                        <h2>Pedido</h2>
                        <div className={styles.contenedor7}>

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
                            {!bool &&
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
                                        defaultValue={semana}
                                    />
                                </InputGroup>
                            }
                            {bool &&
                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                                    <Form.Control
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        id="semana"
                                        name="semana"
                                        type="text"
                                        required
                                        disabled={bool}
                                        defaultValue={semana}
                                    />
                                </InputGroup>
                            }
                        </div>

                        <div className={styles.line}></div>

                        {products.map((product, key) => (
                            <div key={key}>
                                <div className={styles.contenedor2} >

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

                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                        <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={bool}>
                                            {!bool && productos.map((item, index) => {
                                                return <option key={index}>{item.name}</option>;
                                            })}
                                            {bool && <option>{product?.cons_producto}</option>}
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
                                    disabled={bool}
                                />
                            </InputGroup>

                        </div>
                   
                    </form>
        
                </Container>
            </ThirdLayout>
        </>
    );
}
