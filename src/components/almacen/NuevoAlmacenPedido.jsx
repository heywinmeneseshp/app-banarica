import React, { useEffect, useState, useRef, useContext } from "react";
import AppContext from "@context/AppContext";
//Hooks
import useAlert from "@hooks/useAlert";
//Bootstrap
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

//Components
import Alertas from "@assets/Alertas";
//CSS
import styles from "@styles/almacen/almacen.module.css";


export default function NuevoAlmacenPedido({ formRef }) {
    const { gestionPedido } = useContext(AppContext);
    const [products, setProducts] = useState([0]);
    const [almacen, setAlmacen] = useState(null);
    const [nameAlmacen, setNameAlmacen] = useState(null);
    const almacenRef = useRef(null);
    const [bool, setBool] = useState(false);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [consProducts, setConsProduct] = useState([]);
    const [change, setChange] = useState(false);

    useEffect(() => {
    }, [bool, change]);


    const cerrar = () => {
        const formData = new FormData(formRef.current);
        const result = gestionPedido.almacenes.find(item => item.nombre == almacenRef.current.value);
        let array = [];
        products.map((item, index) => {
            const consecutiveProdcut = gestionPedido.productos.find(item => item.name == formData.get(`producto-${index}-${almacen}`)).consecutivo;
            let data = {
                cons_producto: consecutiveProdcut,
                cons_almacen_destino: result.consecutivo,
                cantidad: formData.get("cantidad-" + index + "-" + almacen)
            };
            array.push(data);
        });
        const existe = array.find((item) => item.cantidad == "");
        if (!existe) {
            gestionPedido.agregar(array);
            gestionPedido.eliminarAlmacen(result.consecutivo);
            setBool(true);
            setAlert({ active: false });
        } else {
            setAlert({
                active: true,
                mensaje: "Existen cantidades vacias",
                color: "danger",
                autoClose: false
            });
        }
        setAlmacen(result.consecutivo);
        setNameAlmacen(result.nombre);
        setConsProduct(array);
    };


    function addProduct() {
        setProducts([...products, 0]);
    }

    function handleSelect(index) {
        const formData = new FormData(formRef.current);
        let bultos = formData.get(`bulto-${index}-${almacen}`);
        let producto = gestionPedido.productos.find(item => item.name == formData.get(`producto-${index}-${almacen}`));
        let newProducts = products;
        newProducts[index] = bultos * producto.bulto;
        setProducts(newProducts);
        setChange(!change);
    }

    function removeProduct() {
        const array = products.slice(0, -1);
        setProducts(array);
    }

    return (
        <>
            <section>
                <div className={styles.line}></div>

                <div className={styles.contenedor5}>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Código alamcén</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                            disabled
                            defaultValue={almacen}
                        />
                    </InputGroup>

                    <Form.Select ref={almacenRef} id="" name="" className={styles.select} size="sm" disabled={bool}>
                        {!bool && gestionPedido.almacenes.map((item, index) => (
                            <option key={index}>{item.nombre}</option>
                        ))}
                        {bool && <option>{nameAlmacen}</option>}
                    </Form.Select>

                </div>

                {
                    products.map((item, indexA) => {
                        return (
                            <div item={item} key={indexA}>
                                <div className={styles.contenedor9} >

                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                                        <Form.Control
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            disabled={true}
                                            defaultValue={consProducts[indexA]?.cons_producto}
                                        />
                                    </InputGroup>

                                    <Form.Select onChange={() => handleSelect(indexA)} className={styles.select} id={"producto-" + indexA + "-" + almacen} name={"producto-" + indexA + "-" + almacen} size="sm" disabled={bool}>
                                        {gestionPedido.productos.map((item, index) => (
                                            <option key={index}>{item.name}</option>
                                        ))}
                                    </Form.Select>

                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Bultos</InputGroup.Text>
                                        <Form.Control
                                            onChange={() => handleSelect(indexA)}
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            id={"bulto-" + indexA + "-" + almacen} name={"bulto-" + indexA + "-" + almacen}
                                            type="number"
                                            disabled={bool}
                                        />

                                    </InputGroup>

                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text id="inputGroup-sizing-sm">Cantidad</InputGroup.Text>
                                        <Form.Control
                                            aria-label="Small"
                                            aria-describedby="inputGroup-sizing-sm"
                                            id={"cantidad-" + indexA + "-" + almacen} name={"cantidad-" + indexA + "-" + almacen}
                                            type="number"
                                            disabled={bool}
                                            placeholder={item}
                                            required
                                        />

                                    </InputGroup>
                                </div>
                            </div>
                        );
                    })}

                {!bool && <div className={styles.contenedor6}>
                    <div>
                        <Button className={styles.button} onClick={addProduct} variant="primary" size="sm">
                            Agregar producto
                        </Button>
                    </div>
                    <div>
                        <Button className={styles.button} onClick={removeProduct} variant="danger" size="sm">
                            Remover producto
                        </Button>
                    </div>
                    <div></div>
                    <div></div>
                    <div>
                        <Button className={styles.button} onClick={cerrar} variant="warning" size="sm">
                            Cerrar pedido
                        </Button>
                    </div>
                </div>}
            </section>
            <Alertas alert={alert} handleClose={toogleAlert} />
        </>
    );
}