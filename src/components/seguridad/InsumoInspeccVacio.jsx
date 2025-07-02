import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { InputGroup, Form, Container, Row, Col, Button } from "react-bootstrap";
import { filtrarProductos } from "@services/api/productos";
import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";
import Loader from "@components/shared/Loader";

export default function InsumoInspeccVacio({ setOpenConfig }) {
    const formRef = useRef();
    const [articulos, setArticulos] = useState([]);
    const [inputs, setInputs] = useState([]);
    const [articulo, setArticulo] = useState("");
    const [loading, setLoading] = useState(false);

    // Cargar datos iniciales una sola vez
    useEffect(() => {
        const listar = async () => {
            try {
                const body = { producto: { serial: true }, stock: { isBlock: false } };
                const [productos, insumos] = await Promise.all([
                    filtrarProductos(body),
                    encontrarModulo("Insumos_inspeccion_vacio")
                ]);
                console.log(insumos);
                setArticulos(productos || []);
                setInputs(JSON.parse(insumos[0].detalles) || []);
            } catch (error) {
                console.error("Error al listar productos:", error);
            }
        };
        listar();
    }, []);

    const handleAdd = useCallback(() => {
        if (!articulo.trim()) return;

        const item = articulos.find(i => i.name === articulo);
        if (!item) return;

        setInputs(prev => [
            ...prev,
            {
                id: Date.now(),
                name: articulo,
                value: "",
                consecutivo: item.consecutivo || "",
                cons_producto: item.consecutivo
            }
        ]);
        setArticulo("");
    }, [articulo, articulos]);

    const handleRemove = useCallback((id) => {
        setInputs(prev => prev.filter(item => item.id !== id));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputs.length === 0) {
            alert("Debe agregar al menos un artículo");
            return;
        }

        setLoading(true);
        try {
            const detalles = JSON.stringify(inputs);
            await actualizarModulo({ modulo: "Insumos_inspeccion_vacio", detalles });
            alert("Datos cargados con éxito");
            setOpenConfig(false);
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.fondo}>
            <div className={styles.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between">
                        <span className="fw-bold">Asignar artículos de seguridad</span>
                        <button type="button" onClick={() => setOpenConfig(false)} className="btn-close" aria-label="Close" />
                    </div>
                    <div className="card-body">
                        <Form ref={formRef} onSubmit={handleSubmit}>
                            <Container className="mt-2">
                                <Row>
                                    <Col md={12} className="d-flex mb-3">
                                        <InputGroup className="me-3">
                                            <InputGroup.Text>Artículo</InputGroup.Text>
                                            <Form.Control
                                                list="articulos"
                                                value={articulo}
                                                onChange={(e) => setArticulo(e.target.value)}
                                                placeholder="Seleccione el artículo"
                                            />
                                            <datalist id="articulos">
                                                {articulos.map((item) => {
                                                    const exists = inputs.find(element => element.name == item.name);
                                                    if (!exists) {
                                                        return (
                                                            <option key={item.id || item.name} value={item.name} />
                                                        );
                                                    }

                                                })}
                                            </datalist>
                                        </InputGroup>
                                        <Button onClick={handleAdd} variant="primary" style={{ height: "33.5px" }}>
                                            Agregar
                                        </Button>
                                    </Col>
                                </Row>
                            </Container>

                            {inputs.length > 0 && (
                                <>
                                    <Container><div className="line" /></Container>
                                    <Container className="mb-2">
                                        <Row>
                                            <Col md={12}>
                                                <div className="card">
                                                    <div className="card-body d-flex flex-wrap">
                                                        {inputs.map((item) => (
                                                            <span
                                                                key={item.id}
                                                                className="badge bg-primary me-2 mb-2 d-flex align-items-center"
                                                            >
                                                                {item.name}
                                                                <button
                                                                    type="button"
                                                                    className="btn-close btn-sm ms-2"
                                                                    aria-label="Remove"
                                                                    onClick={() => handleRemove(item.id)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Container>
                                </>
                            )}

                            <Container>
                                <div className="mb-3 col-md-12 d-flex">
                                    <Button type="submit" variant="success" className="w-100 w-lg-auto">
                                        Guardar
                                    </Button>
                                </div>
                            </Container>
                        </Form>
                        <Loader loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
}
