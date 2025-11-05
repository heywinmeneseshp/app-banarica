import React, { useRef, useState, useEffect } from 'react';
import { actualizarCategorias, filtrarCategorias, listarCategorias } from '@services/api/categorias';
import useAlert from '@hooks/useAlert';
import NuevaCategoria from '@components/administrador/NuevaCategoria';
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
import styles from '@styles/Listar.module.css';
import excel from '@hooks/useExcel';
import { FaRegCircle, FaEdit, FaPowerOff } from 'react-icons/fa';

const Categoria = () => {
    const buscardorRef = useRef(null);
    const [item, setItem] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);
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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allItems = items.map(item => item.consecutivo);
            setSelectedItems(allItems);
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectOne = (e, consecutivo) => {
        const selected = [...selectedItems];
        if (e.target.checked) {
            selected.push(consecutivo);
        } else {
            const index = selected.indexOf(consecutivo);
            if (index > -1) selected.splice(index, 1);
        }
        setSelectedItems(selected);
    };

    const handleDesactivarTodos = () => {
        selectedItems.forEach(async (consecutivo) => {
            try {
                const itemToUpdate = items.find(item => item.consecutivo === consecutivo);
                if (itemToUpdate) {
                    const changes = { isBlock: true };
                    await actualizarCategorias(consecutivo, changes);
                }
            } catch (e) {
                setAlert({
                    active: true,
                    mensaje: 'Se ha presentado un error al desactivar los items',
                    color: "danger",
                    autoClose: true
                });
            }
        });
        setAlert({
            active: true,
            mensaje: 'Se han desactivado los items seleccionados',
            color: "success",
            autoClose: true
        });
        setSelectedItems([]); // Limpiar selección después de desactivar
    };

    return (
        <>
            <div>
                <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
                <h3>Categorías</h3>
                <div className="row g-2">
                    <div className="col-12 col-md-1">
                        <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                    </div>
                    <div className="col-12 col-md-1">
                        <button
                            type="button"
                            className="btn btn-danger btn-sm w-100"
                            onClick={handleDesactivarTodos}
                            disabled={selectedItems.length === 0}
                        >Desactivar</button>
                    </div>
                    <div className="col-12 col-md-8">
                        <input 
                            ref={buscardorRef} 
                            className="form-control form-control-sm" 
                            type="text" 
                            placeholder="Buscar"
                            onChange={buscar}
                        />
                    </div>
                    <div className="col-12 col-md-2">
                        <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
                    </div>
                </div>
                <table className="table table-bordered table-sm mt-3">
                    <thead className={styles.letter}>
                        <tr>
                            <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="checkboxAll"
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Código</th>
                            <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Nombre</th>
                            <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Editar</th>
                            <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Activar</th>
                        </tr>
                    </thead>
                    <tbody className={styles.letter}>
                        {items.map((item, index) => (
                            <tr key={index} style={{ height: '1px' }}>
                                <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`checkbox-${index}`}
                                        checked={selectedItems.includes(item.consecutivo)}
                                        onChange={(e) => handleSelectOne(e, item.consecutivo)}
                                    />
                                </td>
                                <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.consecutivo}</td>
                                <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.nombre}</td>
                                <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                    <button
                                        onClick={() => handleEditar(item)}
                                        type="button"
                                         title={"Editar"}
                                        className="btn btn-warning btn-sm"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '25px',
                                            width: "auto",
                                            margin: "auto"
                                        }}
                                    >
                                        
                                        <FaEdit /> {/* Aquí va el ícono de edición */}
                                    </button>
                                </td>
                                <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                    <button
                                        onClick={() => handleActivar(item)}
                                        type="button"
                                            title={item.isBlock ? "Activar" : "Desactivar"}
                                        className={`btn btn-${item.isBlock ? "danger" : "success"} btn-sm`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '25px',
                                            width: "auto",
                                            margin: "auto"
                                        }}
                                    >
                                        
                                        {item.isBlock ? <FaRegCircle /> : <FaPowerOff />}
                                    </button>
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
