import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
//Services
import { actualizarProducto, agregarProducto } from '@services/api/productos';
import { habilitarProductoEnAlmacen, crearStock } from '@services/api/stock';
import { listarProveedores } from '@services/api/proveedores';
import endPoints from '@services/api';
//Components
//CSS
import styles from '@styles/admin/crearProducto.module.css';
import { listarCategorias } from '@services/api/categorias';


export default function NuevoProducto({ setAlert, setOpen, producto }) {

    const formRef = useRef(null);
    const [checkedState, setcheckedState] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [serial, setSerial] = useState(false);
    const [salida_sin_stock, setSalida_sin_stock] = useState(false);
    const [permitir_traslados, setPermitir_traslados] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    useEffect(() => {
        async function listarAlmacenes() {
            const res = await axios.get(endPoints.almacenes.list);
            let array = new Array(res.data.length).fill(false);
            if (producto) {
                const resB = await axios.get(endPoints.stock.findOneProductInAll(producto.consecutivo));
                res.data.map((almacen, index) => {
                    resB.data.map((item) => {
                        if (almacen.consecutivo === item.cons_almacen) {
                            array[index] = !item.isBlock;
                        }
                    });
                });
                setcheckedState(array);
                setPermitir_traslados(producto.permitir_traslados);
                setSerial(producto.serial);
                setSalida_sin_stock(producto.salida_sin_stock);
            } else {
                setcheckedState(array);
            }
            setAlmacenes(res.data);
            listarCategorias().then(res => {
                setCategorias(res);
            });
            listarProveedores().then(res => {
                setProveedores(res);
            });
        }
        try {
            listarAlmacenes();
        } catch (e) {
            alert("Se ha producido un error al cargar los almacenes");
        }
    }, [producto]);

    const handleChange = (position) => {
        const updatedCheckedState = checkedState.map((item, index) =>
            index === position ? !item : item
        );
        setcheckedState(updatedCheckedState);
    };

    const handleChangeBool = (botonName) => {
        if (botonName === "permitir_traslado") setPermitir_traslados(!permitir_traslados);
        if (botonName === "salida_sin_stock") setSalida_sin_stock(!salida_sin_stock);
        if (botonName === "serial") setSerial(!serial);
    };


    let styleBoton = { color: "success", text: "Agregar producto" };
    if (producto) styleBoton = { color: "warning", text: "Editar producto" };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const proveedor = proveedores.find(item => item.razon_social === formData.get('proveedor'));
        const data = {
            name: formData.get('name'),
            bulto: formData.get('bulto'),
            cons_categoria: formData.get('categoria'),
            cons_proveedor: proveedor.consecutivo,
            salida_sin_stock: salida_sin_stock,
            serial: serial,
            permitir_traslados: permitir_traslados,
            costo: 0,
            isBlock: false
        };

        if (producto === null) {
            try {
                agregarProducto(data).then((res) => {
                    almacenes.map((almacen, index) => {
                        crearStock(almacen.consecutivo, res.consecutivo, !checkedState[index]);
                    });
                });
                setAlert({
                    active: true,
                    mensaje: "El producto ha sido creado con exito",
                    color: "success",
                    autoClose: true
                });
                setOpen(false);
            } catch (e) {
                alert("Se ha presentado un error al crear el producto");
            }
        } else {
            actualizarProducto(producto.id, data).then(() => {
                almacenes.map((almacen, index) => {
                    habilitarProductoEnAlmacen(almacen.consecutivo, producto.consecutivo, !checkedState[index]);
                });
            });
            setAlert({
                active: true,
                mensaje: 'El producto se ha actualizado',
                color: "success",
                autoClose: true
            });
            setOpen(false);
        }
    };
    return (
        <div>
            <div className={styles.tableros}>
                <div className={styles.padre}>
                    <div className={styles.ex}><span tabIndex={0} role="button" onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit} >
                        <span>
                            <div className={styles.formulario}>
                                <div className={styles.grupo}>
                                    <label htmlFor="consecutivo">Código</label>
                                    <div>
                                        <input defaultValue={producto?.consecutivo} type="text" className="form-control form-control-sm" name="consecutivo" id="consecutivo" disabled></input>
                                    </div>
                                </div>

                                <div className={styles.grupo}>
                                    <label htmlFor="proveedor">Proveedor</label>
                                    <div>
                                        <select id="proveedor" name='proveedor' className="form-select form-select-sm">
                                            {proveedores.map((proveedor, index) => {
                                                return <option key={index} selected={producto?.cons_proveedor == proveedor.consecutivo}>{proveedor.razon_social}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.grupo}>
                                    <label htmlFor="categoria">Categoría</label>
                                    <div>
                                        <select id="categoria" name='categoria' className="form-select form-select-sm">
                                            {categorias.map((categoria, index) => {
                                                return <option key={index} selected={producto?.cons_categoria == categoria.consecutivo} value={categoria.consecutivo}>{categoria.nombre}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formulario2}>
                                <div className={styles.grupo}>
                                    <label htmlFor="name">Descripción del producto</label>
                                    <div>
                                        <input defaultValue={producto?.name} type="text" className="form-control form-control-sm" name='name' id="name"></input>
                                    </div>
                                </div>
                                <div className={styles.grupo}>
                                    <label htmlFor="bulto">Unidades por bulto</label>
                                    <div>
                                        <input defaultValue={producto?.bulto} type="text" className="form-control form-control-sm" name='bulto' id="bulto" required></input>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formulario7}>
                                <div className={styles.grupo}>
                                    <label htmlFor="unidad">Unidad de medida</label>
                                    <div>
                                        <select className="form-select form-select-sm" name="unidad" id="unidad">
                                            <option>Unidad</option>
                                            <option>Palet</option>
                                            <option>Caja</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.grupo}>
                                    <label htmlFor="costo">Costo por Unidad</label>
                                    <div>
                                        <input type="text" className="form-control form-control-sm" name='costo' id="costo" ></input>
                                    </div>
                                </div>
                                <div className={styles.grupo}>
                                    <label htmlFor="costo">Precio por Unidad</label>
                                    <div>
                                        <input type="text" className="form-control form-control-sm" name='precio' id="precio" ></input>
                                    </div>
                                </div>
                                <div className={styles.grupo}>
                                    <label htmlFor="gravamen">Gravamen</label>
                                    <div>
                                        <input type="text" className="form-control form-control-sm" name='gravamen' id="gravamen" ></input>
                                    </div>
                                </div>
                            </div>




                            <div className={styles.formulario3}>
                                <div className="form-check">
                                    <input className="form-check-input" onChange={() => handleChangeBool("salida_sin_stock")} type="checkbox" checked={salida_sin_stock} value="" name="salida_sin_stock" id="salida_sin_stock"></input>
                                    <label htmlFor="salida_sin_stock" className="form-check-label" >
                                        Salida sin stock
                                    </label>
                                </div>

                                <div className="form-check">
                                    <input className="form-check-input" onChange={() => handleChangeBool("serial")} type="checkbox" checked={serial} value="" name='serial' id="serial"></input>
                                    <label htmlFor='serial' className="form-check-label" >
                                        Serial
                                    </label>
                                </div>

                                <div className="form-check">
                                    <input className="form-check-input" onChange={() => handleChangeBool("permitir_traslado")} type="checkbox" checked={permitir_traslados} value="" name='permitir_traslado' id="permitir_traslado"></input>
                                    <label htmlFor='permitir_traslado' className="form-check-label" >
                                        Permitir traslados
                                    </label>
                                </div>
                            </div>
                        </span>

                        <span>
                            <div className={styles.formulario5}>
                                <p>Habilitar almacenes</p>
                            </div>

                            <div className={styles.formulario4}>

                                {almacenes.map((almacen, index) => (
                                    <div key={index} className="form-check">
                                        <input className="form-check-input" type="checkbox" checked={checkedState[index]} onChange={() => handleChange(index)} name={almacen.consecutivo} id={almacen.consecutivo}></input>
                                        <label className="form-check-label" htmlFor={almacen.consecutivo}>
                                            {almacen.consecutivo}
                                        </label>
                                    </div>
                                ))}

                            </div>
                        </span>




                        <div className={styles.formulario6}>
                            <br />
                            <div>
                                <button type="submit" className={"btn btn-" + styleBoton.color + " btn-sm form-control form-control-sm"}>{styleBoton.text}</button>
                            </div>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}