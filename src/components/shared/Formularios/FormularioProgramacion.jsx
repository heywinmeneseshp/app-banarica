import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { agregarUbicacion, listarUbicaciones } from "@services/api/ubicaciones";
import { agregarConductor, listarConductores } from "@services/api/conductores";
import { agregarVehiculo, listarVehiculo } from "@services/api/vehiculos";
import { agregarProgramaciones } from "@services/api/programaciones";
import { agregarRutas, buscarRutaPost } from "@services/api/rutas";
import { agregarConsumoRutaVehiculo } from "@services/api/consumoRutaVehiculo";
import { listarSemanas } from "@services/api/semanas";
import { paginarEmbarques } from "@services/api/embarques";
import { listarCombos } from "@services/api/combos";
import { listarcategoriaVehiculos } from "@services/api/CategoriaVehiculos";
import { listarNavieras } from "@services/api/navieras";
import { listarDestinos } from "@services/api/destinos";
import { listarBuques } from "@services/api/buques";
import { agregartipoMovimientoVehiculo, listartipoMovimientoVehiculos } from "@services/api/tipoMovimientoVehiculos";
import { encontrarModulo } from "@services/api/configuracion";
import { agregarProductosViaje } from "@services/api/productos_viaje";

const parseVehiculosSinCombustible = (configRows) => {
  try {
    const [config = {}] = configRows || [];
    const parsed = JSON.parse(config?.detalles || "{}");
    return Array.isArray(parsed?.vehiculosSinCombustible)
      ? parsed.vehiculosSinCombustible.map((item) => String(item))
      : [];
  } catch (error) {
    console.warn("No se pudo leer la configuracion de Programador_combustible:", error);
    return [];
  }
};

const getEmbarqueClienteId = (item) => String(item?.id_cliente || item?.clientes?.id || item?.cliente?.id || "");
const getEmbarqueNavieraId = (item) => String(item?.id_naviera || item?.Naviera?.id || item?.naviera?.id || "");
const getEmbarqueDestinoId = (item) => String(item?.id_destino || item?.Destino?.id || item?.destino?.id || "");
const getEmbarqueBuqueId = (item) => String(item?.id_buque || item?.Buque?.id || item?.buque?.id || "");

