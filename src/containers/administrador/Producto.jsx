import React, { useState, useEffect } from 'react';
import axios from 'axios';
//Services
import endPoints from '@services/api';
import { actualizarProducto, listarProductos } from '@services/api/productos';
//Hooks
import useAlert from '@hooks/useAlert';
import useExcel from '@hooks/useExcel';
//Components
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
import NuevoProducto from '@components/administrador/NuevoProducto';
//CSS
import styles from '@styles/Listar.module.css';


const Producto = () => {


    const [producto, setProducto] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false)
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [changeAll, setChangeAll ] = useState(false)
    const [checkbox, setCheckbox] = useState(new Array(10).fill(false))
    const limit = 10;


    useEffect(() => {
        async function listrasItems() {
            const res = await axios.get(endPoints.productos.pagination(pagination, limit, "")); //Debo crearlo
            setTotal(res.data.total);
            setItems(res.data.data)           
        }
        try {
            listrasItems()
        } catch (e) {
            alert("Error al cargar los productos", "error")
        }
    }, [alert, pagination])


    const handleNuevo = () => {
        setOpen(true);
        setProducto(null)
    };
    
    const handleEnable = () => {
        console.log("Aja")
    };

    const handleEditar = (item) => {
        setOpen(true);
        setProducto(item)
    };

    const onDescargar = async ()  => {
        const data = await listarProductos()
        useExcel(data, "Productos", "Productos")
    }

    const handleChangeBuscardor = async (e) => {
        const name = e.target.value;
        const res = await axios.get(endPoints.productos.pagination(pagination, limit, name)); //Debo crearlo
        setTotal(res.data.total);
        setItems(res.data.data)  
    }

    const onChangeAll = () => {
        setChangeAll(!changeAll)
        setCheckbox(new Array(checkbox.length).fill(!changeAll)) 
    }

    const onChangeCheckBox = (position) => {
        const updatedCheckedState = checkbox.map((item, index) =>
            index === position ? !item : item
        );
        setCheckbox(updatedCheckedState);
    }

    const handleActivar = (item) => {
        try {
            const changes = { isBlock: !item.isBlock }
            actualizarProducto(item.id, changes);
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
        <div>
            <Alertas alert={alert} handleClose={toogleAlert} />
            <h3>Productos</h3>
            <div className={styles.cajaBotones}>
                <div className={styles.botones}>
                    <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                </div>
                <div className={styles.botones}>
                    <button 
                    type="button" 
                    className="btn btn-danger btn-sm w-100"
                    onClick={handleEnable}
                    >Desactivar</button>
                </div>
                <div className={styles.buscar}>
                    <input
                        className="form-control form-control-sm w-90"
                        type="text"
                        placeholder="Buscar"
                        onChange={handleChangeBuscardor}
                    ></input>
                </div>
                <div className={styles.botones}>
                    <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
                </div>
            </div>

            <table className="table">
                <thead className={styles.letter}>
                    <tr>
                        <th><input onChange={onChangeAll} type="checkbox" id="topping" name="topping" checked={changeAll}/></th>
                        <th scope="col">Cod</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Proveedor</th>
                        <th scope="col">Serial</th>
                        <th scope="col">Salida sin stock</th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody className={styles.letter}>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td><input onChange={() => onChangeCheckBox(index)} type="checkbox" id={`box-${index}`} name="topping" checked={checkbox[index]} /></td>
                            <td>{item.consecutivo}</td>
                            <td>{item.name}</td>
                            <td>{item.cons_categoria}</td>
                            <td>{item.cons_proveedor}</td>
                            <td>{item.serial ? "SI" : "NO"}</td>
                            <td>{item.salida_sin_stock ? "SI" : "NO"}</td>
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
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoProducto setOpen={setOpen} setAlert={setAlert} producto={producto} />}
        </div>
    )
}

export default Producto;
