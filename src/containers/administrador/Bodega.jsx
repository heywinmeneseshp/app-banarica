import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
//Services
import endPoints from '@services/api';
import { actualizarAlmacen, buscarAlmacen } from '@services/api/almacenes';
//Components
import NuevaBodega from '@components/administrador/NuevaBodega';
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
//Hooks
import useAlert from '@hooks/useAlert';
//Bootstrap
//CSS
import styles from '@styles/Listar.module.css';

const Bodega = () => {
    const buscardorRef = useRef(null);
    const [almacen, setAlmacen] = useState(null);
    const [almacenes, setAlmacenes] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false)
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        async function listarAlmacenes() {
            const res = await axios.get(endPoints.almacenes.pagination(pagination, limit)); //Debo crearlo
            const total = await axios.get(endPoints.almacenes.list);
            setTotal(total.data.length);
            setAlmacenes(res.data)
        }
        try {
            listarAlmacenes()
        } catch (e) {
            console.log(e);
        }
    }, [alert, pagination])


    const handleNuevo = () => {
        setOpen(true);
        setAlmacen(null)
    };

    const handleEditar = (almacen) => {
        setOpen(true);
        setAlmacen(almacen)
    };

    const buscar = async () => {
        const consecutivo = buscardorRef.current.value; consecutivo
        const almacen = await buscarAlmacen(consecutivo)
        if (almacen == null) {
            setAlert({
                active: true,
                mensaje: 'El almacen no existe',
                color: "danger",
                autoClose: true
            })
        } else {
            setUsuarios([almacen])
            setTotal(1);
        }
    }

    const handleActivar = (almacen) => {
        try {
            const changes = { isBlock: !almacen.isBlock }
            actualizarAlmacen(almacen.consecutivo, changes);
            setAlert({
                active: true,
                mensaje: 'El almacen "' + almacen.consecutivo + '" se ha actualizado',
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
                <h3>Almacenes</h3>
                <div className={styles.cajaBotones}>
                    <div className={styles.botones}>
                        <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
                    </div>
                    <div className={styles.buscar}>
                        <button onClick={buscar} type="button" className="btn btn-light btn-sm">Buscar</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-light btn-sm">Buscar</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-light btn-sm">Ordenar</button>
                    </div>
                </div>

                <table className="table">
                    <thead className={styles.letter}>
                        <tr>
                            <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
                            <th scope="col">C??digo</th>
                            <th scope="col">Alamacen</th>
                            <th scope="col">Raz??n social</th>
                            <th scope="col">Direcci??n</th>
                            <th scope="col">T??lefono</th>
                            <th scope="col">email</th>
                            <th scope="col"></th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody className={styles.letter}>
                        {almacenes.map((almacen, index) => (
                            <tr key={index}>
                                <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>                      
                                <td scope="row">{almacen.consecutivo}</td>
                                <td>{almacen.nombre}</td>
                                <td>{almacen.razon_social}</td>
                                <td>{almacen.direccion}</td>
                                <td>{almacen.telefono}</td>
                                <td>{almacen.email}</td>
                                <td>
                                    <button onClick={() => handleEditar(almacen)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                                </td>
                                <td>
                                    {!almacen.isBlock && <button onClick={() => handleActivar(almacen)} type="button" className="btn btn-danger btn-sm w-80">Activar</button>}
                                    {almacen.isBlock && <button onClick={() => handleActivar(almacen)} type="button" className="btn btn-success btn-sm w-80">Desactivar</button>}
                                </td>
                            </tr>)
                        )}
                    </tbody>
                </table>
            </div>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevaBodega setOpen={setOpen} setAlert={setAlert} almacen={almacen} />}
        </>
    )
}

export default Bodega;
