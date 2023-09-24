import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
//Serviec
import { agregarMovimiento, bucarDoumentoMovimiento, actualizarMovimiento } from "@services/api/movimientos";
import { agregarNotificaciones } from "@services/api/notificaciones";
import { agregarHistorial } from "@services/api/historialMovimientos";
import { restar, sumar } from "@services/api/stock";
import { filtrarProductos } from "@services/api/productos";
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


export default function Ajuste({ exportacion, movimiento }) {
    const formRef = useRef();
    const router = useRouter();
    const { almacenByUser, user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [prodcuctsCons, setProductsCons] = useState([]);
    const [bool, setBool] = useState(false);
    const [consMovimiento, setConsMovimiento] = useState([]);
    const [date, setDate] = useState();
    const [tipoMovimiento, setTipoMovimiento] = useState(null);
    const [almacen, setAlmacen] = useState(null);
    const [semana, setSemana] = useState(null);
    const [observaciones, setObservaciones] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [titulo, setTitulo] = useState("Ajuste");
    const [semanaActual, setSemanaActual] = useState(null);
    const [editarMovimiento, setEditarMovimiento] = useState(true);
    const [movimientoID, setMovimientoID] = useState(null);

    useEffect(() => {
        if (exportacion) setTitulo(exportacion);
        if (!movimiento) { 
            const listar = async () => {
                const fecha = generarFecha();
                setDate(fecha);
                const almacenes = almacenByUser.map(item => item.consecutivo);
                const data = { "stock": { "isBlock": false, "cons_almacen": almacenes } };
                const productlist = await filtrarProductos(data);
                setProductos(productlist);
                encontrarModulo("Semana").then(res => setSemanaActual(res[0]));
            };
            listar();
        } else {
            bucarDoumentoMovimiento(movimiento.consecutivo).then(res => {
                setMovimientoID(res.movimiento.id);
                setConsMovimiento(res.movimiento.consecutivo);//Listo
                setAlmacen(res.almacen);//Listo
                setTipoMovimiento(res.razon_movimiento);//Listo
                setDate(res.movimiento.fecha);//Listo
                setSemana(res.movimiento.cons_semana);//Listo
                setProducts(res.lista);//Listo
                setProductsCons(res.lista);//Listo
                setObservaciones(res.movimiento.observaciones); //Listo
            });
            setBool(true);
        }
    }, [movimiento?.consecutivo, movimiento, date]);


    const [products, setProducts] = useState([1]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    };
    function removeProduct() {
        const array = products.slice(0, -1);
        setProducts(array);
    };
    function onEditarMovimiento() {
        setEditarMovimiento(!editarMovimiento);
    };
    function onCancelarActualizacion() {
        router.push(`/`);
    };
    function onActualizarMovimiento() {

        if (!editarMovimiento) {
            const formData = new FormData(formRef.current);
            const week = formData.get("semana");
            const anho = formData.get("anho_actual");
            actualizarMovimiento(movimientoID, {
                "fecha": formData.get("fecha"),
                "cons_semana": `S${week}-${anho}`,
            });
        };
        setEditarMovimiento(!editarMovimiento);
        window.alert('Movimiento actualizado');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const almacenR = formData.get('almacen');
        const tipoDeMovimiento = formData.get('tipo-movimiento');
        const fecha = formData.get("fecha");
        const semanaR = await generarSemana(formData.get('semana'));
        const observacionesR = formData.get("observaciones");
        const consAlmacen = almacenByUser.find((item) => item.nombre == almacenR).consecutivo;
        let tipo;
        if (tipoDeMovimiento == "Sobrante") tipo = "Entrada";
        if (tipoDeMovimiento == "Faltante") tipo = "Salida";
        try {
            setAlmacen(almacenR);
            setTipoMovimiento(tipoDeMovimiento);
            setDate(fecha);
            setSemana(semanaR);
            setObservaciones(observacionesR);
            const data = {
                "prefijo": "AJ",
                "pendiente": false,
                "observaciones": observacionesR,
                "cons_semana": semanaR,
                'realizado_por': user.username,
                'aprobado_por': user.username,
                "fecha": fecha
            };

            //VAMOS EN ESTE LUGAR ¡¡¡¡ATENCION!!!!!
            agregarMovimiento(data).then(res => {//ESTA FUNCION NO EXISTE
                const consMovimiento = res.data.consecutivo;
                setConsMovimiento(consMovimiento);
                const dataNotificacion = {
                    almacen_emisor: consAlmacen,
                    almacen_receptor: "BRC",
                    cons_movimiento: consMovimiento,
                    tipo_movimiento: "Ajuste",
                    descripcion: "realizado",
                    aprobado: true,
                    visto: false
                };
                agregarNotificaciones(dataNotificacion);
                let array = [];
                products.map((product, index) => {
                    const producto = productos.find(producto => producto.name == formData.get(`producto-${index}`));
                    const data = { cons_producto: producto.consecutivo, nombre: producto.name, cantidad: formData.get(`cantidad-${index}`) };
                    array.push(data);
                    const dataHistorial = {
                        cons_movimiento: consMovimiento,
                        cons_producto: producto.consecutivo,
                        cons_almacen_gestor: consAlmacen,
                        cons_lista_movimientos: "AJ",
                        tipo_movimiento: tipo,
                        razon_movimiento: tipoDeMovimiento,
                        cantidad: formData.get("cantidad-" + index)
                    };
                    if (tipoDeMovimiento == "Sobrante") sumar(consAlmacen, producto.consecutivo, dataHistorial.cantidad);
                    if (tipoDeMovimiento == "Faltante") restar(consAlmacen, producto.consecutivo, dataHistorial.cantidad);
                    agregarHistorial(dataHistorial);
                });
                setProductsCons(array);
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
        setBool(true);
    };
    return (
        <>
            <Container>
                <form ref={formRef} onSubmit={handleSubmit}>
                    <h2 className="mb-3">{titulo}</h2>
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
                                className={styles.select}
                                size="sm"
                                disabled={bool}>
                                {!bool && almacenByUser.map((item, index) => (
                                    <option key={index}>{item.nombre}</option>
                                ))}
                                {bool && <option>{almacen}</option>}
                            </Form.Select>
                        </InputGroup>

                        <Form.Select className={styles.select}
                            id="tipo-movimiento"
                            name="tipo-movimiento"
                            disabled={bool}
                            size="sm">
                            {!bool && <option>Sobrante</option>}
                            {!bool && <option>Faltante</option>}
                            {bool && <option>{tipoMovimiento}</option>}
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
                                disabled={bool && editarMovimiento}
                            />
                        </InputGroup>


                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                id="semana"
                                min={semanaActual?.semana_actual * 1 - semanaActual?.semana_previa}
                                max={semanaActual?.semana_actual * 1 + semanaActual?.semana_siguiente}
                                name="semana"
                                type="number"
                                required
                                disabled={bool && editarMovimiento}
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
                                disabled={editarMovimiento}
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
                                            defaultValue={prodcuctsCons[key]?.cons_producto}
                                        />
                                    </InputGroup>
                                </span>

                                <InputGroup size="sm" className="mb-3">
                                    <InputGroup.Text id="inputGroup-sizing-sm">Artículo</InputGroup.Text>
                                    <Form.Select className={styles.select} id={"producto-" + key} name={"producto-" + key} size="sm" disabled={bool}>
                                        {!bool && productos.map((item, index) => {
                                            return <option key={index}>{item.name}</option>;
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
                                        min={0}
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
                            </Button>
                            }
                        </div>
                        <div>
                            {!bool && <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                                Remover producto
                            </Button>}
                        </div>
                        <div className={styles.display}></div>
                        <div className={styles.display}>
                            {bool && (user?.id_rol == "Super administrador") &&
                                !editarMovimiento &&
                                <Button onClick={onCancelarActualizacion} className={styles.button} variant="danger" size="sm">
                                    Cancelar  actualización
                                </Button>}
                        </div>
                        <div>
                            {!bool && <Button type="submit" className={styles.button} variant="danger" size="sm">
                                Ajustar
                            </Button>}
                            {bool && (user?.id_rol == "Super administrador") &&
                                editarMovimiento &&
                                <Button onClick={onEditarMovimiento} className={styles.button} variant="warning" size="sm">
                                    Modificar movimiento
                                </Button>}
                            {bool && (user?.id_rol == "Super administrador") &&
                                !editarMovimiento &&
                                <Button onClick={onActualizarMovimiento} className={styles.button} variant="warning" size="sm">
                                    Actualizar movimiento
                                </Button>}
                        </div>
                    </div>

                </form>
                <Alertas alert={alert} handleClose={toogleAlert} />
            </Container>
        </>
    );
}
