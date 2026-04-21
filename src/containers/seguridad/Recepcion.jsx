import React, { useEffect, useMemo, useState } from "react";
import readXlsxFile from "read-excel-file";

import uDate from "@hooks/useDate";
import styles from "@styles/Seguridad.module.css";
import { useAuth } from "@hooks/useAuth";
import { cargarSeriales, listarProductosSeguridad } from "@services/api/seguridad";
import file from "@hooks/useFile";
import excel from "@hooks/useExcel";
import Alertas from "@assets/Alertas";
import useAlert from "@hooks/useAlert";
import { InputGroup, Form } from "react-bootstrap";
import { filtrarSemanaRangoMes } from "@services/api/semanas";

function getDefaultWarehouse(warehouses = []) {
    return warehouses.find((item) => item.consecutivo === "BRC")?.consecutivo || warehouses[0]?.consecutivo || "";
}

function validatePreviewRows(rows = []) {
    const serialCount = rows.reduce((acc, item) => {
        const serial = item?.serial?.trim?.() || "";
        if (serial) {
            acc[serial] = (acc[serial] || 0) + 1;
        }
        return acc;
    }, {});

    const rowIssues = rows.map((item, index) => {
        const issues = [];

        if (!item?.cons_producto) {
            issues.push("Sin articulo");
        }

        if (!item?.serial || item.serial === "null") {
            issues.push("Sin serial");
        }

        if (item?.serial && serialCount[item.serial] > 1) {
            issues.push("Serial repetido");
        }

        return {
            index,
            serial: item?.serial,
            issues,
        };
    });

    const duplicates = Object.entries(serialCount)
        .filter(([, count]) => count > 1)
        .map(([serial]) => serial);

    return {
        duplicates,
        rowIssues,
        hasErrors: rowIssues.some((row) => row.issues.length > 0),
    };
}

