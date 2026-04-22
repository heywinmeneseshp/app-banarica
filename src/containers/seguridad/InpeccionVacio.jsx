import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FaCheckCircle, FaCog, FaFileExcel, FaMinusCircle, FaRedo } from "react-icons/fa";
import { LiaUndoAltSolid } from "react-icons/lia";
import { crearListado } from "@services/api/listado";
import { useAuth } from "@hooks/useAuth";
import { encontrarUnSerial } from "@services/api/seguridad";
import { filtrarSemanaRangoMes } from "@services/api/semanas";
import { encontrarModulo } from "@services/api/configuracion";
import { crearInspeccion } from "@services/api/inpecciones";
import { filtrarContenedor } from "@services/api/contenedores";
import endPoints from "@services/api";
import Loader from "@components/shared/Loader";
import InsumoInspeccVacio from "@components/seguridad/InsumoInspeccVacio";
import DevolverContenedorModal from "@components/seguridad/DevolverContenedorModal";
import CargueMasivo from "@assets/Seguridad/Listado/CargueMasivo";

const FIELD_CONFIG = {
  semana: {
    label: "Semana",
    type: "text",
    pattern: "^S\\d{2}-\\d{4}$",
    required: true,
    errorMsg: "Debe seguir la estructura S00-2000 (ej: S01-2023)"
  },
  fecha: {
    label: "Fecha",
    type: "date",
    required: true
  },
  contenedor: {
    label: "Contenedor",
    type: "text",
    placeholder: "DUMMY000001",
    pattern: "[A-Za-z]{4}[0-9]{7}",
    required: true,
    errorMsg: "Debe ser 4 letras seguidas de 7 números (ej: ABCD1234567)"
  }
};

const STORAGE_KEYS = {
  INSPECCION_VACIO: "inspecVacio",
  OBSERVACIONES: "observaciones",
  USUARIO: "usuario",
  FORMULARIO_DIGITAL: "inspecVacioDigital"
};

const INSPECTION_PARTS = [
  "Tapa frontal",
  "Lámina reflectora",
  "Tabique izquierdo",
  "Tabique derecho",
  "Puertas",
  "Piso",
  "Techo",
  "Damper",
  "Unidad de refrigeración",
  "Tapas externas"
];

const FOOD_CONDITIONS = [
  { id: "lavado", label: "Contenedor lavado" },
  { id: "sin_olores", label: "Sin malos olores" },
  { id: "sin_residuos", label: "Sin residuos sólidos de otras cargas" }
];

const createInspectionChecks = () =>
  INSPECTION_PARTS.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "_"),
    label: name,
    checked: false,
    observacion: ""
  }));

const createFoodValidation = () => ({
  lavado: false,
  sin_olores: false,
  sin_residuos: false
});

const getCurrentDate = () => new Date().toISOString().split("T")[0];
const getCurrentTime = () => new Date().toTimeString().split(" ")[0];

const buildInspectionSummary = ({
  baseObservaciones,
  inspectionChecks,
  foodValidation,
  foodValidationResult
}) => {
  const partsSummary = inspectionChecks
    .map((item) => {
      const status = item.checked ? "OK" : "Pendiente";
      return `${item.label}: ${status}${item.observacion ? ` (${item.observacion})` : ""}`;
    })
    .join(" | ");

  const foodSummary = FOOD_CONDITIONS.map(
    ({ id, label }) => `${label}: ${foodValidation[id] ? "Sí" : "No"}`
  ).join(" | ");

  return [
    baseObservaciones?.trim(),
    `Formulario digital inspección vacío -> Partes: ${partsSummary}`,
    `Validación alimentos -> ${foodSummary}. Resultado: ${foodValidationResult ? "Apto" : "No apto"}`
  ]
    .filter(Boolean)
    .join("\n\n");
};

