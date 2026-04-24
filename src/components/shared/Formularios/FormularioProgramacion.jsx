import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import mas from "@public/images/mas.png";
import menos from "@public/images/menos.png";
import hecho from "@public/images/hecho.png";
import guardar from "@public/images/guardar.png";


import styles from "@components/shared/Formularios/Formularios.module.css";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { agregarUbicacion, listarUbicaciones } from "@services/api/ubicaciones";
import { agregarConductor, listarConductores } from "@services/api/conductores";
import { agregarVehiculo, listarVehiculo } from "@services/api/vehiculos";
import { listarProductos } from "@services/api/productos";
import { listarClientes } from "@services/api/clientes";
import { agregarProgramaciones } from "@services/api/programaciones";
import { agregarRutas, buscarRutaPost } from "@services/api/rutas";
import { agregarProductosViaje } from "@services/api/productos_viaje";
import { agregarConsumoRutaVehiculo } from "@services/api/consumoRutaVehiculo";
import { listarSemanas } from "@services/api/semanas";
import { listarEmbarques } from "@services/api/embarques";
import { listarcategoriaVehiculos } from "@services/api/CategoriaVehiculos";
import { listarTransportadoras } from "@services/api/transportadoras";
import { listarNavieras } from "@services/api/navieras";
import { listarDestinos } from "@services/api/destinos";
import { listarBuques } from "@services/api/buques";
import { agregartipoMovimientoVehiculo, listartipoMovimientoVehiculos } from "@services/api/tipoMovimientoVehiculos";



