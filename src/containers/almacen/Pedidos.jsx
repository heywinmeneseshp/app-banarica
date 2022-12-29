import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import AppContext from "@context/AppContext";
//Services
import { agregarPedido, agregarTablePedido } from "@services/api/pedidos";
import endPoints from "@services/api";
//Hooks
import generarFecha from "@hooks/useDate";
import useAlert from "@hooks/useAlert";
import generarSemana from "@hooks/useSemana";
import { useAuth } from "@hooks/useAuth";
//Bootstrap
import { Container } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

//Components
import NuevoAlmacenPedido from "@components/almacen/NuevoAlmacenPedido.jsx";

//CSS
import styles from "@styles/almacen/almacen.module.css";
import Alertas from "@assets/Alertas";
import { encontrarModulo } from "@services/api/configuracion";


export default function Pedidos() {
    const { almacenByUser, user } = useAuth();
    const { gestionPedido } = useContext(AppContext);
    const [deposits, setDeposits] = useState([1]);
    const [date, setDate] = useState(null);
    const formRef = useRef(null);
    const [consPedido, setConsPedido] = useState(null);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [bool, setBool] = useState(false)
    const [observaciones, setObservaciones] = useState(null);
    const [semanaActual, setSemanaActual] = useState(null);

    useEffect(() => {
        gestionPedido.initialize(almacenByUser)
        setDate(generarFecha)
        encontrarModulo('Semana').then(res => setSemanaActual(res[0]))
    }, [])

    function addDeposit() {
        setDeposits([...deposits, deposits.length + 1]);
    }

    function removeDeposit() {
        const array = deposits.slice(0, -1)
        setDeposits(array);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current)
        const observaciones = formData.get("observaciones")
        const week = formData.get("semana");
        const semanaR = await generarSemana(week);
        setObservaciones(observaciones)
        const data = {
            pendiente: true,
            observaciones: observaciones,
            fecha: formData.get('fecha'),
            cons_semana: semanaR,
            usuario: user.username
        }
        let almacenes = []
        console.log(data)
        const res = await agregarTablePedido(data)
        console.log(res)
        setConsPedido(res.data.consecutivo)
        const cons_pedido = res.data.consecutivo
        gestionPedido.listaPedido.map((item, index) => {
            const existe = almacenes.find(element => element == item.cons_almacen_destino)
            if (existe == null) almacenes = [...almacenes, item.cons_almacen_destino]
            agregarPedido(res.data.consecutivo, item)
        })
        almacenes.map(async (cons_alamcen) => {
            const dataNotificacion = {
                almacen_emisor: cons_alamcen,
                almacen_receptor: cons_alamcen,
                cons_movimiento: cons_pedido,
                tipo_movimiento: "Pedido",
                descripcion: "pendiente por recibir",
                aprobado: false,
                visto: false
            }
            const res = await axios.post(endPoints.notificaciones.create, dataNotificacion);
        })
        setAlert({
            active: true,
            mensaje: "Se ha cargado el pedido con éxito",
            color: "success",
            autoClose: false
        })
        setBool(true)
    }

    const nuevoMovimiento = () => {
        setDeposits([]);
        setConsPedido(null);
        setBool(false);
        setObservaciones(null);
        setAlert({
            active: false
        })
        setTimeout(() => {
            setDeposits([1])
        }, 50)
    }

    return (
        <>
            <Container className={styles.contenedorPadre}>

                <form ref={formRef} onSubmit={handleSubmit} >
                    <h2>+ Crear pedido</h2>

                    <div className={styles.contenedor0}>

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={consPedido}
                                disabled={true}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
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

                        <InputGroup size="sm">
                            <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                            <Form.Control
                                type="number"
                                id="semana"
                                name="semana"
                                min={semanaActual?.semana_actual * 1 - semanaActual?.semana_previa}
                                max={semanaActual?.semana_actual * 1 + semanaActual?.semana_siguiente}
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                required
                                disabled={bool}
                            />
                        </InputGroup>

                    </div>

                    {deposits.map((item, key) => (
                        <span key={key}>
                            <NuevoAlmacenPedido formRef={formRef} />
                        </span>
                    ))}

                    <div className={styles.line}></div>
                    <InputGroup className="mb-3" size="sm">
                        <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            id="observaciones"
                            name="observaciones"
                            defaultValue={observaciones}
                            required
                            disabled={bool}
                        />
                    </InputGroup>

                    <div className={styles.line}></div>

                    <div className={styles.contenedor6}>

                        {(user.id_rol == "Super administrador" || user.id_rol == "Administrador") &&
                            <span>
                                {bool && <span></span>}
                                {!bool && <Button className={styles.button} onClick={addDeposit} variant="info" size="sm">
                                    Agregar almacén
                                </Button>}
                            </span>
                        }


                        {(user.id_rol == "Super administrador" || user.id_rol == "Administrador") &&
                            <span>
                                {bool && <span></span>}
                                {!bool && <Button className={styles.buttonB} onClick={removeDeposit} size="sm">
                                    Remover Alamcén
                                </Button>}
                            </span>
                        }
                        <div className={styles.display}></div>
                        <div className={styles.display}></div>
                        {!(user.id_rol == "Super administrador" || user.id_rol == "Administrador") && <div className={styles.display}></div>}
                        {!(user.id_rol == "Super administrador" || user.id_rol == "Administrador") && <div className={styles.display}></div>}
                        <div>
                            {!bool && <Button type='submit' className={styles.button} variant="success" size="sm">
                                Cargar productos
                            </Button>}
                            {bool && <Button type='submit' onClick={nuevoMovimiento} className={styles.button} variant="primary" size="sm">
                                Nuevo pedido
                            </Button>}
                        </div>

                    </div>

                    {bool && <Alertas alert={alert} handleClose={toogleAlert} />}
                </form>
            </Container>
        </>
    );
}