export default function FormulariosProgramacion({
  setOpen,
  setAlert,
  onSaved,
  onOpenMassCreate,
  onOpenMassUpdate,
  massActionLoading = false,
}) {
  const [listaUbicaciones, setListaUbicaciones] = useState([]);
  const [listaConductores, setListaConductores] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [listaCategoriasVehiculo, setListaCategoriasVehiculo] = useState([]);
  const [listaNavieras, setListaNavieras] = useState([]);
  const [listaDestinos, setListaDestinos] = useState([]);
  const [listaBuques, setListaBuques] = useState([]);
  const [listaTiposMovimiento, setListaTiposMovimiento] = useState([]);
  const [listaSemanas, setListaSemanas] = useState([]);
  const [listaEmbarques, setListaEmbarques] = useState([]);
  const [listaCombos, setListaCombos] = useState([]);
  const [vehiculosSinCombustible, setVehiculosSinCombustible] = useState([]);
  const [canQuickCreateProgramador, setCanQuickCreateProgramador] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [semanaInput, setSemanaInput] = useState("");
  const [semanaSeleccionada, setSemanaSeleccionada] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [navieraSeleccionada, setNavieraSeleccionada] = useState("");
  const [destinoSeleccionado, setDestinoSeleccionado] = useState("");
  const [buqueSeleccionado, setBuqueSeleccionado] = useState("");
  const [bookingSeleccionado, setBookingSeleccionado] = useState("");
  const [fecha, setFecha] = useState("");
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
  const [conductorSeleccionado, setConductorSeleccionado] = useState("");
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState("");
  const [contenedor, setContenedor] = useState("");
  const [paradas, setParadas] = useState([]);
  const [ubicacionPendiente, setUbicacionPendiente] = useState("");
  const [showPostSavePrompt, setShowPostSavePrompt] = useState(false);
  const [quickCreateState, setQuickCreateState] = useState({
    show: false,
    type: "",
    title: "",
    form: {},
    targetField: "",
  });
  const conductorTouchedRef = useRef(false);

  const cargarCatalogos = useCallback(async () => {
    const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "{}") : {};
    const [
      ubicaciones,
      conductores,
      vehiculos,
      categoriasVehiculo,
      navieras,
      destinos,
      buques,
      tiposMovimiento,
      semanas,
      embarquesRes,
      combos,
      configProgramador,
      userConfig,
    ] = await Promise.all([
      listarUbicaciones(),
      listarConductores(),
      listarVehiculo(),
      listarcategoriaVehiculos(),
      listarNavieras(),
      listarDestinos(),
      listarBuques(),
      listartipoMovimientoVehiculos(),
      listarSemanas(),
      paginarEmbarques(1, 5000, {}),
      listarCombos(),
      encontrarModulo("Programador_combustible"),
      usuario?.id_rol === "Super administrador" || !usuario?.username ? Promise.resolve([]) : encontrarModulo(usuario.username),
    ]);

    setListaUbicaciones(ubicaciones || []);
    setListaConductores(conductores || []);
    setListaVehiculos(vehiculos || []);
    setListaCategoriasVehiculo(categoriasVehiculo || []);
    setListaNavieras(navieras || []);
    setListaDestinos(destinos || []);
    setListaBuques(buques || []);
    setListaTiposMovimiento((tiposMovimiento || []).filter((item) => item?.activo !== false));
    setListaSemanas(semanas || []);
    setListaEmbarques(embarquesRes?.data || []);
    setListaCombos(combos || []);
    setVehiculosSinCombustible(parseVehiculosSinCombustible(configProgramador));
    if (usuario?.id_rol === "Super administrador") {
      setCanQuickCreateProgramador(true);
    } else {
      try {
        const detalles = JSON.parse(userConfig?.[0]?.detalles || "{}");
        const botones = Array.isArray(detalles?.botones) ? detalles.botones : [];
        setCanQuickCreateProgramador(botones.includes("programador_creacion_rapida"));
      } catch {
        setCanQuickCreateProgramador(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  const semanaActual = useMemo(
    () => listaSemanas.find((item) => String(item?.id || "") === String(semanaSeleccionada)),
    [listaSemanas, semanaSeleccionada]
  );

  const combosActivos = useMemo(
    () => (listaCombos || []).filter((item) => item?.isBlock !== true),
    [listaCombos]
  );

  const productoActual = useMemo(
    () => listaCombos.find((item) => String(item?.id || "") === String(productoSeleccionado)),
    [listaCombos, productoSeleccionado]
  );

  const embarquesSemana = useMemo(() => {
    if (!semanaSeleccionada) {
      return [];
    }

    const consecutivoSemana = String(semanaActual?.consecutivo || "").trim();
    return (listaEmbarques || []).filter((item) => (
      String(item?.id_semana || "") === String(semanaSeleccionada)
      || String(item?.semana?.id || "") === String(semanaSeleccionada)
      || String(item?.semana?.consecutivo || "").trim() === consecutivoSemana
    ));
  }, [listaEmbarques, semanaActual, semanaSeleccionada]);

  const embarquesProductoSemana = useMemo(() => {
    if (!productoActual?.id_cliente) {
      return embarquesSemana;
    }

    return embarquesSemana.filter((item) => (
      getEmbarqueClienteId(item) === String(productoActual.id_cliente)
    ));
  }, [embarquesSemana, productoActual]);

  const navierasDisponibles = useMemo(() => {
    const map = new Map();
    embarquesProductoSemana.forEach((item) => {
      const id = getEmbarqueNavieraId(item);
      const navieraMaestra = (listaNavieras || []).find(
        (naviera) => String(naviera?.id || naviera?.consecutivo || "") === id
      );
      const nombre =
        item?.Naviera?.navieras
        || item?.Naviera?.cod
        || item?.naviera?.navieras
        || item?.naviera?.cod
        || navieraMaestra?.navieras
        || navieraMaestra?.cod
        || "";

      if (id && nombre && !map.has(id)) {
        map.set(id, { id, nombre });
      }
    });
    return Array.from(map.values());
  }, [embarquesProductoSemana, listaNavieras]);

  const embarquesNaviera = useMemo(() => {
    if (!navieraSeleccionada) {
      return [];
    }
    return embarquesProductoSemana.filter((item) => getEmbarqueNavieraId(item) === String(navieraSeleccionada));
  }, [embarquesProductoSemana, navieraSeleccionada]);

  const destinosDisponibles = useMemo(() => {
    const map = new Map();
    embarquesNaviera.forEach((item) => {
      const id = getEmbarqueDestinoId(item);
      const destinoMaestro = (listaDestinos || []).find(
        (destino) => String(destino?.id || destino?.consecutivo || "") === id
      );
      const nombre =
        item?.Destino?.destino
        || item?.Destino?.cod
        || item?.destino?.destino
        || item?.destino?.cod
        || destinoMaestro?.destino
        || destinoMaestro?.cod
        || "";

      if (id && nombre && !map.has(id)) {
        map.set(id, { id, nombre });
      }
    });
    return Array.from(map.values());
  }, [embarquesNaviera, listaDestinos]);

  const embarquesDestino = useMemo(() => {
    if (!destinoSeleccionado) {
      return [];
    }
    return embarquesNaviera.filter((item) => getEmbarqueDestinoId(item) === String(destinoSeleccionado));
  }, [embarquesNaviera, destinoSeleccionado]);

  const buquesDisponibles = useMemo(() => {
    const map = new Map();
    embarquesDestino.forEach((item) => {
      const id = getEmbarqueBuqueId(item);
      const buqueMaestro = (listaBuques || []).find(
        (buque) => String(buque?.id || buque?.consecutivo || "") === id
      );
      const nombre =
        item?.Buque?.buque
        || item?.buque?.buque
        || buqueMaestro?.buque
        || "";

      if (id && nombre && !map.has(id)) {
        map.set(id, { id, nombre });
      }
    });
    return Array.from(map.values());
  }, [embarquesDestino, listaBuques]);

  const embarquesBuque = useMemo(() => {
    if (!buqueSeleccionado) {
      return [];
    }
    return embarquesDestino.filter((item) => getEmbarqueBuqueId(item) === String(buqueSeleccionado));
  }, [embarquesDestino, buqueSeleccionado]);

  const bookingsDisponibles = useMemo(() => (
    embarquesBuque
      .filter((item) => item?.booking)
      .map((item) => ({
        id: String(item?.id || ""),
        booking: item.booking,
        bl: item.bl || "",
      }))
  ), [embarquesBuque]);

  const bookingActual = useMemo(
    () => bookingsDisponibles.find((item) => item.id === bookingSeleccionado),
    [bookingsDisponibles, bookingSeleccionado]
  );

  const vehiculoActual = useMemo(
    () => listaVehiculos.find((item) => String(item?.id || "") === String(vehiculoSeleccionado)),
    [listaVehiculos, vehiculoSeleccionado]
  );

  const conductorSugerido = useMemo(
    () => listaConductores.find((item) => String(item?.id || "") === String(vehiculoActual?.conductor_id || "")),
    [listaConductores, vehiculoActual]
  );

  const conductorActual = useMemo(
    () => listaConductores.find((item) => String(item?.id || "") === String(conductorSeleccionado || "")),
    [conductorSeleccionado, listaConductores]
  );

  const movimientoActual = useMemo(
    () => listaTiposMovimiento.find((item) => String(item?.movimiento || "") === String(movimientoSeleccionado || "")),
    [listaTiposMovimiento, movimientoSeleccionado]
  );

  const requiereContenedor = Boolean(movimientoActual?.requiere_contenedor);
  const vehiculoPuedeOmitirCombustible = vehiculosSinCombustible.includes(String(vehiculoSeleccionado || ""));

  useEffect(() => {
    if (!vehiculoSeleccionado) {
      if (!conductorTouchedRef.current) {
        setConductorSeleccionado("");
      }
      return;
    }

    const conductorPredeterminado = String(vehiculoActual?.conductor_id || "");
    if (!conductorTouchedRef.current || !conductorSeleccionado) {
      setConductorSeleccionado(conductorPredeterminado);
    }
  }, [vehiculoActual, vehiculoSeleccionado, conductorSeleccionado]);

  const agregarParada = () => {
    const ubicacionId = String(ubicacionPendiente || "").trim();

    if (!ubicacionId) {
      throw new Error("Debes seleccionar una ubicacion antes de agregarla.");
    }

    setParadas((prev) => {
      if (prev[prev.length - 1] === ubicacionId) {
        throw new Error("No puedes agregar la misma ubicacion consecutivamente.");
      }
      return [...prev, ubicacionId];
    });
    setUbicacionPendiente("");
  };

  const eliminarParada = (index) => {
    setParadas((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetDependentSelectors = (level) => {
    if (level === "semana") {
      setNavieraSeleccionada("");
      setDestinoSeleccionado("");
      setBuqueSeleccionado("");
      setBookingSeleccionado("");
      return;
    }
    if (level === "producto") {
      setNavieraSeleccionada("");
      setDestinoSeleccionado("");
      setBuqueSeleccionado("");
      setBookingSeleccionado("");
      return;
    }
    if (level === "naviera") {
      setDestinoSeleccionado("");
      setBuqueSeleccionado("");
      setBookingSeleccionado("");
      return;
    }
    if (level === "destino") {
      setBuqueSeleccionado("");
      setBookingSeleccionado("");
      return;
    }
    if (level === "buque") {
      setBookingSeleccionado("");
    }
  };

  const handleSemanaChange = (event) => {
    const value = event.target.value;
    const semana = listaSemanas.find(
      (item) => String(item?.consecutivo || "").trim().toUpperCase() === String(value || "").trim().toUpperCase()
    );
    setSemanaInput(value);
    setSemanaSeleccionada(semana ? String(semana?.id || "") : "");
    resetDependentSelectors("semana");
  };

  const handleProductoChange = (event) => {
    setProductoSeleccionado(event.target.value);
    resetDependentSelectors("producto");
  };

  const handleQuickCreateUbicacion = () => {
    setQuickCreateState({
      show: true,
      type: "ubicacion",
      title: "Nueva ubicacion",
      form: { cod: "", ubicacion: "", detalle: "", activo: true },
      targetField: "ubicacionPendiente",
    });
  };

  const handleQuickCreateVehiculo = () => {
    setQuickCreateState({
      show: true,
      type: "vehiculo",
      title: "Nuevo vehiculo",
      form: {
        vehiculo: "",
        modelo: "",
        placa: "",
        conductor_id: "",
        categoria_id: "",
        combustible: 0,
        gal_por_km: 0,
        activo: true,
      },
      targetField: "vehiculo",
    });
  };

  const handleQuickCreateConductor = () => {
    setQuickCreateState({
      show: true,
      type: "conductor",
      title: "Nuevo conductor",
      form: {
        conductor: "",
        documento: "",
        telefono: "",
        activo: true,
      },
      targetField: "conductor",
    });
  };

  const handleQuickCreateTipoMovimiento = () => {
    setQuickCreateState({
      show: true,
      type: "tipoMovimientoVehiculo",
      title: "Nuevo tipo de movimiento",
      form: {
        movimiento: "",
        requiere_contenedor: false,
        activo: true,
      },
      targetField: "movimiento",
    });
  };

  const closeQuickCreateModal = () => {
    setQuickCreateState({
      show: false,
      type: "",
      title: "",
      form: {},
      targetField: "",
    });
  };

  const handleQuickCreateSubmit = async () => {
    try {
      if (quickCreateState.type === "ubicacion") {
        const ubicacionValue = String(quickCreateState.form?.ubicacion || "").trim().toUpperCase();
        if (!ubicacionValue) {
          throw new Error("Debes ingresar la ubicacion.");
        }

        const created = await agregarUbicacion({
          cod: String(quickCreateState.form?.cod || "").trim().toUpperCase(),
          ubicacion: ubicacionValue,
          detalle: String(quickCreateState.form?.detalle || "").trim(),
          activo: true,
        });

        await cargarCatalogos();
        const createdId = String(created?.id || "");
        if (quickCreateState.targetField === "ubicacionPendiente" && createdId) {
          setUbicacionPendiente(createdId);
        }
      }

      if (quickCreateState.type === "vehiculo") {
        const placaValue = String(quickCreateState.form?.placa || "").trim().toUpperCase();
        if (!placaValue) {
          throw new Error("Debes ingresar la placa.");
        }

        const created = await agregarVehiculo({
          vehiculo: String(quickCreateState.form?.vehiculo || placaValue).trim(),
          modelo: String(quickCreateState.form?.modelo || "").trim(),
          placa: placaValue,
          conductor_id: quickCreateState.form?.conductor_id || null,
          categoria_id: quickCreateState.form?.categoria_id || null,
          combustible: Number(quickCreateState.form?.combustible || 0),
          gal_por_km: Number(quickCreateState.form?.gal_por_km || 0),
          activo: true,
        });

        await cargarCatalogos();
        const createdId = String(created?.id || "");
        if (quickCreateState.targetField === "vehiculo" && createdId) {
          conductorTouchedRef.current = false;
          setVehiculoSeleccionado(createdId);
        }
      }

      if (quickCreateState.type === "conductor") {
        const conductorValue = String(quickCreateState.form?.conductor || "").trim().toUpperCase();
        if (!conductorValue) {
          throw new Error("Debes ingresar el conductor.");
        }

        const created = await agregarConductor({
          conductor: conductorValue,
          documento: String(quickCreateState.form?.documento || "").trim(),
          telefono: String(quickCreateState.form?.telefono || "").trim(),
          activo: true,
        });

        await cargarCatalogos();
        const createdId = String(created?.id || "");
        if (quickCreateState.targetField === "conductor" && createdId) {
          conductorTouchedRef.current = true;
          setConductorSeleccionado(createdId);
        }
      }

      if (quickCreateState.type === "tipoMovimientoVehiculo") {
        const movimientoValue = String(quickCreateState.form?.movimiento || "").trim();
        if (!movimientoValue) {
          throw new Error("Debes ingresar el movimiento.");
        }

        await agregartipoMovimientoVehiculo({
          movimiento: movimientoValue,
          requiere_contenedor: Boolean(quickCreateState.form?.requiere_contenedor),
          activo: true,
        });

        await cargarCatalogos();
        if (quickCreateState.targetField === "movimiento") {
          setMovimientoSeleccionado(movimientoValue);
        }
      }

      closeQuickCreateModal();
      setAlert({
        active: true,
        mensaje: "Registro creado correctamente.",
        color: "success",
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error?.message || "No fue posible crear el registro.",
        color: "danger",
        autoClose: true,
      });
    }
  };

  const ensureRoute = async (origenId, destinoId) => {
    try {
      const route = await buscarRutaPost({ ubicacion1: origenId, ubicacion2: destinoId });
      return route?.data?.id;
    } catch (error) {
      const origenSeleccionado = listaUbicaciones.find((item) => String(item?.id || "") === String(origenId));
      const destinoSeleccionado = listaUbicaciones.find((item) => String(item?.id || "") === String(destinoId));

      if (!vehiculoPuedeOmitirCombustible) {
        const confirmarCrearRuta = window.confirm(
          `No existe una ruta entre "${origenSeleccionado?.ubicacion || "origen"}" y "${destinoSeleccionado?.ubicacion || "destino"}". Desea crearla ahora y asignar el consumo del vehiculo?`
        );

        if (!confirmarCrearRuta) {
          throw new Error("Cancelaste la creacion de la ruta.");
        }

        const consumoIngresado = window.prompt("Ingrese el consumo del vehiculo (km/gal) para esta nueva ruta:");
        const consumoPorKm = Number(consumoIngresado);

        if (!consumoIngresado || Number.isNaN(consumoPorKm) || consumoPorKm <= 0) {
          throw new Error("Consumo invalido.");
        }

        const nuevaRuta = await agregarRutas({ ubicacion1: origenId, ubicacion2: destinoId });
        await agregarConsumoRutaVehiculo({
          vehiculo_id: vehiculoSeleccionado,
          ruta_id: nuevaRuta.data.id,
          consumo_por_km: consumoPorKm,
          activo: true,
        });
        return nuevaRuta?.data?.id;
      }

      const nuevaRuta = await agregarRutas({ ubicacion1: origenId, ubicacion2: destinoId });
      return nuevaRuta?.data?.id;
    }
  };

  const resetMovimientoFields = () => {
    setProductoSeleccionado("");
    setVehiculoSeleccionado("");
    setConductorSeleccionado("");
    setMovimientoSeleccionado("");
    setContenedor("");
    setParadas([]);
    setUbicacionPendiente("");
    conductorTouchedRef.current = false;
  };

  const handleProgramarOtro = () => {
    setShowPostSavePrompt(false);
    resetMovimientoFields();
  };

  const handleFinalizarProgramacion = () => {
    setShowPostSavePrompt(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      if (!semanaSeleccionada) {
        throw new Error("Debes seleccionar una semana valida.");
      }
      if (!navieraSeleccionada || !destinoSeleccionado || !buqueSeleccionado || !bookingSeleccionado) {
        throw new Error("Debes completar naviera, destino, buque y BL.");
      }
      if (!fecha) {
        throw new Error("Debes seleccionar la fecha.");
      }
      if (!vehiculoSeleccionado) {
        throw new Error("Debes seleccionar el vehiculo.");
      }
      if (!conductorSeleccionado) {
        throw new Error("Debes seleccionar el conductor.");
      }
      if (!conductorActual?.id) {
        throw new Error("El conductor seleccionado no existe.");
      }
      if (!movimientoSeleccionado) {
        throw new Error("Debes seleccionar el tipo de movimiento.");
      }
      if (requiereContenedor && !String(contenedor || "").trim()) {
        throw new Error("El movimiento seleccionado requiere contenedor.");
      }

      const paradasValidas = paradas
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      if (!vehiculoPuedeOmitirCombustible && paradasValidas.length < 2) {
        throw new Error("Debes seleccionar al menos dos ubicaciones para programar.");
      }

      if (vehiculoPuedeOmitirCombustible && paradasValidas.length < 1) {
        throw new Error("Debes seleccionar al menos una ubicacion para programar.");
      }

      for (let index = 0; index < paradasValidas.length - 1; index += 1) {
        if (paradasValidas[index] === paradasValidas[index + 1]) {
          throw new Error(`Las ubicaciones ${index + 1} y ${index + 2} no pueden ser iguales.`);
        }
      }

      setGuardando(true);

      const semanaTexto = semanaActual?.consecutivo || semanaInput;
      const bookingActualBl = bookingActual?.bl || null;
      const contenedorFinal = requiereContenedor ? String(contenedor || "").trim().toUpperCase() : null;
      const productoPayload = productoActual?.id
        ? {
            producto_id: productoActual.id,
            unidad_de_medida: "",
            cantidad: 0,
            activo: true,
          }
        : null;
      const primerClienteProducto = productoActual?.id_cliente || null;
      const getProgramacionId = (programacion) => (
        programacion?.id
        || programacion?.data?.id
        || programacion?.programacion?.id
        || programacion?.data?.programacion?.id
        || ""
      );

      if (paradasValidas.length === 1) {
        const ubicacionId = paradasValidas[0];
        const rutaId = await ensureRoute(ubicacionId, ubicacionId);
        const programacionCreada = await agregarProgramaciones({
          ruta_id: rutaId,
          cobrar: false,
          id_pagador_flete: primerClienteProducto,
          activo: true,
          movimiento: movimientoSeleccionado,
          conductor_id: conductorActual.id,
          vehiculo_id: vehiculoSeleccionado,
          contenedor: contenedorFinal,
          bl: bookingActualBl,
          semana: semanaTexto,
          fecha,
          detalles: "Ubicacion unica",
        });
        const programacionCreadaId = getProgramacionId(programacionCreada);
        if (productoPayload && programacionCreadaId) {
          await agregarProductosViaje({
            ...productoPayload,
            programacion_id: programacionCreadaId,
          });
        }
      } else {
        for (let index = 0; index < paradasValidas.length - 1; index += 1) {
          const origenId = paradasValidas[index];
          const destinoId = paradasValidas[index + 1];
          const rutaId = await ensureRoute(origenId, destinoId);

          const programacionCreada = await agregarProgramaciones({
            ruta_id: rutaId,
            cobrar: false,
            id_pagador_flete: primerClienteProducto,
            activo: true,
            movimiento: movimientoSeleccionado,
            conductor_id: conductorActual.id,
            vehiculo_id: vehiculoSeleccionado,
            contenedor: contenedorFinal,
            bl: bookingActualBl,
            semana: semanaTexto,
            fecha,
            detalles: `Tramo ${index + 1} de ${paradasValidas.length - 1}`,
          });
          const programacionCreadaId = getProgramacionId(programacionCreada);
          if (productoPayload && programacionCreadaId) {
            await agregarProductosViaje({
              ...productoPayload,
              programacion_id: programacionCreadaId,
            });
          }
        }
      }

      setAlert({
        active: true,
        mensaje: "Las lineas del programador se guardaron correctamente.",
        color: "success",
        autoClose: true,
      });
      onSaved?.();
      setShowPostSavePrompt(true);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error?.message || "No fue posible guardar la programacion.",
        color: "danger",
        autoClose: true,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className={styles.fondo}>
        <div style={{ width: "min(1120px, 96vw)" }} className={styles.floatingform}>
          <div style={{ minWidth: "100%" }} className="card shadow-sm">
            <span style={{ minWidth: "100%" }} className={styles.ventana}>
              <div className="card-header text-end">
                <button type="button" onClick={() => setOpen(false)} className="btn-close" aria-label="Close"></button>
              </div>
              <div className="card-body py-3 px-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div>
                    <h6 className="mb-0">Nuevo movimiento</h6>
                    <div className="small text-muted">Programa rapido por BL, recorrido, vehiculo y conductor.</div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button type="button" variant="outline-primary" size="sm" onClick={onOpenMassCreate} disabled={massActionLoading || !onOpenMassCreate}>
                      Cargue masivo
                    </Button>
                    <Button type="button" variant="outline-secondary" size="sm" onClick={onOpenMassUpdate} disabled={massActionLoading || !onOpenMassUpdate}>
                      Actualizacion masiva
                    </Button>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-6 col-lg-2">
                    <label htmlFor="semana-programador" className="form-label mb-1">Semana</label>
                    <input
                      id="semana-programador"
                      type="text"
                      list="semana-programador-items"
                      className={`form-control form-control-sm ${!semanaSeleccionada ? "is-invalid" : ""}`}
                      value={semanaInput}
                      onChange={handleSemanaChange}
                      placeholder="Seleccione una semana"
                    />
                    <datalist id="semana-programador-items">
                      {listaSemanas.map((item) => (
                        <option key={item?.id || item?.consecutivo} value={item?.consecutivo} />
                      ))}
                    </datalist>
                    {!semanaSeleccionada && (
                      <small className="text-danger d-block mt-1">Debes seleccionar una semana valida.</small>
                    )}
                  </div>

                  <div className="col-12 col-md-6 col-lg-2">
                    <label htmlFor="fecha-programador" className="form-label mb-1">Fecha</label>
                    <input
                      id="fecha-programador"
                      type="date"
                      className="form-control form-control-sm"
                      value={fecha}
                      onChange={(event) => setFecha(event.target.value)}
                    />
                  </div>

                  <div className="col-12 col-lg-8">
                    <label htmlFor="producto-programador" className="form-label mb-1">Producto</label>
                    <select
                      id="producto-programador"
                      className="form-control form-control-sm"
                      value={productoSeleccionado}
                      onChange={handleProductoChange}
                    >
                      <option value=""></option>
                      {combosActivos.map((item) => (
                        <option key={item?.id} value={item?.id}>{item?.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <label htmlFor="naviera-programador" className="form-label mb-1">Naviera</label>
                    <select
                      id="naviera-programador"
                      className="form-control form-control-sm"
                      value={navieraSeleccionada}
                      disabled={!semanaSeleccionada}
                      onChange={(event) => {
                        setNavieraSeleccionada(event.target.value);
                        resetDependentSelectors("naviera");
                      }}
                    >
                      <option value=""></option>
                      {navierasDisponibles.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <label htmlFor="destino-programador" className="form-label mb-1">Destino</label>
                    <select
                      id="destino-programador"
                      className="form-control form-control-sm"
                      value={destinoSeleccionado}
                      disabled={!navieraSeleccionada}
                      onChange={(event) => {
                        setDestinoSeleccionado(event.target.value);
                        resetDependentSelectors("destino");
                      }}
                    >
                      <option value=""></option>
                      {destinosDisponibles.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <label htmlFor="buque-programador" className="form-label mb-1">Buque</label>
                    <select
                      id="buque-programador"
                      className="form-control form-control-sm"
                      value={buqueSeleccionado}
                      disabled={!destinoSeleccionado}
                      onChange={(event) => {
                        setBuqueSeleccionado(event.target.value);
                        resetDependentSelectors("buque");
                      }}
                    >
                      <option value=""></option>
                      {buquesDisponibles.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <label htmlFor="booking-programador" className="form-label mb-1">BL</label>
                    <select
                      id="booking-programador"
                      className="form-control form-control-sm"
                      value={bookingSeleccionado}
                      disabled={!buqueSeleccionado}
                      onChange={(event) => setBookingSeleccionado(event.target.value)}
                    >
                      <option value=""></option>
                      {bookingsDisponibles.map((item) => (
                        <option key={item.id} value={item.id}>{item.bl || item.booking}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <div className="px-0 py-1">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <h6 className="mb-0">Recorrido</h6>
                          {vehiculoPuedeOmitirCombustible && (
                            <p className="text-muted small mb-0">
                              Puedes programar con una sola ubicacion o agregar mas si el vehiculo hace otras paradas.
                            </p>
                          )}
                        </div>
                        <span className="small text-muted">{paradas.length} parada(s)</span>
                      </div>

                      <div className="row g-2 align-items-center">
                        <div className="col-md-9">
                          <select
                            id="ubicacion-pendiente-programador"
                            className="form-control form-control-sm"
                            value={ubicacionPendiente}
                            onChange={(event) => setUbicacionPendiente(event.target.value)}
                          >
                            <option value="">Seleccione una ubicacion</option>
                            {listaUbicaciones.map((item) => (
                              <option key={item?.id} value={item?.id}>{item?.ubicacion}</option>
                            ))}
                          </select>
                        </div>
                        {canQuickCreateProgramador && (
                          <div className="col-md-1">
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              className="w-100"
                              onClick={handleQuickCreateUbicacion}
                              title="Crear ubicacion"
                            >
                              +
                            </Button>
                          </div>
                        )}
                        <div className="col-md-2">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              try {
                                agregarParada();
                              } catch (error) {
                                setAlert({
                                  active: true,
                                  mensaje: error?.message || "No fue posible agregar la ubicacion.",
                                  color: "danger",
                                  autoClose: true,
                                });
                              }
                            }}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded mt-2 px-2 py-2 d-flex flex-wrap gap-2 align-items-start" style={{ minHeight: "2.75rem" }}>
                        {paradas.length === 0 && (
                          <span className="text-muted small">Aun no has agregado ubicaciones.</span>
                        )}

                        {paradas.map((paradaId, index) => {
                          const ubicacion = listaUbicaciones.find(
                            (item) => String(item?.id || "") === String(paradaId)
                          );

                          return (
                            <span
                              key={`parada-${index}-${paradaId}`}
                              className="d-inline-flex align-items-center gap-2 text-white bg-primary rounded-pill px-2 py-1"
                              style={{ fontSize: "0.85rem" }}
                            >
                              <span
                                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white text-primary fw-semibold"
                                style={{ width: "1.35rem", height: "1.35rem", fontSize: "0.75rem" }}
                              >
                                {index + 1}
                              </span>
                              <span>{ubicacion?.ubicacion || "Ubicacion sin nombre"}</span>
                              <button
                                type="button"
                                className="btn-close btn-close-white"
                                aria-label={`Eliminar ubicacion ${index + 1}`}
                                style={{ fontSize: "0.6rem" }}
                                onClick={() => eliminarParada(index)}
                              ></button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="vehiculo-programador" className="form-label mb-0">Vehiculo</label>
                      {canQuickCreateProgramador && (
                        <Button type="button" variant="outline-primary" size="sm" onClick={handleQuickCreateVehiculo}>
                          +
                        </Button>
                      )}
                    </div>
                    <select
                      id="vehiculo-programador"
                      className="form-control form-control-sm"
                      value={vehiculoSeleccionado}
                      onChange={(event) => {
                        const nextVehiculoId = event.target.value;
                        conductorTouchedRef.current = false;
                        setVehiculoSeleccionado(nextVehiculoId);
                      }}
                    >
                      <option value=""></option>
                      {listaVehiculos.map((item) => (
                        <option key={item?.id} value={item?.id}>{item?.placa}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="conductor-programador" className="form-label mb-0">Conductor</label>
                      {canQuickCreateProgramador && (
                        <Button type="button" variant="outline-primary" size="sm" onClick={handleQuickCreateConductor}>
                          +
                        </Button>
                      )}
                    </div>
                    <select
                      id="conductor-programador"
                      className="form-control form-control-sm"
                      value={conductorSeleccionado}
                      onChange={(event) => {
                        conductorTouchedRef.current = true;
                        setConductorSeleccionado(event.target.value);
                      }}
                    >
                      <option value=""></option>
                      {listaConductores.map((item) => (
                        <option key={item?.id} value={item?.id}>{item?.conductor}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="movimiento-programador" className="form-label mb-0">Movimiento</label>
                      {canQuickCreateProgramador && (
                        <Button type="button" variant="outline-primary" size="sm" onClick={handleQuickCreateTipoMovimiento}>
                          +
                        </Button>
                      )}
                    </div>
                    <select
                      id="movimiento-programador"
                      className="form-control form-control-sm"
                      value={movimientoSeleccionado}
                      onChange={(event) => setMovimientoSeleccionado(event.target.value)}
                    >
                      <option value=""></option>
                      {listaTiposMovimiento.map((item) => (
                        <option key={item?.id || item?.movimiento} value={item?.movimiento}>{item?.movimiento}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3 d-flex flex-column">
                    <label htmlFor="contenedor-programador" className="form-label mb-1">Contenedor</label>
                    <input
                      id="contenedor-programador"
                      type="text"
                      maxLength={11}
                      className="form-control form-control-sm mt-auto"
                      value={contenedor}
                      disabled={!requiereContenedor}
                      onChange={(event) => setContenedor(event.target.value.toUpperCase())}
                      placeholder={requiereContenedor ? "Ingrese contenedor" : "No requerido"}
                    />
                  </div>

                  <div className="col-12">
                    <div className="small text-muted d-flex flex-wrap gap-3">
                      <span>
                        {conductorSugerido?.conductor
                          ? `Sugerido por el vehiculo: ${conductorSugerido.conductor}`
                          : ""}
                      </span>
                      {vehiculoPuedeOmitirCombustible && (
                        <span className="text-info">Sin seguimiento de combustible.</span>
                      )}
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-end pt-1">
                    <Button type="button" variant="success" size="sm" onClick={handleSubmit} disabled={guardando || massActionLoading}>
                      {guardando ? "Guardando..." : "Programar"}
                    </Button>
                  </div>
                </div>
              </div>
            </span>
          </div>
        </div>
      </div>

      <Modal show={showPostSavePrompt} onHide={handleFinalizarProgramacion} centered>
        <Modal.Header closeButton>
          <Modal.Title>Programacion guardada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">La programacion se guardo correctamente. ¿Quieres programar otro movimiento o finalizar el proceso?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={handleFinalizarProgramacion}>
            Finalizar
          </Button>
          <Button type="button" variant="primary" onClick={handleProgramarOtro}>
            Programar otro
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={quickCreateState.show} onHide={closeQuickCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{quickCreateState.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {quickCreateState.type === "ubicacion" && (
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Cod</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.cod || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, cod: event.target.value.toUpperCase() },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-8">
                <Form.Group>
                  <Form.Label>Ubicacion</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.ubicacion || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, ubicacion: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Detalle</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.detalle || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, detalle: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
            </div>
          )}

          {quickCreateState.type === "vehiculo" && (
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Vehiculo</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.vehiculo || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, vehiculo: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Modelo</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.modelo || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, modelo: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Placa</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.placa || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, placa: event.target.value.toUpperCase() },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Conductor</Form.Label>
                  <Form.Select
                    value={quickCreateState.form?.conductor_id || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, conductor_id: event.target.value },
                    }))}
                  >
                    <option value=""></option>
                    {listaConductores.map((item) => (
                      <option key={item?.id} value={item?.id}>{item?.conductor}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select
                    value={quickCreateState.form?.categoria_id || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, categoria_id: event.target.value },
                    }))}
                  >
                    <option value=""></option>
                    {listaCategoriasVehiculo.map((item) => (
                      <option key={item?.id} value={item?.id}>{item?.categoria}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Combustible</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="any"
                    value={quickCreateState.form?.combustible ?? 0}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, combustible: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Gal por Km</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="any"
                    value={quickCreateState.form?.gal_por_km ?? 0}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, gal_por_km: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
            </div>
          )}

          {quickCreateState.type === "conductor" && (
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Conductor</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.conductor || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, conductor: event.target.value.toUpperCase() },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Documento</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.documento || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, documento: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Telefono</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.telefono || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, telefono: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
            </div>
          )}

          {quickCreateState.type === "tipoMovimientoVehiculo" && (
            <div className="row g-3">
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Movimiento</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.movimiento || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, movimiento: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Check
                  id="tipo-movimiento-requiere-contenedor"
                  type="checkbox"
                  label="Este movimiento requiere ingreso de contenedor"
                  checked={Boolean(quickCreateState.form?.requiere_contenedor)}
                  onChange={(event) => setQuickCreateState((prev) => ({
                    ...prev,
                    form: { ...prev.form, requiere_contenedor: event.target.checked },
                  }))}
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeQuickCreateModal}>
            Cancelar
          </Button>
          <Button onClick={handleQuickCreateSubmit}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