function Interior({ rutaBool, change, setChange,
  setRutaBool, index, body, element, setAlert, onQuickCreateUbicacion, onQuickCreateTipoMovimiento, listaTiposMovimiento }) {
  const formRef = useRef();
  const [numero, setNumero] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedContenedor, setIsCheckedContenedor] = useState(false);
  const [listaUbicaciones, setListaUbicaciones] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [guardado, setGuardado] = useState(false);
 


  useEffect(() => {
    listar();
  }, [isCheckedContenedor]);

  const listar = async () => {
    let ubicaciones = await listarUbicaciones();
    let productos = await listarProductos();
    let clientes = await listarClientes();
    setListaUbicaciones(ubicaciones);
    setListaProductos(productos);
    setListaClientes(clientes);
  };

  const handleAgregar = () => {
    let nuevoNumero = numero + 1;
    setNumero(nuevoNumero);
  };

  const handleEliminar = () => {
    if (!(numero < 1)) {
      let nuevoNumero = numero - 1;
      setNumero(nuevoNumero);
    }
  };

  const handleCheckBoxChange = () => {
    let newIsChecked = !isChecked;
    setIsChecked(newIsChecked);
  };

  const syncContainerRequirement = useCallback((movimientoValue) => {
    const tipoMovimiento = (listaTiposMovimiento || []).find(
      (item) => String(item?.movimiento || "") === String(movimientoValue || "")
    );
    setIsCheckedContenedor(Boolean(tipoMovimiento?.requiere_contenedor));
  }, [listaTiposMovimiento]);

  useEffect(() => {
    syncContainerRequirement(body?.movimiento);
  }, [body?.movimiento, syncContainerRequirement]);

  const handleSubmit = async () => {
    const formData = new FormData(formRef.current);
    if (!body?.fecha || !body?.semana || !body?.vehiculo || !body?.conductor) {
      return alert("Fecha, semana, placa y conductor son datos obligatorios.");
    }
    if (body.semana == 0) return alert("La casilla semama no puede ser 0");
    if (formData.get("origen") == formData.get("destino")) return alert("El origen y el destino no puede ser el mismo.");
    const buscarRuta = { ubicacion1: formData.get("origen"), ubicacion2: formData.get("destino") };
    var existeRuta;
    try {
      existeRuta = await buscarRutaPost(buscarRuta);
    } catch (e) {
      const origenSeleccionado = listaUbicaciones.find((item) => String(item?.id) === String(buscarRuta.ubicacion1));
      const destinoSeleccionado = listaUbicaciones.find((item) => String(item?.id) === String(buscarRuta.ubicacion2));
      const confirmarCrearRuta = window.confirm(
        `No existe una ruta entre "${origenSeleccionado?.ubicacion || 'origen'}" y "${destinoSeleccionado?.ubicacion || 'destino'}". Desea crearla ahora y asignar el consumo del vehiculo?`
      );

      if (!confirmarCrearRuta) {
        return;
      }

      const consumoIngresado = window.prompt("Ingrese el consumo del vehículo para esta nueva ruta:");
      const consumoPorKm = Number(consumoIngresado);

      if (!consumoIngresado || Number.isNaN(consumoPorKm) || consumoPorKm <= 0) {
        return alert("Debe ingresar un consumo por km valido para crear la nueva ruta.");
      }

      existeRuta = await agregarRutas(buscarRuta);
      await agregarConsumoRutaVehiculo({
        vehiculo_id: body.vehiculo,
        ruta_id: existeRuta.data.id,
        consumo_por_km: consumoPorKm,
        activo: true,
      });
    }
    let contenedor = null;
    if (isCheckedContenedor) {
      contenedor = formData.get("contenedor") ? formData.get("contenedor") : "DUMY0000000";
    }

    let objetoProgramacion = {
      ruta_id: existeRuta.data.id,
      cobrar: isChecked,
      id_pagador_flete: formData.get("cliente"),
      activo: (element ? element.activo : true),
      movimiento: formData.get("movimiento"),
      conductor_id: body.conductor,
      vehiculo_id: body.vehiculo,
      contenedor: contenedor,
      bl: formData.get("bl") || body.bl || null,
      semana: body.semana,
      fecha: body.fecha,
      detalles: formData.get("detalles")
    };

    if (!body?.fecha || !body?.semana || !body?.vehiculo || !body?.conductor) {
      return alert("Fecha, semana, placa y conductor son datos obligatorios.");
    }

    let data;
    try {
      ({ data } = await agregarProgramaciones(objetoProgramacion));
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || "No fue posible guardar la programacion.",
        color: "danger",
        autoClose: true
      });
      return;
    }
    Array.from({ length: numero }).map((_, index) => {
      const objeto = {
        programacion_id: data.id,
        producto_id: formData.get(`producto-${index}`),
        unidad_de_medida: formData.get(`pieza-${index}`), // Corregido el símbolo de asignación
        cantidad: formData.get(`cantidad-${index}`),
        activo: true
      };
      agregarProductosViaje(objeto);
    });
    setGuardado(true);
    let newRutaBool = rutaBool;
    let objet = rutaBool[index - 1];
    objet[index] = true;
    newRutaBool[index - 1] = objet;
    setRutaBool(newRutaBool);
    setChange(!change);
    setAlert({
      active: true,
      mensaje: "La ruta ha sido programada con éxito",
      color: "success",
      autoClose: true
    });
  };


  return (

    <form ref={formRef} >
      {/*Inputs*/}
      <span className="col-md-12 row">


        <div className={`mb-2 col-md-${isCheckedContenedor ? 2 : 3}`}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label htmlFor="origen" className="form-label mb-0">Origen</label>
            {!guardado && (
              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                className="py-0 px-2"
                onClick={() => onQuickCreateUbicacion?.("origen", formRef, setAlert)}
              >
                +
              </Button>
            )}
          </div>
          <select
            id="origen"
            name="origen"
            className="form-control form-control-sm"
            required
            disabled={guardado}
          >
            <option value=""></option>
            {listaUbicaciones.map((item, index) => {
              return (
                <option key={index} value={item?.id}>{item?.ubicacion}</option>
              );
            })}
          </select>
        </div>

        <div className={`mb-2 col-md-${isCheckedContenedor ? 2 : 3}`}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label htmlFor="destino" className="form-label mb-0">Destino</label>
            {!guardado && (
              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                className="py-0 px-2"
                onClick={() => onQuickCreateUbicacion?.("destino", formRef, setAlert)}
              >
                +
              </Button>
            )}
          </div>
          <select
            id="destino"
            name="destino"
            className="form-control form-control-sm"
            required
            disabled={guardado}
          >
            <option value=""></option>
            {listaUbicaciones.map((item, index) => {
              return (
                <option key={index} value={item?.id}>{item?.ubicacion}</option>
              );
            })}
          </select>
        </div>

        <div className="mb-2 col-md-2">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label htmlFor="movimiento" className="form-label mb-0">Movimiento</label>
            {!guardado && (
              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                className="py-0 px-2"
                onClick={() => onQuickCreateTipoMovimiento?.(formRef)}
              >
                +
              </Button>
            )}
          </div>
          <select
            id="movimiento"
            name="movimiento"
            className="form-control form-control-sm"
            required
            onChange={(event) => syncContainerRequirement(event.target.value)}
            disabled={guardado}
          >
            <option value=""></option>
            {(listaTiposMovimiento || [])
              .filter((item) => item?.activo !== false)
              .map((item) => (
                <option key={item?.id || item?.movimiento} value={item?.movimiento}>{item?.movimiento}</option>
              ))}
          </select>
        </div>

        {isCheckedContenedor &&
          <div className={`mb-2 col-md-3`}>
            <label htmlFor="contenedor" className="form-label mb-1">Contenedor</label>
            <input
              type="text"
              id="contenedor"
              name="contenedor"
              className="form-control form-control-sm"
              maxLength={11}
              required={true}
              disabled={guardado}
            />
          </div>
        }

        <div className={`mb-2 col-md-${isCheckedContenedor ? 3 : 2}`}>
          <label htmlFor="bl" className="form-label mb-1">BL</label>
          <input
            type="text"
            id="bl"
            name="bl"
            className="form-control form-control-sm"
            value={body.bl || ""}
            readOnly
            disabled={guardado}
          />
        </div>


        <div className="mt-3 mb-2 col-md-3 d-flex justify-content-center align-items-center">
          <div className="container d-flex justify-content-center">
            <div className="d-flex row justify-content-around">
              {!guardado && <div className="col">
                <Form.Check
                  type="checkbox"
                  id="cobrar"
                  label="Cobrar"
                  checked={isChecked}
                  onChange={handleCheckBoxChange}
                />
              </div>}
              {!guardado && <div className="col" >
                <Image style={{ cursor: 'pointer' }} onClick={() => handleAgregar()} width="20" height="20" src={mas} alt="mas" />
              </div>}
              {!guardado && <div className="col" >
                <Image style={{ cursor: 'pointer' }} onClick={() => handleEliminar()} width="20" height="20" src={menos} alt="menos" />
              </div>}
              <div className="col" >
                {!guardado && <Image style={{ cursor: 'pointer' }} onClick={() => handleSubmit()} width="20" height="20" src={guardar} alt="guardar" />

                }
                {guardado && <Image style={{ cursor: 'pointer' }} width="20" height="20" src={hecho} alt="hecho" />
                }
              </div>
            </div>
          </div>

        </div>


        {isChecked &&
          <div className={`mb-2 col-md-6`}>
            <label htmlFor="cliente" className="form-label mb-1">Cliente</label>
            <select
              id="cliente"
              name="cliente"
              className="form-control form-control-sm"
              required
              disabled={guardado}
            >
              <option value=""></option>
              {listaClientes.map((item, index) => {
                return (
                  <option key={index} value={item?.id}>{item?.razon_social}</option>
                );
              })}
            </select>
          </div>
        }


        {isChecked &&
          <div className="mb-2 col-md-6">
            <label htmlFor="semana" className="form-label mb-1">Observaciones</label>
            <input
              type="text"
              id="detalles"
              name="detalles"
              className="form-control form-control-sm"
              required
              disabled={guardado}
            />
          </div>
        }

      </span>

      {/* Producto*/}
      {Array.from({ length: numero }).map((_, index) => (
        <span key={index} className="col-md-12 row mt-0">
          <div className="mb-2 col-md-6">
            <InputGroup size="sm" className="mb-2">
              <InputGroup.Text id="inputGroup-sizing-sm">Producto</InputGroup.Text>
              <Form.Select id={`producto-${index}`}
                disabled={guardado}
                name={`producto-${index}`} aria-label="Default select example">
                {listaProductos.map((item, index) => {
                  return (
                    <option key={index} value={item?.id}>{item?.name}</option>
                  );
                })}
              </Form.Select>
            </InputGroup>
          </div>
          <div className="mb-2 col-md-3">
            <InputGroup size="sm" className="mb-2">
              <InputGroup.Text id="inputGroup-sizing-sm">Pieza</InputGroup.Text>
              <Form.Select id={`pieza-${index}`}
                disabled={guardado}
                name={`pieza-${index}`} aria-label="Default select example">
                <option value="Cajas">Cajas</option>
                <option value="Palets">Palets</option>
                <option value="Unidades">Unidades</option>
              </Form.Select>
            </InputGroup>
          </div>
          <div className="mb-2 col-md-3">
            <InputGroup size="sm" className="mb-2">
              <InputGroup.Text id="inputGroup-sizing-sm">Cantidad</InputGroup.Text>
              <Form.Control
                disabled={guardado}
                id={`cantidad-${index}`} name={`cantidad-${index}`} type="number" min={0} />
            </InputGroup>
          </div>
        </span>
      ))}

    </form>

  );


};


