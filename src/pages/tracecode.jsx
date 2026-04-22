import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FaBoxOpen, FaCheckCircle, FaClipboardList, FaEdit, FaPrint, FaRoute, FaShippingFast, FaTimesCircle, FaUserShield } from "react-icons/fa";
import CorregirSerialModal from "@components/seguridad/CorregirSerialModal";
import { useAuth } from "@hooks/useAuth";
import { encontrarModulo } from "@services/api/configuracion";
import { encontrarContenedor } from "@services/api/contenedores";
import { listarInspecciones, paginarInspecciones } from "@services/api/inpecciones";
import { paginarListado } from "@services/api/listado";
import { paginarRechazos } from "@services/api/rechazos";
import { corregirAsignacionSerial, listarSeriales } from "@services/api/seguridad";
import { decodeTraceToken } from "@utils/tracecode";
import { getContainerReturnInfo, isContainerReturned } from "@utils/contenedorEstado";

const EMPTY_DATA = {
  contenedor: null,
  listados: [],
  emptyInspection: null,
  otherInspections: [],
  antinarcoticsRows: [],
  serialesContenedor: [],
  rechazos: [],
  usersMap: new Map(),
  tokenData: null
};

const formatDate = (value) => {
  if (!value) return "No registrado";

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota"
  });
};

const formatDateTime = (value) => {
  if (!value) return "No registrado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("es-CO", {
    timeZone: "America/Bogota"
  });
};

const formatNumber = (value, digits = 0) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0";

  return parsed.toLocaleString("es-CO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
};

const getFullName = (user) => {
  if (!user) return "No registrado";

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(" ").trim();
  return fullName || user.username || "No registrado";
};

const getUserLabel = (usersMap, userId, fallbackUser = null) => {
  if (fallbackUser) return getFullName(fallbackUser);
  if (!userId) return "No registrado";
  return usersMap.get(userId) || `Usuario #${userId}`;
};

