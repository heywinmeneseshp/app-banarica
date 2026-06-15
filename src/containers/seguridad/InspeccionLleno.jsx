import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCamera, FaCog, FaMinus, FaPlus } from "react-icons/fa";
import Loader from "@components/shared/Loader";
import { listarAlmacenes } from "@services/api/almacenes";
import { listarCombos } from "@services/api/combos";
import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";
import { paginarInspecciones } from "@services/api/inpecciones";
import { paginarListado } from "@services/api/listado";
import { encontrarUnSerial, inspeccionAntinarcoticos } from "@services/api/seguridad";
import { filterActiveContainerRows } from "@utils/contenedorEstado";
import useFeedback from '@hooks/useFeedback';

const CONTAINER_LENGTH = 11;
const INSPECCION_LLENO_ALERT_MODULE = "Inspeccion_lleno_alertas";
const isEmptyInspectionZone = (zone) =>
  String(zone || "").toLowerCase().includes("vacio");

const getSearchWindow = () => {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  from.setMonth(from.getMonth() - 1);
  to.setMonth(to.getMonth() + 1);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0]
  };
};

const createInitialFormData = () => ({
  consecutivo: "",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
  agente: "",
  zona: "",
  contenedor: "",
  bolsa: "",
  observaciones: ""
});

const createEmptySection = () => ({
  id: Date.now() + Math.random(),
  cod_productor: "",
  codigoPallet: "",
  producto: "",
  totalCajas: ""
});