export default function FormulariosProgramacion({ element, setOpen, setAlert }) {

  const formRef = useRef();
  const [date] = useState("");
  const [listaConductores, setListaConductores] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [listaCategoriasVehiculo, setListaCategoriasVehiculo] = useState([]);
  const [listaTransportadoras, setListaTransportadoras] = useState([]);
  const [listaNavieras, setListaNavieras] = useState([]);
  const [listaDestinos, setListaDestinos] = useState([]);
  const [listaBuques, setListaBuques] = useState([]);
  const [listaTiposMovimiento, setListaTiposMovimiento] = useState([]);
  const [listaSemanas, setListaSemanas] = useState([]);
  const [listaEmbarques, setListaEmbarques] = useState([]);
  const [ruta, setRuta] = useState([{ "1": false }]);
  const [change, setChange] = useState(false);
  const [body, setBody] = useState({});
  const [dataList, setDataList] = useState([]);
  const [onlyRead, setOnlyRead] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState("");
  const [semanaInput, setSemanaInput] = useState("");
  const [navieraSeleccionada, setNavieraSeleccionada] = useState("");
  const [destinoSeleccionado, setDestinoSeleccionado] = useState("");
  const [buqueSeleccionado, setBuqueSeleccionado] = useState("");
  const [bookingSeleccionado, setBookingSeleccionado] = useState("");
  const [quickCreateState, setQuickCreateState] = useState({
    show: false,
    type: "",
    title: "",
    form: {},
    targetField: "",
    routeFormRef: null,
  });

  const cargarCatalogos = useCallback(async () => {
    const [conductores, vehiculos, categoriasVehiculo, transportadoras, navieras, destinos, buques, tiposMovimiento, semanas, embarques] = await Promise.all([
      listarConductores(),
      listarVehiculo(),
      listarcategoriaVehiculos(),
      listarTransportadoras(),
      listarNavieras(),
      listarDestinos(),
      listarBuques(),
      listartipoMovimientoVehiculos(),
      listarSemanas(),
      listarEmbarques(),
    ]);

    setListaConductores(conductores || []);
    setListaVehiculos(vehiculos || []);
    setListaCategoriasVehiculo(categoriasVehiculo || []);
    setListaTransportadoras(transportadoras || []);
    setListaNavieras(navieras || []);
    setListaDestinos(destinos || []);
    setListaBuques(buques || []);
    setListaTiposMovimiento(tiposMovimiento || []);
    setListaSemanas(semanas || []);
    setListaEmbarques(embarques || []);
  }, []);

  useEffect(() => {
    cargarCatalogos();
    const res = ruta.find((item, key) => item[key + 1] == true);
    res ? setOnlyRead(true) : setOnlyRead(false);
  }, [change, body, ruta, cargarCatalogos]);

  const handleSubmit = async () => {
    const res = ruta.find((item, key) => item[key + 1] == false);
    if (res == null) {
      setOpen(false);
      setAlert({
        active: true,
        mensaje: "La ruta ha sido programada con éxito",
        color: "success",
        autoClose: true
      });
    } else {
      alert("Para salir se deben guardas todas las rutas programdas.");

    }
  };

  const handleCerrar = async () => {
      setOpen(false);
  };

  const embarquesSemana = useMemo(() => {
    if (!semanaSeleccionada) {
      return [];
    }

    const semanaActual = listaSemanas.find((item) => String(item?.id || '') === String(semanaSeleccionada));
    const consecutivoSemana = String(semanaActual?.consecutivo || '').trim();

    return listaEmbarques.filter((item) => (
      String(item?.id_semana || '') === String(semanaSeleccionada)
      || String(item?.semana?.id || '') === String(semanaSeleccionada)
      || String(item?.semana?.consecutivo || '').trim() === consecutivoSemana
    ));
  }, [listaEmbarques, listaSemanas, semanaSeleccionada]);

  const navierasDisponibles = useMemo(() => {
    const map = new Map();
    embarquesSemana.forEach((item) => {
      const id = String(item?.id_naviera || item?.Naviera?.id || item?.naviera?.id || '');
      const navieraMaestra = (listaNavieras || []).find(
        (naviera) => String(naviera?.id || naviera?.consecutivo || '') === id
      );
      const nombre =
        item?.Naviera?.navieras
        || item?.Naviera?.cod
        || item?.naviera?.navieras
        || item?.naviera?.cod
        || navieraMaestra?.navieras
        || navieraMaestra?.cod
        || '';
      if (id && nombre && !map.has(id)) {
        map.set(id, { id, nombre });
      }
    });
    return Array.from(map.values());
  }, [embarquesSemana, listaNavieras]);

  const embarquesNaviera = useMemo(() => {
    if (!navieraSeleccionada) {
      return [];
    }

    return embarquesSemana.filter((item) => String(item?.id_naviera || '') === String(navieraSeleccionada));
  }, [embarquesSemana, navieraSeleccionada]);

  const destinosDisponibles = useMemo(() => {
    const map = new Map();
    embarquesNaviera.forEach((item) => {
      const id = String(item?.id_destino || item?.Destino?.id || item?.destino?.id || '');
      const destinoMaestro = (listaDestinos || []).find(
        (destino) => String(destino?.id || destino?.consecutivo || '') === id
      );
      const nombre =
        item?.Destino?.destino
        || item?.Destino?.cod
        || item?.destino?.destino
        || item?.destino?.cod
        || destinoMaestro?.destino
        || destinoMaestro?.cod
        || '';
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

    return embarquesNaviera.filter((item) => String(item?.id_destino || '') === String(destinoSeleccionado));
  }, [embarquesNaviera, destinoSeleccionado]);

  const buquesDisponibles = useMemo(() => {
    const map = new Map();
    embarquesDestino.forEach((item) => {
      const id = String(item?.id_buque || item?.Buque?.id || item?.buque?.id || '');
      const buqueMaestro = (listaBuques || []).find(
        (buque) => String(buque?.id || buque?.consecutivo || '') === id
      );
      const nombre =
        item?.Buque?.buque
        || item?.buque?.buque
        || buqueMaestro?.buque
        || '';
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

    return embarquesDestino.filter((item) => String(item?.id_buque || '') === String(buqueSeleccionado));
  }, [embarquesDestino, buqueSeleccionado]);

  const bookingsDisponibles = useMemo(() => {
    return embarquesBuque
      .filter((item) => item?.booking)
      .map((item) => ({
        id: String(item.id),
        booking: item.booking,
        bl: item.bl || "",
      }));
  }, [embarquesBuque]);

  const handleSemanaChange = (event) => {
    const value = event.target.value;
    const semanaActual = listaSemanas.find(
      (item) => String(item?.consecutivo || '').trim().toUpperCase() === String(value || '').trim().toUpperCase()
    );

    setSemanaInput(value);
    setSemanaSeleccionada(semanaActual ? String(semanaActual?.id || '') : "");
    setNavieraSeleccionada("");
    setDestinoSeleccionado("");
    setBuqueSeleccionado("");
    setBookingSeleccionado("");
    guardarBody({
      semana: semanaActual?.consecutivo || "",
      id_semana: semanaActual?.id || "",
      bl: "",
    });
  };

  const handleNavieraChange = (event) => {
    const value = event.target.value;
    setNavieraSeleccionada(value);
    setDestinoSeleccionado("");
    setBuqueSeleccionado("");
    setBookingSeleccionado("");
    guardarBody({ bl: "" });
  };

  const handleDestinoChange = (event) => {
    const value = event.target.value;
    setDestinoSeleccionado(value);
    setBuqueSeleccionado("");
    setBookingSeleccionado("");
    guardarBody({ bl: "" });
  };

  const handleBuqueChange = (event) => {
    const value = event.target.value;
    setBuqueSeleccionado(value);
    setBookingSeleccionado("");
    guardarBody({ bl: "" });
  };

  const handleBookingChange = (event) => {
    const value = event.target.value;
    setBookingSeleccionado(value);
    const embarque = bookingsDisponibles.find((item) => item.id === value);
    guardarBody({
      booking: embarque?.booking || "",
      bl: embarque?.bl || "",
    });
  };

  const guardarBody = (overrides = {}) => {
    const formData = new FormData(formRef.current);
    const semanaActual = listaSemanas.find((item) => String(item?.id || '') === String(overrides.id_semana ?? semanaSeleccionada));
    const nextBody = {
      semana: overrides.semana ?? semanaActual?.consecutivo ?? "",
      vehiculo: formData.get("vehiculo"),
      fecha: formData.get("fecha"),
      conductor: formData.get("conductor"),
      id_semana: overrides.id_semana ?? semanaSeleccionada,
      id_naviera: navieraSeleccionada,
      id_destino: destinoSeleccionado,
      id_buque: buqueSeleccionado,
      id_embarque: overrides.id_embarque ?? bookingSeleccionado,
      booking: overrides.booking ?? bookingSeleccionado,
      bl: overrides.bl ?? "",
    };
    setBody(nextBody);
  };

  const closeQuickCreateModal = () => {
    setQuickCreateState({
      show: false,
      type: "",
      title: "",
      form: {},
      targetField: "",
      routeFormRef: null,
    });
  };

  const openQuickCreateModal = ({ type, title, form, targetField = "", routeFormRef = null }) => {
    setQuickCreateState({
      show: true,
      type,
      title,
      form,
      targetField,
      routeFormRef,
    });
  };

  const handleQuickCreateConductor = () => {
    openQuickCreateModal({
      type: "conductor",
      title: "Nuevo conductor",
      form: {
        conductor: "",
        cons_transportadora: "",
        tel: "",
        email: "",
      },
      targetField: "conductor",
    });
  };

  const handleQuickCreateVehiculo = () => {
    openQuickCreateModal({
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

  const handleQuickCreateUbicacion = (field, routeFormRef) => {
    openQuickCreateModal({
      type: "ubicacion",
      title: field === "origen" ? "Nuevo origen" : "Nuevo destino",
      form: {
        cod: "",
        ubicacion: "",
        detalle: "",
        activo: true,
      },
      targetField: field,
      routeFormRef,
    });
  };

  const handleQuickCreateTipoMovimiento = (routeFormRef) => {
    openQuickCreateModal({
      type: "tipoMovimientoVehiculo",
      title: "Nuevo tipo de movimiento",
      form: {
        movimiento: "",
        requiere_contenedor: false,
        activo: true,
      },
      targetField: "movimiento",
      routeFormRef,
    });
  };

  const handleQuickCreateSubmit = async () => {
    try {
      let createdId = "";

      if (quickCreateState.type === "conductor") {
        const conductorValue = String(quickCreateState.form?.conductor || "").trim();
        if (!conductorValue) {
          return;
        }

        const created = await agregarConductor({
          conductor: conductorValue,
          cons_transportadora: quickCreateState.form?.cons_transportadora || null,
          tel: String(quickCreateState.form?.tel || "").trim(),
          email: String(quickCreateState.form?.email || "").trim(),
          isBlock: false,
        });

        await cargarCatalogos();
        createdId = String(created?.id || "");

        if (!createdId) {
          const refreshedConductores = await listarConductores();
          const matched = (refreshedConductores || []).find(
            (item) => String(item?.conductor || "").trim().toUpperCase() === conductorValue.toUpperCase()
          );
          createdId = String(matched?.id || "");
        }

        if (formRef.current?.elements?.namedItem("conductor") && createdId) {
          formRef.current.elements.namedItem("conductor").value = createdId;
        }
      }

      if (quickCreateState.type === "vehiculo") {
        const placaValue = String(quickCreateState.form?.placa || "").trim().toUpperCase();
        if (!placaValue) {
          return;
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
        createdId = String(created?.id || "");

        if (!createdId) {
          const refreshedVehiculos = await listarVehiculo();
          const matched = (refreshedVehiculos || []).find(
            (item) => String(item?.placa || "").trim().toUpperCase() === placaValue
          );
          createdId = String(matched?.id || "");
        }

        if (formRef.current?.elements?.namedItem("vehiculo") && createdId) {
          formRef.current.elements.namedItem("vehiculo").value = createdId;
        }
      }

      if (quickCreateState.type === "ubicacion") {
        const ubicacionValue = String(quickCreateState.form?.ubicacion || "").trim().toUpperCase();
        if (!ubicacionValue) {
          return;
        }

        const created = await agregarUbicacion({
          cod: String(quickCreateState.form?.cod || "").trim().toUpperCase(),
          ubicacion: ubicacionValue,
          detalle: String(quickCreateState.form?.detalle || "").trim(),
          activo: true,
        });

        await cargarCatalogos();
        createdId = String(created?.id || "");

        if (!createdId) {
          const refreshedUbicaciones = await listarUbicaciones();
          const matched = (refreshedUbicaciones || []).find(
            (item) => String(item?.ubicacion || "").trim().toUpperCase() === ubicacionValue
          );
          createdId = String(matched?.id || "");
        }

        if (quickCreateState.routeFormRef?.current?.elements?.namedItem(quickCreateState.targetField) && createdId) {
          quickCreateState.routeFormRef.current.elements.namedItem(quickCreateState.targetField).value = createdId;
        }
      }

      if (quickCreateState.type === "tipoMovimientoVehiculo") {
        const movimientoValue = String(quickCreateState.form?.movimiento || "").trim();
        if (!movimientoValue) {
          throw new Error("Debes ingresar el nombre del movimiento.");
        }

        const created = await agregartipoMovimientoVehiculo({
          movimiento: movimientoValue,
          requiere_contenedor: Boolean(quickCreateState.form?.requiere_contenedor),
          activo: true,
        });

        await cargarCatalogos();

        const createdMovimiento = created?.data?.movimiento || movimientoValue;
        if (quickCreateState.routeFormRef?.current?.elements?.namedItem("movimiento")) {
          const movementField = quickCreateState.routeFormRef.current.elements.namedItem("movimiento");
          movementField.value = createdMovimiento;
          movementField.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      guardarBody();
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

  const agregarRuta = () => {
    let newRuta = [...ruta]; // Crear una copia del array existente
    newRuta.push({ [ruta.length + 1]: false }); // Agregar un nuevo objeto al array
    setRuta(newRuta);
    setChange(!change);
  };


  const eliminarRuta = () => {
    let newRuta = ruta;
    newRuta.pop();
    setRuta(newRuta);
    setChange(!change);
  };

  return (
    <>
      <div className={styles.fondo}>
        <div style={{ minWidth: "70%" }} className={styles.floatingform}>
          <div style={{ minWidth: "100%" }} className="card">
            <span style={{ minWidth: "100%" }} className={styles.ventana}>
              <div className="card-header text-end">
                <button type="button" onClick={() => handleCerrar()} className="btn-close" aria-label="Close"></button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12"></div>

                  <form ref={formRef} className="container">
                    <span className="col-md-12 row">
                      <div className="mb-2 col-md-3">
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                          type="text"
                          id="semana"
                          name="semana"
                          list="semana-programacion-items"
                          className={`form-control form-control-sm ${!semanaSeleccionada ? "is-invalid" : ""}`}
                          value={semanaInput}
                          required
                          disabled={onlyRead}
                          onChange={handleSemanaChange}
                          placeholder="Seleccione una semana"
                        />
                        <datalist id="semana-programacion-items">
                          {listaSemanas.map((item, index) => {
                            return (
                              <option key={index} value={item?.consecutivo} />
                            );
                          })}
                        </datalist>
                        {!semanaSeleccionada && (
                          <div className="invalid-feedback d-block">
                            Debes seleccionar una semana valida.
                          </div>
                        )}
                      </div>

                      <div className="mb-2 col-md-3">
                        <label htmlFor="naviera" className="form-label mb-1">Naviera</label>
                        <select
                          id="naviera"
                          name="naviera"
                          className="form-control form-control-sm"
                          value={navieraSeleccionada}
                          disabled={onlyRead || !semanaSeleccionada}
                          onChange={handleNavieraChange}
                        >
                          <option value=""></option>
                          {navierasDisponibles.map((item) => (
                            <option key={item.id} value={item.id}>{item.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-2 col-md-3">
                        <label htmlFor="destino_embarque" className="form-label mb-1">Destino</label>
                        <select
                          id="destino_embarque"
                          name="destino_embarque"
                          className="form-control form-control-sm"
                          value={destinoSeleccionado}
                          disabled={onlyRead || !navieraSeleccionada}
                          onChange={handleDestinoChange}
                        >
                          <option value=""></option>
                          {destinosDisponibles.map((item) => (
                            <option key={item.id} value={item.id}>{item.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-2 col-md-3">
                        <label htmlFor="buque" className="form-label mb-1">Buque</label>
                        <select
                          id="buque"
                          name="buque"
                          className="form-control form-control-sm"
                          value={buqueSeleccionado}
                          disabled={onlyRead || !destinoSeleccionado}
                          onChange={handleBuqueChange}
                        >
                          <option value=""></option>
                          {buquesDisponibles.map((item) => (
                            <option key={item.id} value={item.id}>{item.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </span>

                    <span className="col-md-12 row">
                      <div className="mb-2 col-md-3">
                        <label htmlFor={"fecha"} className="form-label mb-1">Fecha</label>
                        <input
                          type="date"
                          id="fecha"
                          name="fecha"
                          className="form-control form-control-sm"
                          defaultValue={date}
                          required
                          disabled={onlyRead}
                          readOnly={onlyRead}
                          onChange={() => guardarBody()}
                        />
                      </div>

                      <div className="mb-2 col-md-2">
                        <label htmlFor="booking" className="form-label mb-1">Booking</label>
                        <select
                          id="booking"
                          name="booking"
                          className="form-control form-control-sm"
                          value={bookingSeleccionado}
                          disabled={onlyRead || !buqueSeleccionado}
                          onChange={handleBookingChange}
                        >
                          <option value=""></option>
                          {bookingsDisponibles.map((item) => (
                            <option key={item.id} value={item.id}>{item.booking}</option>
                          ))}
                        </select>
                      </div>


                      <div className="mb-2 col-md-5">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label htmlFor="conductor" className="form-label mb-0">Conductor</label>
                          {!onlyRead && (
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              className="py-0 px-2"
                              onClick={handleQuickCreateConductor}
                            >
                              +
                            </Button>
                          )}
                        </div>
                        <select
                          id="conductor"
                          name="conductor"
                          className="form-control form-control-sm"
                          required
                          readOnly={onlyRead}
                          disabled={onlyRead}
                          onChange={() => guardarBody()}
                        >
                          <option value=""></option>
                          {listaConductores.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.conductor}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-2">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label htmlFor="placa" className="form-label mb-0">Placa</label>
                          {!onlyRead && (
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              className="py-0 px-2"
                              onClick={handleQuickCreateVehiculo}
                            >
                              +
                            </Button>
                          )}
                        </div>
                        <select id="vehiculo"
                          name="vehiculo"
                          className="form-control form-control-sm"
                          required
                          readOnly={onlyRead}
                          disabled={onlyRead}
                          onChange={() => guardarBody()}
                        >
                          <option value=""></option>
                          {listaVehiculos.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.placa}</option>
                            );
                          })}
                        </select>
                      </div>

                    </span>
                    {ruta.map((itemR) => {
                      const keys = Object.keys(itemR); // Obtener todas las claves del objeto                      
                      return (
                        <span key={keys[0]}>
                          <span style={{ fontSize: "12px" }}>Ruta {keys[0]}</span>
                          <div className="border border-1 mb-2 border-secondary"></div>
                          <Interior
                            change={change} setChange={setChange}
                            setDataList={setDataList}
                            dataList={dataList}
                            index={keys[0]}
                            rutaBool={ruta}
                            setRutaBool={setRuta}
                            body={body}
                            element={element}
                            setAlert={setAlert}
                            onQuickCreateUbicacion={handleQuickCreateUbicacion}
                            onQuickCreateTipoMovimiento={handleQuickCreateTipoMovimiento}
                            listaTiposMovimiento={listaTiposMovimiento} />
                        </span>
                      );
                    })
                    }

                    {/*BOTONES*/}
                    <span className="col-md-12 row mt-4 justify-content-end">
                      <div className="mb-2 col-md-4">
                        <button type="button" onClick={() => agregarRuta()} className={`btn btn-primary col-md-4  w-100`}>
                          Agregar Ruta
                        </button>
                      </div>

                      <div className="mb-2 col-md-4">
                        <button type="button" onClick={() => eliminarRuta()} className={`btn btn-danger col-md-4  w-100`}>
                          Eliminar Ruta
                        </button>
                      </div>

                      <div className="mb-2 col-md-4">
                        <button type="button" onClick={() => handleSubmit()} className={`btn btn-${element ? "warning" : "success"} col-md-4 w-100`}>
                          {element ? "Editar" : "Programar"}
                        </button>
                      </div>

                    </span>
                  </form>




                </div>
              </div>
            </span>
          </div>
        </div >
      </div >

      <Modal show={quickCreateState.show} onHide={closeQuickCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{quickCreateState.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {quickCreateState.type === "conductor" && (
            <div className="row g-3">
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Conductor</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.conductor || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, conductor: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Transportadora</Form.Label>
                  <Form.Select
                    value={quickCreateState.form?.cons_transportadora || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, cons_transportadora: event.target.value },
                    }))}
                  >
                    <option value=""></option>
                    {listaTransportadoras.map((item) => (
                      <option key={item?.consecutivo || item?.id || item?.razon_social} value={item?.consecutivo || item?.id || ""}>
                        {item?.razon_social}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Correo</Form.Label>
                  <Form.Control
                    type="email"
                    value={quickCreateState.form?.email || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, email: event.target.value },
                    }))}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Telefono</Form.Label>
                  <Form.Control
                    type="text"
                    value={quickCreateState.form?.tel || ""}
                    onChange={(event) => setQuickCreateState((prev) => ({
                      ...prev,
                      form: { ...prev.form, tel: event.target.value },
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
};
