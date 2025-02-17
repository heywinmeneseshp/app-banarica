import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
//Services
import endPoints from '@services/api';
import { actualizarProducto, listarProductos } from '@services/api/productos';
//Hooks
import useAlert from '@hooks/useAlert';
import excel from '@hooks/useExcel';
//Components
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
import NuevoProducto from '@components/administrador/NuevoProducto';
//CSS
import styles from '@styles/Listar.module.css';
import { FaPowerOff, FaRegCircle, FaEdit } from 'react-icons/fa';


const Producto = () => {

    const refBuscador = useRef();
    const [producto, setProducto] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [changeAll, setChangeAll] = useState(false);
    const [checkbox, setCheckbox] = useState(new Array(10).fill(false));
    const limit = 10;


    useEffect(() => {
        async function listrasItems() {
            const buscador = refBuscador.current.value;
            const res = await axios.get(endPoints.productos.pagination(pagination, limit, buscador)); //Debo crearlo
            setTotal(res.data.total);
            setItems(res.data.data);
        }
        try {
            listrasItems();
        } catch (e) {
            alert("Error al cargar los productos", "error");
        }
    }, [alert, pagination]);


    const handleNuevo = () => {
        setOpen(true);
        setProducto(null);
    };

    const handleEnable = () => {
        const selectedItems = items.filter((item, index) => checkbox[index]);
        if (selectedItems.length === 0) {
            setAlert({
                active: true,
                mensaje: 'Debe seleccionar al menos un producto para desactivar.',
                color: "danger",
                autoClose: true
            });
            return;
        }
        selectedItems.forEach((item) => {
            const changes = { isBlock: true };  // Asumiendo que quieres desactivar el producto
            actualizarProducto(item.id, changes);
        });
        setCheckbox(new Array(10).fill(false));
        setChangeAll(false);
        setAlert({
            active: true,
            mensaje: 'Los productos seleccionados han sido desactivados.',
            color: "success",
            autoClose: true
        });
    };

    const handleEditar = (item) => {
        setOpen(true);
        setProducto(item);
    };

    const onDescargar = async () => {
        const data = await listarProductos();
        excel(data, "Productos", "Productos");
    };

    const handleChangeBuscardor = async (e) => {
        setPagination(1);
        const name = e.target.value;
        const res = await axios.get(endPoints.productos.pagination(pagination, limit, name)); //Debo crearlo
        setTotal(res.data.total);
        setItems(res.data.data);
    };

    const onChangeAll = () => {
        setChangeAll(!changeAll);
        setCheckbox(new Array(checkbox.length).fill(!changeAll));
    };

    const onChangeCheckBox = (position) => {
        const updatedCheckedState = checkbox.map((item, index) =>
            index === position ? !item : item
        );
        setCheckbox(updatedCheckedState);
    };

    const handleActivar = (item) => {
        try {
            const changes = { isBlock: !item.isBlock };
            actualizarProducto(item.id, changes);
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
        <div>
            <Alertas alert={alert} handleClose={toogleAlert} />
            <h3>Productos</h3>
            <div  className="row g-2">
                <div className="col-12 col-md-1">
                    <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                </div>
                <div className="col-12 col-md-1">
                    <button
                        type="button"
                        className="btn btn-danger btn-sm w-100"
                        onClick={handleEnable}
                    >Desactivar</button>
                </div>
                <div className="col-12 col-md-8">
                    <input
                        className="form-control form-control-sm w-90"
                        type="text"
                        placeholder="Buscar"
                        ref={refBuscador}
                        onChange={handleChangeBuscardor}
                    ></input>
                </div>
                <div className="col-12 col-md-2">
                    <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
                </div>
            </div>

            <table className="table table-bordered table-sm mt-3">
                <thead >
                    <tr>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                            <input
                                onChange={onChangeAll}
                                type="checkbox"
                                id="topping"
                                name="topping"
                                checked={changeAll}
                                className="form-check-input"
                            />
                        </th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Cod</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Nombre</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Categoría</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Proveedor</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Serial</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Salida sin stock</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}></th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}></th>
                    </tr>
                </thead>
                <tbody className={styles.letter}>
                    {items.map((item, index) => (
                        <tr key={index} style={{ height: '1px' }}>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                                <input
                                    onChange={() => onChangeCheckBox(index)}
                                    type="checkbox"
                                    id={`box-${index}`}
                                    name="topping"
                                    checked={checkbox[index]}
                                    className="form-check-input"
                                />
                            </td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.consecutivo}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.name}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.cons_categoria}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.cons_proveedor}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.serial ? "SI" : "NO"}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.salida_sin_stock ? "SI" : "NO"}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                <button
                                    onClick={() => handleEditar(item)}
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '25px',
                                        width: 'auto',
                                        margin: 'auto',
                                    }}
                                >
                                   <FaEdit />
                                </button>
                            </td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                          
                                    <button
                                        onClick={() => handleActivar(item)}
                                        type="button"
                                        className={`btn btn-${item.isBlock ? "danger" : "success"} btn-sm`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '25px',
                                            width: 'auto',
                                            margin: 'auto',
                                        }}
                                    >
                                       {item.isBlock ? <FaRegCircle /> : <FaPowerOff />}
                                    </button>
                                
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoProducto setOpen={setOpen} setAlert={setAlert} producto={producto} />}
        </div>
    );
};

export default Producto;
