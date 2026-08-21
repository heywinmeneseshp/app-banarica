import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaCheckCircle, FaChartBar, FaCog, FaExchangeAlt, FaEdit, FaSave, FaTable } from "react-icons/fa";
import { GrCircleInformation } from "react-icons/gr";
import { Dropdown } from "react-bootstrap";

import Paginacion from "@components/shared/Tablas/Paginacion";
import CorregirInspeccionContenedorModal from "@components/seguridad/CorregirInspeccionContenedorModal";
import { encontrarModulo } from "@services/api/configuracion";
import { actualizarInspeccion, paginarInspecciones } from "@services/api/inspecciones";
import { aprobarInspeccionLleno, corregirInspeccionContenedor, rechazarInspeccionLleno } from "@services/api/seguridad";
import InsumoConfig from "@components/shared/InsumoConfig";
import InspeccionesGraficos from "./InspeccionesGraficos";
import { useAuth } from "@hooks/useAuth";

const isEmptyInspectionZone = (zone) =>
    String(zone || "").toLowerCase().includes("vacio");

export default function Inspeccionados() {
    const formRef = useRef();
    const tableRef = useRef(null);
    const { getUser, almacenByUser } = useAuth();
    const user = getUser();

    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [openConfig, setOpenConfig] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [filtersVersion, setFiltersVersion] = useState(0);
    const [canCorrectContainer, setCanCorrectContainer] = useState(false);
    const [canEditHoras, setCanEditHoras] = useState(false);
    const [canVerGraficos, setCanVerGraficos] = useState(false);
    const [vista, setVista] = useState("tabla"); // "tabla" | "grafico"
    const [editando, setEditando] = useState(null);
    const [valoresEditados, setValoresEditados] = useState({});
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);
    const [inspeccionSeleccionada, setInspeccionSeleccionada] = useState(null);
    const [corrigiendoContenedor, setCorrigiendoContenedor] = useState(false);
    const [aprobandoInspeccionId, setAprobandoInspeccionId] = useState(null);
    const [rechazandoInspeccionId, setRechazandoInspeccionId] = useState(null);

    const limit = 30;

    const getWeekConsecutive = (item) =>
        item?.Embarque?.semana?.consecutivo
        || item?.listado?.Embarque?.semana?.consecutivo
        || item?.semana?.consecutivo
        || "";

    const ultimoDiaDelAnio = () => {
        const hoy = new Date();
        return `${hoy.getFullYear() + 1}-01-01`;
    };

    const fetchSeriales = useCallback(async () => {
        try {
            const formData = new FormData(formRef.current);
            const alamcenes = almacenByUser?.map((item) => item.consecutivo) || [];
            let config = await encontrarModulo("InspeccionesConfig");
            config = JSON.parse(config[0].detalles);
            config = config.tags;

            const dataBusqueda = {
                semana: formData.get("semana"),
                cons_producto: config,
                cons_almacen: alamcenes,
                contenedor: formData.get("contenedor"),
                fecha_inspeccion_inicio: formData.get("fecha-inicio"),
                fecha_inspeccion_fin: formData.get("fecha-fin"),
            };

            const res = await paginarInspecciones(pagination, limit, dataBusqueda);

            const rows = (res.data || []).filter((item) => {
                const respuestaMovimiento = String(item?.movimiento?.respuesta || "").toLowerCase();
                return (
                    !respuestaMovimiento.includes("rechazada")
                    && !isEmptyInspectionZone(item?.Inspeccion?.zona || item?.zona)
                );
            });

            setData(rows);
            setTotal(Number(res?.total || 0));
        } catch (error) {
            console.error("Error al obtener seriales:", error);
            setData([]);
            setTotal(0);
        }
    }, [almacenByUser, limit, pagination]);

    useEffect(() => {
        fetchSeriales();
    }, [fetchSeriales, openConfig, filtersVersion]);

    useEffect(() => {
        const loadPermissions = async () => {
            if (user?.id_rol === "Super administrador") {
                setCanCorrectContainer(true);
                setCanEditHoras(true);
                setCanVerGraficos(true);
                return;
            }

            if (!user?.username) {
                setCanCorrectContainer(false);
                setCanEditHoras(false);
                setCanVerGraficos(false);
                return;
            }

            try {
                const config = await encontrarModulo(user.username);
                const detallesRaw = config?.[0]?.detalles;
                const detalles = detallesRaw ? JSON.parse(detallesRaw) : {};
                const botones = Array.isArray(detalles?.botones) ? detalles.botones : [];
                setCanCorrectContainer(botones.includes("inspeccionados_corregir_contenedor"));
                setCanEditHoras(botones.includes("inspeccionados_editar_horas"));
                setCanVerGraficos(botones.includes("inspeccionados_ver_graficos"));
            } catch (error) {
                console.error("Error cargando permisos de correccion de contenedor:", error);
                setCanCorrectContainer(false);
                setCanEditHoras(false);
                setCanVerGraficos(false);
            }
        };

        loadPermissions();
    }, [user?.id_rol, user?.username]);

    // Si el usuario pierde el permiso de graficos (o nunca lo tuvo), no se queda
    // atascado en esa vista.
    useEffect(() => {
        if (!canVerGraficos && vista === "grafico") {
            setVista("tabla");
        }
    }, [canVerGraficos, vista]);

    const handleFilter = () => {
        setPagination(1);
        setFiltersVersion((prev) => prev + 1);
    };

    const handleConfig = () => {
        setOpenConfig(!openConfig);
    };

    const abrirCorreccionContenedor = (item) => {
        setInspeccionSeleccionada(item);
    };

    const cerrarCorreccionContenedor = () => {
        setInspeccionSeleccionada(null);
        setCorrigiendoContenedor(false);
    };

    const ejecutarCorreccionContenedor = async ({ contenedorCorrecto, observaciones }) => {
        if (!inspeccionSeleccionada?.Inspeccion?.id) {
            return;
        }

        if (!contenedorCorrecto) {
            window.alert("Debes indicar el contenedor correcto.");
            return;
        }

        try {
            setCorrigiendoContenedor(true);
            await corregirInspeccionContenedor({
                id_inspeccion: inspeccionSeleccionada.Inspeccion.id,
                contenedor_correcto: contenedorCorrecto,
                observaciones,
            });
            await fetchSeriales();
            cerrarCorreccionContenedor();
        } catch (error) {
            console.error("Error corrigiendo contenedor inspeccionado:", error);
        } finally {
            setCorrigiendoContenedor(false);
        }
    };

    const aprobarInspeccionPendiente = async (item) => {
        const idInspeccion = item?.Inspeccion?.id;
        if (!idInspeccion) {
            return;
        }

        try {
            setAprobandoInspeccionId(idInspeccion);
            const response = await aprobarInspeccionLleno({ id_inspeccion: idInspeccion });
            await fetchSeriales();
            window.alert(response?.message || "Inspeccion aprobada exitosamente.");
        } catch (error) {
            console.error("Error aprobando inspeccion lleno:", error);
        } finally {
            setAprobandoInspeccionId(null);
        }
    };

    const rechazarInspeccionPendiente = async (item) => {
        const idInspeccion = item?.Inspeccion?.id;
        if (!idInspeccion) {
            return;
        }

        const observaciones = window.prompt("Observaciones del rechazo:", "") || "";
        if (!window.confirm("¿Estas seguro de rechazar esta inspeccion? Esto devolvera los seriales al inventario.")) {
            return;
        }

        try {
            setRechazandoInspeccionId(idInspeccion);
            const response = await rechazarInspeccionLleno({
                id_inspeccion: idInspeccion,
                observaciones
            });
            await fetchSeriales();
            window.alert(response?.message || "Inspeccion rechazada exitosamente.");
        } catch (error) {
            console.error("Error rechazando inspeccion lleno:", error);
        } finally {
            setRechazandoInspeccionId(null);
        }
    };

    const getInspectionStatus = (item) => {
        if (item?.Inspeccion?.habilitado) {
            return { label: "Aprobada", className: "bg-success" };
        }

        return { label: "Pendiente", className: "bg-warning text-dark" };
    };

    const formatHoraInput = (hora) => {
        if (!hora) return "";
        return String(hora).slice(0, 5);
    };

    const formatDateInput = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        if (!isNaN(d.getTime())) {
            const dia = String(d.getUTCDate()).padStart(2, "0");
            const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
            return `${d.getUTCFullYear()}-${mes}-${dia}`;
        }
        const match = String(dateString).match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[0] : "";
    };

    const abrirEdicion = (item) => {
        const inspeccion = item?.Inspeccion || {};
        setValoresEditados({
            fecha_inspeccion: formatDateInput(inspeccion.fecha_inspeccion),
            agente: inspeccion.agente || "",
            hora_inicio: formatHoraInput(inspeccion.hora_inicio),
            hora_fin: formatHoraInput(inspeccion.hora_fin),
        });
        setEditando(item?.Inspeccion?.id);
    };

    const cerrarEdicion = () => {
        setEditando(null);
        setValoresEditados({});
    };

    const handleChange = (e, field) => {
        setValoresEditados({ ...valoresEditados, [field]: e.target.value });
    };

    const guardarEdicion = async () => {
        const idInspeccion = editando;
        if (!idInspeccion) {
            return;
        }

        try {
            setGuardandoEdicion(true);
            await actualizarInspeccion(idInspeccion, {
                fecha_inspeccion: valoresEditados.fecha_inspeccion,
                agente: valoresEditados.agente,
                hora_inicio: valoresEditados.hora_inicio,
                hora_fin: valoresEditados.hora_fin,
            });
            cerrarEdicion();
            await fetchSeriales();
        } catch (error) {
            console.error("Error actualizando inspeccion:", error);
            window.alert("Error al guardar los cambios de la inspeccion.");
        } finally {
            setGuardandoEdicion(false);
        }
    };

    const formatDateToDDMMYYYY = (dateString) => {
        const d = new Date(dateString);
        const dia = String(d.getUTCDate()).padStart(2, "0");
        const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
        const anio = d.getUTCFullYear();
        return `${dia}-${mes}-${anio}`;
    };

    return (
        <>
            <div className="container-fluid px-0">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2 mb-3">
                    <h2 className="mb-0">Unidades Inspeccionadas</h2>
                    {canVerGraficos && (
                        <div className="btn-group btn-group-sm" role="group" aria-label="Cambiar vista">
                            <button
                                type="button"
                                onClick={() => setVista("tabla")}
                                className={`btn ${vista === "tabla" ? "btn-primary" : "btn-outline-primary"} d-inline-flex align-items-center gap-1`}
                            >
                                <FaTable /> Tabla
                            </button>
                            <button
                                type="button"
                                onClick={() => setVista("grafico")}
                                className={`btn ${vista === "grafico" ? "btn-primary" : "btn-outline-primary"} d-inline-flex align-items-center gap-1`}
                            >
                                <FaChartBar /> Gráfico
                            </button>
                        </div>
                    )}
                </div>

                {vista === "grafico" && canVerGraficos ? (
                    <InspeccionesGraficos />
                ) : (
                <>
                <form ref={formRef} className="row mt-3 g-2 align-items-center">
                    <div className={`col-12 ${user?.id_rol === "Super administrador" ? "col-md-2" : "col-md-3"}`}>
                        <div className="input-group flex-nowrap">
                            <span className="input-group-text" id="start-date-addon">Fecha Inicio:</span>
                            <input
                                onChange={handleFilter}
                                type="date"
                                id="fecha-inicio"
                                name="fecha-inicio"
                                className="form-control"
                                aria-label="Fecha inicio"
                                aria-describedby="start-date-addon"
                            />
                        </div>
                    </div>

                    <div className={`col-12 ${user?.id_rol === "Super administrador" ? "col-md-2" : "col-md-3"}`}>
                        <div className="input-group flex-nowrap">
                            <span className="input-group-text" id="end-date-addon">Fecha Fin:</span>
                            <input
                                defaultValue={ultimoDiaDelAnio()}
                                onChange={handleFilter}
                                type="date"
                                id="fecha-fin"
                                name="fecha-fin"
                                className="form-control"
                                aria-label="Fecha fin"
                                aria-describedby="end-date-addon"
                            />
                        </div>
                    </div>

                    <div className={`col-12 ${user?.id_rol === "Super administrador" ? "col-md-3" : "col-md-3"}`}>
                        <div className="input-group flex-nowrap">
                            <span className="input-group-text" id="week-addon">Semana:</span>
                            <input
                                onChange={handleFilter}
                                type="text"
                                id="semana"
                                name="semana"
                                className="form-control"
                                aria-label="Semana"
                                aria-describedby="week-addon"
                                placeholder="S18-2026"
                            />
                        </div>
                    </div>

                    <div className={`col-12 ${user?.id_rol === "Super administrador" ? "col-md-3" : "col-md-3"}`}>
                        <div className="input-group flex-nowrap">
                            <span className="input-group-text" id="end-contendor-addon">Contenedor:</span>
                            <input
                                onChange={handleFilter}
                                type="text"
                                id="contenedor"
                                name="contenedor"
                                className="form-control"
                                aria-label="Contenedor"
                                aria-describedby="end-contendor-addon"
                            />
                        </div>
                    </div>

                    {user?.id_rol === "Super administrador" && (
                        <div className="col-12 col-md-2 d-flex align-items-center justify-content-md-center justify-content-start">
                            <button
                                onClick={handleConfig}
                                type="button"
                                className="btn btn-sm d-inline-flex align-items-center justify-content-center border-0 shadow-none text-secondary"
                                style={{ fontSize: "1.2rem", color: "#6c757d" }}
                            >
                                <FaCog />
                            </button>
                        </div>
                    )}
                </form>

                <div className="table-responsive mt-3">
                <table ref={tableRef} className="table table-striped table-bordered table-sm align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th scope="col" className="text-center text-nowrap">N°</th>
                            <th scope="col" className="text-center text-nowrap">Semana</th>
                            <th scope="col" className="text-center text-nowrap">Fecha Inspccion</th>
                            <th className="text-center text-nowrap">Contenedor</th>
                            <th className="text-center text-nowrap">Serial</th>
                            <th className="text-center text-nowrap">Movimiento</th>
                            <th className="text-center text-nowrap">Agente</th>
                            <th className="text-center text-nowrap">Inicio</th>
                            <th className="text-center text-nowrap">Fin</th>
                            <th className="text-center text-nowrap">Usuario</th>
                            {user?.id_rol === "Super administrador" && <th className="text-center text-nowrap">Accion</th>}
                            {canCorrectContainer && <th className="text-center text-nowrap">Corregir</th>}
                            {canEditHoras && <th className="text-center text-nowrap">Editar</th>}
                            {user?.id_rol === "Super administrador" && <th className="text-center text-nowrap">Info</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, key) => {
                            const status = getInspectionStatus(item);
                            const canResolvePending = item?.Inspeccion?.id && !item?.Inspeccion?.habilitado && status.label === "Pendiente";
                            const datos = {
                                id: item?.contenedor?.id,
                                timestamp: Date.now(),
                                contenedor: item?.contenedor?.contenedor
                            };
                            const token = btoa(JSON.stringify(datos));
                            const baseUrl = window.location.origin;
                            const traceUrl = `${baseUrl}/tracecode?token=${token}`;
                            return (
                                <tr key={key}>
                                    <td className="text-center">{(pagination - 1) * limit + key + 1}</td>
                                    <td className="text-center">{getWeekConsecutive(item) || "-"}</td>
                                    <td className="text-center">
                                        {canEditHoras && editando === item?.Inspeccion?.id ? (
                                            <input
                                                type="date"
                                                value={valoresEditados.fecha_inspeccion || ""}
                                                onChange={(e) => handleChange(e, "fecha_inspeccion")}
                                                className="form-control form-control-sm d-inline-block"
                                                style={{ width: "135px" }}
                                            />
                                        ) : (
                                            formatDateToDDMMYYYY(item?.Inspeccion?.fecha_inspeccion)
                                        )}
                                    </td>
                                    <td className="text-center">{item?.contenedor?.contenedor}</td>
                                    <td className="text-center">{item?.serial}</td>
                                    <td className="text-center">{item?.MotivoDeUso?.motivo_de_uso}</td>
                                    <td className="text-center">
                                        {canEditHoras && editando === item?.Inspeccion?.id ? (
                                            <input
                                                type="text"
                                                value={valoresEditados.agente || ""}
                                                onChange={(e) => handleChange(e, "agente")}
                                                className="form-control form-control-sm d-inline-block"
                                                style={{ width: "110px" }}
                                            />
                                        ) : (
                                            item?.Inspeccion?.agente
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {canEditHoras && editando === item?.Inspeccion?.id ? (
                                            <input
                                                type="time"
                                                value={valoresEditados.hora_inicio || ""}
                                                onChange={(e) => handleChange(e, "hora_inicio")}
                                                className="form-control form-control-sm d-inline-block"
                                                style={{ width: "100px" }}
                                            />
                                        ) : (
                                            item?.Inspeccion?.hora_inicio
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {canEditHoras && editando === item?.Inspeccion?.id ? (
                                            <input
                                                type="time"
                                                value={valoresEditados.hora_fin || ""}
                                                onChange={(e) => handleChange(e, "hora_fin")}
                                                className="form-control form-control-sm d-inline-block"
                                                style={{ width: "100px" }}
                                            />
                                        ) : (
                                            item?.Inspeccion?.hora_fin
                                        )}
                                    </td>
                                    <td className="text-center">{`${item?.usuario?.nombre || ""} ${item?.usuario?.apellido || ""}`.trim()}</td>
                                    {user?.id_rol === "Super administrador" && (
                                        <td className="text-center">
                                            {canResolvePending ? (
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        id={`acciones-inspeccion-${item?.Inspeccion?.id}`}
                                                        className="d-inline-flex align-items-center justify-content-center"
                                                    >
                                                        ⋮
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu>
                                                        <Dropdown.Item
                                                            onClick={() => aprobarInspeccionPendiente(item)}
                                                            disabled={aprobandoInspeccionId === item?.Inspeccion?.id}
                                                        >
                                                            {aprobandoInspeccionId === item?.Inspeccion?.id ? "Aprobando..." : "Aprobar"}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
                                                            onClick={() => rechazarInspeccionPendiente(item)}
                                                            disabled={rechazandoInspeccionId === item?.Inspeccion?.id}
                                                            className="text-danger"
                                                        >
                                                            {rechazandoInspeccionId === item?.Inspeccion?.id ? "Rechazando..." : "Rechazar"}
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            ) : (
                                                <span
                                                    title={status.label}
                                                    className="d-inline-flex align-items-center justify-content-center"
                                                    style={{ color: "#198754", fontSize: "1.2rem" }}
                                                >
                                                    <FaCheckCircle />
                                                </span>
                                            )}
                                        </td>
                                    )}
                                    {canCorrectContainer && (
                                        <td className="text-center">
                                            {item?.Inspeccion?.id ? (
                                                <button
                                                    type="button"
                                                    title={`Corregir contenedor ${item?.contenedor?.contenedor || ""}`}
                                                    onClick={() => abrirCorreccionContenedor(item)}
                                                    className="btn p-0 border-0 bg-transparent d-inline-flex align-items-center justify-content-center"
                                                    style={{ color: "#f0ad4e", fontSize: "1.15rem" }}
                                                >
                                                    <FaExchangeAlt />
                                                </button>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                    )}
                                    {canEditHoras && (
                                        <td className="text-center">
                                            {editando === item?.Inspeccion?.id ? (
                                                <FaSave
                                                    onClick={() => guardarEdicion(item)}
                                                    title={guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                                                    style={{ cursor: guardandoEdicion ? "wait" : "pointer", color: "black", fontSize: "1.2rem", opacity: guardandoEdicion ? 0.5 : 1 }}
                                                />
                                            ) : (
                                                <FaEdit
                                                    onClick={() => abrirEdicion(item)}
                                                    title="Editar fecha, agente y horas"
                                                    disabled={!item?.Inspeccion?.id}
                                                    style={{ cursor: "pointer", color: "#997a1c", fontSize: "1.2rem", opacity: item?.Inspeccion?.id ? 1 : 0.4 }}
                                                />
                                            )}
                                        </td>
                                    )}
                                    {user?.id_rol === "Super administrador" && (
                                        <td
                                            className="text-center"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => window.open(traceUrl)}
                                        >
                                            <GrCircleInformation />
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>

                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                {openConfig && <InsumoConfig handleConfig={handleConfig} modulo_confi={"InspeccionesConfig"} />}
                <CorregirInspeccionContenedorModal
                    open={Boolean(inspeccionSeleccionada)}
                    loading={corrigiendoContenedor}
                    inspeccionSeleccionada={inspeccionSeleccionada}
                    onClose={cerrarCorreccionContenedor}
                    onConfirm={ejecutarCorreccionContenedor}
                />
                </>
                )}
            </div>
        </>
    );
}