const InspeccionLlenoAlertConfigModal = ({ show, onClose }) => {
  const { notify } = useFeedback();
  const [correos, setCorreos] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) {
      return;
    }

    const loadConfig = async () => {
      try {
        const response = await encontrarModulo(INSPECCION_LLENO_ALERT_MODULE);
        const detalles = response?.[0]?.detalles ? JSON.parse(response[0].detalles) : {};
        setCorreos(detalles?.correos_alerta || "");
      } catch (error) {
        console.error("Error cargando configuracion de alertas de inspeccion lleno:", error);
        setCorreos("");
      }
    };

    loadConfig();
  }, [show]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await actualizarModulo({
        modulo: INSPECCION_LLENO_ALERT_MODULE,
        detalles: JSON.stringify({
          correos_alerta: correos
        })
      });
      notify("Correos de alerta guardados exitosamente.", { variant: 'success' });
      onClose();
    } catch (error) {
      notify(error?.message || "No fue posible guardar la configuracion de correos.", { variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 overflow-auto" style={{ zIndex: 1055 }}>
      <div className="container-fluid min-vh-100 d-flex align-items-start align-items-md-center justify-content-center py-3 py-md-4 px-2">
        <div className="card border-0 shadow w-100" style={{ maxWidth: "820px", maxHeight: "92vh" }}>
          <div className="card-header bg-white border-bottom py-3 px-3 px-md-4">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <h4 className="mb-1 fw-bold">Configuracion de alertas</h4>
                <p className="mb-0 text-muted">
                  Define a que correos se notificara cuando una segunda inspeccion lleno quede pendiente por aprobacion.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-link p-0 text-secondary text-decoration-none flex-shrink-0"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <i className="bi bi-x-lg fs-4"></i>
              </button>
            </div>
          </div>

          <div className="card-body p-3 p-md-4 overflow-auto">
            <form onSubmit={handleSubmit}>
              <div className="card border">
                <div className="card-body p-3 p-md-4">
                  <div className="mb-3">
                    <h5 className="mb-1 fw-bold">Correos de alerta</h5>
                    <p className="mb-0 text-muted">
                      Separa varios destinatarios con coma.
                    </p>
                  </div>

                  <div className="input-group">
                    <span className="input-group-text fw-semibold">Correos</span>
                    <input
                      type="text"
                      className="form-control"
                      value={correos}
                      onChange={(event) => setCorreos(event.target.value)}
                      placeholder="correo1@empresa.com, correo2@empresa.com"
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  type = "text",
  id,
  value,
  onChange,
  required = false,
  readOnly = false,
  className = "",
  list,
  placeholder,
  onBlur,
  isValid = true,
  minLength,
  maxLength
}) => (
  <div className="input-group">
    <span className="input-group-text">{label}:</span>
    <input
      type={type}
      id={id}
      className={`form-control ${className} ${isValid ? "" : "is-invalid"}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      list={list}
      onBlur={onBlur}
      minLength={minLength}
      maxLength={maxLength}
    />
  </div>
);

const SelectField = ({ label, value, onChange, required = false, children }) => (
  <div className="input-group">
    <span className="input-group-text">{label}:</span>
    <select className="form-control" value={value} required={required} onChange={onChange}>
      {children}
    </select>
  </div>
);

const ScanActionButton = ({ label, onClick }) => (
  <button
    type="button"
    className="input-group-text bg-white text-secondary"
    onClick={onClick}
    aria-label={`Escanear ${label}`}
    title={`Escanear ${label}`}
    style={{ minWidth: "44px", cursor: "pointer" }}
  >
    <FaCamera />
  </button>
);

const DynamicSection = ({ section, onUpdate, onRemove, products, almacenes }) => {
  const handleFieldChange = (field, value) => {
    onUpdate(section.id, field, value);
  };

  return (
    <>
      <div className="col-md-2 mb-3">
        <SelectField
          label="Cod"
          value={section.cod_productor}
          required
          onChange={(event) => handleFieldChange("cod_productor", event.target.value)}
        >
          <option value=""></option>
          {almacenes.map((item) => (
            <option key={item.id} value={item.consecutivo}>
              {item.consecutivo}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="col-md-3 mb-3">
        <div className="input-group">
          <span className="input-group-text">Serial:</span>
          <input
            type="text"
            className="form-control"
            value={section.codigoPallet}
            onChange={(event) => handleFieldChange("codigoPallet", event.target.value.toUpperCase())}
            placeholder="Palet"
            required
          />
        </div>
      </div>

      <div className="col-md-4 mb-3">
        <SelectField
          label="Producto"
          value={section.producto}
          required
          onChange={(event) => handleFieldChange("producto", event.target.value)}
        >
          <option value=""></option>
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="col-md-2 mb-3">
        <InputField
          label="Cajas"
          type="number"
          value={section.totalCajas}
          onChange={(event) => handleFieldChange("totalCajas", event.target.value)}
          placeholder="00"
          required
        />
      </div>

      <div className="col-md-1 mb-3">
        <button type="button" className="btn btn-outline-danger w-100" onClick={() => onRemove(section.id)}>
          <FaMinus />
        </button>
      </div>
    </>
  );
};

export default function InspeccionLLeno() {
  const { notify, confirm } = useFeedback();
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerFrameRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const searchWindow = useMemo(() => getSearchWindow(), []);
  const currentUser = useMemo(
    () => (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "{}") : {}),
    []
  );
  const isSuperAdmin = currentUser?.id_rol === "Super administrador";

  const [formData, setFormData] = useState(createInitialFormData);
  const [products, setProducts] = useState([]);
  const [contenedores, setContenedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAlertConfig, setOpenAlertConfig] = useState(false);
  const [validation, setValidation] = useState({ bolsa: true, contenedor: true });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);
  const [scannerError, setScannerError] = useState("");
  const [scannerSupported, setScannerSupported] = useState(true);

  const containerSuggestions = useMemo(
    () => contenedores.map((item) => item?.contenedor).filter(Boolean),
    [contenedores]
  );

  const fetchContainers = useCallback(
    async (value) => {
      const code = String(value || "").trim().toUpperCase();

      if (!code || code.length < CONTAINER_LENGTH - 4) {
        setContenedores([]);
        setValidation((prev) => ({ ...prev, contenedor: true }));
        return;
      }

      const filters = {
        contenedor: code,
        booking: "",
        bl: "",
        destino: "",
        naviera: "",
        cliente: "",
        semana: "",
        buque: "",
        fecha_inicial: searchWindow.from,
        fecha_final: searchWindow.to,
        llenado: "",
        producto: "",
        habilitado: true
      };

      try {
        const listado = await paginarListado(1, 25, filters);
        const rows = filterActiveContainerRows(listado.data || []);

        const uniqueContainersMap = new Map();
        rows
          .map((item) => item?.Contenedor)
          .filter(Boolean)
          .forEach((item) => {
            const code = String(item?.contenedor || "").trim().toUpperCase();
            if (code && !uniqueContainersMap.has(code)) {
              uniqueContainersMap.set(code, item);
            }
          });

        const uniqueContainers = Array.from(uniqueContainersMap.values());

        setContenedores(uniqueContainers);
        setValidation((prev) => ({ ...prev, contenedor: uniqueContainers.length > 0 }));
      } catch (error) {
        console.error("Error al listar contenedores:", error);
        setContenedores([]);
        setValidation((prev) => ({ ...prev, contenedor: false }));
      }
    },
    [searchWindow]
  );

  const assignConsecutivo = useCallback((containerCode) => {
    const code = String(containerCode || "").trim().toUpperCase();
    const selected = contenedores.find((item) => item?.contenedor === code);

    setFormData((prev) => ({
      ...prev,
      contenedor: code || prev.contenedor,
      consecutivo: selected?.id || ""
    }));

    setValidation((prev) => ({ ...prev, contenedor: Boolean(selected) }));
  }, [contenedores]);

  const handleInputChange = useCallback(
    (event) => {
      const { id, value } = event.target;
      const normalizedValue = id === "contenedor" || id === "bolsa" ? value.toUpperCase() : value;

      setFormData((prev) => ({
        ...prev,
        [id]: normalizedValue
      }));

      if (id === "contenedor") {
        setFormData((prev) => ({ ...prev, contenedor: normalizedValue, consecutivo: "" }));
        fetchContainers(normalizedValue);
      }

      if (id === "bolsa") {
        setValidation((prev) => ({ ...prev, bolsa: true }));
      }
    },
    [fetchContainers]
  );

  const handleSectionUpdate = useCallback((sectionId, field, value) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    );
  }, []);

  const addSection = useCallback(() => {
    setSections((prev) => [...prev, createEmptySection()]);
  }, []);

  const removeSection = useCallback((id) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  }, []);

  const closeScanner = useCallback(() => {
    if (scannerFrameRef.current) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }

    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }

    if (scannerVideoRef.current) {
      scannerVideoRef.current.pause();
      scannerVideoRef.current.srcObject = null;
    }

    setScannerOpen(false);
    setScannerTarget(null);
    setScannerError("");
  }, []);

  const openScanner = useCallback((target) => {
    setScannerSupported(true);
    setScannerError("");
    setScannerTarget(target);
    setScannerOpen(true);
  }, []);

  const applyScannedValue = useCallback((rawValue) => {
    const nextValue = String(rawValue || "").trim().toUpperCase();
    if (!nextValue || !scannerTarget) return;

    if (scannerTarget.scope === "form") {
      setFormData((prev) => ({
        ...prev,
        [scannerTarget.field]: nextValue
      }));

      if (scannerTarget.field === "bolsa") {
        setValidation((prev) => ({ ...prev, bolsa: true }));
      }
    }

    if (scannerTarget.scope === "section") {
      setSections((prev) =>
        prev.map((section) =>
          section.id === scannerTarget.sectionId
            ? { ...section, [scannerTarget.field]: nextValue }
            : section
        )
      );
    }

    closeScanner();
  }, [closeScanner, scannerTarget]);

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData());
    setSections([]);
    setContenedores([]);
    setValidation({ bolsa: true, contenedor: true });
  }, []);

  const validateForm = useCallback(async () => {
    const bagCode = String(formData.bolsa || "").trim().toUpperCase();
    const selectedContainer = contenedores.find(
      (item) => item?.contenedor === String(formData.contenedor || "").trim().toUpperCase()
    );

    if (!selectedContainer) {
      setValidation((prev) => ({ ...prev, contenedor: false }));
      throw new Error("Selecciona un contenedor válido del listado.");
    }

    const kit = await encontrarUnSerial({ bag_pack: bagCode, available: [true] });
    const hasKit = Array.isArray(kit) && kit.length > 0;

    setValidation((prev) => ({ ...prev, bolsa: hasKit }));

    if (!hasKit) {
      throw new Error("El kit ingresado no existe o ya fue utilizado.");
    }

    return selectedContainer;
  }, [contenedores, formData.bolsa, formData.contenedor]);

  const countFullInspections = useCallback(async (containerCode) => {
    const response = await paginarInspecciones(1, 200, {
      contenedor: containerCode
    });

    const rows = Array.isArray(response?.data) ? response.data : [];
    const inspectionIds = new Set(
      rows
        .filter((item) => !isEmptyInspectionZone(item?.Inspeccion?.zona || item?.zona))
        .map((item) => item?.Inspeccion?.id)
        .filter(Boolean)
    );

    return inspectionIds.size;
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const selectedContainer = await validateForm();
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      const isSuperAdmin = usuario?.id_rol === "Super administrador";
      const inspectionCount = await countFullInspections(selectedContainer.contenedor);

      if (inspectionCount >= 1) {
        const shouldContinue = await confirm({
          title: 'Contenedor ya inspeccionado',
          message: 'Este contenedor ya fue inspeccionado anteriormente. ¿Estás seguro de enviarlo nuevamente?',
          confirmLabel: 'Si, enviar',
          cancelLabel: 'Cancelar',
          variant: 'warning'
        });

        if (!shouldContinue) {
          return;
        }
      }

      const response = await inspeccionAntinarcoticos(
        {
          ...formData,
          bolsa: String(formData.bolsa || "").trim().toUpperCase(),
          contenedor: selectedContainer.contenedor,
          consecutivo: selectedContainer.id,
          id_usuario: usuario.id
        },
        sections
      );

      if (!isSuperAdmin && response?.pending_approval) {
        notify("La inspeccion fue enviada, pero no sera aprobada hasta que un Super administrador la autorice.", { variant: 'warning', autoClose: false });
      } else {
        notify(response?.message || "Datos cargados con exito", { variant: 'success' });
      }
      resetForm();
    } catch (error) {
      notify(error.message || "No fue posible guardar la inspeccion.", { variant: 'danger', autoClose: false });
    } finally {
      setLoading(false);
    }
  }, [confirm, countFullInspections, formData, notify, resetForm, sections, validateForm]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [productsData, almacenesData] = await Promise.all([
          listarCombos(),
          listarAlmacenes()
        ]);

        setProducts(productsData || []);
        setAlmacenes(almacenesData || []);
      } catch (error) {
        console.error("Error inicializando inspección lleno:", error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (!scannerOpen || !scannerTarget) {
      return undefined;
    }

    let cancelled = false;
    const videoElement = scannerVideoRef.current;

    const startScanner = async () => {
      try {
        if (typeof window === "undefined" || typeof navigator === "undefined") {
          throw new Error("La camara no esta disponible en este entorno.");
        }

        if (typeof window.BarcodeDetector === "undefined") {
          setScannerSupported(false);
          setScannerError("Este navegador no soporta lectura por camara. Usa Chrome o Brave actualizados.");
          return;
        }

        const preferredFormats = [
          "qr_code",
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "codabar",
          "itf",
          "data_matrix",
          "pdf417",
          "aztec"
        ];

        let formats = preferredFormats;
        if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
          const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
          formats = preferredFormats.filter((item) => supportedFormats.includes(item));
        }

        if (formats.length === 0) {
          setScannerSupported(false);
          setScannerError("El navegador no reporta formatos compatibles para QR o codigo de barras.");
          return;
        }

        barcodeDetectorRef.current = new window.BarcodeDetector({ formats });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        scannerStreamRef.current = stream;

        if (!videoElement) {
          return;
        }

        videoElement.srcObject = stream;
        videoElement.setAttribute("playsInline", "true");
        await videoElement.play();

        const scanFrame = async () => {
          if (cancelled) return;

          if (!videoElement || !barcodeDetectorRef.current || videoElement.readyState < 2) {
            scannerFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          try {
            const barcodes = await barcodeDetectorRef.current.detect(videoElement);
            const rawValue = barcodes?.[0]?.rawValue;
            if (rawValue) {
              applyScannedValue(rawValue);
              return;
            }
          } catch (error) {
            console.error("Error leyendo desde la camara en inspeccion lleno:", error);
          }

          scannerFrameRef.current = requestAnimationFrame(scanFrame);
        };

        scannerFrameRef.current = requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error("No fue posible iniciar la camara en inspeccion lleno:", error);
        setScannerError(
          error?.name === "NotAllowedError"
            ? "Debes permitir el acceso a la camara para escanear."
            : "No fue posible iniciar la camara en este dispositivo."
        );
      }
    };

    startScanner();

    return () => {
      cancelled = true;

      if (scannerFrameRef.current) {
        cancelAnimationFrame(scannerFrameRef.current);
        scannerFrameRef.current = null;
      }

      if (scannerStreamRef.current) {
        scannerStreamRef.current.getTracks().forEach((track) => track.stop());
        scannerStreamRef.current = null;
      }

      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
    };
  }, [applyScannedValue, scannerOpen, scannerTarget]);

  return (
    <>
      <Loader loading={loading} />

      <form onSubmit={handleSubmit}>
        <div className="container py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
            <div className="text-center text-md-start">
              <h2 className="mb-2">Inspección Lleno</h2>
              <p className="text-muted mb-0">
                Registra la inspección antinarcóticos del contenedor lleno.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                className="btn btn-link text-decoration-none p-0 align-self-center align-self-md-auto"
                onClick={() => setOpenAlertConfig(true)}
                title="Configurar correos de alerta"
              >
                <FaCog
                  style={{
                    height: "25px",
                    width: "25px",
                    color: "rgb(0 0 0 / 30%)"
                  }}
                />
              </button>
            )}
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Cons"
                    id="consecutivo"
                    value={formData.consecutivo}
                    readOnly
                    placeholder="Se asigna al elegir el contenedor"
                  />
                </div>

                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Fecha"
                    type="date"
                    id="fecha"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Inicio"
                    type="time"
                    id="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Fin"
                    type="time"
                    id="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-lg-6">
                  <InputField
                    label="Contenedor"
                    id="contenedor"
                    value={formData.contenedor}
                    onChange={handleInputChange}
                    onBlur={(event) => assignConsecutivo(event.target.value)}
                    required
                    minLength={CONTAINER_LENGTH}
                    maxLength={CONTAINER_LENGTH}
                    placeholder="DUMMY000001"
                    isValid={validation.contenedor}
                    list="container-list"
                  />
                  <datalist id="container-list">
                    {containerSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="col-lg-6">
                  <div className="input-group">
                    <span className="input-group-text">Kit:</span>
                    <input
                      type="text"
                      id="bolsa"
                      className={`form-control ${validation.bolsa ? "" : "is-invalid"}`}
                      value={formData.bolsa}
                      onChange={handleInputChange}
                      required
                      placeholder="AA2L0000"
                    />
                    <ScanActionButton
                      label="Kit"
                      onClick={() => openScanner({ scope: "form", field: "bolsa", label: "Kit" })}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <InputField
                    label="Agente"
                    id="agente"
                    value={formData.agente}
                    onChange={handleInputChange}
                    placeholder="Nombre del agente de policía"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <InputField
                    label="Zona"
                    id="zona"
                    value={formData.zona}
                    onChange={handleInputChange}
                    placeholder="Zona de inspección"
                    required
                  />
                </div>

                <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                  <div className="mt-2">
                 
                    <span className="text-muted small">
                 
                    </span>
                  </div>

                  <button type="button" className="btn btn-primary" onClick={addSection}>
                    <FaPlus className="me-2" />
                    Agregar rechazo
                  </button>
                </div>

                {sections.length > 0 && (
                  <div className="col-12">
                    <div className="border rounded-3 p-3 bg-light-subtle">
                      <div className="row g-2">
                        {sections.map((section) => (
                          <DynamicSection
                            key={section.id}
                            section={section}
                            onUpdate={handleSectionUpdate}
                            onRemove={removeSection}
                            products={products}
                            almacenes={almacenes}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text">Observaciones:</span>
                    <textarea
                      id="observaciones"
                      className="form-control"
                      placeholder="Escriba sus observaciones"
                      onChange={handleInputChange}
                      value={formData.observaciones}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-success flex-fill">
                    Guardar
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      {scannerOpen && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Escanear {scannerTarget?.label || "serial"}
                </h5>
                <button type="button" className="btn-close" onClick={closeScanner} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Acerca el QR o codigo de barras a la camara. Cuando se detecte, el valor se cargara automaticamente.
                </p>

                <div className="ratio ratio-4x3 bg-dark rounded overflow-hidden">
                  <video
                    ref={scannerVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {scannerError && (
                  <div className={`alert ${scannerSupported ? "alert-warning" : "alert-danger"} mt-3 mb-0`}>
                    {scannerError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeScanner}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <InspeccionLlenoAlertConfigModal show={openAlertConfig} onClose={() => setOpenAlertConfig(false)} />
    </>
  );
}


