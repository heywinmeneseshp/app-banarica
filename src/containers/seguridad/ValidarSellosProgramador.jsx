import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FaArrowRight, FaCheckCircle, FaClipboardCheck, FaExclamationTriangle, FaSearch, FaTimesCircle } from "react-icons/fa";
import { Button, Modal } from "react-bootstrap";
import { encontrarModulo } from "@services/api/configuracion";
import { enviarEmail } from "@services/api/email";
import { filtrarProductos } from "@services/api/productos";
import { actualizarProgramaciones, paginarProgramaciones } from "@services/api/programaciones";
import { useAuth } from "@hooks/useAuth";

const PROGRAMADOR_GLOBAL_CONFIG = "Relacion_programador";
const PROGRAMADOR_USER_CONFIG_PREFIX = "Relacion_programador_";
const DASHBOARD_SECURITY_CONFIG_KEYS = ["RelaciÃ³n_seguridad", "Relación_seguridad", "Relacion_seguridad"];
const INSPECCION_VACIO_STORAGE_KEY = "inspecVacio";

const normalizeText = (value) => String(value || "").trim();
const normalizeUppercase = (value) => normalizeText(value).toUpperCase();
const normalizeCompare = (value) => normalizeUppercase(value).replace(/\s+/g, "");
const normalizeStatus = (value) => normalizeText(value).toLowerCase();

const parseConfigTags = (rows) => {
  try {
    const detalles = rows?.[0]?.detalles ? JSON.parse(rows[0].detalles) : {};
    if (Array.isArray(detalles)) {
      return detalles.map((item) => item?.consecutivo || item?.id || item).filter(Boolean);
    }
    return Array.isArray(detalles?.tags) ? detalles.tags.filter(Boolean) : [];
  } catch (error) {
    console.warn("No fue posible leer la configuracion de sellos del programador:", error);
    return [];
  }
};

const parseConfigDetails = (rows) => {
  try {
    return rows?.[0]?.detalles ? JSON.parse(rows[0].detalles) : {};
  } catch (error) {
    console.warn("No fue posible leer detalles de configuracion:", error);
    return {};
  }
};

const parseProgramacionDetalles = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("No fue posible leer detalles de programacion:", error);
    return {};
  }
};

const hasSealReview = (row) => Boolean(parseProgramacionDetalles(row?.detalles)?.sellos_programador_revision?.estado);

const getProgramadorSeriales = (row) => {
  const seriales = Array.isArray(row?.seriales_programador)
    ? row.seriales_programador
    : row?.serialesProgramador || [];

  return seriales.filter((item) => item?.activo !== false);
};

const getSerialProduct = (serialRow) => (
  serialRow?.serial_articulo?.cons_producto
  || serialRow?.cons_producto
  || serialRow?.serial_articulo?.producto?.consecutivo
  || ""
);

const getSerialValue = (serialRow) => (
  serialRow?.serial_articulo?.bag_pack
  || serialRow?.serial_articulo?.serial
  || serialRow?.bag_pack
  || serialRow?.serial
  || ""
);

const getProductName = (serialRow) => (
  serialRow?.serial_articulo?.producto?.name
  || serialRow?.producto?.name
  || serialRow?.cons_producto
  || ""
);

const buildSealRows = (programacion, configProducts) => {
  const seriales = getProgramadorSeriales(programacion);
  const configured = configProducts.length ? configProducts : [];

  if (!configured.length) {
    return seriales.map((serial) => ({
      key: serial?.id || getSerialValue(serial),
      articulo: getProductName(serial),
      serial: getSerialValue(serial),
      completo: Boolean(getSerialValue(serial)),
    }));
  }

  return configured.map((product) => {
    const serial = seriales.find((item) => String(getSerialProduct(item)) === String(product?.consecutivo));
    return {
      key: product.consecutivo,
      articulo: product.name,
      serial: getSerialValue(serial),
      completo: Boolean(serial && getSerialValue(serial)),
    };
  });
};

