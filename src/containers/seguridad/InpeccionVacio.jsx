import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FaCamera, FaCheckCircle, FaCog, FaFileExcel, FaMinusCircle, FaRedo } from "react-icons/fa";
import { LiaUndoAltSolid } from "react-icons/lia";
import { useAuth } from "@hooks/useAuth";
import useFeedback from '@hooks/useFeedback';
import { crearInspeccionVacio, encontrarUnSerial } from "@services/api/seguridad";
import { filtrarSemanaRangoMes } from "@services/api/semanas";
import { encontrarModulo } from "@services/api/configuracion";
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
const normalizeValue = (value) => String(value || "").trim();
const normalizeUppercase = (value) => normalizeValue(value).toUpperCase();

const buildInitialFormValues = ({ baseFields, insumos, savedValues, defaultWeek }) => {
  const nextValues = {};

  baseFields.forEach((field) => {
    if (field.id === "semana") {
      nextValues[field.id] = defaultWeek || "";
      return;
    }

    if (field.id === "fecha") {
      nextValues[field.id] = getCurrentDate();
      return;
    }

    nextValues[field.id] = savedValues?.[field.id] || "";
  });

  insumos.forEach((insumo) => {
    nextValues[insumo.id] = "";
  });

  return nextValues;
};

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
  const { notify, confirm } = useFeedback();
  const router = useRouter();
  const formRef = useRef();
  const inputRefs = useRef({});
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerFrameRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
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
    massUploadHeaders: {},
    scannerOpen: false,
    scannerFieldId: null,
    scannerError: "",
    scannerSupported: true
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
    massUploadHeaders,
    scannerOpen,
    scannerFieldId,
    scannerError,
    scannerSupported
  } = state;

  const setStateValue = (key, value) => setState((prev) => ({ ...prev, [key]: value }));
  const setInputRef = useCallback((id, element) => {
    if (!element) {
      delete inputRefs.current[id];
      return;
    }

    inputRefs.current[id] = element;
  }, []);
  const capitalizarPrimeraLetra = useCallback(
    (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : ""),
    []
  );
  const focusField = useCallback((id) => {
    const field = inputRefs.current[id];
    if (!field) return;

    field.focus();
    if (typeof field.select === "function" && field.value) {
      field.select();
    }
  }, []);

  const focusNextField = useCallback(
    (currentId) => {
      const orderedIds = inputFields.map((field) => field.id);
      const currentIndex = orderedIds.indexOf(currentId);
      if (currentIndex === -1) return;

      const nextId = orderedIds[currentIndex + 1];
      if (nextId) {
        focusField(nextId);
      }
    },
    [focusField, inputFields]
  );

  const isScannableField = useCallback(
    (fieldId) => !["semana", "fecha", "contenedor"].includes(fieldId),
    []
  );

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

    setState((prev) => ({
      ...prev,
      scannerOpen: false,
      scannerFieldId: null,
      scannerError: ""
    }));
  }, []);

  const applyScannedValue = useCallback(
    (fieldId, rawValue) => {
      const nextValue = normalizeUppercase(rawValue);
      if (!nextValue) return;

      setState((prev) => ({
        ...prev,
        formValues: {
          ...prev.formValues,
          [fieldId]: nextValue
        },
        fieldErrors: {
          ...prev.fieldErrors,
          [fieldId]: false
        }
      }));

      if (fieldId === "contenedor" || fieldId === "fecha") {
        localStorage.setItem(
          STORAGE_KEYS.INSPECCION_VACIO,
          JSON.stringify({
            contenedor: fieldId === "contenedor" ? nextValue : formValues.contenedor || "",
            fecha: fieldId === "fecha" ? nextValue : formValues.fecha || ""
          })
        );
      }

      closeScanner();
      focusNextField(fieldId);
    },
    [closeScanner, focusNextField, formValues.contenedor, formValues.fecha]
  );

  const openScanner = useCallback((fieldId) => {
    setState((prev) => ({
      ...prev,
      scannerOpen: true,
      scannerFieldId: fieldId,
      scannerError: "",
      scannerSupported: true
    }));
  }, []);

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

      const defaultWeek = semanaSeleccionada?.consecutivo || "";
      const initialFormValues = buildInitialFormValues({
        baseFields: camposBase,
        insumos,
        savedValues: inputsGuardados,
        defaultWeek
      });

      setState((prev) => ({
        ...prev,
        semanas: semanasData,
        semana: defaultWeek,
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

  useEffect(() => {
    if (inputFields.length > 0) {
      focusField("contenedor");
    }
  }, [focusField, inputFields.length]);

  useEffect(() => {
    if (!scannerOpen || !scannerFieldId) {
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
          setState((prev) => ({
            ...prev,
            scannerSupported: false,
            scannerError: "Este navegador no soporta lectura por camara. Usa Chrome o Brave actualizados."
          }));
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
          setState((prev) => ({
            ...prev,
            scannerSupported: false,
            scannerError: "El navegador no reporta formatos compatibles para QR o codigo de barras."
          }));
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

          if (
            !videoElement
            || !barcodeDetectorRef.current
            || videoElement.readyState < 2
          ) {
            scannerFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          try {
            const barcodes = await barcodeDetectorRef.current.detect(videoElement);
            const rawValue = barcodes?.[0]?.rawValue;
            if (rawValue) {
              applyScannedValue(scannerFieldId, rawValue);
              return;
            }
          } catch (error) {
            console.error("Error leyendo desde la camara:", error);
          }

          scannerFrameRef.current = requestAnimationFrame(scanFrame);
        };

        scannerFrameRef.current = requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error("No fue posible iniciar la camara:", error);
        setState((prev) => ({
          ...prev,
          scannerError:
            error?.name === "NotAllowedError"
              ? "Debes permitir el acceso a la camara para escanear."
              : "No fue posible iniciar la camara en este dispositivo."
        }));
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
  }, [applyScannedValue, scannerFieldId, scannerOpen]);

  const handleRemove = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      inputFields: prev.inputFields.filter((item) => item.id !== id)
    }));
  }, []);

  const handleFieldKeyDown = useCallback(
    (event) => {
      if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") {
        return;
      }

      event.preventDefault();
      focusNextField(event.target.id);
    },
    [focusNextField]
  );

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
      const nextValue = id === "contenedor" ? normalizeUppercase(value) : value;

      setState((prev) => {
        const nextState = {
          ...prev,
          formValues: {
            ...prev.formValues,
            [id]: nextValue
          }
        };

        if (prev.fieldErrors[id]) {
          nextState.fieldErrors = { ...prev.fieldErrors, [id]: false };
        }

        return nextState;
      });

      if (event.target.value !== nextValue) {
        event.target.value = nextValue;
      }

      event.target.setCustomValidity("");

      if (id === "contenedor" || id === "fecha") {
        localStorage.setItem(
          STORAGE_KEYS.INSPECCION_VACIO,
          JSON.stringify({
            contenedor: id === "contenedor" ? nextValue : formValues.contenedor || "",
            fecha: id === "fecha" ? nextValue : formValues.fecha || ""
          })
        );
      }

      if (id === "observaciones") {
        localStorage.setItem(STORAGE_KEYS.OBSERVACIONES, nextValue);
      }

      const currentField = inputRefs.current[id];
      const maxLen = Number(currentField?.maxLength);
      const canAdvanceByLength =
        currentField?.type !== "date"
        && id !== "semana"
        && maxLen > 0
        && normalizeValue(nextValue).length >= maxLen;

      if (canAdvanceByLength) {
        focusNextField(id);
      }
    },
    [focusNextField, formValues.contenedor, formValues.fecha]
  );

  const verificarSeriales = useCallback(async (serialesList) => {
    const serialMap = new Map();
    const duplicates = new Map();

    serialesList.forEach(({ serial, label }) => {
      const normalizedSerial = normalizeUppercase(serial);
      if (!normalizedSerial) return;

      if (serialMap.has(normalizedSerial)) {
        duplicates.set(normalizedSerial, [
          ...(duplicates.get(normalizedSerial) || [serialMap.get(normalizedSerial)]),
          label
        ]);
        return;
      }

      serialMap.set(normalizedSerial, label);
    });

    if (duplicates.size > 0) {
      const duplicatesMsg = Array.from(duplicates.entries())
        .map(([serial, labels]) => `Serial: ${serial} se repite en: ${labels.join(", ")}`)
        .join("\n");
      notify(`Seriales duplicados:\n${duplicatesMsg}`, { variant: 'warning', autoClose: false });
      return { success: false };
    }

    try {
      const verificationResults = await Promise.all(
        Array.from(serialMap.keys()).map(async (serial) => {
          const response = await encontrarUnSerial({ serial, available: [true] });
          return {
            serial,
            exists: Boolean(response?.[0]),
            label: serialMap.get(serial)
          };
        })
      );

      const missingItems = verificationResults.filter((item) => !item.exists);
      if (missingItems.length > 0) {
        const proceed = await confirm({
          title: 'Seriales no encontrados',
          message: `No existen ${missingItems.length} serial(es):\n${missingItems
            .map((item) => `- ${item.label}: ${item.serial}`)
            .join("\n")}\n\n¿Deseas continuar?`,
          confirmLabel: 'Continuar',
          cancelLabel: 'Cancelar',
          variant: 'warning'
        });
        if (!proceed) return { success: false };
      }

      return {
        success: true,
        seriales: verificationResults.map((item) => item.serial)
      };
    } catch (error) {
      notify(`Error al verificar seriales: ${error.message}`, { variant: 'danger', autoClose: false });
      return { success: false, error };
    }
  }, [confirm, notify]);

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
      notify("El contenedor cumple con las condiciones para el transporte de alimentos.", { variant: 'success' });
      return;
    }

    notify(
      "El contenedor no cumple con las condiciones para el transporte de alimentos. Puedes devolverlo por mal estado.",
      { variant: 'warning', autoClose: false }
    );
  };

  const buscarContenedorParaDevolucion = async () => {
    const code = normalizeUppercase(formValues.contenedor);
    if (!code) {
      notify("Ingresa el contenedor antes de registrar la devolucion.", { variant: 'warning' });
      return;
    }

    setStateValue("contenedorDevuelto", { contenedor: code });
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
        notify("Debes usar el boton de validacion para confirmar aptitud del contenedor.", { variant: 'warning' });
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
        const fullObservations = buildInspectionSummary({
          baseObservaciones: observaciones,
          inspectionChecks,
          foodValidation,
          foodValidationResult
        });

        const response = await crearInspeccionVacio({
          fecha: formValues.fecha || getCurrentDate(),
          contenedor: normalizeUppercase(formValues.contenedor),
          observaciones: fullObservations,
          seriales,
          semana: semanaValue,
          hora_inicio: getCurrentTime(),
          hora_fin: getCurrentTime(),
          agente:
            [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim() || user?.username || "Sistema",
          zona: "Inspeccion vacio"
        });

        notify(response?.message || "Guardado exitoso.", { variant: 'success' });

        setState((prev) => ({
          ...prev,
          observaciones: "",
          formValues: buildInitialFormValues({
            baseFields: prev.inputFields.filter((field) => Object.prototype.hasOwnProperty.call(FIELD_CONFIG, field.id)),
            insumos: prev.inputFields.filter((field) => field.eliminar),
            savedValues: {},
            defaultWeek: prev.semana || semanaValue
          }),
          semana: prev.semana || semanaValue,
          inspectionChecks: createInspectionChecks(),
          foodValidation: createFoodValidation(),
          foodValidationResult: null
        }));

        localStorage.removeItem(STORAGE_KEYS.INSPECCION_VACIO);
        localStorage.removeItem(STORAGE_KEYS.OBSERVACIONES);
        localStorage.removeItem(STORAGE_KEYS.FORMULARIO_DIGITAL);
        focusField("contenedor");

        const shouldContinue = await confirm({
          title: 'Inspección guardada',
          message: '¿Deseas cargar otro contenedor?',
          confirmLabel: 'Si, continuar',
          cancelLabel: 'Ir al dashboard',
          variant: 'primary'
        });
        if (!shouldContinue) {
          router.push("/Seguridad/Dashboard");
        }
      } catch (error) {
        console.error("Error al guardar inspeccion vacio:", error);
        notify(error?.message || "Ocurrio un error. Por favor intenta nuevamente.", {
          variant: 'danger',
          autoClose: false
        });
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
      verificarSeriales,
      focusField,
      notify,
      confirm
    ]
  );

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h2>Inspección contenedor vacío</h2>
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

          {user?.id_rol === "Super administrador" && (
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
                      ref={(element) => setInputRef(field.id, element)}
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
                      onKeyDown={handleFieldKeyDown}
                    />
                    <datalist id={`${field.id}-list`}>
                      {semanas.map((s) => (
                        <option key={s.consecutivo} value={s.consecutivo} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <input
                    ref={(element) => setInputRef(field.id, element)}
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
                    onKeyDown={handleFieldKeyDown}
                  />
                )}

                {isScannableField(field.id) && (
                  <button
                    type="button"
                    className="input-group-text bg-white text-secondary"
                    onClick={() => openScanner(field.id)}
                    aria-label={`Escanear ${field.label}`}
                    title={`Escanear ${field.label}`}
                    style={{ minWidth: "44px", cursor: "pointer" }}
                  >
                    <FaCamera />
                  </button>
                )}

                {field.eliminar && (
                  <button
                    type="button"
                    className="input-group-text bg-white"
                    onClick={() => handleRemove(field.id)}
                    aria-label={`Eliminar ${field.label}`}
                    style={{ minWidth: "40px", cursor: "pointer" }}
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
                  const nextValue = event.target.value;
                  setStateValue("observaciones", nextValue);
                  localStorage.setItem(STORAGE_KEYS.OBSERVACIONES, nextValue);
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
                  Escanear {inputFields.find((item) => item.id === scannerFieldId)?.label || "serial"}
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
    </div>
  );
}


