import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
//Services
import endPoints from '@services/api';
import { actualizarConductor, buscarConductor } from '@services/api/conductores';
//Hooks
import useAlert from '@hooks/useAlert';
//Components
import Paginacion from '@components/Paginacion';
import Alertas from '@assets/Alertas';
import NuevoConductor from '@components/administrador/NuevoConductor';
//CSS
import styles from '@styles/Listar.module.css';

const Conductor = () => {
    const buscardorRef = useRef(null);
    const [item, setItem] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false)
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        async function listrasItems() {
            const res = await axios.get(endPoints.conductores.pagination(pagination, limit)); //Debo crearlo
            const total = await axios.get(endPoints.conductores.list);
            setTotal(total.data.length);
            setItems(res.data)
        }
        try {
            listrasItems()
        } catch (e) {
            console.log(e);
        }
    }, [alert, pagination])


    const handleNuevo = () => {
        setOpen(true);
        setItem(null)
    };

    const handleEditar = (item) => {
        setOpen(true);
        setItem(item)
    };

    const buscar = async () => {
        const consecutivo = buscardorRef.current.value; consecutivo
        const item = await buscarConductor(consecutivo)
        if (item == null) {
            setAlert({
                active: true,
                mensaje: 'El almacen no existe',
                color: "danger",
                autoClose: true
            })
        } else {
            setItems([item])
            setTotal(1);
        }
    }

    const handleActivar = (item) => {
        try {
            const changes = { isBlock: true }
            if (item.isBlock === "1") changes.isBlock = false
            actualizarConductor(item.consecutivo, changes);
            setAlert({
                active: true,
                mensaje: 'El item "' + item.consecutivo + '" se ha actualizado',
                color: "success",
                autoClose: true
            })
        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error',
                color: "danger",
                autoClose: true
            })
        }
    }
    return (
        <>
            <div>
                <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
                <h3>Conductores</h3>
                <div className={styles.cajaBotones}>
                    <div className={styles.botones}>
                        <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
                    </div>
                    <div className={styles.buscar}>
                        <input ref={buscardorRef} className="form-control form-control-sm" type="text" placeholder="Buscar"></input>
                    </div>
                    <div className={styles.botones}>
                        <button onClick={buscar} type="button" className="btn btn-light btn-sm">Buscar</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-light btn-sm">Ordenar</button>
                    </div>
                </div>

                <table className="table">
                    <thead className={styles.letter}>
                        <tr>
                            <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
                            <th scope="col">Código</th>
                            <th scope="col">Conductor</th>
                            <th scope="col">Transportadora</th>
                            <th scope="col">Correo</th>
                            <th scope="col">Telefono</th>
                            <th scope="col"></th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody className={styles.letter}>

                        {items.map((itemA, index) => (
                            <tr key={index}>
                                <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                                <td>{itemA.consecutivo}</td>
                                <td>{itemA.conductor}</td>
                                <td>{itemA.cons_transportadora}</td>
                                <td>{itemA.email}</td>
                                <td>{itemA.tel}</td>
                                <td>
                                    <button onClick={() => handleEditar(itemA)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                                </td>
                                <td>
                                    {(itemA.isBlock === "1") && <button onClick={() => handleActivar(itemA)} type="button" className="btn btn-danger btn-sm w-80">Activar</button>}
                                    {(itemA.isBlock === "0") && <button onClick={() => handleActivar(itemA)} type="button" className="btn btn-success btn-sm w-80">Desactivar</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoConductor setOpen={setOpen} setAlert={setAlert} item={item} />}
        </>
    )
}

export default Conductor;