export default function ValidarSellosProgramador() {
  const router = useRouter();
  const { getUser } = useAuth();
  const user = getUser() || {};
  const [contenedor, setContenedor] = useState("");
  const [programacion, setProgramacion] = useState(null);
  const [sealRows, setSealRows] = useState([]);
  const [verified, setVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyChecks, setVerifyChecks] = useState({});
  const [verifyRealSerials, setVerifyRealSerials] = useState({});
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verificationDiffs, setVerificationDiffs] = useState([]);
  const [discrepancyReported, setDiscrepancyReported] = useState(false);
  const [alertEmails, setAlertEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [message, setMessage] = useState("");

  const sealsComplete = useMemo(() => (
    Boolean(programacion)
    && sealRows.length > 0
    && sealRows.every((item) => item.completo)
  ), [programacion, sealRows]);
  const canContinue = sealsComplete && verified;

  const loadConfigData = async () => {
    const username = user?.username || "";
    const configRequests = [
      encontrarModulo(PROGRAMADOR_GLOBAL_CONFIG).catch(() => []),
      ...DASHBOARD_SECURITY_CONFIG_KEYS.map((key) => encontrarModulo(key).catch(() => [])),
    ];

    if (username) {
      configRequests.push(encontrarModulo(`${PROGRAMADOR_USER_CONFIG_PREFIX}${username}`).catch(() => []));
    }

    const configs = await Promise.all(configRequests);
    const [globalConfig, ...restConfigs] = configs;
    const userConfig = username ? restConfigs[restConfigs.length - 1] : [];
    const dashboardConfigs = username ? restConfigs.slice(0, -1) : restConfigs;
    const dashboardDetails = dashboardConfigs.map(parseConfigDetails).find((details) => details?.correos_alerta) || {};
    const tags = [globalConfig, userConfig].map(parseConfigTags).find((items) => items.length) || [];
    const emails = dashboardDetails?.correos_alerta || "";

    if (!tags.length) {
      return { products: [], emails };
    }

    const productos = await filtrarProductos({ producto: { consecutivo: tags, isBlock: false } });
    const products = tags
      .map((tag) => (productos || []).find((item) => String(item?.consecutivo) === String(tag)))
      .filter(Boolean);

    return { products, emails };
  };

  const buscarContenedor = async (event) => {
    event.preventDefault();
    const contenedorValue = normalizeUppercase(contenedor);

    if (!contenedorValue) {
      setMessage("Ingresa un numero de contenedor.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setProgramacion(null);
      setSealRows([]);
      setVerified(false);
      setVerifyChecks({});
      setVerifyRealSerials({});
      setVerifyMessage("");
      setVerificationDiffs([]);
      setDiscrepancyReported(false);

      const [configData, programacionesResponse] = await Promise.all([
        loadConfigData(),
        paginarProgramaciones(1, 2000, {
          fecha: "2024-01-01",
          fechaFin: "2099-12-31",
        }),
      ]);
      setAlertEmails(configData.emails || "");

      const rows = Array.isArray(programacionesResponse?.data) ? programacionesResponse.data : [];
      const pendingRows = rows.filter((row) => (
        normalizeStatus(row?.estado_listado || "pendiente") === "pendiente"
        && !hasSealReview(row)
      ));
      const found = pendingRows.find((row) => normalizeCompare(row?.contenedor) === normalizeCompare(contenedorValue));

      if (!found) {
        setMessage(`No se encontro el contenedor ${contenedorValue} en lineas pendientes sin revision previa del Programador.`);
        return;
      }

      const nextSealRows = buildSealRows(found, configData.products);
      setProgramacion(found);
      setSealRows(nextSealRows);

      if (!nextSealRows.length) {
        setMessage("El contenedor existe en Programador, pero no tiene sellos relacionados.");
        return;
      }

      if (!nextSealRows.every((item) => item.completo)) {
        setMessage("El contenedor tiene sellos pendientes. Completa los sellos del Programador antes de inspeccionar.");
        return;
      }

      setMessage("Sellos completos. Verifica fisicamente los sellos para continuar.");
    } catch (error) {
      console.error("Error validando sellos del programador:", error);
      setMessage(error.message || "No fue posible validar los sellos del Programador.");
    } finally {
      setLoading(false);
    }
  };

  const irAInspeccionVacio = () => {
    const contenedorValue = normalizeUppercase(programacion?.contenedor || contenedor);
    localStorage.setItem(
      INSPECCION_VACIO_STORAGE_KEY,
      JSON.stringify({
        contenedor: contenedorValue,
        fecha: new Date().toISOString().split("T")[0],
      })
    );
    router.push("/Seguridad/Lector");
  };

  const abrirVerificacion = () => {
    if (!sealsComplete) {
      setMessage("Todos los sellos deben estar asignados antes de verificarlos.");
      return;
    }

    setVerifyChecks(
      sealRows.reduce((acc, item) => {
        acc[item.key] = true;
        return acc;
      }, {})
    );
    setVerifyRealSerials({});
    setVerifyMessage("");
    setVerificationDiffs([]);
    setShowVerifyModal(true);
  };

  const sendMismatchAlert = async (diffs) => {
    if (!alertEmails) {
      return { success: false, message: "No hay correo destinatario configurado." };
    }

    const rows = diffs.map((item) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd;">${item.articulo}</td>
        <td style="padding: 6px; border: 1px solid #ddd; color: red; font-weight: bold;">${item.serial}</td>
        <td style="padding: 6px; border: 1px solid #ddd; color: green; font-weight: bold;">${item.serialReal}</td>
      </tr>
    `).join("");

    const cuerpo = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d9534f;">ALERTA: Inconsistencias en sellos del programador</h2>
        <p><b>Contenedor:</b> ${programacion?.contenedor || ""}</p>
        <p><b>Fecha:</b> ${programacion?.fecha || ""}</p>
        <p>Se detectaron diferencias entre los sellos registrados en la app y los sellos fisicos revisados.</p>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f9fa; text-align: left; border-bottom: 2px solid #ddd;">
              <th style="padding: 6px; border: 1px solid #ddd;">Articulo</th>
              <th style="padding: 6px; border: 1px solid #ddd;">Serial registrado</th>
              <th style="padding: 6px; border: 1px solid #ddd;">Serial fisico</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const result = await enviarEmail(
      alertEmails,
      `Alerta: diferencias en sellos del programador - ${programacion?.contenedor || ""}`,
      cuerpo
    );
    return {
      success: Boolean(result?.success),
      message: result?.message || "No fue posible enviar la alerta.",
    };
  };

  const guardarRevisionProgramador = async ({ estado, diferencias = [] }) => {
    if (!programacion?.id) {
      return;
    }

    const detalles = parseProgramacionDetalles(programacion.detalles);
    const nextDetalles = {
      ...detalles,
      sellos_programador_revision: {
        estado,
        fecha: new Date().toISOString(),
        usuario: user?.username || "",
        diferencias: diferencias.map((item) => ({
          articulo: item.articulo,
          serial_registrado: item.serial,
          serial_fisico: item.serialReal,
        })),
      },
    };

    await actualizarProgramaciones(programacion.id, {
      detalles: JSON.stringify(nextDetalles),
    });
    setProgramacion((prev) => (prev ? { ...prev, detalles: JSON.stringify(nextDetalles) } : prev));
  };

  const confirmarVerificacion = async () => {
    const rejected = sealRows.filter((item) => !verifyChecks[item.key]);
    if (rejected.length) {
      const missingRealSerials = rejected.filter((item) => !normalizeText(verifyRealSerials[item.key]));
      if (missingRealSerials.length) {
        setVerifyMessage("Ingresa el sello fisico real para cada diferencia marcada.");
        return;
      }

      const diffs = rejected.map((item) => ({
        ...item,
        serialReal: normalizeUppercase(verifyRealSerials[item.key]),
      }));

      setSendingAlert(true);
      const alertResult = await sendMismatchAlert(diffs);
      setSendingAlert(false);
      setVerified(false);
      setVerificationDiffs(diffs);
      try {
        await guardarRevisionProgramador({ estado: "diferencia", diferencias: diffs });
      } catch (error) {
        setVerifyMessage(error.message || "No fue posible guardar la revision del Programador.");
        return;
      }
      setDiscrepancyReported(true);
      setShowVerifyModal(false);
      setMessage(
        alertResult.success
          ? `Hay diferencias en sellos. Se envio la alerta a: ${alertEmails}. Finaliza esta revision para continuar con otro contenedor.`
          : `Hay diferencias en sellos. ${alertResult.message} Finaliza esta revision para continuar con otro contenedor.`
      );
      return;
    }

    try {
      await guardarRevisionProgramador({ estado: "verificado" });
    } catch (error) {
      setVerifyMessage(error.message || "No fue posible guardar la revision del Programador.");
      return;
    }
    setVerified(true);
    setVerifyMessage("");
    setVerificationDiffs([]);
    setDiscrepancyReported(false);
    setShowVerifyModal(false);
    setMessage("Sellos verificados correctamente. Puedes continuar a Inspeccion Vacio.");
  };

  const finalizarRevisionConDiferencia = () => {
    setContenedor("");
    setProgramacion(null);
    setSealRows([]);
    setVerified(false);
    setVerifyChecks({});
    setVerifyRealSerials({});
    setVerificationDiffs([]);
    setDiscrepancyReported(false);
    setMessage("Revision finalizada con diferencia reportada.");
  };

  const getSealBadge = (item) => {
    if (!item.completo) {
      return { label: "Pendiente", className: "bg-warning text-dark", icon: <FaExclamationTriangle className="me-1" /> };
    }

    if (verificationDiffs.some((diff) => diff.key === item.key)) {
      return { label: "Diferencia", className: "bg-danger", icon: <FaTimesCircle className="me-1" /> };
    }

    if (verified || verificationDiffs.length > 0) {
      return { label: "Verificado", className: "bg-success", icon: <FaCheckCircle className="me-1" /> };
    }

    return { label: "Asignado", className: "bg-secondary", icon: <FaClipboardCheck className="me-1" /> };
  };

  return (
    <div className="container-fluid px-2 px-md-0">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2 mb-3">
        <h2 className="mb-0 fs-4 fs-md-2">Validar sellos programador</h2>
      </div>

      <form className="border rounded bg-light p-3 p-md-4 mb-3" onSubmit={buscarContenedor}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-5">
            <label htmlFor="contenedor-programador-validacion" className="form-label fw-semibold">
              Contenedor
            </label>
            <input
              id="contenedor-programador-validacion"
              type="text"
              className="form-control form-control-lg"
              value={contenedor}
              onChange={(event) => setContenedor(normalizeUppercase(event.target.value))}
              placeholder="CGMU5383374"
            />
          </div>
          <div className="col-12 col-sm-4 col-lg-2">
            <button type="submit" className="btn btn-primary btn-lg w-100 text-nowrap" disabled={loading}>
              <FaSearch className="me-2" />
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
          <div className="col-12 col-sm-4 col-lg-2">
            <button type="button" className="btn btn-warning btn-lg w-100 text-nowrap" disabled={!sealsComplete} onClick={abrirVerificacion}>
              <FaClipboardCheck className="me-2" />
              Verificar
            </button>
          </div>
          <div className="col-12 col-sm-4 col-lg-3">
            {discrepancyReported ? (
              <button type="button" className="btn btn-outline-danger btn-lg w-100 text-nowrap" onClick={finalizarRevisionConDiferencia}>
                Finalizar revision
              </button>
            ) : (
              <button type="button" className="btn btn-success btn-lg w-100 text-nowrap" disabled={!canContinue} onClick={irAInspeccionVacio}>
                <FaArrowRight className="me-2" />
                <span className="d-none d-sm-inline">Ir a inspeccion vacio</span>
                <span className="d-inline d-sm-none">Continuar</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {message && (
        <div className={`alert ${canContinue ? "alert-success" : "alert-warning"} py-2 px-3 small mb-3`} role="alert">
          {message}
        </div>
      )}

      {programacion && (
        <>
          <div className="mb-3">
            <div className="border rounded bg-light p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <div className="small text-muted">Contenedor</div>
                  <div className="fw-bold fs-5 fs-md-4">{programacion.contenedor || ""}</div>
                </div>
                <span className={`badge ${canContinue ? "bg-success" : "bg-warning text-dark"} mt-1`}>
                  {discrepancyReported ? "Diferencia" : canContinue ? "Verificado" : "Pendiente"}
                </span>
              </div>
              <div className="row g-2 small">
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="text-muted">Fecha</div>
                  <div className="fw-semibold text-break">{programacion.fecha || "-"}</div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <div className="text-muted">Sellos</div>
                  <div className="fw-semibold text-break">{sealRows.length}</div>
                </div>
              </div>
            </div>

            <div className="row g-2 g-md-3 mt-1">
              {sealRows.map((item, index) => (
                <div className="col-12 col-md-6 col-xl-4" key={item.key || index}>
                  <div className="border rounded p-3 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div className="fw-semibold text-break">{item.articulo || "Articulo sin nombre"}</div>
                      <span className={`badge ${getSealBadge(item).className} flex-shrink-0`}>
                        {getSealBadge(item).icon}
                        {getSealBadge(item).label}
                      </span>
                    </div>
                    <div className="small text-muted">Serial</div>
                    <div className="font-monospace text-break">{item.serial || "Sin asignar"}</div>
                    {verificationDiffs.find((diff) => diff.key === item.key)?.serialReal && (
                      <>
                        <div className="small text-muted mt-2">Serial fisico reportado</div>
                        <div className="font-monospace text-break text-danger">
                          {verificationDiffs.find((diff) => diff.key === item.key)?.serialReal}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Verificar sellos del contenedor {programacion?.contenedor || ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-light border py-2 small" role="status">
            La alerta se enviara a: <span className="fw-semibold">{alertEmails || "Sin correo configurado"}</span>
          </div>
          {verifyMessage && (
            <div className="alert alert-warning py-2 small" role="alert">
              {verifyMessage}
            </div>
          )}
          <div className="d-flex flex-column gap-2">
            {sealRows.map((item) => {
              const checked = verifyChecks[item.key] !== false;
              return (
                <div className="border rounded p-3" key={item.key}>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{item.articulo || "Articulo sin nombre"}</div>
                      <div className="small text-muted">Serial registrado en app</div>
                      <div className="font-monospace text-break">{item.serial || "Sin asignar"}</div>
                      {checked === false && (
                        <div className="mt-3">
                          <label htmlFor={`serial-fisico-${item.key}`} className="form-label small fw-semibold mb-1">
                            Sello fisico real
                          </label>
                          <input
                            id={`serial-fisico-${item.key}`}
                            type="text"
                            className="form-control"
                            value={verifyRealSerials[item.key] || ""}
                            onChange={(event) => setVerifyRealSerials((prev) => ({
                              ...prev,
                              [item.key]: normalizeUppercase(event.target.value),
                            }))}
                            placeholder="Ingresa el serial fisico"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn p-0 flex-shrink-0"
                      onClick={() => setVerifyChecks((prev) => ({ ...prev, [item.key]: !checked }))}
                      title={checked ? "Marcar con diferencia" : "Marcar como correcto"}
                    >
                      {checked ? <FaCheckCircle className="text-success" size={28} /> : <FaTimesCircle className="text-danger" size={28} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowVerifyModal(false)}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={confirmarVerificacion} disabled={sendingAlert}>
            {sendingAlert ? "Enviando alerta..." : "Confirmar verificacion"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