export default function Recepcion() {
    const { almacenByUser, user } = useAuth();
    const { alert, setAlert, toogleAlert } = useAlert();

    const [productos, setProductos] = useState([]);
    const [semanas, setSemanas] = useState([]);
    const [archivoBruto, setArchivoBruto] = useState([]);
    const [archivoExcel, setArchivoExcel] = useState([]);
    const [tabla, setTabla] = useState([]);
    const [bool, setBool] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [limit, setLimit] = useState(5);
    const [archivoNombre, setArchivoNombre] = useState("");

    const [formData, setFormData] = useState({
        almacen: "",
        remision: "",
        pedido: "",
        semana: "",
        fecha: uDate(),
        articulo: "0",
        observaciones: "",
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [productosRes, semanasRes] = await Promise.all([
                    listarProductosSeguridad(),
                    filtrarSemanaRangoMes(1, 1),
                ]);

                setProductos((productosRes || []).filter((item) => item.serial === true));
                setSemanas(semanasRes || []);
            } catch (error) {
                console.error("Error al cargar datos iniciales de recepcion:", error);
                setAlert({
                    active: true,
                    mensaje: "No fue posible cargar los datos iniciales.",
                    color: "danger",
                    autoClose: false
                });
            }
        };

        cargarDatos();
    }, [setAlert]);

    useEffect(() => {
        if (!formData.almacen && almacenByUser.length > 0) {
            setFormData((prev) => ({
                ...prev,
                almacen: getDefaultWarehouse(almacenByUser),
            }));
        }
    }, [almacenByUser, formData.almacen]);

    const productosMap = useMemo(() => {
        return new Map(productos.map((item) => [item.consecutivo, item.name]));
    }, [productos]);

    const previewValidation = useMemo(() => validatePreviewRows(archivoExcel), [archivoExcel]);

    const recalcularPreview = (rows, nextFormData = formData, nextLimit = limit) => {
        if (!rows || rows.length === 0 || !nextFormData.almacen) {
            setArchivoExcel([]);
            setTabla([]);
            return;
        }

        const transformedRows = file().ordenarExcelSerial(
            [...rows],
            nextFormData.almacen,
            nextFormData.articulo
        );

        setArchivoExcel(transformedRows);
        setTabla(transformedRows.slice(0, nextLimit));
    };

    const handleFormChange = (field, value) => {
        const nextFormData = { ...formData, [field]: value };
        setFormData(nextFormData);

        if (archivoBruto.length > 0 && (field === "almacen" || field === "articulo")) {
            recalcularPreview(archivoBruto, nextFormData, limit);
        }
    };

    const subirExcel = async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) {
            return;
        }

        try {
            const rows = await readXlsxFile(archivo);
            setArchivoNombre(archivo.name);
            setArchivoBruto(rows);
            setLimit(5);
            recalcularPreview(rows, formData, 5);
        } catch (error) {
            console.error("Error al leer archivo de recepcion:", error);
            setAlert({
                active: true,
                mensaje: "No fue posible leer el archivo Excel.",
                color: "danger",
                autoClose: false
            });
        }
    };

    const descargarPlantilla = () => {
        const data = {
            "Consecutivo articulo": null,
            "Serial articulo": null,
            "Serial bag pack": null,
            "Serial s_pack": null,
            "Serial m_pack": null,
            "Serial l_pack": null,
        };
        excel([data], "Plantilla", "Plantilla seriales");
    };

    const limitPaginacion = (e) => {
        const nextLimit = Math.max(0, parseInt(e.target.value, 10) || 0);
        setLimit(nextLimit);
        setTabla(archivoExcel.slice(0, nextLimit));
    };

    const cargarDatos = async (e) => {
        e.preventDefault();

        if (archivoExcel.length === 0) {
            setAlert({
                active: true,
                mensaje: "Debes cargar un archivo valido antes de continuar.",
                color: "danger",
                autoClose: false
            });
            return;
        }

        if (previewValidation.hasErrors) {
            setAlert({
                active: true,
                mensaje: "Corrige las filas marcadas en la previsualizacion antes de cargar.",
                color: "danger",
                autoClose: false
            });
            return;
        }

        if (!formData.almacen || !formData.semana || !formData.remision || !formData.pedido) {
            setAlert({
                active: true,
                mensaje: "Completa los campos obligatorios antes de cargar la recepcion.",
                color: "danger",
                autoClose: false
            });
            return;
        }

        if (formData.remision.trim().length < 3) {
            window.alert("La remision debe tener al menos tres caracteres.");
            return;
        }

        try {
            setSubiendo(true);
            const res = await cargarSeriales(
                archivoExcel,
                formData.remision.trim(),
                formData.pedido.trim(),
                formData.semana,
                formData.fecha,
                formData.observaciones.trim(),
                user.username
            );

            setBool(Boolean(res?.bool));
            setAlert({
                active: true,
                mensaje: res?.message || "Proceso completado.",
                color: res?.bool ? "success" : "danger",
                autoClose: false
            });
        } catch (error) {
            setAlert({
                active: true,
                mensaje: "Error, no se ha cargado la informacion.",
                color: "danger",
                autoClose: false
            });
        } finally {
            setSubiendo(false);
        }
    };

    const nuevoMovimiento = () => {
        setArchivoExcel([]);
        setTabla([]);
        setArchivoBruto([]);
        setArchivoNombre("");
        setBool(false);
        setSubiendo(false);
        setLimit(5);
        setFormData({
            almacen: getDefaultWarehouse(almacenByUser),
            remision: "",
            pedido: "",
            semana: "",
            fecha: uDate(),
            articulo: "0",
            observaciones: "",
        });
        setAlert({ active: false });
    };

    return (
        <section>
            <h2>Recepcion</h2>

            <form onSubmit={cargarDatos} className={styles.grid_recepcion}>
                <div className="input-group input-group-sm">
                    <span className="input-group-text">Almacen</span>
                    <select
                        className="form-select form-select-sm"
                        id="almacen"
                        name="almacen"
                        value={formData.almacen}
                        onChange={(e) => handleFormChange("almacen", e.target.value)}
                        disabled={bool}
                        required
                    >
                        <option value="">Selecione un almacen</option>
                        {almacenByUser.map((item) => (
                            <option key={item.consecutivo} value={item.consecutivo}>
                                {item.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <InputGroup size="sm">
                    <InputGroup.Text>Remision</InputGroup.Text>
                    <Form.Control
                        id="remision"
                        name="remision"
                        value={formData.remision}
                        onChange={(e) => handleFormChange("remision", e.target.value)}
                        required
                        disabled={bool}
                    />
                </InputGroup>

                <InputGroup size="sm">
                    <InputGroup.Text>Pedido</InputGroup.Text>
                    <Form.Control
                        id="pedido"
                        name="pedido"
                        value={formData.pedido}
                        onChange={(e) => handleFormChange("pedido", e.target.value)}
                        required
                        disabled={bool}
                    />
                </InputGroup>

                <div className="input-group input-group-sm">
                    <span className="input-group-text">Semana</span>
                    <select
                        className="form-select form-select-sm"
                        id="semana"
                        name="semana"
                        value={formData.semana}
                        onChange={(e) => handleFormChange("semana", e.target.value)}
                        disabled={bool}
                        required
                    >
                        <option value="">Selecciones una semana</option>
                        {semanas.map((item) => (
                            <option key={item.consecutivo} value={item.consecutivo}>
                                {item.consecutivo}
                            </option>
                        ))}
                    </select>
                </div>

                <InputGroup size="sm">
                    <InputGroup.Text>Fecha</InputGroup.Text>
                    <Form.Control
                        id="fecha"
                        name="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => handleFormChange("fecha", e.target.value)}
                        disabled={bool}
                    />
                </InputGroup>

                <div className="input-group input-group-sm">
                    <span className="input-group-text">Articulo</span>
                    <select
                        className="form-select form-select-sm"
                        value={formData.articulo}
                        onChange={(e) => handleFormChange("articulo", e.target.value)}
                        disabled={bool}
                    >
                        <option value="0">Varios</option>
                        {productos.map((item) => (
                            <option key={item.consecutivo} value={item.consecutivo}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <input
                        className="form-control form-control-sm"
                        onChange={subirExcel}
                        id="archivo-excel"
                        type="file"
                        required={!bool}
                        disabled={bool}
                    />
                </div>

                <InputGroup size="sm">
                    <InputGroup.Text>Observaciones</InputGroup.Text>
                    <Form.Control
                        id="observaciones"
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={(e) => handleFormChange("observaciones", e.target.value)}
                        disabled={bool}
                    />
                </InputGroup>

                {!bool && (
                    <button type="submit" className="btn btn-success btn-sm" disabled={subiendo}>
                        {subiendo ? "Cargando..." : "Cargar datos"}
                    </button>
                )}

                {bool && (
                    <button type="button" onClick={nuevoMovimiento} className="btn btn-primary btn-sm">
                        Nuevo movimiento
                    </button>
                )}
            </form>

            <Alertas className="mt-3" alert={alert} handleClose={toogleAlert} />

            <div className="line"></div>

            <div className="mt-3">
                {previewValidation.hasErrors && (
                    <div className="alert alert-warning py-2">
                        {previewValidation.duplicates.length > 0 && (
                            <div>
                                Seriales repetidos: {previewValidation.duplicates.join(", ")}
                            </div>
                        )}
                        <div>
                            Filas con observaciones: {previewValidation.rowIssues.filter((row) => row.issues.length > 0).length}
                        </div>
                    </div>
                )}

                <div className={styles.grid_result}>
                    <div className={styles.botonesTrans}>
                        <span className={styles.grid_result_child2}>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                id="limit"
                                min="1"
                                max={archivoExcel.length || 1}
                                onChange={limitPaginacion}
                                placeholder={String(limit)}
                                value={limit}
                                disabled={archivoExcel.length === 0}
                            />
                            <span className="mb-2 mt-2">
                                Resultados de {archivoExcel.length}
                                {archivoNombre ? ` - ${archivoNombre}` : ""}
                            </span>
                        </span>
                        <span className={styles.display}></span>
                        <span className={styles.display}></span>
                        <button type="button" onClick={descargarPlantilla} className="btn btn-warning btn-sm w-100">
                            Descargar Plantilla
                        </button>
                    </div>
                </div>

                <span className={styles.tabla_text}>
                    <table className="table mb-4 table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Alm</th>
                                <th scope="col">Articulo</th>
                                <th scope="col">Serial</th>
                                <th scope="col">Bag pack</th>
                                <th scope="col">S Pack</th>
                                <th scope="col">M Pack</th>
                                <th scope="col">L Pack</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tabla.map((item, index) => {
                                const rowValidation = previewValidation.rowIssues[index];
                                const hasRowError = rowValidation?.issues?.length > 0;

                                return (
                                <tr key={`${item.serial}-${index}`} className={hasRowError ? "table-warning" : ""}>
                                    <td>{item?.cons_almacen}</td>
                                    <td>
                                        {productosMap.get(item?.cons_producto) || item?.cons_producto}
                                        {hasRowError && (
                                            <div className="text-danger small">{rowValidation.issues.join(", ")}</div>
                                        )}
                                    </td>
                                    <td>{item?.serial}</td>
                                    <td>{item?.bag_pack}</td>
                                    <td>{item?.s_pack}</td>
                                    <td>{item?.m_pack}</td>
                                    <td>{item?.l_pack}</td>
                                </tr>
                                );
                            })}

                            {tabla.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        No hay datos para previsualizar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </span>
            </div>
        </section>
    );
}
