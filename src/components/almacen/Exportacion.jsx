import React, { useRef, useState, useEffect } from "react";
//Servieces
import { agregarNotificaciones } from "@services/api/notificaciones";
import { exportCombo } from "@services/api/stock";
//Hooks
import { useAuth } from "@hooks/useAuth";
import useAlert from "@hooks/useAlert";
import generarSemana from "@hooks/useSemana";
import useDate from "@hooks/useDate";
//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
//Components
import Alertas from "@assets/Alertas";
//CSS
import styles from "@styles/almacen/almacen.module.css";
import { listarCombos } from "@services/api/combos";

export default function Ajuste() {
    const formRef = useRef();
    const { almacenByUser } = useAuth();
    const [combos, setCombos] = useState([]);
    const [bool, setBool] = useState(false);
    const [consMovimiento, setConsMovimiento] = useState([]);
    const [date, setDate] = useState(useDate());
    const [almacen, setAlmacen] = useState(null);
    const [semana, setSemana] = useState(null);
    const [observaciones, setObservaciones] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();

    useEffect(() => {
        listarCombos().then(res => setCombos(res));
    }, []);


    const [products, setProducts] = useState([1]);

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
        const almacenR = formData.get('almacen');
        const fecha = formData.get("fecha");
        const week = formData.get('semana');
        const semanaR = generarSemana(week);
        const observacionesR = formData.get("observaciones");
        const consAlmacen = almacenByUser.find((item) => item.nombre == almacenR).consecutivo;
        try {
            setAlmacen(almacenR);
            setDate(fecha);
            setSemana(semanaR);
            setObservaciones(observacionesR);
            const body = {
                "cons_almacen": consAlmacen,
                "cons_semana": semanaR,
                "fecha": fecha,
                "observaciones": observacionesR
            };
            let lista = [];
            let arrayPost = [];
            products.map((product, index) => {
                const nombreCombo = formData.get("producto-" + index);
                const consCombo = combos.find((item) => item.nombre == nombreCombo).consecutivo;
                const cantidad = formData.get("cantidad-" + index);
                lista.push({ nombre: nombreCombo, cantidad: cantidad, cons_producto: consCombo });
                arrayPost.push({ cons_combo: consCombo, cantidad: cantidad });
            });
            setProducts(lista);
            exportCombo(body, arrayPost).then(res =>{
                setConsMovimiento(res.movimiento.consecutivo);
                const dataNotificacion = {
                    almacen_emisor: consAlmacen,
                    almacen_receptor: "BRC",
                    cons_movimiento: res.movimiento.consecutivo,
                    tipo_movimiento: "Exportacion",
                    descripcion: "realizado",
                    aprobado: true,
                    visto: false
                };
                agregarNotificaciones(dataNotificacion);
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
    };
    return (
        <>
            <Container>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <h2>Ajuste</h2>
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
                            <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                            <Form.Select
                                id="almacen"
                                name="almacen"
                                className={styles.select}
                                size="sm"
                                disabled={bool}>
                                {!bool && almacenByUser.map((item, index) => (
                                    <option key={index}>{item.nombre}</option>
                                ))}
                                {bool && <option>{almacen}</option>}
                            </Form.Select>
                        </InputGroup>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Movimiento</InputGroup.Text>
                            <Form.Control
                                id="tipo-movimiento"
                                name="tipo-movimiento"
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue="Exportacion"
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
                                        defaultValue={product.cons_producto}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={bool}>
                                        {!bool && combos.map((item, index) => {
                                            return <option key={index}>{item.nombre}</option>;
                                        })}
                                        {bool && <option>{product?.nombre}</option>}
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
                    {!bool &&
                        <div className={styles.contenedor6}>
                            <div>
                                <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                                    Añadir producto
                                </Button>
                            </div>
                            <div>
                                <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                                    Remover producto
                                </Button>
                            </div>
                            <div></div>
                            <div></div>
                            <div>
                                <Button type="submit" className={styles.button} variant="info" size="sm">
                                    Exportar
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
