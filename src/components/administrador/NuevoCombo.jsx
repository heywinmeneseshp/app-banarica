import React, { useRef, useState, useEffect } from 'react';
import { Button, Form, InputGroup, Row, Col, Modal } from 'react-bootstrap';

// Services
import {
    actualizarCombos,
    agregarCombos,
    armarCombo,
    buscarComboArmado
} from '@services/api/combos';
import { buscarProducto, listarProductos } from '@services/api/productos';

export default function NuevoCombo({ setAlert, setOpen, item, open }) {
    const formRef = useRef(null);
    const [productos, setProductos] = useState([]);
    const [comboItems, setComboItems] = useState([]); // Productos seleccionados
    const [comboData, setComboData] = useState([]);   // Datos del combo armado (para edición)


    const isEdit = Boolean(item);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productos = await listarProductos();
                setProductos(productos);

                if (isEdit) {
                    const combos = await buscarComboArmado(item.consecutivo);
                    const productosCombo = await Promise.all(
                        combos.map(combo => buscarProducto(combo.cons_producto))
                    );
                    setComboItems(productosCombo);
                    setComboData(combos);
                }
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };

        fetchData();
    }, [item, isEdit]);

    const addProduct = () => setComboData(prev => [...prev, {}]);
    const closeWindow = () => setOpen(false);

    const comboFields = [
        { id: 'id_cliente', label: 'ID Cliente', type: 'text', required: true },
        { id: 'cajas_por_palet', label: 'Cajas por Palet', type: 'number', required: true },
        { id: 'cajas_por_mini_palet', label: 'Cajas por Mini Palet', type: 'number' },
        { id: 'palets_por_contenedor', label: 'Palets por Contenedor', type: 'number' },
        { id: 'peso_neto', label: 'Peso Neto (kg)', type: 'number' },
        { id: 'peso_bruto', label: 'Peso Bruto (kg)', type: 'number' },
        { id: 'precio_de_venta', label: 'Precio de Venta ($)', type: 'number', required: true }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);

        const data = {
            nombre: formData.get('nombre_combo'),
            isBlock: false,
        };

        // Añadir los campos extra al objeto data
        comboFields.forEach(field => {
            const value = formData.get(field.id);
            data[field.id] = field.type === 'number' ? parseFloat(value) || 0 : value;
        });

        try {
            if (!isEdit) {
                const res = await agregarCombos(data);
                const consecutivoCombo = res.data.consecutivo;

                await Promise.all(comboData.map((_, index) => {
                    const nombreProducto = formData.get(`producto-${index}`);
                    const producto = productos.find(p => p.name === nombreProducto);
                    return armarCombo(consecutivoCombo, producto?.consecutivo);
                }));

                setAlert({
                    active: true,
                    mensaje: "El combo ha sido creado con éxito",
                    color: "success",
                    autoClose: true
                });
            } else {
                console.log(data);
                await actualizarCombos(item.consecutivo, data);

                setAlert({
                    active: true,
                    mensaje: "El combo se ha actualizado",
                    color: "success",
                    autoClose: true
                });
            }

            setOpen(false);
        } catch (error) {
            setAlert({
                active: true,
                mensaje: "Se ha producido un error",
                color: "warning",
                autoClose: true
            });
            console.error("Error al guardar combo:", error);
        }
    };

    return (
        <Modal show={open} onHide={closeWindow} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className='fs-5'>{isEdit ? "Editar Combo" : "Nuevo Combo"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form ref={formRef} onSubmit={handleSubmit} className="w-100 container">

                    <Row className="mb-3">
                        <Col xs={12} md={2}>
                            <Form.Group controlId="cons_combo">
                                <Form.Label>Código</Form.Label>
                                <Form.Control
                                    name="cons_combo"
                                    defaultValue={item?.consecutivo}
                                    disabled
                                    size="sm"
                                />
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={8}>
                            <Form.Group controlId="nombre_combo">
                                <Form.Label>Nombre del Combo</Form.Label>
                                <Form.Control
                                    name="nombre_combo"
                                    defaultValue={item?.nombre}
                                    required
                                    size="sm"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        {comboFields.map(({ id, label, type, required }) => (
                            <Col xs={12} md={4} key={id} >
                                <Form.Group controlId={id}>
                                    <Form.Label>{label}</Form.Label>
                                    <Form.Control
                                        name={id}
                                        type={type}
                                        step={type === 'number' ? '0.01' : undefined}
                                        defaultValue={item?.[id] || ''}
                                        required={required}
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                        ))}
                    </Row>

                    {(isEdit ? comboItems : comboData).map((comboItem, index) => (
                        <Row key={index} className="mb-3">
                            <Col xs={1} md={3}>
                                <InputGroup size="sm">
                                    <InputGroup.Text>Cod</InputGroup.Text>
                                    <Form.Control
                                        id={`cons_product-${index}`}
                                        name={`cons_product-${index}`}
                                        defaultValue={isEdit ? comboItem?.consecutivo : ""}
                                        disabled
                                    />
                                </InputGroup>
                            </Col>

                            <Col xs={11} md={9}>
                                {isEdit ? (
                                    <InputGroup size="sm" className="mb-3">
                                        <InputGroup.Text>Producto</InputGroup.Text>
                                        <Form.Control
                                            id={`producto-${index}`}
                                            name={`producto-${index}`}
                                            defaultValue={comboItem?.name}
                                            disabled
                                        />
                                    </InputGroup>
                                ) : (
                                    <Form.Select
                                        id={`producto-${index}`}
                                        name={`producto-${index}`}
                                        className="form-select-sm"
                                        required
                                    >
                                        <option value="">Selecciona un producto</option>
                                        {productos.map((p, idx) => (
                                            <option key={idx} value={p.name}>{p.name}</option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Col>
                        </Row>
                    ))}


                    <div className="d-flex justify-content-end">
                        {!isEdit && (
                            <Button variant="primary" size="sm" onClick={addProduct}>
                                Añadir artículo
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant={isEdit ? "warning" : "success"}
                            size="sm"
                            className="ms-2"
                        >
                            {isEdit ? "Editar" : "Agregar"}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
