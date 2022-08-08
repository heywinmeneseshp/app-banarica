import React, { useRef, useState, useEffect } from 'react';
//Services
import { actualizarCombos, agregarCombos, armarCombo, buscarComboArmado } from '@services/api/combos';
import { buscarProducto, listarProductos } from '@services/api/productos';
//Boostrap
import { Button } from 'react-bootstrap';
//Components
//CSS
import styles from '@styles/NuevoCombo.module.css';

export default function NuevoCombo({ setAlert, setOpen, item }) {
    const formRef = useRef(null);
    const [products, setProducts] = useState([]);
    const [productos, setProductos] = useState([]);
    const [listaDelCombo, setListaDelCombo] = useState([]);

    useEffect(() => {
        async function listrasItems() {
            listarProductos().then((res) => {
                setProductos(res);
                if (item) {
                    buscarComboArmado(item.consecutivo).then((res) => {
                        res.map(item => {
                            const producto = item.cons_producto;
                            buscarProducto(producto).then((res) => {
                                setListaDelCombo(lista => [...lista, res]);
                            });
                        });
                        setProducts(res);
                    });
                }
            });
        }
        listrasItems();
    }, [item]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    let styleBoton = { color: "success", text: "Agregar" };
    if (item) styleBoton = { color: "warning", text: "Editar" };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);


        const data = {
            nombre: formData.get('nombre_combo'),
            isBlock: false
        };
        if (item == null) {
            try {
                agregarCombos(data).then(res => {
                    products.map((item, index) => {
                        const result = formData.get('producto-' + index);
                        const existe = productos.find((element) => element.name == result);
                        armarCombo(res.data.consecutivo, existe.consecutivo);
                    });
                });
                setAlert({
                    active: true,
                    mensaje: "El combo ha sido creado con exito",
                    color: "success",
                    autoClose: true
                });
                setOpen(false);
            } catch (e) {
                setAlert({
                    active: true,
                    mensaje: "Se ha producido un error al crear el combo",
                    color: "warning",
                    autoClose: true
                });
                setOpen(false);
            }
        } else {
            actualizarCombos(item.consecutivo, { nombre: data.nombre });
            setAlert({
                active: true,
                mensaje: 'El combo se ha actualizado',
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
                    <div className={styles.ex}><span role="button" tabIndex={0} onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit} className={styles.formulario}>

                        <div className={styles.contenedor1}>

                            <div className="mb-3 input-group input-group-sm">
                                <label htmlFor='cons_combo' className="input-group-text" id="inputGroup-sizing-sm">Cod</label>
                                <input defaultValue={item?.consecutivo} id='cons_combo' name='cons_combo' aria-label="Small" aria-describedby="inputGroup-sizing-sm" className="form-control" disabled></input>
                            </div>

                            <div className="mb-3 input-group input-group-sm">
                                <label htmlFor="nombre_combo" className="input-group-text" id="inputGroup-sizing-sm">Nombre del Combo</label>
                                <input defaultValue={item?.nombre} id='nombre_combo' name='nombre_combo' aria-label="Small" aria-describedby="inputGroup-sizing-sm" className="form-control" required></input>
                            </div>
                        </div>

                        {item &&
                            products.map((item, key) => (
                                <div key={key} className={styles.contenedor2}>

                                    <div className="mb-3 input-group input-group-sm">
                                        <label htmlFor='cons_combo' className="input-group-text" id="inputGroup-sizing-sm">Cod</label>
                                        <input defaultValue={listaDelCombo[key]?.consecutivo} id='cons_combo' name='cons_combo' aria-label="Small" aria-describedby="inputGroup-sizing-sm" className="form-control" disabled></input>
                                    </div>

                                    <div className="mb-3 input-group input-group-sm">
                                        <label htmlFor="nombre_combo" className="input-group-text" id="inputGroup-sizing-sm">Producto</label>
                                        <input defaultValue={listaDelCombo[key]?.name} id='nombre_combo' name='nombre_combo' aria-label="Small" aria-describedby="inputGroup-sizing-sm" className="form-control" disabled></input>
                                    </div>
                                </div>
                            )
                            )
                        }


                        {!item &&
                            products.map((item, key) => (
                                <div item={item} key={key} className={styles.contenedor2}>
                                    <div className="mb-3 input-group input-group-sm">
                                        <label htmlFor={'cons_product-' + key} className="input-group-text" id="inputGroup-sizing-sm">Cod</label>
                                        <input id={'cons_product-' + key} name={'cons_product-' + key} aria-label="Small" aria-describedby="inputGroup-sizing-sm" className="form-control" disabled></input>
                                    </div>


                                    <select id={'producto-' + key} name={'producto-' + key} className="NuevoCombo_select__f6cop form-select form-select-sm">
                                        {productos.map((item, index) => {
                                            return <option key={index}>{item.name}</option>;
                                        })}
                                    </select>
                                </div>
                            )
                            )
                        }


                        <div className={styles.contenedor3}>
                            <div>
                                {!item &&
                                    <Button onClick={addProduct} variant="primary" size="sm">
                                        Añadir artículo
                                    </Button>
                                }
                            </div>

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