export default function InspeccionVacio() {
  const { getUser } = useAuth();
  const router = useRouter();
  const formRef = useRef();
  const user = getUser();

  const [state, setState] = useState({
    observaciones: "",
    semana: "",
    inputFields: [],
    loading: false,
    openConfig: false,
    openMasivo: false,
    semanas: [],
    fieldErrors: {},
    formValues: {},
    inspectionChecks: createInspectionChecks(),
    foodValidation: createFoodValidation(),
    foodValidationResult: null,
    contenedorDevuelto: null,
    canBulkUpload: false,
    massUploadHeaders: {}
  });

  const {
    observaciones,
    semana,
    inputFields,
    loading,
    openConfig,
    openMasivo,
    semanas,
    fieldErrors,
    formValues,
    inspectionChecks,
    foodValidation,
    foodValidationResult,
    contenedorDevuelto,
    canBulkUpload,
    massUploadHeaders
  } = state;

  const setStateValue = (key, value) => setState((prev) => ({ ...prev, [key]: value }));
  const capitalizarPrimeraLetra = useCallback(
    (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : ""),
    []
  );

  const canManageMassUpload = useCallback(
    async (moduleConfig) => {
      if (user?.id_rol === "Super administrador") {
        return true;
      }

      if (!user?.username) {
        return false;
      }

      try {
        const config = moduleConfig || (await encontrarModulo(user.username));
        const details = JSON.parse(config?.[0]?.detalles || "{}");
        const botones = Array.isArray(details?.botones) ? details.botones : [];
        return botones.includes("inspeccion_vacio_cargue_masivo");
      } catch (error) {
        console.error("No fue posible validar el permiso de cargue masivo:", error);
        return false;
      }
    },
    [user?.id_rol, user?.username]
  );

  const persistDigitalForm = useCallback(
    (partial = {}) => {
      const payload = {
        inspectionChecks,
        foodValidation,
        foodValidationResult,
        ...partial
      };

      localStorage.setItem(STORAGE_KEYS.FORMULARIO_DIGITAL, JSON.stringify(payload));
    },
    [inspectionChecks, foodValidation, foodValidationResult]
  );

  const resetInsumos = useCallback(async () => {
    try {
      setStateValue("loading", true);

      const requests = [
        filtrarSemanaRangoMes(1, 1),
        encontrarModulo("Semana"),
        encontrarModulo("Insumos_inspeccion_vacio")
      ];

      if (user?.id_rol !== "Super administrador" && user?.username) {
        requests.push(encontrarModulo(user.username));
      }

      const [semanasData, moduloSemana, moduloInsumos, moduloUsuario] = await Promise.all(requests);

      const inputsGuardados = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECCION_VACIO) || "{}");
      const digitalForm = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORMULARIO_DIGITAL) || "{}");

      const semanaActual = moduloSemana[0]?.semana_actual;
      const semanaSeleccionada = semanasData.find((item) => item.semana == semanaActual);

      const insumos = JSON.parse(moduloInsumos[0]?.detalles || "[]").map((item) => ({
        label: capitalizarPrimeraLetra(item.name),
        id: item.id,
        name: item.name,
        consecutivo: item.consecutivo,
        placeholder: `${item.consecutivo}00000`,
        type: "text",
        eliminar: true,
        required: true,
        errorMsg: "Debe completar el campo"
      }));

      const massUploadHeadersValue = {
        semana: "",
        fecha: "",
        contenedor: "",
        ...insumos.reduce((acc, item) => {
          acc[item.consecutivo || item.name] = "";
          return acc;
        }, {}),
        observaciones: ""
      };

      const canBulkUploadValue = await canManageMassUpload(moduloUsuario);

      const camposBase = Object.entries(FIELD_CONFIG).map(([id, config]) => ({
        id,
        ...config,
        defaultValue: id === "fecha" ? getCurrentDate() : inputsGuardados?.[id] || ""
      }));

      const initialFormValues = {};
      camposBase.forEach((field) => {
        if (field.id === "semana") {
          initialFormValues[field.id] = semanaSeleccionada?.consecutivo || "";
        } else if (field.id === "fecha") {
          initialFormValues[field.id] = getCurrentDate();
        } else {
          initialFormValues[field.id] = inputsGuardados?.[field.id] || "";
        }
      });

      insumos.forEach((insumo) => {
        initialFormValues[insumo.id] = "";
      });

      setState((prev) => ({
        ...prev,
        semanas: semanasData,
        semana: semanaSeleccionada?.consecutivo || "",
        inputFields: [...camposBase, ...insumos],
        formValues: initialFormValues,
        inspectionChecks: digitalForm.inspectionChecks || createInspectionChecks(),
        foodValidation: digitalForm.foodValidation || createFoodValidation(),
        foodValidationResult:
          typeof digitalForm.foodValidationResult === "boolean"
            ? digitalForm.foodValidationResult
            : null,
        canBulkUpload: canBulkUploadValue,
        massUploadHeaders: massUploadHeadersValue,
        loading: false
      }));
    } catch (error) {
      console.error("Error al resetear insumos:", error);
      setStateValue("loading", false);
    }
  }, [canManageMassUpload, capitalizarPrimeraLetra, user?.id_rol, user?.username]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await resetInsumos();
        const savedObservaciones = localStorage.getItem(STORAGE_KEYS.OBSERVACIONES);
        if (savedObservaciones) setStateValue("observaciones", savedObservaciones);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    loadData();
  }, [resetInsumos]);

  const handleRemove = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      inputFields: prev.inputFields.filter((item) => item.id !== id)
    }));
  }, []);

  const handleInvalid = useCallback((event) => {
    event.preventDefault();
    const field = event.target;
    const fieldConfig = FIELD_CONFIG[field.id];
    const isEmpty = !field.value.trim();

    const errorMessages = {
      required: "Este campo es obligatorio",
      pattern: fieldConfig?.errorMsg || "Formato inválido",
      default: "Valor inválido"
    };

    let errorType = "default";
    if (isEmpty && field.required) {
      errorType = "required";
    } else if (field.validity.patternMismatch) {
      errorType = "pattern";
    }

    field.setCustomValidity(errorMessages[errorType]);
    field.reportValidity();

    setState((prev) => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [field.id]: {
          hasError: true,
          message: errorMessages[errorType]
        }
      }
    }));
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { id, value } = event.target;

      setState((prev) => ({
        ...prev,
        formValues: {
          ...prev.formValues,
          [id]: value
        }
      }));

      if (fieldErrors[id]) {
        setState((prev) => ({
          ...prev,
          fieldErrors: { ...prev.fieldErrors, [id]: false }
        }));
      }

      event.target.setCustomValidity("");

      if (id === "contenedor" || id === "fecha") {
        const formData = new FormData(formRef.current);
        localStorage.setItem(
          STORAGE_KEYS.INSPECCION_VACIO,
          JSON.stringify({
            contenedor: formData.get("contenedor"),
            fecha: formData.get("fecha")
          })
        );
      }

      if (id === "observaciones") {
        localStorage.setItem(STORAGE_KEYS.OBSERVACIONES, value);
      }
    },
    [fieldErrors]
  );

  const verificarSeriales = useCallback(async (serialesList) => {
    const existingSerials = new Map();
    const duplicates = new Map();
    let isVerified = true;

    for (const { serial, label } of serialesList) {
      try {
        const [res] = await encontrarUnSerial({ serial, available: [true] });

        if (!res) {
          isVerified = false;
          const proceed = window.confirm(`El campo "${label}" no existe.`);
          if (!proceed) return { success: false };
        } else if (existingSerials.has(serial)) {
          duplicates.set(serial, [...(duplicates.get(serial) || []), label]);
        } else {
          existingSerials.set(serial, label);
        }
      } catch (error) {
        window.alert(`Error al verificar el serial ${serial} (${label}): ${error.message}`);
        return { success: false, error };
      }
    }

    if (duplicates.size > 0) {
      const duplicatesMsg = Array.from(duplicates.entries())
        .map(([serial, labels]) => `Serial: ${serial} se repite en: ${labels.join(", ")}`)
        .join("\n");
      window.alert(`Seriales duplicados:\n${duplicatesMsg}`);
      return { success: false };
    }

    return {
      success: isVerified,
      seriales: Array.from(existingSerials.keys())
    };
  }, []);

  const updateInspectionCheck = (id, field, value) => {
    const nextChecks = inspectionChecks.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setStateValue("inspectionChecks", nextChecks);
    persistDigitalForm({ inspectionChecks: nextChecks });
  };

  const updateFoodValidation = (id, value) => {
    const nextValidation = { ...foodValidation, [id]: value };
    setState((prev) => ({
      ...prev,
      foodValidation: nextValidation,
      foodValidationResult: null
    }));
    persistDigitalForm({
      foodValidation: nextValidation,
      foodValidationResult: null
    });
  };

  const validarTransporteAlimentos = () => {
    const approved = FOOD_CONDITIONS.every(({ id }) => foodValidation[id]);
    setStateValue("foodValidationResult", approved);
    persistDigitalForm({ foodValidationResult: approved });

    if (approved) {
      window.alert("El contenedor cumple con las condiciones para el transporte de alimentos.");
      return;
    }

    window.alert(
      "El contenedor no cumple con las condiciones para el transporte de alimentos. Puedes devolverlo por mal estado."
    );
  };

  const buscarContenedorParaDevolucion = async () => {
    const code = String(formValues.contenedor || "").trim().toUpperCase();
    if (!code) {
      window.alert("Ingresa el contenedor antes de registrar la devolución.");
      return;
    }

    try {
      const response = await filtrarContenedor({ contenedor: code, habilitado: true });
      const containers = response?.data || response || [];
      const exactMatch = containers.find((item) => item.contenedor === code);

      if (!exactMatch) {
        window.alert("No se encontró un contenedor activo con ese código.");
        return;
      }

      setStateValue("contenedorDevuelto", exactMatch);
    } catch (error) {
      console.error("Error al buscar contenedor:", error);
      window.alert("No fue posible consultar el contenedor para la devolución.");
    }
  };

  const canSubmit = useMemo(
    () =>
      inspectionChecks.some((item) => item.checked) &&
      typeof foodValidationResult === "boolean",
    [foodValidationResult, inspectionChecks]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setStateValue("loading", true);

      if (!formRef.current) {
        setStateValue("loading", false);
        return;
      }

      const form = formRef.current;
      if (!form.checkValidity()) {
        setStateValue("loading", false);
        return;
      }

      if (typeof foodValidationResult !== "boolean") {
        window.alert("Debes usar el botón de validación para confirmar aptitud del contenedor.");
        setStateValue("loading", false);
        return;
      }

      const semanaValue = formValues.semana || semana;

      const serialesList = inputFields
        .filter(({ id }) => !["contenedor", "fecha", "semana"].includes(id))
        .map(({ id, label }) => ({
          serial: formValues[id] || "",
          label
        }));

      const { success, seriales } = await verificarSeriales(serialesList);
      if (!success) {
        setStateValue("loading", false);
        return;
      }

      try {
        const usuario = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIO));
        const fullObservations = buildInspectionSummary({
          baseObservaciones: observaciones,
          inspectionChecks,
          foodValidation,
          foodValidationResult
        });

        const itemListado = await crearListado({
          fecha: formValues.fecha || getCurrentDate(),
          contenedor: String(formValues.contenedor || "").toUpperCase(),
          observaciones: fullObservations,
          usuario,
          seriales,
          semana: semanaValue
        });

        const listadoCreado = itemListado?.data;
        if (listadoCreado?.id_contenedor) {
          await crearInspeccion({
            id_contenedor: listadoCreado.id_contenedor,
            fecha_inspeccion: formValues.fecha || getCurrentDate(),
            hora_inicio: getCurrentTime(),
            hora_fin: getCurrentTime(),
            agente:
              [user?.nombre, user?.apellido].filter(Boolean).join(" ") || user?.username || "Sistema",
            zona: "Inspección vacío",
            observaciones: fullObservations,
            habilitado: true
          });
        }

        window.alert(itemListado.message || "Guardado exitoso.");

        setState((prev) => ({
          ...prev,
          observaciones: "",
          formValues: Object.keys(prev.formValues).reduce((acc, key) => {
            acc[key] = key === "fecha" ? getCurrentDate() : "";
            return acc;
          }, {}),
          semana: "",
          inspectionChecks: createInspectionChecks(),
          foodValidation: createFoodValidation(),
          foodValidationResult: null
        }));

        localStorage.removeItem(STORAGE_KEYS.INSPECCION_VACIO);
        localStorage.removeItem(STORAGE_KEYS.OBSERVACIONES);
        localStorage.removeItem(STORAGE_KEYS.FORMULARIO_DIGITAL);

        if (!window.confirm("¿Deseas cargar otro contenedor?")) {
          router.push("/Seguridad/Dashboard");
        }
      } catch (error) {
        console.error("Error al crear listado:", error);
        window.alert("Ocurrió un error. Por favor intenta nuevamente.");
      } finally {
        setStateValue("loading", false);
      }
    },
    [
      foodValidation,
      foodValidationResult,
      formValues,
      inputFields,
      inspectionChecks,
      observaciones,
      router,
      semana,
      user,
      verificarSeriales
    ]
  );

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h2>Inspeccion contenedor vacio</h2>
        <div className="d-flex justify-content-center align-items-center gap-3 mt-2">
          {canBulkUpload && (
            <button
              type="button"
              className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-2"
              onClick={() => setStateValue("openMasivo", true)}
            >
              <FaFileExcel />
              Cargue masivo Excel
            </button>
          )}

          {user.id_rol === "Super administrador" && (
            <button
              onClick={() => setStateValue("openConfig", true)}
              type="button"
              className="btn btn-link p-0"
              aria-label="Configuracion"
            >
              <FaCog style={{ color: "rgba(0, 0, 0, 0.3)" }} size={20} />
            </button>
          )}
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <Loader loading={loading} />

        <div className="row g-3">
          {inputFields.map((field) => (
            <div className="col-md-6 mb-1" key={field.id}>
              <div className="input-group has-validation">
                <span className="input-group-text">{field.label}:</span>

                {field.id === "semana" ? (
                  <>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      pattern={field.pattern}
                      required={field.required}
                      className={`form-control ${fieldErrors[field.id] ? "is-invalid" : ""}`}
                      onInvalid={handleInvalid}
                      onChange={handleChange}
                      value={formValues[field.id] || ""}
                      list={`${field.id}-list`}
                      autoComplete="off"
                      placeholder={field.placeholder}
                    />
                    <datalist id={`${field.id}-list`}>
                      {semanas.map((s) => (
                        <option key={s.consecutivo} value={s.consecutivo} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    pattern={field.pattern}
                    required={field.required}
                    className={`form-control ${fieldErrors[field.id] ? "is-invalid" : ""}`}
                    onInvalid={handleInvalid}
                    onChange={handleChange}
                    value={formValues[field.id] || ""}
                    placeholder={field.placeholder}
                    autoComplete="off"
                  />
                )}

                {field.eliminar && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleRemove(field.id)}
                    aria-label={`Eliminar ${field.label}`}
                    style={{ minWidth: "40px" }}
                  >
                    <FaMinusCircle size={20} color="#dc3545" title={`Eliminar ${field.label}`} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="col-12 d-flex justify-content-end">
            <button type="button" className="btn btn-outline-danger" onClick={buscarContenedorParaDevolucion}>
              Devolver por mal estado
            </button>
          </div>

          {inputFields.length === 3 && (
            <div className="col-md-6 mb-1 text-center">
              <button type="button" className="btn btn-link" onClick={resetInsumos} aria-label="Restaurar valores">
                <FaRedo size={24} color="#0d6efd" />
              </button>
            </div>
          )}

          {inputFields.length === 2 && (
            <div className="col-12 text-center">
              <button type="button" className="btn btn-link" onClick={resetInsumos} title="Restaurar valores">
                <LiaUndoAltSolid size={24} color="#0d6efd" />
              </button>
            </div>
          )}

          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light fw-semibold">Inspección física de la unidad</div>
              <div className="card-body">
                <div className="row g-3">
                  {inspectionChecks.map((item) => (
                    <div className="col-md-6" key={item.id}>
                      <div className="border rounded p-3 h-100">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`check-${item.id}`}
                            checked={item.checked}
                            onChange={(event) =>
                              updateInspectionCheck(item.id, "checked", event.target.checked)
                            }
                          />
                          <label className="form-check-label fw-semibold" htmlFor={`check-${item.id}`}>
                            {item.label}
                          </label>
                        </div>

                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Observación de esta parte"
                          value={item.observacion}
                          onChange={(event) =>
                            updateInspectionCheck(item.id, "observacion", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light fw-semibold">
                Validación para transporte de alimentos
              </div>
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  {FOOD_CONDITIONS.map((item) => (
                    <div className="col-md-4" key={item.id}>
                      <div className="border rounded p-3 h-100">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`food-${item.id}`}
                            checked={foodValidation[item.id]}
                            onChange={(event) => updateFoodValidation(item.id, event.target.checked)}
                          />
                          <label htmlFor={`food-${item.id}`} className="form-check-label fw-semibold">
                            {item.label}
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="col-12 d-flex flex-column flex-md-row gap-2 align-items-md-center">
                    <button type="button" className="btn btn-warning" onClick={validarTransporteAlimentos}>
                      Validar aptitud para alimentos
                    </button>

                    {typeof foodValidationResult === "boolean" && (
                      <span className={`fw-semibold ${foodValidationResult ? "text-success" : "text-danger"}`}>
                        <FaCheckCircle className="me-2" />
                        {foodValidationResult
                          ? "Apto para transporte de alimentos"
                          : "No apto para transporte de alimentos"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="form-floating">
              <textarea
                id="observaciones"
                name="observaciones"
                className="form-control"
                value={observaciones || ""}
                onChange={(event) => {
                  setStateValue("observaciones", event.target.value);
                  localStorage.setItem(STORAGE_KEYS.OBSERVACIONES, event.target.value);
                }}
                style={{ height: "100px" }}
                placeholder=" "
              />
              <label htmlFor="observaciones">Observaciones generales</label>
            </div>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading || !canSubmit}>
              {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              Guardar inspección vacío
            </button>
          </div>
        </div>
      </form>

      {openConfig && <InsumoInspeccVacio setOpenConfig={(val) => setStateValue("openConfig", val)} />}
      {openMasivo && (
        <CargueMasivo
          setOpenMasivo={(val) => setStateValue("openMasivo", val)}
          endPointCargueMasivo={endPoints.seguridad.inspeccionVacioMasivo}
          encabezados={massUploadHeaders}
          titulo="Inspeccion vacio"
          authRequired
          onSuccess={() => resetInsumos()}
        />
      )}
      {contenedorDevuelto && (
        <DevolverContenedorModal
          contenedor={contenedorDevuelto}
          usuario={user}
          origen="inspeccion_vacio"
          onClose={() => setStateValue("contenedorDevuelto", null)}
        />
      )}
    </div>
  );
}
