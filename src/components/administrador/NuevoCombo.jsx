import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';

import {
    actualizarCombos,
    agregarCombos,
    armarCombo,
    buscarComboArmado
} from '@services/api/combos';
import { listarClientes } from '@services/api/clientes';
import { buscarProducto, listarProductos } from '@services/api/productos';

const buildEmptyProductRow = () => ({
    key: `producto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
});

export default function NuevoCombo({ setAlert, setOpen, item, open }) {
    const formRef = useRef(null);
    const [productos, setProductos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [comboItems, setComboItems] = useState([]);
    const [comboData, setComboData] = useState([buildEmptyProductRow()]);
    const [selectedClientCode, setSelectedClientCode] = useState('');

    const isEdit = Boolean(item);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productosData, clientesData] = await Promise.all([
                    listarProductos(),
                    listarClientes()
                ]);

                setProductos(Array.isArray(productosData) ? productosData : []);
                setClientes(Array.isArray(clientesData) ? clientesData : []);

                if (!isEdit) {
                    setComboData([buildEmptyProductRow()]);
                    setComboItems([]);
                    setSelectedClientCode('');
                    return;
                }

                const combos = await buscarComboArmado(item.consecutivo);
                const productosCombo = await Promise.all(
                    (combos || []).map((combo) => buscarProducto(combo.cons_producto))
                );
                setComboItems(productosCombo.filter(Boolean));
                setSelectedClientCode(
                    clientesData.find((cliente) => cliente.id === item?.id_cliente)?.cod || ''
                );
            } catch (error) {
                console.error('Error al cargar datos del combo:', error);
            }
        };

        fetchData();
    }, [item, isEdit]);

    const closeWindow = () => setOpen(false);

    const addProductRow = () => {
        setComboData((prev) => [...prev, buildEmptyProductRow()]);
    };

    const removeProductRow = (indexToRemove) => {
        setComboData((prev) => {
            if (prev.length === 1) {
                return [buildEmptyProductRow()];
            }

            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const comboFields = useMemo(() => ([
        { id: 'cajas_por_palet', label: 'Cajas por Palet', type: 'number', required: true },
        { id: 'cajas_por_mini_palet', label: 'Cajas por Mini Palet', type: 'number' },
        { id: 'palets_por_contenedor', label: 'Palets por Contenedor', type: 'number' },
        { id: 'peso_neto', label: 'Peso Neto (kg)', type: 'number' },
        { id: 'peso_bruto', label: 'Peso Bruto (kg)', type: 'number' },
        { id: 'precio_de_venta', label: 'Precio de Venta ($)', type: 'number', required: true }
    ]), []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(formRef.current);

        const clientCode = String(selectedClientCode || formData.get('id_cliente') || '').trim();
        const selectedClient = clientes.find((cliente) => cliente?.cod === clientCode);

        if (!selectedClient) {
            setAlert({
                active: true,
                mensaje: 'Debes seleccionar un cliente valido',
                color: 'warning',
                autoClose: true
            });
            return;
        }

        const data = {
            nombre: formData.get('nombre_combo'),
            isBlock: false,
            id_cliente: selectedClient.id
        };

        comboFields.forEach((field) => {
            const value = formData.get(field.id);
            data[field.id] = field.type === 'number' ? parseFloat(value) || 0 : value;
        });

        try {
            if (!isEdit) {
                const response = await agregarCombos(data);
                const consecutivoCombo = response.data.consecutivo;

                const productosSeleccionados = comboData
                    .map((_, index) => String(formData.get(`producto-${index}`) || '').trim())
                    .filter(Boolean)
                    .map((nombreProducto) => productos.find((producto) => producto.name === nombreProducto))
                    .filter(Boolean);

                await Promise.all(
                    productosSeleccionados.map((producto) => armarCombo(consecutivoCombo, producto.consecutivo))
                );

                setAlert({
                    active: true,
                    mensaje: 'El combo ha sido creado con exito',
                    color: 'success',
                    autoClose: true
                });
            } else {
                await actualizarCombos(item.consecutivo, data);

                setAlert({
                    active: true,
                    mensaje: 'El combo se ha actualizado',
                    color: 'success',
                    autoClose: true
                });
            }

            setOpen(false);
        } catch (error) {
            console.error('Error al guardar combo:', error);
            const backendMessage = error?.response?.data?.message;
            const validationMessage = backendMessage?.details?.[0]?.message;
            setAlert({
                active: true,
                mensaje: validationMessage || backendMessage || 'Se ha producido un error',
                color: 'warning',
                autoClose: true
            });
        }
    };

    return (
        <Modal show={open} onHide={closeWindow} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-5">{isEdit ? 'Editar Combo' : 'Nuevo Combo'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form ref={formRef} onSubmit={handleSubmit} className="w-100 container">
                    <Row className="mb-3">
                        <Col xs={12} md={2}>
                            <Form.Group controlId="cons_combo">
                                <Form.Label>Codigo</Form.Label>
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
                        <Col xs={12} md={4}>
                            <Form.Group controlId="id_cliente">
                                <Form.Label>Cliente</Form.Label>
                                <Form.Select
                                    name="id_cliente"
                                    value={selectedClientCode}
                                    onChange={(event) => setSelectedClientCode(event.target.value)}
                                    size="sm"
                                    required
                                >
                                    <option value="">Selecciona un cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.id} value={cliente.cod}>
                                            {cliente.cod}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {comboFields.map(({ id, label, type, required }) => (
                            <Col xs={12} md={4} key={id}>
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

                    <div className="mb-2 fw-semibold">Articulos del combo</div>
                    <div className="small text-muted mb-3">
                        Esta seccion es opcional. Puedes guardar el combo sin productos y agregarlos despues.
                    </div>

                    {(isEdit ? comboItems : comboData).map((comboItem, index) => (
                        <Row key={isEdit ? comboItem?.consecutivo || index : comboItem.key} className="mb-3">
                            <Col xs={12} md={3}>
                                <InputGroup size="sm">
                                    <InputGroup.Text>Cod</InputGroup.Text>
                                    <Form.Control
                                        id={`cons_product-${index}`}
                                        name={`cons_product-${index}`}
                                        defaultValue={isEdit ? comboItem?.consecutivo : ''}
                                        disabled
                                    />
                                </InputGroup>
                            </Col>

                            <Col xs={12} md={isEdit ? 9 : 7}>
                                {isEdit ? (
                                    <InputGroup size="sm">
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
                                        defaultValue=""
                                    >
                                        <option value="">Selecciona un producto</option>
                                        {productos.map((producto) => (
                                            <option key={producto.consecutivo} value={producto.name}>
                                                {producto.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Col>

                            {!isEdit && (
                                <Col xs={12} md={2} className="d-flex align-items-center justify-content-end">
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeProductRow(index)}
                                    >
                                        Quitar
                                    </Button>
                                </Col>
                            )}
                        </Row>
                    ))}

                    <div className="d-flex justify-content-end">
                        {!isEdit && (
                            <Button variant="primary" size="sm" onClick={addProductRow}>
                                Agregar otro articulo
                            </Button>
                        )}
                        <Button
                            type="submit"
                            variant={isEdit ? 'warning' : 'success'}
                            size="sm"
                            className="ms-2"
                        >
                            {isEdit ? 'Editar' : 'Agregar'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
