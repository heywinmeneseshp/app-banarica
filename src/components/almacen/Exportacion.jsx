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
import { encontrarUnSerial, exportarArticulosConSerial, listarSeriales, verificarAndActualizarSeriales } from "@services/api/seguridad";
import { encontrarModulo } from "@services/api/configuracion";

export default function Ajuste() {
    const formRef = useRef();
    const { almacenByUser, user } = useAuth();
    const [combos, setCombos] = useState([]);
    const [bool, setBool] = useState(false);
    const [consMovimiento, setConsMovimiento] = useState([]);
    const [date, setDate] = useState(useDate());
    const [almacen, setAlmacen] = useState(null);
    const [semana, setSemana] = useState(null);
    const [observaciones, setObservaciones] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [radio, setRadio] = useState(0);
    const [alertRadio, setAlertRadio] = useState(false);
    const [nuevo, setNuevo] = useState(true);
    const [moduloSeguridad, setModuloSeguridad] = useState(false);
    const [precintos, setPrecintos] = useState([]);

    useEffect(() => {
        listarCombos().then(res => setCombos(res));
        encontrarModulo('Seguridad').then(res => setModuloSeguridad(res[0].habilitado));
        onChangeAlmacen();
    }, []);

    const onChangeAlmacen = async () => {
        const formData = new FormData(formRef.current);
        const almacenR = formData.get('almacen');
        const producto = await encontrarUnSerial({ "producto": { "name": "Precinto plástico" } });
        const data = {
            "cons_producto": producto.cons_producto,
            "serial": "",
            "bag_pack": "",
            "s_pack": "",
            "m_pack": "",
            "l_pack": "",
            "cons_almacen": almacenByUser.find((item) => item.nombre == almacenR).consecutivo,
            "available": [
                true
            ]
        };
        const precintosR = await listarSeriales(false, false, data);
        setPrecintos(precintosR);
    };


    const [products, setProducts] = useState([1]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    function removeProduct() {
        const array = products.slice(0, -1);
        setProducts(array);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (radio == 0 && moduloSeguridad) return setAlertRadio(true);
        setAlertRadio(false);
        const formData = new FormData(formRef.current);
        const almacenR = formData.get('almacen');
        const fecha = formData.get("fecha");
        const week = formData.get('semana');
        const semanaR = generarSemana(week);
        const observacionesR = formData.get("observaciones");
        const consAlmacen = almacenByUser.find((item) => item.nombre == almacenR).consecutivo;
        try {
            const seriales = {
                'Contenedor': formData.get('contenedor'),
                'Termógrafo': formData.get('termografo'),
                'Botella': formData.get('botella'),
                'Guaya cont': formData.get('guaya-contenedor'),
                'Etiqueta': formData.get('etiqueta'),
                'Precinto plástico': formData.get('precinto-plastico'),
                'Guaya camión': formData.get('guaya-camion')
            };
            let serialesVerificados;
            if (moduloSeguridad) serialesVerificados = await verificarAndActualizarSeriales(seriales, consAlmacen);
            setAlmacen(almacenR);
            setDate(fecha);
            setSemana(semanaR);
            setObservaciones(observacionesR);
            let body = {
                "cons_almacen": consAlmacen,
                "cons_semana": semanaR,
                "fecha": fecha,
                "observaciones": observacionesR,
                'realizado_por': user.username,
                'aprobado_por': user.username,
            };
            let vehiculo = formData.get('vehiculo');
            if (vehiculo) body['vehiculo'] = vehiculo;
            console.log(body);
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

            const { movimiento } = await exportCombo(body, arrayPost);
            console.log(movimiento);
            setConsMovimiento(movimiento.consecutivo);
            if (moduloSeguridad) exportarArticulosConSerial(serialesVerificados, consAlmacen, movimiento.consecutivo);
            const dataNotificacion = {
                almacen_emisor: consAlmacen,
                almacen_receptor: "BRC",
                cons_movimiento: movimiento.consecutivo,
                tipo_movimiento: "Exportacion",
                descripcion: "realizado",
                aprobado: true,
                visto: false
            };
            agregarNotificaciones(dataNotificacion);

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

    const nuevoMovimiento = () => {
        setBool(false);
        setConsMovimiento(null);
        setAlmacen(null);
        setSemana(null);
        setObservaciones(null);
        setProducts([1]);
        setNuevo(false);
        setTimeout(() => {
            setNuevo(true);
        }, 50);
        setAlert({
            active: false,
        });
    };

    const handleRadio = (e) => {
        const radio = e.target.value;
        setRadio(radio);
    };

    return (
        <>
            {nuevo &&
                <Container>
                    <form ref={formRef} onSubmit={handleSubmit}>
                        <h2 className="mb-3">Exportación</h2>
                        <div className={styles.contenedor7}>

                            <span className={styles.display}>
                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                                    <Form.Control
                                        id="consecutivo"
                                        name="consecutivo"
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        defaultValue={consMovimiento}
                                        readOnly={true}
                                    />
                                </InputGroup>
                            </span>

                            <InputGroup size="sm" >
                                <InputGroup.Text id="inputGroup-sizing-sm">Almacén</InputGroup.Text>
                                <Form.Select
                                    id="almacen"
                                    name="almacen"
                                    className={styles.select}
                                    size="sm"
                                    onChange={onChangeAlmacen}
                                    disabled={bool}>
                                    {!bool && almacenByUser.map((item, index) => (
                                        <option key={index}>{item.nombre}</option>
                                    ))}
                                    {bool && <option>{almacen}</option>}
                                </Form.Select>
                            </InputGroup>

                            <InputGroup size="sm" >
                                <InputGroup.Text id="inputGroup-sizing-sm">Movimiento</InputGroup.Text>
                                <Form.Control
                                    id="tipo-movimiento"
                                    name="tipo-movimiento"
                                    aria-label="Small"
                                    aria-describedby="inputGroup-sizing-sm"
                                    defaultValue="Exportación"
                                    disabled={true}
                                />
                            </InputGroup>

                            <InputGroup size="sm" >
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
                                <InputGroup size="sm" >
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
                                        defaultValue={semana}
                                    />
                                </InputGroup>
                            }
                            {bool &&
                                <InputGroup size="sm" >
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


                            {moduloSeguridad &&
                                <div className={styles.radio}>
                                    <label htmlFor="radio-contenedor">Contenedor</label>
                                    <input
                                        id="radio-contenedor"
                                        type="radio"
                                        value={1}
                                        checked={radio == 1}
                                        onChange={handleRadio}
                                        disabled={bool}
                                        aria-label="Radio button for following text input" />
                                </div>
                            }
                            {moduloSeguridad &&
                                <div className={styles.radio}>
                                    <label htmlFor="radio-camion">Camión</label>
                                    <input
                                        id="radio-camion"
                                        type="radio"
                                        value={2}
                                        checked={radio == 2}
                                        onChange={handleRadio}
                                        disabled={bool}
                                        aria-label="Radio button for following text input" />
                                </div>
                            }
                            {moduloSeguridad &&
                                <div className={styles.radio}>
                                    <label htmlFor="radio-camion">Camión sin Precinto</label>
                                    <input
                                        id="radio-sin-precinto"
                                        type="radio"
                                        value={3}
                                        checked={radio == 3}
                                        onChange={handleRadio}
                                        disabled={bool}
                                        aria-label="Radio button for following text input" />
                                </div>
                            }
                            {alertRadio &&
                                <span className={styles.alertRadio}>
                                    <span className="yellow">¡Por favor selecciones el tipo de transporte!</span>
                                </span>
                            }

                        </div>

                        {((radio != 0) && (radio != 1) && (radio != 3)) &&
                            <span>
                                <div className="mb-3"></div>
                                <div className={styles.line}></div>
                            </span>
                        }

                        {false &&
                            <div className={styles.contenedor7}>

                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Contenedor</InputGroup.Text>
                                    <Form.Control
                                        id="contenedor"
                                        name="contenedor"
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        required
                                        disabled={bool}
                                    />
                                </InputGroup>


                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Termógrafo</InputGroup.Text>
                                    <Form.Control
                                        id="termografo"
                                        name="termografo"
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        required
                                        disabled={bool}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Botella</InputGroup.Text>
                                    <Form.Control
                                        id="botella"
                                        name="botella"
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        required
                                        disabled={bool}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Guaya cont</InputGroup.Text>
                                    <Form.Control
                                        id="guaya-contenedor"
                                        name="guaya-contenedor"
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        required
                                        disabled={bool}
                                    />
                                </InputGroup>

                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Etiqueta</InputGroup.Text>
                                    <Form.Control
                                        id="etiqueta"
                                        name="etiqueta"
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        required
                                        disabled={bool}
                                    />
                                </InputGroup>

                            </div>
                        }
                        {radio == 2 &&
                            <div className={styles.contenedor10}>

                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Precinto plástico</InputGroup.Text>
                                    <Form.Select
                                        id="precinto-plastico"
                                        name="precinto-plastico"
                                        className={styles.select}
                                        size="sm"
                                        disabled={bool}>
                                        {precintos.map((item, index) => {
                                            return (
                                                <option key={index}>{item.serial}</option>
                                            );
                                        })}


                                    </Form.Select>
                                </InputGroup>

                                <InputGroup size="sm" >
                                    <InputGroup.Text id="inputGroup-sizing-sm">Vehículo</InputGroup.Text>
                                    <Form.Control
                                        id="vehiculo"
                                        name="vehiculo"
                                        minLength={6}
                                        required
                                        aria-label="Small"
                                        aria-describedby="inputGroup-sizing-sm"
                                        disabled={bool}
                                    />
                                </InputGroup>

                                {false &&
                                    <InputGroup size="sm" >
                                        <InputGroup.Text id="inputGroup-sizing-sm">Guaya camión</InputGroup.Text>
                                        <Form.Control
                                            id="guaya-camion"
                                            name="guaya-camion"
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            disabled={bool}
                                        />
                                    </InputGroup>
                                }
                            </div>
                        }
                        <div className="mb-3"></div>
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
                                                defaultValue={product.cons_producto}
                                            />
                                        </InputGroup>
                                    </span>

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

                        <div className={styles.contenedor6}>
                            <div>
                                {!bool && <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                                    Añadir producto
                                </Button>}
                            </div>
                            <div>
                                {!bool && <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                                    Remover producto
                                </Button>}
                            </div>
                            <div className={styles.display}></div>
                            <div className={styles.display}></div>
                            <div>
                                {!bool && <Button type="submit" className={styles.button} variant="info" size="sm">
                                    Exportar
                                </Button>}
                                {bool && <Button type="button" onClick={nuevoMovimiento} className={styles.button} variant="primary" size="sm">
                                    Nueva exportación
                                </Button>}
                            </div>
                        </div>

                    </form>
                    <Alertas alert={alert} handleClose={toogleAlert} />
                </Container>
            }
        </>
    );
}
