import React, { useRef, useState } from "react";
import { useAuth } from "@hooks/useAuth";

//CSS
import styles from "@styles/Seguridad.module.css"
import { useEffect } from "react";
import { listarAlmacenes } from "@services/api/almacenes";
import { actualizarSeriales, listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import Paginacion from "@components/Paginacion";
import { agregarTraslado } from "@services/api/traslados";
import useDate from "@hooks/useDate";
import useAlert from "@hooks/useAlert";
import Alertas from "@assets/Alertas";
import useSemana from "@hooks/useSemana";
import { agregarNotificaciones } from "@services/api/notificaciones";
import { agregarHistorial } from "@services/api/historialMovimientos";


export default function Transferencias() {
    const limitRef = useRef()
    const formRef = useRef()
    const checkRef = useRef()
    const { almacenByUser } = useAuth();
    const [almacenes, setAlmacenes] = useState([]);
    const [tabla, setTabla] = useState([1]);
    const [total, setTotal] = useState(0);
    const [checkAll, setCheckAll] = useState(false)
    const [checKs, setChecks] = useState([])
    const [limit, setLimit] = useState(20);
    const [productos, setProductos] = useState([]);
    const [pagination, setPagination] = useState(1);
    const { alert, setAlert, toogleAlert } = useAlert();

    useEffect(() => {
        const listar = async () => {
            const formData = new FormData(formRef.current)
            const data = {
                cons_producto: formData.get("producto"),
                serial: formData.get("serial"),
                bag_pack: formData.get("bag_pack"),
                s_pack: formData.get("s_pack"),
                m_pack: formData.get("m_pack"),
                l_pack: formData.get("l_pack"),
                cons_almacen: formData.get("origen"),
                available: [true]
            }
            listarSeriales(pagination, limit, data).then(res => {
                setTabla(res.data);
                setTotal(res.total);
                const array = res.data.map(() => {
                    return false
                })
                setChecks(array)
            });
        }
        listarAlmacenes().then(res => setAlmacenes(res));
        listarProductosSeguridad().then(res => setProductos(res.filter(item => item.serial == true)))
        buscarArticulos();
        listar()
    }, [limit, pagination])

    const buscarArticulos = async () => {
        setPagination(1)
        const formData = new FormData(formRef.current)
        const data = {
            cons_producto: formData.get("producto"),
            serial: formData.get("serial"),
            bag_pack: formData.get("bag_pack"),
            s_pack: formData.get("s_pack"),
            m_pack: formData.get("m_pack"),
            l_pack: formData.get("l_pack"),
            cons_almacen: formData.get("origen"),
            available: [true]
        }
        listarSeriales(pagination, limit, data).then(res => {
            setTabla(res.data);
            setTotal(res.total);
            const array = res.data.map(() => {
                return false
            })
            setChecks(array)
        });
    }

    const handleLimit = () => {
        const limit = limitRef.current.value ? limitRef.current.value : 1
        setLimit(limit)
    }

    const handleCheckAll = () => {
        const array = checKs.fill(!checkAll)
        const newChecks = checKs.map((item, index) => {
            return !checkAll
        });
        setChecks(newChecks)
        setCheckAll(!checkAll);
    }

    const hadleChecks = (position) => {
        setCheckAll(false)
        const newChecks = checKs.map((item, index) =>
            index === position ? !item : item
        );
        setChecks(newChecks);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(formRef.current)
            if (formData.get("destino") == formData.get("origen")) {
               return  setAlert({
                    active: true,
                    mensaje: "El origen y el destin no pueden ser el mismo.",
                    color: "danger",
                    autoClose: false
                })
            }
            let tranferencias = [];
            let claves = {}
            checKs.forEach((item, index) => {
                if (item == true) {
                    if (claves.hasOwnProperty(tabla[index].cons_producto)) {
                        claves[tabla[index].cons_producto] = claves[tabla[index].cons_producto] + 1
                    } else {
                        claves[tabla[index].cons_producto] = 1
                    }
                    let tranferencia = tabla[index];
                    tranferencia["cons_almacen"] = formData.get("destino");
                    tranferencias.push(tabla[index]);
                }
            })
            await actualizarSeriales(tranferencias);
            const semana = useSemana(formData.get("semana"))
            const data = {
                transportadora: "No aplica",
                conductor: "No aplica",
                vehiculo: "No aplica",
                origen: formData.get("origen"),
                destino: formData.get("destino"),
                estado: "Pendiente",
                fecha_salida: formData.get("fecha"),
                semana: semana
            };

            const traslado = await agregarTraslado(data)
            const cons_traslado = traslado.data.consecutivo;
            console.log(cons_traslado)
            for (const property in claves) {
                const dataHistorial = {
                    cons_movimiento: cons_traslado,
                    cons_producto: property,
                    cons_almacen_gestor: data.origen,
                    cons_almacen_receptor: data.destino,
                    cons_lista_movimientos: "TR",
                    tipo_movimiento: "Traslado",
                    cantidad: claves[property]
                };
                //sumar(almacen, consecutiveProdcut, formData.get("cantidad-" + index));
                agregarHistorial(dataHistorial);
            }
            const dataNotificacion = {
                almacen_emisor: data.origen,
                almacen_receptor: data.destino,
                cons_movimiento: cons_traslado,
                tipo_movimiento: "Traslado",
                descripcion: "pendiente por recibir",
                aprobado: false,
                visto: false
            };
            agregarNotificaciones(dataNotificacion);
            setPagination(1)
            setAlert({
                active: true,
                mensaje: "Transferencia pendiente por acetación",
                color: "success",
                autoClose: false
            })
        } catch (e) {
            console.log(e)
            setAlert({
                active: true,
                mensaje: "Error en la transferencia",
                color: "danger",
                autoClose: false
            })
        }
    }

    return (
        <>
            <form ref={formRef} onSubmit={handleSubmit}>
                <h2>Transferencias</h2>
                <div className={styles.grid_tranferencias}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Orígen</span>
                        <select className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            onChange={buscarArticulos}
                            id="origen"
                            name="origen">
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div
                        className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Destino</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            onChange={buscarArticulos}
                            id="destino"
                            name="destino">
                            {almacenes.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="producto"
                            name="producto"
                            onChange={buscarArticulos}
                        >
                            <option value={""}>All</option>
                            {productos.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Semana</span>
                        <input type="number"
                            className="form-control"
                            aria-label="Sizing example input"
                            id="semana"
                            name="semana"
                            min={1}
                            max={52}
                            required
                            onChange={buscarArticulos}
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Fecha</span>
                        <input type="date"
                            className="form-control"
                            aria-label="Sizing example input"
                            id="fecha"
                            name="fecha"
                            onChange={buscarArticulos}
                            defaultValue={useDate()}
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Serial</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            id="serial"
                            name="serial"
                            onChange={buscarArticulos}
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Bag Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            id="bag_pack"
                            onChange={buscarArticulos}
                            name="bag_pack"></input>
                    </div>

                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">S Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            id="s_pack"
                            onChange={buscarArticulos}
                            name="s_pack"></input>
                    </div>


                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">M Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            onChange={buscarArticulos}
                            id="m_pack"
                            name="m_pack"></input>
                    </div>


                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">L Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            onChange={buscarArticulos}
                            id="l_pack"
                            name="l_pack"></input>
                    </div>

                </div>
                <Alertas className="mt-3" alert={alert} handleClose={toogleAlert} />
                <div className="line"></div>

                <div>

                    <div className={styles.grid_result}>
                        <div className={styles.botonesTrans}>
                            <span className={styles.grid_result_child2}>
                                <input type="number" onChange={handleLimit}
                                    className="form-control form-control-sm"
                                    id="limit"
                                    name="limit"
                                    typeof="number"
                                    min={1}
                                    max={total}
                                    ref={limitRef}
                                    placeholder={limit}></input>
                                <span className="mb-2 mt-2">Resultados de {total}</span>
                            </span>
                            <span></span>
                            <span></span>
                            <button type="submit" className="btn btn-success btn-sm w-100">Realizar Transferencia</button>
                        </div>
                    </div>

                    <span className={styles.tabla_text}>

                        <table className="table mb-4 table-striped cont_tabla">
                            <thead>
                                <tr>
                                    <th scope="row">
                                        <input className="form-check-input"
                                            type="checkbox"
                                            id="checkAll"
                                            name="checkAll"
                                            ref={checkRef}
                                            onChange={() => handleCheckAll()}
                                            checked={checkAll}
                                        ></input>
                                    </th>
                                    <th scope="col">Alm</th>
                                    <th scope="col">Artículo</th>
                                    <th scope="col">Serial</th>
                                    <th scope="col">Bag Pack</th>
                                    <th scope="col">S Pack</th>
                                    <th scope="col">M Pack</th>
                                    <th scope="col">L Pack</th>
                                    <th className={styles.display} scope="col">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabla.map((item, index) => {
                                    return (
                                        <tr key={index}>
                                            <th scope="row">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox" id={`check-${index}`}
                                                    name={`check-${index}`}
                                                    checked={checKs[index]}
                                                    onChange={() => hadleChecks(index)}
                                                ></input>
                                            </th>
                                            <td>{item?.cons_almacen}</td>
                                            <td>{item?.cons_producto}</td>
                                            <td>{item?.serial}</td>
                                            <td>{item?.bag_pack}</td>
                                            <td>{item?.s_pack}</td>
                                            <td>{item?.m_pack}</td>
                                            <td>{item?.l_pack}</td>
                                            <td className={styles.display}>{item?.available == true ? "Disponible" : "Usado"}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        <span className="container">
                            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                        </span>
                    </span>
                </div>
            </form>
        </>
    )
}