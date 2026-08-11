import React, { useEffect, useMemo, useRef, useState } from "react";
import readXlsxFile from "read-excel-file";
import { Form, Row, Col, ProgressBar } from "react-bootstrap";
import { FaClipboardList, FaExclamationTriangle, FaFileExcel, FaTable } from "react-icons/fa";

import uDate from "@hooks/useDate";
import { useAuth } from "@hooks/useAuth";
import { cargarSeriales, deshacerCargaSeriales, listarProductosSeguridad } from "@services/api/seguridad";
import file from "@hooks/useFile";
import excel from "@hooks/useExcel";
import Alertas from "@components/shared/Alertas";
import useAlert from "@hooks/useAlert";
import { filtrarSemanasRangoProgramador } from "@services/api/semanas";
import { encontrarModulo } from "@services/api/configuracion";

const TAMANO_LOTE = 3000; // Filas por solicitud. Divide archivos grandes automaticamente.

function getDefaultWarehouse(warehouses = []) {
    return warehouses.find((item) => item.consecutivo === "BRC")?.consecutivo || warehouses[0]?.consecutivo || "";
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function validatePreviewRows(rows = [], productosMap = new Map()) {
    const serialCount = rows.reduce((acc, item) => {
        const serial = item?.serial?.trim?.() || "";
        if (serial) {
            acc[serial] = (acc[serial] || 0) + 1;
        }
        return acc;
    }, {});

    const rowIssues = rows.map((item, index) => {
        const issues = [];
        const camposConError = new Set();

        if (!item?.cons_producto) {
            issues.push("Sin articulo");
            camposConError.add("articulo");
        } else if (productosMap.size > 0 && !productosMap.has(item.cons_producto)) {
            issues.push("Articulo no reconocido");
            camposConError.add("articulo");
        }

        if (!item?.serial || item.serial === "null") {
            issues.push("Sin serial");
            camposConError.add("serial");
        } else if (serialCount[item.serial] > 1) {
            issues.push("Serial repetido");
            camposConError.add("serial");
        }

        return {
            index,
            fila: index + 2, // +1 por encabezado, +1 por indice base 1: coincide con el numero de fila del Excel
            serial: item?.serial,
            issues,
            camposConError,
        };
    });

    const duplicates = Object.entries(serialCount)
        .filter(([, count]) => count > 1)
        .map(([serial]) => serial);

    const conteoPorTipo = rowIssues.reduce((acc, row) => {
        row.issues.forEach((issue) => {
            acc[issue] = (acc[issue] || 0) + 1;
        });
        return acc;
    }, {});

    const filasConError = rowIssues.filter((row) => row.issues.length > 0);

    return {
        duplicates,
        rowIssues,
        conteoPorTipo,
        filasConError,
        hasErrors: filasConError.length > 0,
    };
}

export default function Recepcion() {
    const { almacenByUser, user } = useAuth();
    const { alert, setAlert, toogleAlert } = useAlert();

    const [productos, setProductos] = useState([]);
    const [semanas, setSemanas] = useState([]);
    const [archivoBruto, setArchivoBruto] = useState([]);
    const [archivoExcel, setArchivoExcel] = useState([]);
    const [bool, setBool] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [limit, setLimit] = useState(5);
    const [soloErrores, setSoloErrores] = useState(false);
    const [archivoNombre, setArchivoNombre] = useState("");
    const [progreso, setProgreso] = useState(null); // { loteActual, totalLotes, filasCargadas, totalFilas }
    const [resumenCarga, setResumenCarga] = useState(null); // { totalSeriales, consMovimiento }
    const previsualizacionRef = useRef(null);

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
                const [productosRes, moduloRes] = await Promise.all([
                    listarProductosSeguridad(),
                    encontrarModulo("Semana", { syncWeeks: false }).catch(() => null),
                ]);

                setProductos((productosRes || []).filter((item) => item.serial === true));

                if (moduloRes?.[0]) {
                    const config = moduloRes[0];
                    filtrarSemanasRangoProgramador({
                        anho_actual: config.anho_actual,
                        semana_actual: config.semana_actual,
                        semana_previa: config.semana_previa,
                        semana_siguiente: config.semana_siguiente,
                        total_semanas_anho: config.total_semanas_anho,
                    })
                        .then((semanasList) => setSemanas(semanasList || []))
                        .catch(() => {});
                }
            } catch (error) {
                console.error("Error al cargar datos iniciales de recepcion:", error?.message);
                setAlert({
                    active: true,
                    mensaje: "No fue posible cargar los datos iniciales.",
                    color: "danger",
                    autoClose: false,
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

    const previewValidation = useMemo(
        () => validatePreviewRows(archivoExcel, productosMap),
        [archivoExcel, productosMap]
    );

    const totalLotes = useMemo(
        () => Math.max(1, Math.ceil(archivoExcel.length / TAMANO_LOTE)),
        [archivoExcel.length]
    );

    const filasParaMostrar = useMemo(() => {
        const base = soloErrores
            ? previewValidation.filasConError.map((row) => ({ item: archivoExcel[row.index], index: row.index }))
            : archivoExcel.map((item, index) => ({ item, index }));

        return base.slice(0, limit);
    }, [archivoExcel, previewValidation, soloErrores, limit]);

    const recalcularPreview = (rows, nextFormData = formData) => {
        if (!rows || rows.length === 0 || !nextFormData.almacen) {
            setArchivoExcel([]);
            return;
        }

        const transformedRows = file().ordenarExcelSerial(
            [...rows],
            nextFormData.almacen,
            nextFormData.articulo
        );

        setArchivoExcel(transformedRows);
    };

    const handleFormChange = (field, value) => {
        const nextFormData = { ...formData, [field]: value };
        setFormData(nextFormData);

        if (archivoBruto.length > 0 && (field === "almacen" || field === "articulo")) {
            recalcularPreview(archivoBruto, nextFormData);
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
            setSoloErrores(false);
            recalcularPreview(rows, formData);
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
            setSoloErrores(true);
            setLimit((prev) => Math.max(prev, 20));
            previsualizacionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            setAlert({
                active: true,
                mensaje: `Hay ${previewValidation.filasConError.length} fila(s) con errores en la previsualizacion. Corrigelas en el Excel antes de cargar (se muestran solo las filas con error).`,
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
            setAlert({
                active: true,
                mensaje: "La remision debe tener al menos tres caracteres.",
                color: "danger",
                autoClose: false
            });
            return;
        }

        const lotes = chunkArray(archivoExcel, TAMANO_LOTE);
        let consMovimiento = null;
        let filasCargadas = 0;

        setSubiendo(true);
        setAlert({ active: false });

        try {
            for (let i = 0; i < lotes.length; i++) {
                setProgreso({
                    loteActual: i + 1,
                    totalLotes: lotes.length,
                    filasCargadas,
                    totalFilas: archivoExcel.length,
                });

                const res = await cargarSeriales({
                    data: lotes[i],
                    remision: formData.remision.trim(),
                    pedido: formData.pedido.trim(),
                    semana: formData.semana,
                    fecha: formData.fecha,
                    observaciones: formData.observaciones.trim(),
                    username: user.username,
                    cons_movimiento: consMovimiento,
                });

                if (!res?.bool) {
                    throw new Error(res?.message || "El servidor rechazo el lote.");
                }

                consMovimiento = res.cons_movimiento;
                filasCargadas += lotes[i].length;
            }

            setProgreso({ loteActual: lotes.length, totalLotes: lotes.length, filasCargadas, totalFilas: archivoExcel.length });
            setResumenCarga({ totalSeriales: filasCargadas, consMovimiento });
            setBool(true);
            setAlert({
                active: true,
                mensaje: `Se cargaron ${filasCargadas} seriales exitosamente (movimiento ${consMovimiento}).`,
                color: "success",
                autoClose: false
            });
        } catch (error) {
            console.error("Error al cargar seriales:", error);

            // Todo o nada: si algun lote falla, se revierten los lotes que ya se
            // hubieran alcanzado a cargar bajo el mismo movimiento.
            if (consMovimiento) {
                try {
                    await deshacerCargaSeriales(consMovimiento);
                } catch (rollbackError) {
                    console.error("Error al revertir la carga parcial:", rollbackError);
                    setAlert({
                        active: true,
                        mensaje: `${error.message} Ademas, no fue posible revertir automaticamente lo ya cargado en el movimiento ${consMovimiento}: ${rollbackError.message} Contacta a un administrador.`,
                        color: "danger",
                        autoClose: false
                    });
                    setSubiendo(false);
                    return;
                }
            }

            setProgreso(null);
            setAlert({
                active: true,
                mensaje: `No se cargo ningun serial: ${error.message} Corrige el archivo e intenta de nuevo.`,
                color: "danger",
                autoClose: false
            });
        } finally {
            setSubiendo(false);
        }
    };

    const nuevoMovimiento = () => {
        setArchivoExcel([]);
        setArchivoBruto([]);
        setArchivoNombre("");
        setBool(false);
        setSubiendo(false);
        setLimit(5);
        setSoloErrores(false);
        setProgreso(null);
        setResumenCarga(null);
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
            <h2 className="mb-1">Recepcion de Seriales</h2>
            <div className="line"></div>
            <p className="text-muted small mb-3">
                Carga un archivo Excel con los seriales recibidos. Si el archivo tiene muchos seriales
                (por ejemplo, 20.000), no es necesario dividirlo: el sistema lo sube en lotes automaticamente.
            </p>

            <form onSubmit={cargarDatos}>
                <div className="card shadow-sm mb-3">
                    <div className="card-header bg-dark text-white py-2 fw-bold d-flex align-items-center gap-2">
                        <FaClipboardList /> 1. Datos de la recepcion
                    </div>
                    <div className="card-body">
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Label className="mb-1 small">Almacen</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={formData.almacen}
                                    onChange={(e) => handleFormChange("almacen", e.target.value)}
                                    disabled={bool}
                                    required
                                >
                                    <option value="">Seleccione un almacen</option>
                                    {almacenByUser.map((item) => (
                                        <option key={item.consecutivo} value={item.consecutivo}>
                                            {item.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col md={4}>
                                <Form.Label className="mb-1 small">Semana</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={formData.semana}
                                    onChange={(e) => handleFormChange("semana", e.target.value)}
                                    disabled={bool}
                                    required
                                >
                                    <option value="">Seleccione una semana</option>
                                    {semanas.map((item) => (
                                        <option key={item.consecutivo} value={item.consecutivo}>
                                            {item.consecutivo}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col md={4}>
                                <Form.Label className="mb-1 small">Fecha</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => handleFormChange("fecha", e.target.value)}
                                    disabled={bool}
                                />
                            </Col>

                            <Col md={4}>
                                <Form.Label className="mb-1 small">Remision</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={formData.remision}
                                    onChange={(e) => handleFormChange("remision", e.target.value)}
                                    required
                                    disabled={bool}
                                />
                            </Col>

                            <Col md={4}>
                                <Form.Label className="mb-1 small">Pedido</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={formData.pedido}
                                    onChange={(e) => handleFormChange("pedido", e.target.value)}
                                    required
                                    disabled={bool}
                                />
                            </Col>

                            <Col md={4}>
                                <Form.Label className="mb-1 small">Articulo</Form.Label>
                                <Form.Select
                                    size="sm"
                                    value={formData.articulo}
                                    onChange={(e) => handleFormChange("articulo", e.target.value)}
                                    disabled={bool}
                                >
                                    <option value="0">Varios (el archivo trae el articulo por fila)</option>
                                    {productos.map((item) => (
                                        <option key={item.consecutivo} value={item.consecutivo}>
                                            {item.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label className="mb-1 small d-flex align-items-center gap-1">
                                    <FaFileExcel /> Archivo Excel
                                </Form.Label>
                                <Form.Control
                                    size="sm"
                                    onChange={subirExcel}
                                    id="archivo-excel"
                                    type="file"
                                    required={!bool}
                                    disabled={bool}
                                />
                                <small className="text-muted d-block mt-1">
                                    Usa la plantilla para asegurar que las columnas coincidan.
                                </small>
                            </Col>

                            <Col md={6}>
                                <Form.Label className="mb-1 small">Observaciones</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={formData.observaciones}
                                    onChange={(e) => handleFormChange("observaciones", e.target.value)}
                                    disabled={bool}
                                />
                            </Col>
                        </Row>
                    </div>
                </div>

                <div className="d-grid gap-2 d-sm-flex justify-content-sm-end mb-3">
                    <button type="button" onClick={descargarPlantilla} className="btn btn-warning btn-sm" disabled={bool}>
                        Descargar plantilla
                    </button>
                    {!bool ? (
                        <button type="submit" className="btn btn-success btn-sm" disabled={subiendo}>
                            {subiendo ? "Cargando..." : "Cargar datos"}
                        </button>
                    ) : (
                        <button type="button" onClick={nuevoMovimiento} className="btn btn-primary btn-sm">
                            Nuevo movimiento
                        </button>
                    )}
                </div>
            </form>

            {progreso && subiendo && (
                <div className="card shadow-sm mb-3">
                    <div className="card-body">
                        <div className="d-flex justify-content-between small mb-1">
                            <span>
                                Subiendo lote {progreso.loteActual} de {progreso.totalLotes}
                            </span>
                            <span>
                                {progreso.filasCargadas} / {progreso.totalFilas} seriales
                            </span>
                        </div>
                        <ProgressBar
                            now={(progreso.filasCargadas / progreso.totalFilas) * 100}
                            animated
                        />
                    </div>
                </div>
            )}

            {resumenCarga && bool && (
                <div className="alert alert-success py-2">
                    Movimiento <strong>{resumenCarga.consMovimiento}</strong> completado con {resumenCarga.totalSeriales} seriales.
                </div>
            )}

            <Alertas className="mt-3" alert={alert} handleClose={toogleAlert} />

            <div className="card shadow-sm" ref={previsualizacionRef}>
                <div className="card-header bg-dark text-white py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <span className="fw-bold d-flex align-items-center gap-2"><FaTable /> 3. Previsualizacion</span>
                    <span className="text-white-50 small">
                        {archivoExcel.length > 0 && (
                            <>
                                {archivoExcel.length} seriales en {totalLotes} lote{totalLotes !== 1 ? "s" : ""}
                                {archivoNombre ? ` · ${archivoNombre}` : ""}
                            </>
                        )}
                    </span>
                </div>
                <div className="card-body">
                    {previewValidation.hasErrors && (
                        <div className="alert alert-danger py-2">
                            <div className="fw-bold d-flex align-items-center gap-2 mb-1">
                                <FaExclamationTriangle />
                                {previewValidation.filasConError.length} fila(s) con errores. No se puede cargar hasta corregirlas.
                            </div>
                            <ul className="mb-2 small">
                                {Object.entries(previewValidation.conteoPorTipo).map(([tipo, cantidad]) => (
                                    <li key={tipo}>{tipo}: {cantidad}</li>
                                ))}
                            </ul>
                            <div className="small mb-2">
                                Filas del Excel con error: {previewValidation.filasConError.slice(0, 20).map((row) => row.fila).join(", ")}
                                {previewValidation.filasConError.length > 20 ? ` y ${previewValidation.filasConError.length - 20} mas...` : ""}
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="solo-errores"
                                    checked={soloErrores}
                                    onChange={(e) => setSoloErrores(e.target.checked)}
                                />
                                <label className="form-check-label small" htmlFor="solo-errores">
                                    Mostrar solo filas con error
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                        <label htmlFor="limit" className="small mb-0 text-muted">Mostrar</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: 80 }}
                            id="limit"
                            min="1"
                            max={archivoExcel.length || 1}
                            onChange={limitPaginacion}
                            placeholder={String(limit)}
                            value={limit}
                            disabled={archivoExcel.length === 0}
                        />
                        <span className="small text-muted">
                            de {soloErrores ? previewValidation.filasConError.length : archivoExcel.length} filas
                            {soloErrores ? " con error" : ""}
                        </span>
                    </div>

                    <div className="table-responsive">
                        <table className="table mb-0 table-striped table-hover table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col" title="Numero de fila en el archivo Excel">Fila</th>
                                    <th scope="col"></th>
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
                                {filasParaMostrar.map(({ item, index }) => {
                                    const rowValidation = previewValidation.rowIssues[index];
                                    const hasRowError = rowValidation?.issues?.length > 0;
                                    const errorArticulo = rowValidation?.camposConError?.has("articulo");
                                    const errorSerial = rowValidation?.camposConError?.has("serial");

                                    return (
                                    <tr key={`${item?.serial}-${index}`} className={hasRowError ? "table-danger" : ""}>
                                        <td className="text-muted small">{rowValidation?.fila}</td>
                                        <td>
                                            {hasRowError && (
                                                <FaExclamationTriangle className="text-danger" title={rowValidation.issues.join(", ")} />
                                            )}
                                        </td>
                                        <td>{item?.cons_almacen}</td>
                                        <td className={errorArticulo ? "text-danger fw-bold" : ""}>
                                            {productosMap.get(item?.cons_producto) || item?.cons_producto}
                                        </td>
                                        <td className={errorSerial ? "text-danger fw-bold" : ""}>{item?.serial}</td>
                                        <td>{item?.bag_pack}</td>
                                        <td>{item?.s_pack}</td>
                                        <td>{item?.m_pack}</td>
                                        <td>{item?.l_pack}</td>
                                    </tr>
                                    );
                                })}

                                {filasParaMostrar.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center text-muted py-4">
                                            {archivoExcel.length === 0
                                                ? "No hay datos para previsualizar. Sube un archivo Excel arriba."
                                                : "No hay filas con error para mostrar."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
