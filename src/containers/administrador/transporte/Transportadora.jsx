import React, { useRef, useState, useEffect } from 'react';

import { actualizarTransportadora,  listarTransportadoras, paginarTransportadora } from '@services/api/transportadoras';
//Hooks
import useAlert from '@hooks/useAlert';
//Components
import Paginacion from '@components/Paginacion';
import Alertas from '@assets/Alertas';
//CSS
import styles from '@styles/Listar.module.css';
import NuevoTransporte from '@components/administrador/NuevoTransporte';
import excel from '@hooks/useExcel';


const Transportadora = () => {
    const buscardorRef = useRef(null);
    const [item, setItem] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        listrasItems();
    }, [alert, pagination]);

    async function listrasItems() {
        const nombre = buscardorRef.current.value;
        const res = await paginarTransportadora(pagination, limit, nombre);
        setTotal(res.total);
        setItems(res.data);
    }

    const handleNuevo = () => {
        setOpen(true);
        setItem(null);
    };

    const handleEditar = (item) => {
        setOpen(true);
        setItem(item);
    };

    const buscar = async () => {
        setPagination(1);
        listrasItems();
    };

    const onDescargar = async () => {
       const data = await listarTransportadoras();
       excel(data, "Transportadores", "Transportadores");
    };

    const handleActivar = (item) => {
        try {
            const changes = { isBlock: !item.isBlock };
            actualizarTransportadora(item.id, changes);
            setAlert({
                active: true,
                mensaje: 'El item "' + item.consecutivo + '" se ha actualizado',
                color: "success",
                autoClose: true
            });
        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error',
                color: "danger",
                autoClose: true
            });
        }
    };
    return (
        <>
            <div>
                <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
                <h3>Transportadoras</h3>
                <div className={styles.cajaBotones}>
                    <div className={styles.botones}>
                        <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
                    </div>
                    <div className={styles.buscar}>
                        <input ref={buscardorRef} 
                        className="form-control form-control-sm" 
                        type="text" 
                        placeholder="Buscar"
                        onChange={buscar}></input>
                    </div>
                    <div className={styles.botones}>
                        <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
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

                        {items.map((itemA, index) => (
                            <tr key={index}>
                                <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                                <td>{itemA.consecutivo}</td>
                                <td>{itemA.razon_social}</td>
                                <td>{itemA.direccion}</td>
                                <td>{itemA.email}</td>
                                <td>{itemA.tel}</td>
                                <td>
                                    <button onClick={() => handleEditar(itemA)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                                </td>
                                <td>
                                    {itemA.isBlock && <button onClick={() => handleActivar(itemA)} type="button" className="btn btn-danger btn-sm w-80">Activar</button>}
                                    {!itemA.isBlock && <button onClick={() => handleActivar(itemA)} type="button" className="btn btn-success btn-sm w-80">Desactivar</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoTransporte setOpen={setOpen} setAlert={setAlert} item={item} />}
        </>
    );
};

export default Transportadora;
