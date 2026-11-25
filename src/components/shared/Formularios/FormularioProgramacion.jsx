import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Modal, OverlayTrigger, Popover } from "react-bootstrap";
import { FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaMinus, FaRegTrashAlt, FaUndoAlt, FaArrowRight, FaInfoCircle } from "react-icons/fa";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { agregarUbicacion, listarUbicaciones } from "@services/api/ubicaciones";
import { agregarConductor, listarConductores } from "@services/api/conductores";
import { agregarVehiculo, listarVehiculo } from "@services/api/vehiculos";
import { agregarProgramaciones } from "@services/api/programaciones";
import { agregarRutas, buscarRutaPost } from "@services/api/rutas";
import { agregarConsumoRutaVehiculo } from "@services/api/consumoRutaVehiculo";
import { filtrarSemanasRangoProgramador } from "@services/api/semanas";
import { paginarEmbarques } from "@services/api/embarques";
import { listarCombos } from "@services/api/combos";
import { listarcategoriaVehiculos } from "@services/api/categoriaVehiculos";
import { listarTransportadoras } from "@services/api/transportadoras";
import { listarNavieras } from "@services/api/navieras";
import { listarDestinos } from "@services/api/destinos";
import { listarBuques } from "@services/api/buques";
import { agregartipoMovimientoVehiculo, listartipoMovimientoVehiculos } from "@services/api/tipoMovimientoVehiculos";
import { encontrarModulo } from "@services/api/configuracion";
import { agregarProductosViaje } from "@services/api/productos_viaje";
import { listarProgramacionCorte } from "@services/api/programacionCorte";

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

