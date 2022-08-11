import React, { useEffect, useState, useRef, useContext } from "react";
import AppContext from "@context/AppContext";
//Services
import { agregarPedido, agregarTablePedido } from "@services/api/pedidos";
import { agregarNotificaciones } from "@services/api/notificaciones";
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

    useEffect(() => {
        gestionPedido.initialize()
        gestionPedido.ingresarAlmacenes(almacenByUser)
        setDate(generarFecha)
    }, [])

    function addDeposit() {
        setDeposits([...deposits, deposits.length + 1]);
    }

    function removeDeposit() {
        const array = deposits.slice(0, -1)
        setDeposits(array);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current)
        const week = formData.get("semana");
        const semanaR = generarSemana(week);
        const data = {
            pendiente: true,
            observaciones: formData.get('fecha'),
            fecha: formData.get('fecha'),
            cons_semana: semanaR,
            usuario: "UsuarioPrueba"
        }
        agregarTablePedido(data).then((res) => {
            setConsPedido(res.data.consecutivo)
            gestionPedido.listaPedido.map((item) => {
                agregarPedido(res.data.consecutivo, item)
            })
            const dataNotificacion = {
                almacen_receptor: "BRC",
                cons_movimiento: res.data.consecutivo,
                tipo_movimiento: "Pedido",
                descripcion: "realizado",
                aprobado: true,
                visto: false
            }
            agregarNotificaciones(dataNotificacion)
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
                    {!bool &&
                        <div className={styles.contenedor6}>
                            <div>
                                {(user.id_rol == "Super administrador") &&
                                    <Button className={styles.button} onClick={addDeposit} variant="info" size="sm">
                                        Agregar almacén
                                    </Button>
                                }
                            </div>
                            <div>
                                <Button className={styles.buttonB} onClick={removeDeposit} size="sm">
                                    Remover Alamcén
                                </Button>
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