const uniqueStrings = (values = []) =>
  [...new Set(values.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const getTransitDays = (start, end) => {
  if (!start || !end) return "No calculado";

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "No calculado";
  }

  const diff = Math.abs(endDate.getTime() - startDate.getTime());
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))} dias`;
};

const parseFoodResult = (text) => {
  const normalized = String(text || "").toLowerCase();

  if (normalized.includes("resultado: apto")) return "Apto para alimentos";
  if (normalized.includes("resultado: no apto")) return "No apto para alimentos";

  return "No registrado";
};

const buildUsersMap = (...collections) => {
  const users = new Map();

  collections.flat().forEach((item) => {
    const user = item?.usuario;
    if (user?.id) {
      users.set(user.id, getFullName(user));
    }
  });

  return users;
};

const groupAntinarcoticsRows = (rows = []) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const inspection = row?.Inspeccion || {};
    const key = [
      inspection.id || "sin-id",
      inspection.fecha_inspeccion || "",
      inspection.hora_inicio || "",
      inspection.hora_fin || "",
      inspection.agente || ""
    ].join("|");

    const current = grouped.get(key) || {
      inspection,
      seriales: [],
      usuarios: new Set()
    };

    current.seriales.push(row);

    const userName = getFullName(row?.usuario);
    if (userName !== "No registrado") {
      current.usuarios.add(userName);
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const left = new Date(b.inspection?.fecha_inspeccion || 0).getTime();
    const right = new Date(a.inspection?.fecha_inspeccion || 0).getTime();
    return left - right;
  });
};

const MetricCard = ({ label, value, icon, valueClassName = "text-dark" }) => (
  <div className="col-12 col-md-6 col-xl-3">
    <div className="card border-0 shadow-sm h-100" style={metricCardStyle}>
      <div className="card-body">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{
              width: 52,
              height: 52,
              background: "linear-gradient(135deg, #1e5fa4 0%, #0f9d7a 100%)",
              boxShadow: "0 10px 20px rgba(15, 157, 122, 0.18)"
            }}
          >
            {icon}
          </div>
          <div>
            <div className="small text-uppercase" style={{ color: "#6b7b93", letterSpacing: "0.04em", fontWeight: 700 }}>{label}</div>
            <div className={`fw-bold fs-5 ${valueClassName}`}>{value}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SimpleListCard = ({ title, items, emptyText = "No registrado" }) => (
  <div className="card border-0 shadow-sm h-100" style={sectionCardStyle}>
    <div className="card-header fw-semibold" style={sectionHeaderStyle}>{title}</div>
    <div className="card-body">
      {items.length === 0 ? (
        <span className="text-muted">{emptyText}</span>
      ) : (
        <div className="d-flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="badge border"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f2f8ff 100%)",
                color: "#163b6d",
                borderColor: "rgba(30, 95, 164, 0.14)",
                padding: "0.45rem 0.7rem"
              }}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

const centeredTableCellStyle = {
  textAlign: "center",
  verticalAlign: "middle"
};

const heroCardStyle = {
  background: "linear-gradient(135deg, #163b6d 0%, #1e5fa4 45%, #0f9d7a 100%)",
  color: "#ffffff",
  borderRadius: "24px",
  overflow: "hidden"
};

const sectionCardStyle = {
  background: "rgba(255, 255, 255, 0.96)",
  borderRadius: "22px",
  overflow: "hidden",
  boxShadow: "0 18px 45px rgba(16, 52, 96, 0.08)"
};

const sectionHeaderStyle = {
  background: "linear-gradient(90deg, #eef6ff 0%, #f4fbf9 100%)",
  color: "#163b6d",
  borderBottom: "1px solid rgba(22, 59, 109, 0.08)"
};

const metricCardStyle = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.98) 100%)",
  borderRadius: "18px",
  border: "1px solid rgba(30, 95, 164, 0.10)"
};

const tableHeaderStyle = {
  ...centeredTableCellStyle,
  background: "#edf5ff",
  color: "#163b6d",
  fontWeight: 700
};

export default function TracecodePage() {
  const router = useRouter();
  const { token } = router.query;
  const { getUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(EMPTY_DATA);
  const [canCorrectSerials, setCanCorrectSerials] = useState(false);
  const [serialSeleccionado, setSerialSeleccionado] = useState(null);
  const [corrigiendoSerial, setCorrigiendoSerial] = useState(false);

  const user = getUser();

  const loadPermissions = useCallback(async () => {
    if (!user?.username) {
      setCanCorrectSerials(false);
      return;
    }

    if (user?.id_rol === "Super administrador") {
      setCanCorrectSerials(true);
      return;
    }

    try {
      const config = await encontrarModulo(user.username);
      const detalles = config?.[0]?.detalles;
      const botones = Array.isArray(detalles)
        ? detalles
        : Array.isArray(detalles?.botones)
          ? detalles.botones
          : [];

      setCanCorrectSerials(botones.includes("disponibles_corregir_serial"));
    } catch (permissionError) {
      console.error("No fue posible cargar permisos para correccion de seriales:", permissionError);
      setCanCorrectSerials(false);
    }
  }, [user]);

  const loadDetail = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const decoded = decodeTraceToken(token);
      if (!decoded?.id) {
        throw new Error("El token del contenedor no es valido.");
      }

      const contenedor = await encontrarContenedor(decoded.id);
      const contenedorCodigo = contenedor?.contenedor || decoded?.contenedor || "";

      const [
        listadoResponse,
        inspeccionesResponse,
        rechazosResponse,
        serialesContenedor,
        inspeccionesGlobales
      ] = await Promise.all([
        paginarListado(1, 200, { contenedor: contenedorCodigo }),
        paginarInspecciones(1, 200, { contenedor: contenedorCodigo }),
        paginarRechazos(1, 200, { contenedor: contenedorCodigo }),
        listarSeriales(null, null, { id_contenedor: decoded.id }),
        listarInspecciones()
      ]);

      const listados = (listadoResponse?.data || []).filter(
        (item) => item?.Contenedor?.id === decoded.id
      );

      const antinarcoticsRows = (inspeccionesResponse?.data || []).filter(
        (item) => item?.contenedor?.id === decoded.id
      );

      const rechazos = (rechazosResponse?.data || []).filter(
        (item) => item?.Contenedor?.id === decoded.id
      );

      const usersMap = buildUsersMap(serialesContenedor || [], antinarcoticsRows || [], rechazos || []);
      const inspeccionesContenedor = (inspeccionesGlobales || []).filter(
        (item) => item?.id_contenedor === decoded.id
      );

      const emptyInspection =
        inspeccionesContenedor.find((item) =>
          String(item?.zona || "").toLowerCase().includes("vacio")
        ) || null;

      const otherInspections = inspeccionesContenedor.filter((item) => item?.id !== emptyInspection?.id);

      setDetail({
        contenedor,
        listados,
        emptyInspection,
        otherInspections,
        antinarcoticsRows,
        serialesContenedor: Array.isArray(serialesContenedor) ? serialesContenedor : [],
        rechazos,
        usersMap,
        tokenData: decoded
      });
    } catch (err) {
      console.error("Error cargando tracecode:", err);
      setError(err?.message || "No fue posible cargar la ficha del contenedor.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const computed = useMemo(() => {
    const { contenedor, listados, emptyInspection, otherInspections, antinarcoticsRows, serialesContenedor, rechazos, usersMap } = detail;

    if (!contenedor) return null;

    const firstRow = listados[0] || null;
    const embarque = firstRow?.Embarque || null;

    const uniqueProducts = uniqueStrings(listados.map((item) => item?.combo?.nombre));
    const uniqueFarms = uniqueStrings(listados.map((item) => item?.almacen?.nombre));
    const harvestDates = uniqueStrings(listados.map((item) => formatDate(item?.fecha)));

    const totalBoxes = listados.reduce((acc, item) => acc + Number(item?.cajas_unidades || 0), 0);
    const totalNetWeight = listados.reduce(
      (acc, item) => acc + (Number(item?.combo?.peso_neto || 0) * Number(item?.cajas_unidades || 0)),
      0
    );
    const totalGrossWeight = listados.reduce(
      (acc, item) => acc + (Number(item?.combo?.peso_bruto || 0) * Number(item?.cajas_unidades || 0)),
      0
    );
    const totalPallets = listados.reduce((acc, item) => {
      const cajas = Number(item?.cajas_unidades || 0);
      const cajasPorPalet = Number(item?.combo?.cajas_por_palet || 1);
      return acc + Math.ceil(cajas / cajasPorPalet);
    }, 0);

    const antinarcoticsSerials = new Set(antinarcoticsRows.map((item) => item?.serial).filter(Boolean));
    const emptyInspectionSerials = serialesContenedor.filter(
      (item) => item?.id_contenedor === contenedor.id && !antinarcoticsSerials.has(item?.serial)
    );
    const allUsedSerials = serialesContenedor.filter((item) => item?.id_contenedor === contenedor.id);

    const emptyInspectionUsers = uniqueStrings(
      emptyInspectionSerials.map((item) => getUserLabel(usersMap, item?.id_usuario, item?.usuario))
    );

    const antinarcoticsUsers = uniqueStrings(
      antinarcoticsRows.map((item) => getUserLabel(usersMap, item?.id_usuario, item?.usuario))
    );

    const rejectionUsers = uniqueStrings(
      rechazos.map((item) => getUserLabel(usersMap, item?.id_usuario, item?.usuario))
    );

    const groupedAntinarcotics = groupAntinarcoticsRows(antinarcoticsRows);
    const returnedInfo = getContainerReturnInfo(contenedor);
    const statusReturned = isContainerReturned(contenedor);

    const relatedUsers = uniqueStrings([
      ...emptyInspectionUsers,
      ...antinarcoticsUsers,
      ...rejectionUsers
    ]);

    return {
      embarque,
      uniqueProducts,
      uniqueFarms,
      harvestDates,
      totalBoxes,
      totalNetWeight,
      totalGrossWeight,
      totalPallets,
      allUsedSerials,
      emptyInspectionSerials,
      emptyInspectionUsers,
      antinarcoticsUsers,
      rejectionUsers,
      groupedAntinarcotics,
      returnedInfo,
      statusReturned,
      relatedUsers,
      hasFullInspection: groupedAntinarcotics.length > 0 || otherInspections.length > 0,
      emptyFoodStatus: parseFoodResult(emptyInspection?.observaciones)
    };
  }, [detail]);

  const abrirCorreccion = (serial) => {
    setSerialSeleccionado(serial);
  };

  const cerrarCorreccion = () => {
    setSerialSeleccionado(null);
    setCorrigiendoSerial(false);
  };

  const ejecutarCorreccion = async ({ modoCorreccion, serialCorrecto, observaciones }) => {
    if (!serialSeleccionado?.serial) {
      return;
    }

    if (modoCorreccion === "reemplazar" && !serialCorrecto.trim()) {
      window.alert("Debes indicar el serial correcto para el reemplazo.");
      return;
    }

    try {
      setCorrigiendoSerial(true);
      await corregirAsignacionSerial({
        serial_errado: serialSeleccionado.serial,
        serial_correcto: modoCorreccion === "reemplazar" ? serialCorrecto.trim().toUpperCase() : "",
        observaciones
      });

      await loadDetail();
      cerrarCorreccion();
    } catch (correctionError) {
      console.error("Error corrigiendo serial desde tracecode:", correctionError);
    } finally {
      setCorrigiendoSerial(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <h5 className="mb-1">Cargando ficha del contenedor</h5>
          <div className="text-muted">Consultando inspecciones, usuarios y trazabilidad.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-sm" style={{ maxWidth: 620 }}>
          <div className="card-body p-4">
            <h4 className="text-danger mb-3">No fue posible mostrar la ficha</h4>
            <p className="mb-0 text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!detail.contenedor || !computed) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center text-muted">
          <h4 className="mb-2">Sin informacion para mostrar</h4>
          <p className="mb-0">Abre esta pagina con un token valido de tracecode.</p>
        </div>
      </div>
    );
  }

  const { contenedor, listados, emptyInspection, rechazos } = detail;
  const {
    embarque,
    uniqueProducts,
    uniqueFarms,
    harvestDates,
    totalBoxes,
    totalNetWeight,
    totalGrossWeight,
    totalPallets,
    allUsedSerials,
    emptyInspectionSerials,
    emptyInspectionUsers,
    antinarcoticsUsers,
    groupedAntinarcotics,
    returnedInfo,
    statusReturned,
    relatedUsers,
    hasFullInspection,
    emptyFoodStatus
  } = computed;

  return (
    <div
      className="min-vh-100 py-4"
      style={{ background: "linear-gradient(180deg, #f6f8fb 0%, #eef3f9 100%)" }}
    >
      <div className="container">
        <div className="card border-0 shadow-sm mb-4" style={heroCardStyle}>
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
              <div>
                <div
                  className="small fw-semibold mb-2"
                  style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.72)" }}
                >
                  Tracecode del contenedor
                </div>
                <h1 className="mb-1">{contenedor.contenedor}</h1>
                <div style={{ color: "rgba(255,255,255,0.84)" }}>
                  Semana {embarque?.semana?.consecutivo || "No registrada"} • BL {embarque?.bl || "No registrado"}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <span className={`badge fs-6 ${statusReturned ? "text-bg-danger" : "text-bg-light text-dark"}`}>
                  {statusReturned ? "Devuelto / fuera de operacion" : "Activo"}
                </span>
                {emptyInspection && (
                  <span className="badge fs-6 text-bg-warning text-dark">
                    Inspeccion vacio registrada
                  </span>
                )}
                <span className={`badge fs-6 ${hasFullInspection ? "text-bg-success" : "text-bg-secondary"}`}>
                  {hasFullInspection ? "Inspeccion lleno / antinarcoticos" : "Sin inspeccion lleno"}
                </span>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <MetricCard label="Productos" value={uniqueProducts.length || 0} icon={<FaBoxOpen />} />
              <MetricCard label="Cajas" value={formatNumber(totalBoxes)} icon={<FaClipboardList />} />
              <MetricCard label="Pallets" value={formatNumber(totalPallets)} icon={<FaShippingFast />} />
              <MetricCard label="Usuarios" value={relatedUsers.length || 0} icon={<FaUserShield />} />
            </div>

            <div className="d-flex flex-column flex-md-row gap-2">
              <button type="button" className="btn btn-light fw-semibold px-4" onClick={() => window.print()}>
                <FaPrint className="me-2" />
                Imprimir ficha
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={sectionCardStyle}>
              <div className="card-header fw-semibold" style={sectionHeaderStyle}>Logistica del embarque</div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Booking</div>
                    <div className="fw-semibold">{embarque?.booking || "No registrado"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Destino</div>
                    <div className="fw-semibold">{embarque?.Destino?.destino || "No registrado"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Naviera</div>
                    <div className="fw-semibold">{embarque?.Naviera?.navieras || embarque?.Naviera?.cod || "No registrada"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Buque</div>
                    <div className="fw-semibold">{embarque?.Buque?.buque || "No registrado"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Fecha zarpe</div>
                    <div className="fw-semibold">{formatDateTime(embarque?.fecha_zarpe)}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Fecha arribo</div>
                    <div className="fw-semibold">{formatDateTime(embarque?.fecha_arribo)}</div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted small">Tiempo de transito</div>
                    <div className="fw-semibold">{getTransitDays(embarque?.fecha_zarpe, embarque?.fecha_arribo)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={sectionCardStyle}>
              <div className="card-header fw-semibold" style={sectionHeaderStyle}>Resumen de carga</div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Fincas / lugares de llenado</div>
                    <div className="fw-semibold">{uniqueFarms.join(", ") || "No registrado"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Fechas de cosecha / carga</div>
                    <div className="fw-semibold">{harvestDates.join(", ") || "No registrado"}</div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted small">Productos</div>
                    <div className="fw-semibold">{uniqueProducts.join(", ") || "No registrado"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Peso neto estimado</div>
                    <div className="fw-semibold">{formatNumber(totalNetWeight, 1)} kg</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Peso bruto estimado</div>
                    <div className="fw-semibold">{formatNumber(totalGrossWeight, 1)} kg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-6">
            <SimpleListCard title="Usuarios relacionados" items={relatedUsers} emptyText="No se identificaron usuarios relacionados." />
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={sectionCardStyle}>
              <div className="card-header fw-semibold" style={sectionHeaderStyle}>Estado del contenedor</div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  {statusReturned ? (
                    <FaTimesCircle className="text-danger fs-3" />
                  ) : (
                    <FaCheckCircle className="text-success fs-3" />
                  )}
                  <div>
                    <div className="fw-semibold">
                      {statusReturned ? "Contenedor devuelto o marcado en mal estado" : "Contenedor habilitado"}
                    </div>
                    <div className="text-muted small">
                      Creado: {formatDateTime(contenedor?.createdAt)} • Actualizado: {formatDateTime(contenedor?.updatedAt)}
                    </div>
                  </div>
                </div>

                {returnedInfo ? (
                  <>
                    <div className="text-muted small">Motivo de devolucion</div>
                    <div className="fw-semibold mb-2">{returnedInfo?.motivo || "No registrado"}</div>
                    <div className="text-muted small">Fecha de devolucion</div>
                    <div className="fw-semibold mb-2">{formatDateTime(returnedInfo?.fecha)}</div>
                    <div className="text-muted small">Origen</div>
                    <div className="fw-semibold">{returnedInfo?.origen || "No registrado"}</div>
                  </>
                ) : (
                  <span className="text-muted">No hay novedad de devolucion para este contenedor.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {emptyInspection && (
          <div className="card border-0 shadow-sm mb-4" style={sectionCardStyle}>
            <div className="card-header d-flex align-items-center justify-content-between" style={sectionHeaderStyle}>
              <span className="fw-semibold">Inspeccion contenedor vacio</span>
              <span className="badge text-bg-success">Registrada</span>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-12 col-lg-4">
                  <div className="text-muted small">Fecha de inspeccion</div>
                  <div className="fw-semibold mb-3">{formatDateTime(emptyInspection?.fecha_inspeccion)}</div>

                  <div className="text-muted small">Agente</div>
                  <div className="fw-semibold mb-3">{emptyInspection?.agente || "No registrado"}</div>

                  <div className="text-muted small">Horario</div>
                  <div className="fw-semibold mb-3">
                    {emptyInspection?.hora_inicio || "No registrado"} - {emptyInspection?.hora_fin || "No registrado"}
                  </div>

                  <div className="text-muted small">Validacion alimentos</div>
                  <div className={`fw-semibold ${emptyFoodStatus.includes("No apto") ? "text-danger" : "text-success"}`}>
                    {emptyFoodStatus}
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className="text-muted small">Usuarios que registraron insumos / vacio</div>
                  <div className="fw-semibold mb-3">
                    {emptyInspectionUsers.join(", ") || "No registrado"}
                  </div>

                  <div className="text-muted small">Cantidad de seriales asociados</div>
                  <div className="fw-semibold mb-3">{emptyInspectionSerials.length}</div>

                  <div className="text-muted small">Zona</div>
                  <div className="fw-semibold">{emptyInspection?.zona || "No registrada"}</div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className="text-muted small">Observaciones</div>
                  <div className="border rounded p-3 bg-light-subtle" style={{ whiteSpace: "pre-wrap" }}>
                    {emptyInspection?.observaciones || "Sin observaciones registradas."}
                  </div>
                </div>

                <div className="col-12">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered table-hover align-middle text-center mb-0">
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>Serial</th>
                          <th style={tableHeaderStyle}>Producto</th>
                          <th style={tableHeaderStyle}>Usuario</th>
                          <th style={tableHeaderStyle}>Fecha de uso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emptyInspectionSerials.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-3">
                              No se encontraron seriales asociados a la inspeccion vacio.
                            </td>
                          </tr>
                        ) : (
                          emptyInspectionSerials.map((item) => (
                            <tr key={item.id || item.serial}>
                              <td style={centeredTableCellStyle}>{item.serial || "No registrado"}</td>
                              <td style={centeredTableCellStyle}>{item?.producto?.name || item?.producto?.nombre || item.cons_producto || "No registrado"}</td>
                              <td style={centeredTableCellStyle}>{getUserLabel(detail.usersMap, item?.id_usuario, item?.usuario)}</td>
                              <td style={centeredTableCellStyle}>{formatDate(item?.fecha_de_uso || item?.updatedAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm mb-4" style={sectionCardStyle}>
          <div className="card-header d-flex align-items-center justify-content-between" style={sectionHeaderStyle}>
            <span className="fw-semibold">Inspeccion lleno / antinarcoticos</span>
            <span className={`badge ${hasFullInspection ? "text-bg-success" : "text-bg-secondary"}`}>
              {hasFullInspection ? "Registrada" : "No registrada"}
            </span>
          </div>
          <div className="card-body">
            {!hasFullInspection ? (
              <div className="text-muted">No hay inspecciones de contenedor lleno asociadas a este contenedor.</div>
            ) : (
              <div className="row g-4">
                <div className="col-12">
                  <div className="row g-3">
                    <MetricCard label="Eventos inspeccion" value={groupedAntinarcotics.length || detail.otherInspections.length} icon={<FaRoute />} />
                    <MetricCard label="Seriales usados" value={detail.antinarcoticsRows.length} icon={<FaBoxOpen />} />
                    <MetricCard label="Usuarios" value={antinarcoticsUsers.length || 0} icon={<FaUserShield />} />
                    <MetricCard label="Rechazos" value={rechazos.length} icon={<FaClipboardList />} valueClassName={rechazos.length ? "text-danger" : "text-dark"} />
                  </div>
                </div>

                {groupedAntinarcotics.map((group, index) => (
                  <div className="col-12" key={`${group.inspection?.id || "anti"}-${index}`}>
                    <div className="border rounded p-3">
                      <div className="row g-3">
                        <div className="col-12 col-lg-4">
                          <div className="text-muted small">Fecha</div>
                          <div className="fw-semibold mb-2">{formatDateTime(group.inspection?.fecha_inspeccion)}</div>
                          <div className="text-muted small">Agente</div>
                          <div className="fw-semibold mb-2">{group.inspection?.agente || "No registrado"}</div>
                          <div className="text-muted small">Horario</div>
                          <div className="fw-semibold">
                            {group.inspection?.hora_inicio || "No registrado"} - {group.inspection?.hora_fin || "No registrado"}
                          </div>
                        </div>

                        <div className="col-12 col-lg-4">
                          <div className="text-muted small">Zona</div>
                          <div className="fw-semibold mb-2">{group.inspection?.zona || "No registrada"}</div>
                          <div className="text-muted small">Usuarios del registro</div>
                          <div className="fw-semibold">{Array.from(group.usuarios).join(", ") || "No registrado"}</div>
                        </div>

                        <div className="col-12 col-lg-4">
                          <div className="text-muted small">Observaciones</div>
                          <div className="border rounded p-3 bg-light-subtle" style={{ whiteSpace: "pre-wrap" }}>
                            {group.inspection?.observaciones || "Sin observaciones registradas."}
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered table-hover align-middle text-center mb-0">
                              <thead>
                                <tr>
                                  <th style={tableHeaderStyle}>Serial</th>
                                  <th style={tableHeaderStyle}>Articulo</th>
                                  <th style={tableHeaderStyle}>Movimiento</th>
                                  <th style={tableHeaderStyle}>Usuario</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.seriales.map((item) => (
                                  <tr key={item.id || item.serial}>
                                    <td style={centeredTableCellStyle}>{item.serial || "No registrado"}</td>
                                    <td style={centeredTableCellStyle}>{item?.producto?.name || item?.producto?.nombre || item?.cons_producto || "No registrado"}</td>
                                    <td style={centeredTableCellStyle}>{item?.MotivoDeUso?.motivo_de_uso || "No registrado"}</td>
                                    <td style={centeredTableCellStyle}>{getUserLabel(detail.usersMap, item?.id_usuario, item?.usuario)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={sectionCardStyle}>
          <div className="card-header fw-semibold" style={sectionHeaderStyle}>Todos los seriales usados en el contenedor</div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-bordered table-hover align-middle text-center mb-0">
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Serial</th>
                    <th style={tableHeaderStyle}>Articulo</th>
                    <th style={tableHeaderStyle}>Motivo de uso</th>
                    <th style={tableHeaderStyle}>Usuario</th>
                    <th style={tableHeaderStyle}>Movimiento</th>
                    <th style={tableHeaderStyle}>Fecha de uso</th>
                    {canCorrectSerials && <th style={tableHeaderStyle}>Corregir</th>}
                  </tr>
                </thead>
                <tbody>
                  {allUsedSerials.length === 0 ? (
                    <tr>
                      <td colSpan={canCorrectSerials ? 7 : 6} className="text-center text-muted py-3">
                        No se encontraron seriales usados para este contenedor.
                      </td>
                    </tr>
                  ) : (
                    allUsedSerials.map((item) => (
                      <tr key={item.id || item.serial}>
                        <td style={centeredTableCellStyle}>{item.serial || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{item?.producto?.name || item?.producto?.nombre || item?.cons_producto || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{item?.MotivoDeUso?.motivo_de_uso || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{getUserLabel(detail.usersMap, item?.id_usuario, item?.usuario)}</td>
                        <td style={centeredTableCellStyle}>{item?.cons_movimiento || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{formatDate(item?.fecha_de_uso || item?.updatedAt)}</td>
                        {canCorrectSerials && (
                          <td style={centeredTableCellStyle}>
                            <button
                              type="button"
                              className="btn btn-outline-warning btn-sm"
                              onClick={() => abrirCorreccion(item)}
                              title={`Corregir serial ${item.serial}`}
                            >
                              <FaEdit />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={sectionCardStyle}>
          <div className="card-header fw-semibold" style={sectionHeaderStyle}>Lineas de listado del contenedor</div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-bordered table-hover align-middle text-center mb-0">
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Fecha</th>
                    <th style={tableHeaderStyle}>Producto</th>
                    <th style={tableHeaderStyle}>Cajas</th>
                    <th style={tableHeaderStyle}>Pallets</th>
                    <th style={tableHeaderStyle}>Llenado</th>
                    <th style={tableHeaderStyle}>Semana</th>
                    <th style={tableHeaderStyle}>BL</th>
                  </tr>
                </thead>
                <tbody>
                  {listados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-3">
                        No hay lineas de listado registradas para este contenedor.
                      </td>
                    </tr>
                  ) : (
                    listados.map((item) => {
                      const cajas = Number(item?.cajas_unidades || 0);
                      const cajasPorPalet = Number(item?.combo?.cajas_por_palet || 1);
                      const pallets = Math.ceil(cajas / cajasPorPalet);

                      return (
                        <tr key={item.id}>
                          <td style={centeredTableCellStyle}>{formatDate(item?.fecha)}</td>
                          <td style={centeredTableCellStyle}>{item?.combo?.nombre || "No registrado"}</td>
                          <td style={centeredTableCellStyle}>{formatNumber(cajas)}</td>
                          <td style={centeredTableCellStyle}>{formatNumber(pallets)}</td>
                          <td style={centeredTableCellStyle}>{item?.almacen?.nombre || "No registrado"}</td>
                          <td style={centeredTableCellStyle}>{item?.Embarque?.semana?.consecutivo || "No registrado"}</td>
                          <td style={centeredTableCellStyle}>{item?.Embarque?.bl || "No registrado"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm" style={sectionCardStyle}>
          <div className="card-header fw-semibold" style={sectionHeaderStyle}>Rechazos asociados</div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-bordered table-hover align-middle text-center mb-0">
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Fecha</th>
                    <th style={tableHeaderStyle}>Producto</th>
                    <th style={tableHeaderStyle}>Cantidad</th>
                    <th style={tableHeaderStyle}>Pallet</th>
                    <th style={tableHeaderStyle}>Motivo</th>
                    <th style={tableHeaderStyle}>Productor</th>
                    <th style={tableHeaderStyle}>Usuario</th>
                    <th style={tableHeaderStyle}>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rechazos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-3">
                        No hay rechazos registrados para este contenedor.
                      </td>
                    </tr>
                  ) : (
                    rechazos.map((item) => (
                      <tr key={item.id}>
                        <td style={centeredTableCellStyle}>{formatDate(item?.fecha_rechazo || item?.createdAt)}</td>
                        <td style={centeredTableCellStyle}>{item?.combo?.nombre || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{formatNumber(item?.cantidad || 0)}</td>
                        <td style={centeredTableCellStyle}>{item?.serial_palet || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{item?.MotivoDeRechazo?.motivo_rechazo || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{item?.almacene?.nombre || item?.cod_productor || "No registrado"}</td>
                        <td style={centeredTableCellStyle}>{getUserLabel(detail.usersMap, item?.id_usuario, item?.usuario)}</td>
                        <td style={centeredTableCellStyle}>{item?.observaciones || "Sin observaciones"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <CorregirSerialModal
          open={Boolean(serialSeleccionado)}
          serialSeleccionado={serialSeleccionado}
          loading={corrigiendoSerial}
          onClose={cerrarCorreccion}
          onConfirm={ejecutarCorreccion}
        />
      </div>
    </div>
  );
}
