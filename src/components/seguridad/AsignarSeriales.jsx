import React, { useEffect, useRef, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { InputGroup, Form, Container, Row, Col, Button } from "react-bootstrap";
import { filtrarProductos } from "@services/api/productos";
import { FaMinusCircle } from "react-icons/fa";
import { listarMotivoDeUso } from "@services/api/motivoDeUso";
import { encontrarUnSerial, usarSeriales } from "@services/api/seguridad";
import { filtrarSemanaRangoMes } from "@services/api/semanas";
import { encontrarModulo } from "@services/api/configuracion";
import Loader from "@components/shared/Loader";

export default function AsignarSeriales({ contenedor, setContenedor }) {
    const formRef = useRef();

    // Estados del componente
    const [articulos, setArticulos] = useState([]);
    const [inputs, setInputs] = useState([]);
    const [articulo, setArticulo] = useState("");
    const [errores, setErrores] = useState(new Set());
    const [motivoDeUsos, setMotivosDeUsos] = useState([]);
    const [semanas, setSemanas] = useState([]);
    const [semanaActual, setSemanaActual] = useState([]);
    const [loading, setLoading] = useState(false);
    const [almacenByUser, setAlmacenByUser] = useState([]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        listar();
    }, [errores]);

    // Función para obtener datos necesarios del servidor
    const listar = async () => {
        try {
            const almacenes = JSON.parse(localStorage.getItem("almacenByUser"))?.map(item => item.consecutivo) || [];
            const body = { producto: { serial: true }, stock: { cons_almacen: almacenes, isBlock: false } };

            const [productos, motivos, weeks, currentWeek] = await Promise.all([
                filtrarProductos(body),
                listarMotivoDeUso(),
                filtrarSemanaRangoMes(1, 1),
                encontrarModulo("Semana")
            ]);

            setArticulos(productos || []);
            setMotivosDeUsos(motivos);
            setSemanas(weeks);
            setSemanaActual(currentWeek[0].semana_actual);
            setAlmacenByUser(almacenes);
        } catch (error) {
            console.error("Error al listar productos:", error);
        }
    };

    // Agrega un artículo seleccionado
    const handleAdd = () => {
        if (!articulo.trim()) return;

        const item = articulos.find(item => item.name === articulo);
        setInputs([...inputs, {
            id: Date.now(),
            name: articulo,
            value: "",
            consecutivo: item?.consecutivo || "",
            cons_producto: item?.consecutivo
        }]);
        setArticulo("");
    };

    // Elimina un artículo
    const handleRemove = (id) => {
        setInputs(inputs.filter(item => item.id !== id));
        setErrores(prev => {
            const newErrors = new Set(prev);
            newErrors.delete(id);
            return newErrors;
        });
    };

    // Actualiza el valor de un input específico
    const handleInputChange = (id, newValue) => {
        setInputs(inputs.map(item => (item.id === id ? { ...item, value: newValue } : item)));
    };

    // Envía el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (inputs.length === 0) {
            alert("Debe agregar al menos un artículo");
            setLoading(false);
            return;
        }

        const countMap = new Map();
        const newErrores = new Set();

        // Detectar seriales duplicados
        inputs.forEach(({ value, id }) => {
            const trimmed = value.trim();
            if (trimmed) {
                countMap.set(trimmed, [...(countMap.get(trimmed) || []), id]);
            }
        });

        countMap.forEach(ids => {
            if (ids.length > 1) ids.forEach(id => newErrores.add(id));
        });

        if (newErrores.size > 0) {
            alert("Existen seriales duplicados");
            setErrores(newErrores);
            setLoading(false);
            return;
        }

        const formData = new FormData(formRef.current);
        const motivo = motivoDeUsos.find(item => item.id == formData.get("motivoDeUso"));
        const semana = formData.get("semana");
        const fecha = formData.get("fecha");
        const contenedorID = contenedor.id;
        const usuarioID = JSON.parse(localStorage.getItem("usuario")).id;

        let seriales = [];
        let erroresSeriales = [];

        // Validación de existencia de seriales
        for (const { value, id, cons_producto } of inputs) {
            try {
                const serialList = await encontrarUnSerial({
                    bag_pack: value,
                    available: true,
                    cons_producto,
                    cons_almacen: almacenByUser
                });

                if (serialList.length === 0) {
                    newErrores.add(id);
                    erroresSeriales.push(`No se encontró el serial para: ${value}`);
                } else {
                    seriales.push(value);
                }
            } catch (error) {
                console.error(`Error al buscar el serial de ${value}:`, error);
            }
        }

        if (erroresSeriales.length > 0) {
            alert(erroresSeriales.join("\n"));
        }

        setErrores(newErrores);

        if (newErrores.size > 0) {
            setLoading(false);
            return;
        }

        // Envío de seriales válidos
        const res = await usarSeriales(semana, fecha, seriales, contenedorID, usuarioID, motivo);

        if (res) {
            alert("Datos cargados con éxito");
            setContenedor(null);
        }

        setLoading(false);
    };

    // Función para obtener la fecha de hoy en formato YYYY-MM-DD
    const getToday = () => new Date().toISOString().split("T")[0];

    return (
        <div className={styles.fondo}>
            <div className={styles.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between">
                        <span className="fw-bold">Asignar artículos de seguridad: {contenedor?.contenedor}</span>
                        <button type="button" onClick={() => setContenedor(null)} className="btn-close" aria-label="Close" />
                    </div>
                    <div className="card-body">
                        <form ref={formRef} onSubmit={handleSubmit}>
                            <Container className="mt-2">
                                <Row>
                                    {/* Fecha */}
                                    <Col md={6} className="d-flex mb-3">
                                        <InputGroup>
                                            <InputGroup.Text>Fecha</InputGroup.Text>
                                            <Form.Control
                                                id="fecha"
                                                name="fecha"
                                                type="date"
                                                required
                                                defaultValue={getToday()}
                                            />
                                        </InputGroup>
                                    </Col>

                                    {/* Semana */}
                                    <Col md={6} className="d-flex mb-3">
                                        <InputGroup>
                                            <InputGroup.Text>Semana</InputGroup.Text>
                                            <Form.Select id="semana" name="semana" required>
                                                <option value=""></option>
                                                {semanas.map((item, index) => (
                                                    <option
                                                        key={index}
                                                        value={item.consecutivo}
                                                        selected={item?.semana == semanaActual}
                                                    >
                                                        {item?.consecutivo}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </InputGroup>
                                    </Col>

                                    {/* Motivo */}
                                    <Col md={12} className="d-flex mb-3">
                                        <InputGroup>
                                            <InputGroup.Text>Motivo</InputGroup.Text>
                                            <Form.Select id="motivoDeUso" name="motivoDeUso" required>
                                                <option value=""></option>
                                                {motivoDeUsos.map((item, index) => (
                                                    <option key={index} value={item.id}>
                                                        {item?.motivo_de_uso}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </InputGroup>
                                    </Col>

                                    {/* Artículo + botón agregar */}
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
                                                {articulos.map((item, index) => (
                                                    <option key={index} value={item?.name} />
                                                ))}
                                            </datalist>
                                        </InputGroup>
                                        <Button onClick={handleAdd} variant="primary" style={{ height: "33.5px" }}>
                                            Agregar
                                        </Button>
                                    </Col>
                                </Row>
                            </Container>

                            {/* Inputs dinámicos para seriales */}
                            {inputs.length > 0 && (
                                <>
                                    <Container><div className="line" /></Container>
                                    <Container className="mb-2">
                                        <Row>
                                            {inputs.map((item) => (
                                                <Col md={12} className="d-flex align-items-center mb-3" key={item.id}>
                                                    <InputGroup className="me-3">
                                                        <InputGroup.Text>{item.name}</InputGroup.Text>
                                                        <Form.Control
                                                            id={item.id}
                                                            name={item.id}
                                                            required
                                                            value={item.value}
                                                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                                                            className={errores.has(item.id) ? "is-invalid" : ""}
                                                        />
                                                    </InputGroup>
                                                    <FaMinusCircle
                                                        size={20}
                                                        color="#dc3545"
                                                        style={{ cursor: "pointer", margin: "auto" }}
                                                        onClick={() => handleRemove(item.id)}
                                                        title="Eliminar este artículo"
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </Container>
                                </>
                            )}

                            {/* Botón guardar */}
                            <Container>
                                <div className="mb-3 col-md-12 d-flex">
                                    <Button type="submit" variant="success" className="w-100 w-lg-auto">
                                        Guardar
                                    </Button>
                                </div>
                            </Container>
                        </form>
                        <Loader loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
}
