import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
//Services
import endPoints from '@services/api';
import { actualizarProveedor, buscarProveedor } from '@services/api/proveedores';
//Hooks
import useAlert from '@hooks/useAlert';
//Components
import Paginacion from '@components/Paginacion';
import NuevoProveedor from '@components/administrador/NuevoProveedor';
import Alertas from '@assets/Alertas';
//CSS
import styles from '@styles/Listar.module.css';




const Proveedor = () => {
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
            const res = await axios.get(endPoints.proveedores.pagination(pagination, limit)); //Debo crearlo
            const total = await axios.get(endPoints.proveedores.list);
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
        const item = await buscarProveedor(consecutivo)
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
            const changes = { isBlock: !item.isBlock }
            actualizarProveedor(item.id, changes);
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
                <h3>Proveedores</h3>
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
                            <th scope="col">Razón social</th>
                            <th scope="col">Dirección</th>
                            <th scope="col">Correo</th>
                            <th scope="col">Telefono</th>
                            <th scope="col"></th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody className={styles.letter}>

                        {items.map((item, index) => (
                            <tr key={index}>
                                <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                                <td>{item.consecutivo}</td>
                                <td>{item.razon_social}</td>
                                <td>{item.direccion}</td>
                                <td>{item.email}</td>
                                <td>{item.tel}</td>
                                <td>
                                    <button onClick={() => handleEditar(item)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                                </td>
                                <td>
                                    {item.isBlock && <button onClick={() => handleActivar(item)} type="button" className="btn btn-danger btn-sm w-80">Activar</button>}
                                    {!item.isBlock && <button onClick={() => handleActivar(item)} type="button" className="btn btn-success btn-sm w-80">Desactivar</button>}
                                </td>
                            </tr>
                        ))}

                    </tbody>
                </table>
            </div>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoProveedor setOpen={setOpen} setAlert={setAlert} item={item} />}
        </>
    )
}

export default Proveedor;
