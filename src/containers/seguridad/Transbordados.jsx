import React, { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Col, Container, Form, Row, Table } from "react-bootstrap";

import Paginacion from "@components/Paginacion";
import { paginarTransbordo } from "@services/api/transbordo";
import dateUse from "@hooks/useDate";

const formatDate = (value) => {
    if (!value) return "No registrado";

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
};

export default function Transbordados() {
    const formRef = useRef();
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [transbordos, setTransbordos] = useState([]);
    const limit = 20;

    const cargar = useCallback(async (page = pagination, currentFilters = null) => {
        try {
            const filtrosActivos = currentFilters || (() => {
                if (!formRef.current) {
                    return {
                        contenedor_viejo: "",
                        contenedor_nuevo: "",
                        fecha_inicial: "",
                        fecha_final: "",
                    };
                }

                const formData = new FormData(formRef.current);
                return {
                    contenedor_viejo: String(formData.get("contenedor_viejo") || "").trim().toUpperCase(),
                    contenedor_nuevo: String(formData.get("contenedor_nuevo") || "").trim().toUpperCase(),
                    fecha_inicial: formData.get("fecha_inicial") || "",
                    fecha_final: formData.get("fecha_final") || "",
                };
            })();

            const res = await paginarTransbordo(page, limit, filtrosActivos);
            setTransbordos(res?.data || []);
            setTotal(res?.total || 0);
        } catch (error) {
            console.error("Error al cargar transbordos:", error);
            setTransbordos([]);
            setTotal(0);
        }
    }, [pagination]);

    useEffect(() => {
        cargar(pagination);
    }, [pagination, cargar]);

    const onBuscar = async () => {
        setPagination(1);
        await cargar(1);
    };

    const onDescargarExcel = async () => {
        const formData = new FormData(formRef.current);
        const filtrosExcel = {
            contenedor_viejo: String(formData.get("contenedor_viejo") || "").trim().toUpperCase(),
            contenedor_nuevo: String(formData.get("contenedor_nuevo") || "").trim().toUpperCase(),
            fecha_inicial: formData.get("fecha_inicial") || "",
            fecha_final: formData.get("fecha_final") || "",
        };

        const res = await paginarTransbordo(1, 5000, filtrosExcel);
        const rows = (res?.data || []).map((item) => ({
            "ID": item?.id,
            "Contenedor origen": item?.contenedorViejo?.contenedor || "No registrado",
            "Contenedor nuevo": item?.contenedorNuevo?.contenedor || "No registrado",
            "Fecha transbordo": formatDate(item?.fecha_transbordo),
            "Habilitado": item?.habilitado ? "Si" : "No",
            "Fecha registro": formatDate(item?.createdAt),
        }));

        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(book, sheet, "Transbordados");
        XLSX.writeFile(book, `Reporte transbordados ${dateUse()}.xlsx`);
    };

    return (
        <Container>
            <h2 className="mb-2">Reporte de transbordados</h2>
            <div className="line"></div>

            <Form ref={formRef}>
                <Row xs={1} sm={2} md={3} lg={5} className="g-3 align-items-end mb-3">
                    <Col>
                        <Form.Group controlId="contenedor_viejo">
                            <Form.Label className="mb-1">Contenedor origen</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                name="contenedor_viejo"
                                placeholder="ABCD1234567"
                                onChange={onBuscar}
                            />
                        </Form.Group>
                    </Col>

                    <Col>
                        <Form.Group controlId="contenedor_nuevo">
                            <Form.Label className="mb-1">Contenedor nuevo</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                name="contenedor_nuevo"
                                placeholder="WXYZ1234567"
                                onChange={onBuscar}
                            />
                        </Form.Group>
                    </Col>

                    <Col>
                        <Form.Group controlId="fecha_inicial">
                            <Form.Label className="mb-1">Fecha inicial</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                name="fecha_inicial"
                                onChange={onBuscar}
                            />
                        </Form.Group>
                    </Col>

                    <Col>
                        <Form.Group controlId="fecha_final">
                            <Form.Label className="mb-1">Fecha final</Form.Label>
                            <Form.Control
                                type="date"
                                size="sm"
                                name="fecha_final"
                                onChange={onBuscar}
                            />
                        </Form.Group>
                    </Col>

                    <Col className="d-grid">
                        <Button type="button" onClick={onDescargarExcel} variant="success" size="sm">
                            Descargar Excel
                        </Button>
                    </Col>
                </Row>

            </Form>

            <div className="table-responsive">
            <Table className="mb-0" striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th className="text-center align-middle">ID</th>
                        <th className="text-center align-middle">Contenedor origen</th>
                        <th className="text-center align-middle">Contenedor nuevo</th>
                        <th className="text-center align-middle">Fecha transbordo</th>
                        <th className="text-center align-middle">Habilitado</th>
                        <th className="text-center align-middle">Registro</th>
                    </tr>
                </thead>
                <tbody>
                    {transbordos.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center">
                                No hay transbordos para los filtros seleccionados.
                            </td>
                        </tr>
                    ) : (
                        transbordos.map((item) => (
                            <tr key={item.id}>
                                <td className="text-center align-middle">{item?.id}</td>
                                <td className="text-center align-middle">{item?.contenedorViejo?.contenedor || "No registrado"}</td>
                                <td className="text-center align-middle">{item?.contenedorNuevo?.contenedor || "No registrado"}</td>
                                <td className="text-center align-middle">{formatDate(item?.fecha_transbordo)}</td>
                                <td className="text-center align-middle">{item?.habilitado ? "Si" : "No"}</td>
                                <td className="text-center align-middle">{formatDate(item?.createdAt)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
            </div>

            <div className="d-flex justify-content-center mt-3">
                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>
        </Container>
    );
}