// Movimiento a Puerto: no lleva naviera, destino, buque ni Booking.
const normalizarTexto = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const esMovimientoPuerto = (movimiento) => String(movimiento || "").trim().toLowerCase() === "puerto";
const getEmbarqueClienteId = (item) => String(item?.id_cliente || item?.clientes?.id || item?.cliente?.id || "");
const getEmbarqueNavieraId = (item) => String(item?.id_naviera || item?.Naviera?.id || item?.naviera?.id || "");
const getEmbarqueDestinoId = (item) => String(item?.id_destino || item?.Destino?.id || item?.destino?.id || "");
const getEmbarqueBuqueId = (item) => String(item?.id_buque || item?.Buque?.id || item?.buque?.id || "");
const getEmbarqueNavieraNombre = (item) => item?.Naviera?.navieras || item?.Naviera?.cod || item?.naviera?.navieras || item?.naviera?.cod || "";
const getEmbarqueDestinoNombre = (item) => item?.Destino?.destino || item?.Destino?.cod || item?.destino?.destino || item?.destino?.cod || "";
const getEmbarqueBuqueNombre = (item) => item?.Buque?.buque || item?.Buque?.cod || item?.buque?.buque || item?.buque?.cod || "";
export default function FormulariosProgramacion({
  setOpen,
  setAlert,
  onSaved,
  onOpenMassCreate,
  onOpenMassUpdate,
  massActionLoading = false,
  // Catalogos que la pantalla que abre este modal ya pudo haber cargado (p.ej.
  // Programador.jsx via useProgramadorCatalogos). Si se pasan, se usan tal cual
  // en vez de volver a pedirlos al backend, para que el modal abra mas rapido.
  catalogosIniciales = null,
}) {
  const [listaUbicaciones, setListaUbicaciones] = useState([]);
  // Ultimo catalogosIniciales del padre: permite reflejar conductores/vehiculos
  // recien creados (el padre los refresca) sin cerrar el modal.
  const catalogosRef = useRef(catalogosIniciales);
  catalogosRef.current = catalogosIniciales;
  const [listaConductores, setListaConductores] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [listaCategoriasVehiculo, setListaCategoriasVehiculo] = useState([]);
  const [listaTransportadoras, setListaTransportadoras] = useState([]);
  const [, setListaNavieras] = useState([]);
  const [, setListaDestinos] = useState([]);
  const [, setListaBuques] = useState([]);
  const [listaTiposMovimiento, setListaTiposMovimiento] = useState([]);
  const [listaSemanas, setListaSemanas] = useState([]);
  const [listaEmbarques, setListaEmbarques] = useState([]);
  const [listaCombos, setListaCombos] = useState([]);
  const [vehiculosSinCombustible, setVehiculosSinCombustible] = useState([]);
  const [canQuickCreateProgramador, setCanQuickCreateProgramador] = useState(false);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);
  const [embarquesError, setEmbarquesError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [semanaInput, setSemanaInput] = useState("");
  const [semanaSeleccionada, setSemanaSeleccionada] = useState("");
  const [, setProductoSeleccionado] = useState("");
  const [, setNavieraSeleccionada] = useState("");
  const [, setDestinoSeleccionado] = useState("");
  const [, setBuqueSeleccionado] = useState("");
  const [, setBookingSeleccionado] = useState("");
  const [fecha, setFecha] = useState("");
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
  const [conductorSeleccionado, setConductorSeleccionado] = useState("");
  const [, setMovimientoSeleccionado] = useState("");
  const [, setContenedor] = useState("");
  const [, setUsarContenedorDemo] = useState(false);
  const [paradas, setParadas] = useState([]);
  // Producto y cajas de cada linea (tramo) que se genera: { [indiceTramo]: { producto, cajas } }
  const [lineasDetalle, setLineasDetalle] = useState({});
  // Programacion de Corte (para avisar si una linea no coincide con lo programado para la finca)
  const [programacionCorte, setProgramacionCorte] = useState([]);
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

    // La semana no depende de ningun otro catalogo (ubicaciones, conductores,
    // vehiculos, etc.), asi que se resuelve en su propio hilo en vez de esperar
    // a que TODOS los demas terminen: si alguno de ellos es lento (p.ej. una
    // flota grande de vehiculos), el selector de semana ya no queda bloqueado.
    const semanasPromise = encontrarModulo("Semana", { syncWeeks: false })
      .then((configSemanaRes) => filtrarSemanasRangoProgramador({
        anho_actual: configSemanaRes?.[0]?.anho_actual,
        semana_actual: configSemanaRes?.[0]?.semana_actual,
        semana_previa: configSemanaRes?.[0]?.semana_previa,
        semana_siguiente: configSemanaRes?.[0]?.semana_siguiente,
        total_semanas_anho: configSemanaRes?.[0]?.total_semanas_anho,
      }))
      .catch((error) => {
        console.warn("No se pudo filtrar el rango de semanas del programador:", error);
        return [];
      });
    semanasPromise.then((semanas) => setListaSemanas(semanas || []));

    // Los catalogos que la pantalla que abre este modal ya tenia cargados se
    // reutilizan (sin pedirlos de nuevo). Solo se piden los que no llegaron
    // precargados: esto es lo que hace que "Nuevo movimiento" abra rapido
    // cuando se abre desde el Programador.
    const tieneVehiculosSinCombustiblePrecargado = Array.isArray(catalogosIniciales?.vehiculosSinCombustible);

    const catalogResults = await Promise.allSettled([
      catalogosIniciales?.ubicaciones ? Promise.resolve(catalogosIniciales.ubicaciones) : listarUbicaciones(),
      catalogosIniciales?.conductores ? Promise.resolve(catalogosIniciales.conductores) : listarConductores(),
      catalogosIniciales?.vehiculos ? Promise.resolve(catalogosIniciales.vehiculos) : listarVehiculo(),
      listarcategoriaVehiculos(),
      catalogosIniciales?.transportadoras ? Promise.resolve(catalogosIniciales.transportadoras) : listarTransportadoras(),
      listarNavieras(),
      listarDestinos(),
      listarBuques(),
      catalogosIniciales?.tiposMovimiento ? Promise.resolve(catalogosIniciales.tiposMovimiento) : listartipoMovimientoVehiculos(),
      catalogosIniciales?.combos ? Promise.resolve(catalogosIniciales.combos) : listarCombos(),
      tieneVehiculosSinCombustiblePrecargado ? Promise.resolve([]) : encontrarModulo("Programador_combustible"),
      usuario?.id_rol === "Super administrador" || !usuario?.username ? Promise.resolve([]) : encontrarModulo(usuario.username),
    ]);

    const getCatalogValue = (index, fallback) => (
      catalogResults[index]?.status === "fulfilled" ? catalogResults[index].value : fallback
    );

    const ubicaciones = getCatalogValue(0, []);
    const conductores = getCatalogValue(1, []);
    const vehiculos = getCatalogValue(2, []);
    const categoriasVehiculo = getCatalogValue(3, []);
    const transportadoras = getCatalogValue(4, []);
    const navieras = getCatalogValue(5, []);
    const destinos = getCatalogValue(6, []);
    const buques = getCatalogValue(7, []);
    const tiposMovimiento = getCatalogValue(8, []);
    const combos = getCatalogValue(9, []);
    const configProgramador = getCatalogValue(10, []);
    const userConfig = getCatalogValue(11, []);

    setListaUbicaciones(ubicaciones || []);
    // Si el padre refresco conductores/vehiculos mientras esto cargaba, se usa
    // la version mas reciente (no el snapshot del montaje).
    const conductoresActuales = catalogosRef.current?.conductores || conductores;
    const vehiculosActuales = catalogosRef.current?.vehiculos || vehiculos;
    setListaConductores([...conductoresActuales].sort((a, b) => String(a.conductor).localeCompare(String(b.conductor))) || []);
    setListaVehiculos([...vehiculosActuales].sort((a, b) => String(a.placa).localeCompare(String(b.placa))) || []);
    setListaCategoriasVehiculo(categoriasVehiculo || []);
    setListaTransportadoras(transportadoras || []);
    setListaNavieras(navieras || []);
    setListaDestinos(destinos || []);
    setListaBuques(buques || []);
    setListaTiposMovimiento((tiposMovimiento || []).filter((item) => item?.activo !== false));
    setListaCombos(combos || []);
    setVehiculosSinCombustible(
      tieneVehiculosSinCombustiblePrecargado
        ? catalogosIniciales.vehiculosSinCombustible
        : parseVehiculosSinCombustible(configProgramador)
    );
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
    // catalogosIniciales se lee como snapshot inicial: el padre puede pasar un
    // objeto literal nuevo en cada render y no queremos que eso dispare un
    // refetch cada vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Cuando el padre refresca conductores/vehiculos (p. ej. se creo uno nuevo
  // en otra pestana), el modal abierto los muestra al instante.
  const conductoresPadre = catalogosIniciales?.conductores;
  const vehiculosPadre = catalogosIniciales?.vehiculos;
  useEffect(() => {
    if (Array.isArray(conductoresPadre)) {
      setListaConductores([...conductoresPadre].sort((a, b) => String(a.conductor).localeCompare(String(b.conductor))));
    }
  }, [conductoresPadre]);
  useEffect(() => {
    if (Array.isArray(vehiculosPadre)) {
      setListaVehiculos([...vehiculosPadre].sort((a, b) => String(a.placa).localeCompare(String(b.placa))));
    }
  }, [vehiculosPadre]);

  const semanaActual = useMemo(
    () => listaSemanas.find((item) => String(item?.id || "") === String(semanaSeleccionada)),
    [listaSemanas, semanaSeleccionada]
  );

  useEffect(() => {
    const consecutivoSemana = String(semanaActual?.consecutivo || "").trim();

    if (!semanaSeleccionada || !consecutivoSemana) {
      setListaEmbarques([]);
      setEmbarquesError("");
      return undefined;
    }

    let active = true;

    const cargarEmbarquesSemana = async () => {
      try {
        setLoadingEmbarques(true);
        setEmbarquesError("");
        const embarquesRes = await paginarEmbarques(1, 5000, { semana: consecutivoSemana });
        if (active) {
          setListaEmbarques(embarquesRes?.data || []);
        }
      } catch (error) {
        console.error("No fue posible cargar embarques de la semana:", error);
        if (active) {
          setListaEmbarques([]);
          setEmbarquesError("No fue posible cargar los embarques de la semana.");
        }
      } finally {
        if (active) {
          setLoadingEmbarques(false);
        }
      }
    };

    cargarEmbarquesSemana();

    return () => {
      active = false;
    };
  }, [semanaActual, semanaSeleccionada]);

  const combosActivos = useMemo(
    () => (listaCombos || []).filter((item) => item?.isBlock !== true),
    [listaCombos]
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
    setLineasDetalle({});
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
    setSemanaSeleccionada(value);
    const semana = listaSemanas.find((item) => String(item?.id || "") === String(value || ""));
    setSemanaInput(semana?.consecutivo || "");
    setListaEmbarques([]);
    setEmbarquesError("");
    resetDependentSelectors("semana");
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
        transportadoraId: "",
        combustible: 0,
        gal_por_km: 0,
        programador_sin_combustible: true,
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
        identificacion: "",
        transportadoraId: "",
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
        if (!quickCreateState.form?.transportadoraId) {
          throw new Error("Debes asignar una transportadora al vehículo.");
        }

        const created = await agregarVehiculo({
          vehiculo: String(quickCreateState.form?.vehiculo || placaValue).trim(),
          modelo: String(quickCreateState.form?.modelo || "").trim(),
          placa: placaValue,
          conductor_id: quickCreateState.form?.conductor_id || null,
          categoria_id: quickCreateState.form?.categoria_id || null,
          transportadoraId: quickCreateState.form?.transportadoraId || null,
          observacion: quickCreateState.form?.programador_sin_combustible
            ? "Programador sin combustible"
            : "",
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
          cons_transportadora: String(quickCreateState.form?.transportadoraId || "").trim() || '',
          licencia: String(quickCreateState.form?.identificacion || "").trim() || '',
          email: '',
          tel: String(quickCreateState.form?.telefono || "").trim(),
          isBlock: false,
        });

        await cargarCatalogos();
        const createdId = String(created?.consecutivo || created?.data?.consecutivo || "");
        if (quickCreateState.targetField === "conductor" && createdId) {
          conductorTouchedRef.current = true;
          setConductorSeleccionado(createdId);
        }
        if (quickCreateState.targetField === "conductor_vehiculo" && createdId) {
          setQuickCreateState((prev) => ({
            ...prev,
            type: "vehiculo",
            title: "Nuevo vehiculo",
            form: { ...prev.form, conductor_id: createdId },
            targetField: null,
          }));
          return;
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

  const ensureRoute = async (origenId, destinoId, vehiculoId = vehiculoSeleccionado) => {
    try {
      const route = await buscarRutaPost({ ubicacion1: origenId, ubicacion2: destinoId });
      return route?.data?.id;
    } catch (error) {
      const nuevaRuta = await agregarRutas({ ubicacion1: origenId, ubicacion2: destinoId });
      const rutaId = nuevaRuta?.data?.id;

      if (rutaId) {
        await agregarConsumoRutaVehiculo({
          vehiculo_id: vehiculoId,
          ruta_id: rutaId,
          consumo_por_km: 1,
          activo: true,
        });
      }

      return rutaId || null;
    }
  };

  const resetMovimientoFields = () => {
    setProductoSeleccionado("");
    setVehiculoSeleccionado("");
    setConductorSeleccionado("");
    setMovimientoSeleccionado("");
    setContenedor("");
    setUsarContenedorDemo(false);
    setParadas([]);
    setLineasDetalle({});
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

  // Opciones de naviera -> destino -> buque -> booking de una linea (filtradas por el cliente del producto de la linea).
  const opcionesEmbarqueLinea = (d) => {
    const producto = listaCombos.find((item) => String(item?.id || "") === String(d.producto || ""));
    const base = producto?.id_cliente
      ? embarquesSemana.filter((item) => getEmbarqueClienteId(item) === String(producto.id_cliente))
      : embarquesSemana;
    const unicos = (lista, getId, getNombre) => {
      const map = new Map();
      lista.forEach((item) => {
        const id = getId(item);
        const nombre = getNombre(item);
        if (id && nombre && !map.has(id)) map.set(id, { id, nombre });
      });
      return Array.from(map.values());
    };
    const porNaviera = d.naviera ? base.filter((item) => getEmbarqueNavieraId(item) === String(d.naviera)) : [];
    const porDestino = d.destino ? porNaviera.filter((item) => getEmbarqueDestinoId(item) === String(d.destino)) : [];
    const porBuque = d.buque ? porDestino.filter((item) => getEmbarqueBuqueId(item) === String(d.buque)) : [];
    return {
      navieras: unicos(base, getEmbarqueNavieraId, getEmbarqueNavieraNombre),
      destinos: unicos(porNaviera, getEmbarqueDestinoId, getEmbarqueDestinoNombre),
      buques: unicos(porDestino, getEmbarqueBuqueId, getEmbarqueBuqueNombre),
      bookings: porBuque.filter((item) => item?.booking).map((item) => ({ id: String(item.id), nombre: item.bl || item.booking })),
    };
  };

  // Cambiar un nivel limpia los que dependen de el (producto > naviera > destino > buque > booking).
  const cambiarCascada = (indice, campo, valor) => {
    const orden = ["producto", "naviera", "destino", "buque", "booking"];
    const limpiar = orden.slice(orden.indexOf(campo) + 1);
    setLineasDetalle((prev) => {
      const actual = { ...(prev[indice] || {}), [campo]: valor };
      limpiar.forEach((k) => { actual[k] = ""; });
      return { ...prev, [indice]: actual };
    });
  };

  useEffect(() => {
    let activo = true;
    listarProgramacionCorte()
      .then((rows) => { if (activo) setProgramacionCorte(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (activo) setProgramacionCorte([]); });
    return () => { activo = false; };
  }, []);

  // Filas de Programacion de Corte de la semana seleccionada.
  const programacionSemana = useMemo(() => {
    if (!semanaSeleccionada) return [];
    return programacionCorte.filter((row) => String(row?.Embarque?.id_semana || "") === String(semanaSeleccionada));
  }, [programacionCorte, semanaSeleccionada]);

  // Compara una linea con la Programacion de Corte de su finca y arma el sugerido mientras se llena.
  // La finca es el origen o el destino del tramo segun el tipo de movimiento ("Finca en"); si aun no hay
  // movimiento, se busca en las dos puntas del tramo. Devuelve null si no hay nada que comparar.
  //   ok: true  -> coincide con lo programado
  //   incompleta -> faltan datos: se muestra el sugerido (no es un error)
  //   mensajes  -> diferencias encontradas cuando la linea ya esta completa
  const revisarLineaContraProgramacion = (indice, d) => {
    if (programacionSemana.length === 0) return null;
    const paradasValidas = paradas.map((item) => String(item || "").trim()).filter(Boolean);
    const origen = paradasValidas[indice];
    const destino = paradasValidas.length === 1 ? paradasValidas[0] : paradasValidas[indice + 1];
    const tipo = d.movimiento
      ? listaTiposMovimiento.find((item) => String(item?.movimiento || "") === String(d.movimiento))
      : null;
    const fincaEn = String(tipo?.finca_en || "").toLowerCase();
    let posibles = [origen, destino];
    if (tipo) posibles = [fincaEn === "origen" ? origen : destino];

    const filasDe = (ubicacion) => programacionSemana.filter((row) => (
      (row?.almacen?.consecutivo && normalizarTexto(row.almacen.consecutivo) === normalizarTexto(ubicacion.cod))
      || (row?.almacen?.nombre && normalizarTexto(row.almacen.nombre) === normalizarTexto(ubicacion.ubicacion))
      || normalizarTexto(row?.finca) === normalizarTexto(ubicacion.ubicacion)
    ));
    let ubicacion = null;
    let filasFinca = [];
    for (const id of [...new Set(posibles.filter(Boolean))]) {
      const u = listaUbicaciones.find((item) => String(item?.id || "") === String(id));
      if (!u) continue;
      const filas = filasDe(u);
      if (!ubicacion) ubicacion = u;
      if (filas.length) { ubicacion = u; filasFinca = filas; break; }
    }
    if (!ubicacion) return null;
    const finca = ubicacion.ubicacion;
    if (filasFinca.length === 0) {
      // Sin movimiento todavia no se sabe cual punta es la finca: no se avisa nada.
      if (!tipo) return null;
      return { ok: false, incompleta: false, finca, filas: [], mensajes: [`${finca} no tiene Programacion de Corte en esta semana.`] };
    }

    // Sugeridos: se van acotando con lo que ya se lleno (fecha, producto, booking, cajas, movimiento).
    let sugeridos = filasFinca;
    const acotar = (cond) => {
      const quedan = sugeridos.filter(cond);
      if (quedan.length) sugeridos = quedan;
    };
    if (fecha) acotar((row) => String(row?.fecha || "").slice(0, 10) === fecha);
    if (d.producto) acotar((row) => String(row?.id_combo || "") === String(d.producto));
    if (d.booking) acotar((row) => String(row?.id_embarque || "") === String(d.booking));
    if (d.movimiento) acotar((row) => normalizarTexto(row?.proceso_empaque) === normalizarTexto(d.movimiento));
    if (d.cajas) acotar((row) => Number(row?.cajas || 0) === Number(d.cajas));

    const puerto = esMovimientoPuerto(d.movimiento);
    const incompleta = !d.movimiento || !d.producto || !d.cajas || (!puerto && !d.booking);
    if (incompleta) {
      return { ok: false, incompleta: true, finca, filas: sugeridos, mensajes: [] };
    }

    const fila = sugeridos.find((row) => (
      String(row?.id_combo || "") === String(d.producto)
      && (puerto || String(row?.id_embarque || "") === String(d.booking))
    ));
    const mensajes = [];
    if (!fila) {
      mensajes.push(`El producto y el Booking no coinciden con la Programacion de Corte de ${finca}.`);
    } else {
      if (Number(fila.cajas || 0) !== Number(d.cajas || 0)) {
        mensajes.push(`Cajas programadas: ${Number(fila.cajas || 0)} (la linea tiene ${Number(d.cajas || 0)}).`);
      }
      if (fila.proceso_empaque && normalizarTexto(fila.proceso_empaque) !== normalizarTexto(d.movimiento)) {
        mensajes.push(`Proceso programado: ${fila.proceso_empaque} (la linea tiene ${d.movimiento}).`);
      }
      if (fecha && String(fila.fecha || "").slice(0, 10) !== fecha) {
        mensajes.push(`Fecha programada: ${String(fila.fecha || "").slice(0, 10)}.`);
      }
    }
    return { ok: mensajes.length === 0, incompleta: false, finca, filas: sugeridos, mensajes };
  };

  // Llena la linea con una fila de la Programacion de Corte (producto, cajas, booking y movimiento).
  const usarFilaProgramacion = (indice, row) => {
    const emb = embarquesSemana.find((item) => String(item?.id || "") === String(row?.id_embarque || ""));
    const movimiento = listaTiposMovimiento.find((item) => normalizarTexto(item?.movimiento) === normalizarTexto(row?.proceso_empaque));
    setLineasDetalle((prev) => {
      const actual = { ...(prev[indice] || {}) };
      actual.producto = row?.id_combo ? String(row.id_combo) : actual.producto;
      actual.cajas = row?.cajas ?? actual.cajas;
      if (movimiento) actual.movimiento = movimiento.movimiento;
      if (emb && !esMovimientoPuerto(actual.movimiento)) {
        actual.naviera = getEmbarqueNavieraId(emb);
        actual.destino = getEmbarqueDestinoId(emb);
        actual.buque = getEmbarqueBuqueId(emb);
        actual.booking = String(emb.id);
      }
      return { ...prev, [indice]: actual };
    });
  };

  const handleSubmit = async () => {
    try {
      if (!semanaSeleccionada) {
        throw new Error("Debes seleccionar una semana valida.");
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
      // Cada linea lleva su propio producto (por defecto el general) y su cantidad de cajas.
      const productoPayloadDe = (indiceLinea) => {
        const detalle = lineasDetalle[indiceLinea] || {};
        const productoId = detalle.producto || "";
        if (!productoId) return null;
        const cajas = Number(detalle.cajas) || 0;
        return {
          producto_id: productoId,
          unidad_de_medida: cajas > 0 ? "Cajas" : "",
          cantidad: cajas,
          activo: true,
        };
      };
      // Datos de cada linea: lo que se haya puesto en la linea o, si esta vacio, lo general del formulario.
      const datosLinea = (indiceLinea) => {
        const d = lineasDetalle[indiceLinea] || {};
        const embarqueLinea = d.booking && !esMovimientoPuerto(d.movimiento)
          ? embarquesSemana.find((item) => String(item?.id || "") === String(d.booking))
          : null;
        const productoLinea = listaCombos.find((item) => String(item?.id || "") === String(d.producto || ""));
        // Vehiculo y conductor son los mismos para todas las lineas del recorrido.
        const vehiculoLinea = vehiculoSeleccionado;
        const conductorLinea = conductorActual.id;
        const movimientoLinea = d.movimiento || "";
        if (!movimientoLinea) {
          throw new Error(`Debes seleccionar el movimiento en la linea ${indiceLinea + 1}.`);
        }
        const movLinea = listaTiposMovimiento.find((item) => String(item?.movimiento || "") === String(movimientoLinea));
        const contenedorLinea = String(d.contenedor || "").trim().toUpperCase();
        const contenedorFinalLinea = movLinea?.requiere_contenedor
          ? (d.demo ? 'DEMO0000000' : contenedorLinea || null)
          : null;
        if (movLinea?.requiere_contenedor && !contenedorFinalLinea) {
          throw new Error(`La linea ${indiceLinea + 1} tiene un movimiento que requiere contenedor.`);
        }
        if (movLinea?.requiere_contenedor && !embarqueLinea && !esMovimientoPuerto(movimientoLinea)) {
          throw new Error(`En la linea ${indiceLinea + 1} debes completar naviera, destino, buque y Booking.`);
        }
        return {
          movimiento: movimientoLinea,
          conductor_id: conductorLinea,
          vehiculo_id: vehiculoLinea,
          contenedor: contenedorFinalLinea,
          bl: embarqueLinea ? (embarqueLinea.bl || null) : null,
          id_pagador_flete: productoLinea?.id_cliente || null,
        };
      };
      // Se valida todo antes de crear la primera linea.
      const totalLineas = paradasValidas.length === 1 ? 1 : paradasValidas.length - 1;
      const lineasResueltas = Array.from({ length: totalLineas }, (_, i) => (
        lineasDetalle[i]?.eliminada ? null : datosLinea(i)
      ));
      if (lineasResueltas.every((item) => item === null)) {
        throw new Error("Eliminaste todas las lineas: no hay nada que programar.");
      }

      const lineasDistintas = lineasResueltas
        .map((item, i) => ({ i, rev: item ? revisarLineaContraProgramacion(i, lineasDetalle[i] || {}) : null }))
        .filter(({ rev }) => rev && !rev.ok && !rev.incompleta);
      if (lineasDistintas.length > 0 && !window.confirm(
        `Hay ${lineasDistintas.length} linea(s) distintas a la Programacion de Corte:\n\n`
        + lineasDistintas.map(({ i, rev }) => `Linea ${i + 1}: ${rev.mensajes.join(" ")}`).join("\n")
        + "\n\n¿Guardar de todas formas?"
      )) {
        setGuardando(false);
        return;
      }

      const getProgramacionId = (programacion) => (
        programacion?.id
        || programacion?.data?.id
        || programacion?.programacion?.id
        || programacion?.data?.programacion?.id
        || ""
      );

      if (paradasValidas.length === 1) {
        const ubicacionId = paradasValidas[0];
        const rutaId = await ensureRoute(ubicacionId, ubicacionId, lineasResueltas[0].vehiculo_id);
        const programacionCreada = await agregarProgramaciones({
          ruta_id: rutaId,
          cobrar: false,
          activo: true,
          ...lineasResueltas[0],
          semana: semanaTexto,
          fecha,
          detalles: "Ubicacion unica",
        });
        const programacionCreadaId = getProgramacionId(programacionCreada);
        const productoPayload = productoPayloadDe(0);
        if (productoPayload && programacionCreadaId) {
          await agregarProductosViaje({
            ...productoPayload,
            programacion_id: programacionCreadaId,
          });
        }
      } else {
        for (let index = 0; index < paradasValidas.length - 1; index += 1) {
          if (!lineasResueltas[index]) continue; // linea eliminada
          const origenId = paradasValidas[index];
          const destinoId = paradasValidas[index + 1];
          const rutaId = await ensureRoute(origenId, destinoId, lineasResueltas[index].vehiculo_id);

          const programacionCreada = await agregarProgramaciones({
            ruta_id: rutaId,
            cobrar: false,
              activo: true,
            ...lineasResueltas[index],
            semana: semanaTexto,
            fecha,
            detalles: `Tramo ${index + 1} de ${paradasValidas.length - 1}`,
          });
          const programacionCreadaId = getProgramacionId(programacionCreada);
          const productoPayload = productoPayloadDe(index);
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
        <div style={{ width: "max(80vw, 1250px)", minWidth: "80vw", maxWidth: "98vw" }} className={styles.floatingform}>
          <div style={{ minWidth: "100%" }} className="card shadow-sm">
            <span style={{ minWidth: "100%" }} className={styles.ventana}>
              {/* Encabezado */}
              <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 px-3">
                <div>
                  <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                    Nuevo movimiento
                    <OverlayTrigger
                      trigger="click"
                      rootClose
                      placement="bottom-start"
                      overlay={(
                        <Popover id="ayuda-nuevo-movimiento" style={{ maxWidth: "34rem" }}>
                          <Popover.Header as="div" className="fw-semibold small">¿Como funciona?</Popover.Header>
                          <Popover.Body className="small">
                            <ol className="ps-3 mb-2">
                              <li className="mb-1"><b>Datos generales:</b> semana, fecha, vehiculo y conductor. Son los mismos para todas las lineas del recorrido.</li>
                              <li className="mb-1"><b>Recorrido:</b> agrega las ubicaciones en el orden en que el vehiculo las visita. Cada par de ubicaciones seguidas genera una linea (tramo); con una sola ubicacion se genera una linea.</li>
                              <li className="mb-1"><b>Detalle de cada linea:</b> producto, cajas, naviera, destino, buque, Booking, movimiento y contenedor. El movimiento es obligatorio; el contenedor solo se pide si el movimiento lo requiere (o marca <i>DEMO</i> si aun esta pendiente). Si el movimiento es <i>Puerto</i>, no se piden naviera, destino, buque ni Booking.</li>
                            </ol>
                            <div className="mb-1"><b>Programacion de Corte:</b> si la semana tiene programacion, cada linea se compara con lo programado para su finca (origen o destino segun el campo <i>Finca en</i> del movimiento):</div>
                            <ul className="ps-3 mb-2 list-unstyled">
                              <li><FaLightbulb className="text-primary me-1" />Hay un sugerido: las opciones programadas salen primero con ★, y puedes llenar la linea con un clic.</li>
                              <li><FaCheckCircle className="text-success me-1" />La linea coincide con lo programado.</li>
                              <li><FaExclamationTriangle className="text-warning me-1" />La linea es distinta a lo programado; al guardar se pide confirmacion.</li>
                              <li><FaMinus className="text-muted me-1" />No hay programacion para comparar.</li>
                            </ul>
                            <div><FaRegTrashAlt className="text-danger me-1" />Elimina una linea para que no se genere; puedes restaurarla con <FaUndoAlt className="mx-1" />.</div>
                          </Popover.Body>
                        </Popover>
                      )}
                    >
                      <Button type="button" variant="link" className="p-0 border-0 text-primary lh-1" aria-label="Como funciona" title="Como funciona">
                        <FaInfoCircle size={15} />
                      </Button>
                    </OverlayTrigger>
                  </h6>
                  <div className="small text-muted">Datos generales del viaje, recorrido y el detalle de cada linea.</div>
                                  </div>
                <div className="d-flex align-items-center gap-2">
                  <Button type="button" variant="outline-primary" size="sm" onClick={onOpenMassCreate} disabled={massActionLoading || !onOpenMassCreate}>
                    Cargue masivo
                  </Button>
                  <Button type="button" variant="outline-secondary" size="sm" onClick={onOpenMassUpdate} disabled={massActionLoading || !onOpenMassUpdate}>
                    Actualizacion masiva
                  </Button>
                  <button type="button" onClick={() => setOpen(false)} className="btn-close ms-2" aria-label="Close"></button>
                </div>
              </div>

              <div className="card-body p-3 d-flex flex-column gap-3">
                {/* 1. Datos generales */}
                <section className="border rounded p-3">
                  <div className="small fw-semibold text-uppercase text-muted mb-2">1. Datos generales</div>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex justify-content-between align-items-end mb-1" style={{ minHeight: "1.9rem" }}>
                        <label htmlFor="semana-programador" className="form-label mb-0">Semana</label>
                      </div>
                      <select
                        id="semana-programador"
                        className="form-select form-select-sm"
                        value={semanaSeleccionada}
                        onChange={handleSemanaChange}
                      >
                        <option value="">Seleccione una semana</option>
                        {listaSemanas.map((item) => (
                          <option key={item?.id || item?.consecutivo} value={String(item?.id || "")}>
                            {item?.consecutivo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex justify-content-between align-items-end mb-1" style={{ minHeight: "1.9rem" }}>
                        <label htmlFor="fecha-programador" className="form-label mb-0">Fecha</label>
                      </div>
                      <input
                        id="fecha-programador"
                        type="date"
                        className="form-control form-control-sm"
                        value={fecha}
                        onChange={(event) => setFecha(event.target.value)}
                      />
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex justify-content-between align-items-end mb-1" style={{ minHeight: "1.9rem" }}>
                        <label htmlFor="vehiculo-programador" className="form-label mb-0">Vehiculo</label>
                        {canQuickCreateProgramador && (
                          <Button type="button" variant="outline-primary" size="sm" className="py-0" onClick={handleQuickCreateVehiculo} title="Crear vehiculo">
                            +
                          </Button>
                        )}
                      </div>
                      <select
                        id="vehiculo-programador"
                        className="form-select form-select-sm"
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
                      {vehiculoPuedeOmitirCombustible && (
                        <div className="small text-info mt-1">Sin seguimiento de combustible.</div>
                      )}
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex justify-content-between align-items-end mb-1" style={{ minHeight: "1.9rem" }}>
                        <label htmlFor="conductor-programador" className="form-label mb-0">Conductor</label>
                        {canQuickCreateProgramador && (
                          <Button type="button" variant="outline-primary" size="sm" className="py-0" onClick={handleQuickCreateConductor} title="Crear conductor">
                            +
                          </Button>
                        )}
                      </div>
                      <select
                        id="conductor-programador"
                        className="form-select form-select-sm"
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
                      {conductorSugerido?.conductor && (
                        <div className="small text-muted mt-1">Sugerido por el vehiculo: {conductorSugerido.conductor}</div>
                      )}
                    </div>
                  </div>

                  {semanaSeleccionada && !loadingEmbarques && !embarquesError && listaEmbarques.length === 0 && (
                    <div className="alert alert-light border py-2 mt-3 mb-0 small">
                      No hay embarques disponibles para la semana seleccionada.
                    </div>
                  )}
                  {embarquesError && (
                    <div className="alert alert-warning py-2 mt-3 mb-0 small">
                      {embarquesError}
                    </div>
                  )}
                </section>

                {/* 2. Recorrido */}
                <section className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="small fw-semibold text-uppercase text-muted">2. Recorrido</div>
                    <span className="badge bg-light text-dark border">{paradas.length} parada(s)</span>
                  </div>
                  {vehiculoPuedeOmitirCombustible && (
                    <p className="text-muted small mb-2">
                      Puedes programar con una sola ubicacion o agregar mas si el vehiculo hace otras paradas.
                    </p>
                  )}
                  <div className="input-group input-group-sm">
                    <select
                      id="ubicacion-pendiente-programador"
                      className="form-select form-select-sm"
                      value={ubicacionPendiente}
                      onChange={(event) => setUbicacionPendiente(event.target.value)}
                    >
                      <option value="">Seleccione una ubicacion</option>
                      {listaUbicaciones.map((item) => (
                        <option key={item?.id} value={item?.id}>{item?.ubicacion}</option>
                      ))}
                    </select>
                    {canQuickCreateProgramador && (
                      <Button type="button" variant="outline-primary" onClick={handleQuickCreateUbicacion} title="Crear ubicacion">
                        +
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      style={{ minWidth: "8rem" }}
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

                  <div className="border rounded mt-2 px-2 py-2 d-flex flex-wrap gap-2 align-items-center bg-light" style={{ minHeight: "2.75rem" }}>
                    {paradas.length === 0 && (
                      <span className="text-muted small">Aun no has agregado ubicaciones.</span>
                    )}
                    {paradas.map((paradaId, index) => {
                      const ubicacion = listaUbicaciones.find(
                        (item) => String(item?.id || "") === String(paradaId)
                      );
                      return (
                        <React.Fragment key={`parada-${index}-${paradaId}`}>
                          {index > 0 && <span className="text-muted">→</span>}
                          <span
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
                        </React.Fragment>
                      );
                    })}
                  </div>
                </section>

                {/* 3. Lineas */}
                <section className="border rounded px-2 py-2 lineas-compactas">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="small fw-semibold text-uppercase text-muted">3. Detalle de cada linea</div>
                    {canQuickCreateProgramador && (
                      <Button type="button" variant="outline-primary" size="sm" onClick={handleQuickCreateTipoMovimiento}>
                        + Tipo de movimiento
                      </Button>
                    )}
                  </div>
                  {paradas.length === 0 ? (
                    <div className="text-muted small">Agrega ubicaciones al recorrido para ver las lineas que se van a generar.</div>
                  ) : (() => {
                    const nombreUbicacion = (id) => listaUbicaciones.find((u) => String(u?.id || "") === String(id))?.ubicacion || "Ubicacion";
                    const tramos = paradas.length === 1
                      ? [{ indice: 0, texto: nombreUbicacion(paradas[0]) }]
                      : paradas.slice(0, -1).map((id, i) => ({ indice: i, texto: `${nombreUbicacion(id)} → ${nombreUbicacion(paradas[i + 1])}` }));
                    const setDetalle = (indice, campo, valor) => setLineasDetalle((prev) => ({
                      ...prev,
                      [indice]: { ...(prev[indice] || {}), [campo]: valor },
                    }));
                    return (
                      <div className="lineas-scroll">
                        <div className="lineas-grid lineas-cab text-muted">
                          <div className="text-center">#</div>
                          <div className="text-center" title="Comparacion con la Programacion de Corte">Prog.</div>
                          <div>Linea</div>
                          <div>Producto</div>
                          <div>Cajas</div>
                          <div>Naviera</div>
                          <div>Destino</div>
                          <div>Buque</div>
                          <div>Booking</div>
                          <div>Movimiento</div>
                          <div>Contenedor</div>
                          <div></div>
                        </div>
                            {tramos.filter(({ indice }) => !lineasDetalle[indice]?.eliminada).map(({ indice, texto }) => {
                              const d = lineasDetalle[indice] || {};
                              const op = opcionesEmbarqueLinea(d);
                              const puerto = esMovimientoPuerto(d.movimiento);
                              const requiere = Boolean(listaTiposMovimiento.find((item) => String(item?.movimiento || "") === String(d.movimiento || ""))?.requiere_contenedor);
                              const rev = revisarLineaContraProgramacion(indice, d);
                              // Sugeridos de la Programacion de Corte, para marcarlos dentro de cada input.
                              const filasSug = rev && !rev.ok ? rev.filas : [];
                              const embSug = filasSug
                                .map((row) => embarquesSemana.find((item) => String(item?.id || "") === String(row?.id_embarque || "")))
                                .filter(Boolean);
                              const sug = {
                                producto: new Set(filasSug.map((row) => String(row?.id_combo || ""))),
                                naviera: new Set(embSug.map(getEmbarqueNavieraId)),
                                destino: new Set(embSug.map(getEmbarqueDestinoId)),
                                buque: new Set(embSug.map(getEmbarqueBuqueId)),
                                booking: new Set(embSug.map((item) => String(item.id))),
                                movimiento: new Set(filasSug.map((row) => normalizarTexto(row?.proceso_empaque))),
                              };
                              const cajasSug = [...new Set(filasSug.map((row) => Number(row?.cajas || 0)).filter(Boolean))];
                              // Opciones con los sugeridos primero y marcados con ★
                              const ordenar = (opciones, esSug) => [...opciones].sort((a, b) => Number(esSug(b)) - Number(esSug(a)));
                              const claseSug = (vacio, haySug) => `form-select form-select-sm${vacio && haySug ? " border-primary" : ""}`;
                              const campo = (nombre, opciones, deshabilitado) => (
                                <div>
                                  <select
                                    className={claseSug(!d[nombre], sug[nombre].size > 0)}
                                    value={d[nombre] ?? ""}
                                    disabled={deshabilitado}
                                    onChange={(event) => cambiarCascada(indice, nombre, event.target.value)}
                                  >
                                    <option value="">{loadingEmbarques ? "Cargando..." : ""}</option>
                                    {ordenar(opciones, (o) => sug[nombre].has(String(o.id))).map((o) => (
                                      <option key={o.id} value={o.id}>{sug[nombre].has(String(o.id)) ? `★ ${o.nombre}` : o.nombre}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                              return (
                                <React.Fragment key={`linea-${indice}`}>
                                <div className={`lineas-grid lineas-fila${rev && !rev.ok && !rev.incompleta ? " lineas-alerta" : ""}`}>
                                  <div className="text-center fw-semibold">{indice + 1}</div>
                                  <div className="text-center" title={!rev ? "Sin Programacion de Corte para comparar" : rev.ok ? "Coincide con la Programacion de Corte" : rev.incompleta ? "Hay un sugerido de la Programacion de Corte" : rev.mensajes.join(" ")}>
                                    {!rev ? <FaMinus className="text-muted" size={10} />
                                      : rev.ok ? <FaCheckCircle className="text-success" size={14} />
                                        : rev.incompleta ? <FaLightbulb className="text-primary" size={14} />
                                          : <FaExclamationTriangle className="text-warning" size={14} />}
                                  </div>
                                  <div className="small text-truncate" title={texto}>{texto}</div>
                                  <div>
                                    <select
                                      className={claseSug(!d.producto, sug.producto.size > 0)}
                                      value={d.producto ?? ""}
                                      onChange={(event) => cambiarCascada(indice, "producto", event.target.value)}
                                    >
                                      <option value=""></option>
                                      {ordenar(combosActivos, (item) => sug.producto.has(String(item?.id))).map((item) => (
                                        <option key={item?.id} value={item?.id}>{sug.producto.has(String(item?.id)) ? `★ ${item?.nombre}` : item?.nombre}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      className={`form-control form-control-sm text-end${!d.cajas && cajasSug.length ? " border-primary" : ""}`}
                                      placeholder={cajasSug.length ? `★ ${cajasSug.join(" / ")}` : ""}
                                      title={cajasSug.length ? `Cajas programadas: ${cajasSug.join(" / ")}` : undefined}
                                      value={d.cajas ?? ""}
                                      onChange={(event) => setDetalle(indice, "cajas", event.target.value)}
                                    />
                                  </div>
                                  {campo("naviera", op.navieras, puerto || !semanaSeleccionada || loadingEmbarques)}
                                  {campo("destino", op.destinos, puerto || !d.naviera)}
                                  {campo("buque", op.buques, puerto || !d.destino)}
                                  {campo("booking", op.bookings, puerto || !d.buque)}
                                  <div>
                                    <select
                                      className={claseSug(!d.movimiento, sug.movimiento.size > 0)}
                                      value={d.movimiento ?? ""}
                                      onChange={(event) => setLineasDetalle((prev) => ({
                                        ...prev,
                                        [indice]: {
                                          ...(prev[indice] || {}),
                                          movimiento: event.target.value,
                                          contenedor: "",
                                          demo: false,
                                          ...(esMovimientoPuerto(event.target.value) ? { naviera: "", destino: "", buque: "", booking: "" } : {}),
                                        },
                                      }))}
                                    >
                                      <option value=""></option>
                                      {ordenar(listaTiposMovimiento, (item) => sug.movimiento.has(normalizarTexto(item?.movimiento))).map((item) => (
                                        <option key={item?.id || item?.movimiento} value={item?.movimiento}>
                                          {sug.movimiento.has(normalizarTexto(item?.movimiento)) ? `★ ${item?.movimiento}` : item?.movimiento}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    {/* La casilla DEMO va dentro del mismo grupo para no cambiar la altura de la fila. */}
                                    <div className="input-group input-group-sm flex-nowrap">
                                      <input
                                        type="text"
                                        maxLength={11}
                                        className="form-control form-control-sm text-uppercase"
                                        placeholder={requiere ? "Contenedor" : "No requerido"}
                                        disabled={!requiere || d.demo}
                                        value={d.demo ? "DEMO0000000" : (d.contenedor ?? "")}
                                        onChange={(event) => setDetalle(indice, "contenedor", event.target.value.toUpperCase())}
                                      />
                                      {requiere && (
                                        <label className="input-group-text gap-1 px-1 mb-0" title="Pendiente: registra DEMO0000000" style={{ fontSize: "0.7rem", cursor: "pointer" }}>
                                          <input
                                            className="form-check-input mt-0"
                                            type="checkbox"
                                            checked={Boolean(d.demo)}
                                            onChange={(event) => setDetalle(indice, "demo", event.target.checked)}
                                          />
                                          DEMO
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="link"
                                      className="p-0 border-0 text-danger"
                                      aria-label="Eliminar linea"
                                      title="Eliminar esta linea (no se va a generar)"
                                      onClick={() => {
                                        if (paradas.length === 1) {
                                          eliminarParada(0);
                                          return;
                                        }
                                        setDetalle(indice, "eliminada", true);
                                      }}
                                    >
                                      <FaRegTrashAlt size={13} />
                                    </Button>
                                  </div>
                                </div>
                                {rev && !rev.ok && (rev.mensajes.length > 0 || rev.filas.length > 0) && (
                                  <div className={`lineas-nota ${rev.incompleta ? "lineas-nota-sug" : "lineas-nota-alerta"}`}>
                                    <div className="small">
                                      {rev.mensajes.length > 0 && (
                                        <div className="fw-semibold text-danger d-flex align-items-center gap-1"><FaExclamationTriangle size={12} /> {rev.mensajes.join(" ")}</div>
                                      )}
                                      {rev.filas.length > 0 && (
                                        <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
                                          <span className="text-muted">{rev.incompleta ? `Sugerido (${rev.finca}):` : `Programado para ${rev.finca}:`}</span>
                                          {rev.filas.map((row) => (
                                            <Button
                                              key={`prog-${indice}-${row.id}`}
                                              type="button"
                                              size="sm"
                                              variant="link"
                                              className="py-0 px-1 border-0 text-decoration-none d-inline-flex align-items-center gap-1"
                                              title="Usar estos datos en la linea"
                                              onClick={() => usarFilaProgramacion(indice, row)}
                                            >
                                              <FaArrowRight size={10} />
                                              {[String(row.fecha || "").slice(0, 10), row.booking, row.combo?.nombre, `${Number(row.cajas || 0)} cajas`, row.proceso_empaque].filter(Boolean).join(" · ")}
                                            </Button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                </React.Fragment>
                              );
                            })}
                        {(() => {
                          const eliminadas = tramos.filter(({ indice }) => lineasDetalle[indice]?.eliminada);
                          if (eliminadas.length === 0) return null;
                          return (
                            <div className="small text-muted mt-2 d-flex flex-wrap align-items-center gap-2">
                              <span>Lineas eliminadas (no se van a generar):</span>
                              {eliminadas.map(({ indice, texto }) => (
                                <Button
                                  key={`restaurar-${indice}`}
                                  type="button"
                                  size="sm"
                                  variant="link"
                                  className="py-0 px-1 border-0 text-decoration-none text-secondary d-inline-flex align-items-center gap-1"
                                  title="Restaurar la linea"
                                  onClick={() => setDetalle(indice, "eliminada", false)}
                                >
                                  <FaUndoAlt size={10} /> {indice + 1}. {texto}
                                </Button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </section>
              </div>

              <style>{`
                .lineas-scroll { overflow-x: auto; }
                .lineas-grid {
                  display: grid;
                  grid-template-columns: 1.6rem 1.8rem minmax(8rem, 1.3fr) minmax(8rem, 1.3fr) 4.5rem repeat(3, minmax(6.5rem, 1fr)) minmax(7rem, 1.1fr) minmax(7rem, 1fr) minmax(7.5rem, 1.1fr) 1.6rem;
                  gap: 4px;
                  align-items: center;
                  min-width: 1050px;
                }
                .lineas-cab { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; padding: 0 2px 2px; border-bottom: 1px solid var(--bs-border-color); }
                .lineas-fila { padding: 3px 2px; border-bottom: 1px solid var(--bs-border-color-translucent); font-size: 0.78rem; }
                .lineas-fila:hover { background: var(--bs-tertiary-bg); }
                .lineas-alerta { background: var(--bs-warning-bg-subtle); }
                .lineas-nota { min-width: 1050px; padding: 2px 6px 4px 3.6rem; border-bottom: 1px solid var(--bs-border-color-translucent); }
                .lineas-nota-sug { background: var(--bs-info-bg-subtle); }
                .lineas-nota-alerta { background: var(--bs-warning-bg-subtle); }
              `}</style>
              {/* Pie */}
              <div className="card-footer bg-white d-flex justify-content-end gap-2 py-2 px-3">
                <Button type="button" variant="outline-secondary" size="sm" onClick={() => setOpen(false)} disabled={guardando}>
                  Cancelar
                </Button>
                <Button type="button" variant="success" size="sm" style={{ minWidth: "8rem" }} onClick={handleSubmit} disabled={guardando || massActionLoading}>
                  {guardando ? "Guardando..." : "Programar"}
                </Button>
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
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">Conductor</Form.Label>
                    <Button
                      type="button"
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setQuickCreateState((prev) => ({
                        ...prev,
                        type: "conductor",
                        title: "Nuevo conductor",
                        form: { conductor: "" },
                        targetField: "conductor_vehiculo",
                      }))}
                    >
                      +
                    </Button>
                  </div>
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
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Transportadora</Form.Label>
                  <Form.Select
                    value={quickCreateState.form?.transportadoraId || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, transportadoraId: event.target.value },
                    }))}
                  >
                    <option value=""></option>
                    {(listaTransportadoras || []).map((item) => (
                      <option key={item?.id} value={item?.id}>{item?.razon_social || item?.consecutivo}</option>
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
              <div className="col-12">
                <Form.Check
                  id="vehiculo-programador-sin-combustible"
                  type="checkbox"
                  label="Programador sin combustible"
                  checked={Boolean(quickCreateState.form?.programador_sin_combustible)}
                  onChange={(event) => setQuickCreateState((prev) => ({
                    ...prev,
                    form: { ...prev.form, programador_sin_combustible: event.target.checked },
                  }))}
                />
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
                  <Form.Label>Identificación</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.identificacion || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, identificacion: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
               <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Transportadora</Form.Label>
                  <Form.Select
                    value={quickCreateState.form?.transportadoraId || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, transportadoraId: event.target.value },
                    }))}
                  >
                    <option value=""></option>
                    {(listaTransportadoras || []).map((item) => (
                      <option key={item?.id} value={item?.id}>{item?.razon_social || item?.consecutivo}</option>
                    ))}
                  </Form.Select>
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
