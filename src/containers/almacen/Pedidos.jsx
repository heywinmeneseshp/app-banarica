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

    useEffect(() => {
        gestionPedido.initialize(almacenByUser)
        setDate(generarFecha)
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
        const semanaR = generarSemana(week);
        setObservaciones(observaciones)
        const data = {
            pendiente: true,
            observaciones: observaciones,
            fecha: formData.get('fecha'),
            cons_semana: semanaR,
            usuario: user.username
        }
        let almacenes = []
        const res = await agregarTablePedido(data)
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

    return (
        <>
            <Container className={styles.contenedorPadre}>

                <form ref={formRef} onSubmit={handleSubmit} >
                    <h2>+ Crear pedido</h2>

                    <div className={styles.contenedor1}>

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Consecutivo</InputGroup.Text>
                            <Form.Control
                                aria-label="Small"
                                aria-describedby="inputGroup-sizing-sm"
                                defaultValue={consPedido}
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

                        <InputGroup size="sm" className="mb-3">
                            <InputGroup.Text id="inputGroup-sizing-sm">Semana</InputGroup.Text>
                            <Form.Control
                                type="number"
                                id="semana"
                                name="semana"
                                min="1"
                                max="52"
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
                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            id="observaciones"
                            name="observaciones"
                            defaultValue={observaciones}
                            disabled={bool}
                        />
                    </InputGroup>
                    <div className={styles.line}></div>
                    {!bool &&
                        <div className={styles.contenedor6}>
                            <div>
                                {(user.id_rol == "Super administrador" || user.id_rol == "Administrador") &&
                                    <Button className={styles.button} onClick={addDeposit} variant="info" size="sm">
                                        Agregar almacén
                                    </Button>
                                }
                            </div>
                            <div>
                                {(user.id_rol == "Super administrador" || user.id_rol == "Administrador") &&
                                    <Button className={styles.buttonB} onClick={removeDeposit} size="sm">
                                        Remover Alamcén
                                    </Button>
                                }
                            </div>
                            <div></div>
                            <div></div>
                            <div>
                                <Button type='submit' className={styles.button} variant="success" size="sm">
                                    Cargar productos
                                </Button>
                            </div>

                        </div>
                    }
                    {bool && <Alertas alert={alert} handleClose={toogleAlert} />}
                </form>
            </Container>
        </>
    );
}