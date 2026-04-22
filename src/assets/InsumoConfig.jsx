import React, { useEffect, useRef, useState } from "react";
import { listarProductos } from "@services/api/productos";
import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";
import { Badge, Button, Card, Col, Form, InputGroup, Row } from "react-bootstrap";

function InsumoConfig({ handleConfig, modulo_confi }) {
  const formRef = useRef();
  const inputRef = useRef(null);

  const [productos, setProductos] = useState([]);
  const [selectedConsecutivo, setSelectedConsecutivo] = useState("");
  const [tags, setTags] = useState([]);
  const [tiempoBloque, setTiempoBloque] = useState({});

  useEffect(() => {
    listarProductos().then((res) => setProductos(res || []));
    encontrarModulo(modulo_confi).then((res) => {
      const detalles = res?.[0]?.detalles;
      const response = detalles ? JSON.parse(detalles) : {};
      setTags(response?.tags || []);
      setTiempoBloque({
        hora_inicial: response.hora_inicial || "",
        hora_final: response.hora_final || "",
        fecha_inicio: response.fecha_inicio || "",
        correos_alerta: response.correos_alerta || ""
      });
    });
  }, [modulo_confi]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);

    actualizarModulo({
      modulo: modulo_confi,
      detalles: JSON.stringify({
        tags,
        hora_inicial: formData.get("hora_inicial"),
        hora_final: formData.get("hora_final"),
        fecha_inicio: formData.get("fecha_inicio"),
        correos_alerta: formData.get("correos_alerta")
      })
    });

    handleConfig();
  };

  const handleAddTag = () => {
    if (selectedConsecutivo && !tags.includes(selectedConsecutivo)) {
      setTags((prev) => [...prev, selectedConsecutivo]);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setSelectedConsecutivo("");
  };

  const handleRemoveTag = (tag) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const selectedProduct = productos.find((product) => product.name === selectedValue);
    setSelectedConsecutivo(selectedProduct ? selectedProduct.consecutivo : "");
  };

  const selectedProducts = tags
    .map((tag) => productos.find((item) => item.consecutivo == tag))
    .filter(Boolean);

  const showAlertSettings =
    modulo_confi === "Relacion_seguridad" || modulo_confi === "Relación_seguridad" || modulo_confi === "RelaciÃ³n_seguridad";

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 overflow-auto"
      style={{ zIndex: 1055 }}
    >
      <div className="container-fluid min-vh-100 d-flex align-items-start align-items-md-center justify-content-center py-3 py-md-4 px-2">
        <Card
          className="border-0 shadow w-100"
          style={{ maxWidth: "900px", maxHeight: "92vh" }}
        >
          <Card.Header className="bg-white border-bottom py-3 px-3 px-md-4">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <h4 className="mb-1 fw-bold">Configuracion de insumos</h4>
                <p className="mb-0 text-muted">
                  Administra los insumos visibles del modulo y, si aplica, sus alertas.
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                className="p-0 text-secondary text-decoration-none flex-shrink-0"
                onClick={handleConfig}
                aria-label="Cerrar"
              >
                <i className="bi bi-x-lg fs-4"></i>
              </Button>
            </div>
          </Card.Header>

          <Card.Body className="p-3 p-md-4 overflow-auto">
            <Form ref={formRef} onSubmit={handleSubmit}>
              <Row className="g-3 g-md-4">
                <Col xs={12}>
                  <Card className="border">
                    <Card.Body className="p-3 p-md-4">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                        <div>
                          <h5 className="mb-1 fw-bold">Agregar insumo</h5>
                          <p className="mb-0 text-muted">
                            Busca el insumo por nombre y agregalo a la configuracion actual.
                          </p>
                        </div>
                        <Badge bg="primary" pill className="px-3 py-2 align-self-start align-self-md-center">
                          {selectedProducts.length} seleccionados
                        </Badge>
                      </div>

                      <Row className="g-3 align-items-end">
                        <Col xs={12} sm={4} md={3}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">Consecutivo</Form.Label>
                            <Form.Control
                              type="text"
                              id="selectInsumoConsecutivo"
                              value={selectedConsecutivo}
                              className="text-center"
                              disabled
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={12} sm={8} md={6}>
                          <Form.Group>
                            <Form.Label htmlFor="selectInsumoNombre" className="fw-semibold">
                              Insumo
                            </Form.Label>
                            <Form.Control
                              ref={inputRef}
                              onChange={handleChange}
                              type="text"
                              id="selectInsumoNombre"
                              list="articulo"
                              name="inputField"
                              placeholder="Ingrese el nombre del insumo"
                            />
                            <datalist id="articulo">
                              {productos.map((item, index) => (
                                <option key={index} value={item.name} />
                              ))}
                            </datalist>
                          </Form.Group>
                        </Col>

                        <Col xs={12} md={3}>
                          <Button
                            type="button"
                            variant="primary"
                            className="w-100"
                            onClick={handleAddTag}
                            disabled={!selectedConsecutivo}
                          >
                            Agregar
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xs={12}>
                  <Card className="border">
                    <Card.Body className="p-3 p-md-4">
                      <div className="mb-3">
                        <h5 className="mb-1 fw-bold">Insumos configurados</h5>
                        <p className="mb-0 text-muted">
                          Retira cualquier insumo que no deba aparecer en el modulo.
                        </p>
                      </div>

                      {selectedProducts.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {selectedProducts.map((item) => (
                            <span
                              key={item.consecutivo}
                              className="badge bg-primary d-inline-flex align-items-center gap-2 px-3 py-2"
                              style={{ fontSize: "0.95rem" }}
                            >
                              <span>{item.name}</span>
                              <button
                                type="button"
                                className="btn-close btn-close-white"
                                aria-label="Remove"
                                onClick={() => handleRemoveTag(item.consecutivo)}
                              />
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded text-center text-muted py-4 px-3">
                          No hay insumos agregados en esta configuracion.
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {showAlertSettings && (
                  <Col xs={12}>
                    <Card className="border">
                      <Card.Body className="p-3 p-md-4">
                        <div className="mb-3">
                          <h5 className="mb-1 fw-bold">Alertas y bloqueo</h5>
                          <p className="mb-0 text-muted">
                            Define los correos y la ventana horaria de restriccion.
                          </p>
                        </div>

                        <Row className="g-3">
                          <Col xs={12}>
                            <InputGroup>
                              <InputGroup.Text className="fw-semibold">Correos alertas</InputGroup.Text>
                              <Form.Control
                                id="correos_alerta"
                                name="correos_alerta"
                                type="text"
                                defaultValue={tiempoBloque.correos_alerta}
                                placeholder="correo1@empresa.com, correo2@empresa.com"
                              />
                            </InputGroup>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">Fecha de bloqueo</Form.Label>
                              <Form.Control
                                type="date"
                                name="fecha_inicio"
                                defaultValue={tiempoBloque.fecha_inicio}
                              />
                            </Form.Group>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">Hora inicio</Form.Label>
                              <Form.Control
                                type="time"
                                name="hora_inicial"
                                defaultValue={tiempoBloque.hora_inicial}
                              />
                            </Form.Group>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">Hora fin</Form.Label>
                              <Form.Control
                                type="time"
                                name="hora_final"
                                defaultValue={tiempoBloque.hora_final}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                <Col xs={12}>
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
                    <Button type="button" variant="outline-secondary" onClick={handleConfig}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="success">
                      Guardar cambios
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default InsumoConfig;
