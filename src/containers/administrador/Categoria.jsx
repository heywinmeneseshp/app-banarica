import React, { useRef, useState, useEffect } from 'react';

//Services

import { actualizarCategorias, filtrarCategorias, listarCategorias } from '@services/api/categorias';
//Hooks
import useAlert from '@hooks/useAlert';
//Components
import NuevaCategoria from '@components/administrador/NuevaCategoria';
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
//CSS
import styles from '@styles/Listar.module.css';
import excel from '@hooks/excel';



const Categoria = () => {
    const buscardorRef = useRef(null);
    const [item, setItem] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    useEffect(() => {
        try {
            listrasItems(pagination, limit).then((res) => {
                setTotal(res.total);
                setItems(res.data);
            });
        } catch (e) {
            alert("Se ha producido un error al listar las categorías");
        }
    }, [alert, pagination]);

    async function listrasItems(page, limit) {
        const nombre = buscardorRef.current.value;
        const res = await filtrarCategorias(page, limit, nombre);
        return res;
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
        listrasItems(pagination, limit).then((res) => {
            setTotal(res.total);
            setItems(res.data);
        });
    };

    const onDescargar = async () => {
       const data = await listarCategorias();
       excel(data, "Categorías", "Categorias");
    };

    const handleActivar = (item) => {
        try {
            const changes = { isBlock: !item.isBlock };
            actualizarCategorias(item.consecutivo, changes);
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
                <h3>Categorías</h3>
                <div className={styles.cajaBotones}>
                    <div className={styles.botones}>
                        <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
                    </div>
                    <div className={styles.buscar}>
                        <input 
                        ref={buscardorRef} 
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
                            <th scope="col">Nombre</th>
                            <th scope="col"></th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody className={styles.letter}>

                        {items.map((item, index) => (
                            <tr key={index}>
                                <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                                <td>{item.consecutivo}</td>
                                <td>{item.nombre}</td>
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
            {open && <NuevaCategoria setOpen={setOpen} setAlert={setAlert} item={item} />}
        </>
    );
};

export default Categoria;
