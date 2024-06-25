import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import mas from "@public/images/mas.png";
import menos from "@public/images/menos.png";
import hecho from "@public/images/hecho.png";
import guardar from "@public/images/guardar.png";


import styles from "@components/shared/Formularios/Formularios.module.css";
import { Form, InputGroup } from "react-bootstrap";
import { listarUbicaciones } from "@services/api/ubicaciones";
import { listarConductores } from "@services/api/conductores";
import { listarVehiculo } from "@services/api/vehiculos";
import { listarProductos } from "@services/api/productos";
import { listarClientes } from "@services/api/clientes";
import { agregarProgramaciones } from "@services/api/programaciones";
import { agregarRutas, buscarRutaPost } from "@services/api/rutas";
import { agregarProductosViaje } from "@services/api/productos_viaje";
import { encontrarModulo } from "@services/api/configuracion";



function Interior({ rutaBool, change, setChange,
  setRutaBool, index, body, element, setAlert }) {
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

  const isContainter = () => {
    const formData = new FormData(formRef.current);
    const res = formData.get("movimiento") == "Contenedor" ? true : false;
    setIsCheckedContenedor(res);
  };

  const handleSubmit = async () => {
    const formData = new FormData(formRef.current);
    if (body.semana == 0) return alert("La casilla semama no puede ser 0");
    if (formData.get("origen") == formData.get("destino")) return alert("El origen y el destino no puede ser el mismo.");
    const buscarRuta = { ubicacion1: formData.get("origen"), ubicacion2: formData.get("destino") };
    var existeRuta;
    try {
      existeRuta = await buscarRutaPost(buscarRuta);
    } catch (e) {
      existeRuta = await agregarRutas(buscarRuta);
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
      semana: body.semana,
      fecha: body.fecha,
      detalles: formData.get("detalles")
    };

    if (body.semana == null) return alert("Por favor ingrese la fecha, la semana, la placa y el conductor del vehiculo.");

    const { data } = await agregarProgramaciones(objetoProgramacion);
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
          <label htmlFor="semana" className="form-label mb-1">Origen</label>
          <select
            id="origen"
            name="origen"
            className="form-control form-control-sm"
            required
            disabled={guardado}
          >
            {listaUbicaciones.map((item, index) => {
              return (
                <option key={index} value={item?.id}>{item?.ubicacion}</option>
              );
            })}
          </select>
        </div>

        <div className={`mb-2 col-md-${isCheckedContenedor ? 2 : 3}`}>
          <label htmlFor="destino" className="form-label mb-1">Destino</label>
          <select
            id="destino"
            name="destino"
            className="form-control form-control-sm"
            required
            disabled={guardado}
          >
            {listaUbicaciones.map((item, index) => {
              return (
                <option key={index} value={item?.id}>{item?.ubicacion}</option>
              );
            })}
          </select>
        </div>

        <div className="mb-2 col-md-2">
          <label htmlFor="semana" className="form-label mb-1">Movimiento</label>
          <select
            id="movimiento"
            name="movimiento"
            className="form-control form-control-sm"
            required
            onChange={() => isContainter()}
            disabled={guardado}
          >
            <option value="Local">Local</option>
            <option value="Puerto">Puerto</option>
            <option value="Contenedor">Contenedor</option>
            <option value="Transitorio">Transitorio</option>
            <option value="Transitorio">Otro</option>
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
  const [date, setDate] = useState("");
  const [listaConductores, setListaConductores] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [ruta, setRuta] = useState([{ "1": false }]);
  const [change, setChange] = useState(false);
  const [body, setBody] = useState({});
  const [dataList, setDataList] = useState([]);
  const [onlyRead, setOnlyRead] = useState(false);
  const [semana, setSemana] = useState();


  useEffect(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth() + 1; // Se suma 1 porque los meses comienzan desde 0
    const dia = hoy.getDate();
    const fechaHoy = `${año}-${mes < 10 ? '0' + mes : mes}-${dia < 10 ? '0' + dia : dia}`;
    setDate(fechaHoy);
    listar();
    const res = ruta.find((item, key) => item[key + 1] == true);
    res ? setOnlyRead(true) : setOnlyRead(false);
    encontrarModulo("Semana").then(res => setSemana(res[0].semana_actual));
  }, [change, body, ruta]);




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

  const listar = async () => {
    let conductores = await listarConductores();
    let vehiculos = await listarVehiculo();
    setListaConductores(conductores);
    setListaVehiculos(vehiculos);
  };

  const guardarBody = () => {
    const formData = new FormData(formRef.current);
    const body = {
      semana: formData.get("semana"),
      vehiculo: formData.get("vehiculo"),
      fecha: formData.get("fecha"),
      conductor: formData.get("conductor")
    };
    setBody(body);
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
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                          type="number"
                          id="semana"
                          name="semana"
                          className="form-control form-control-sm"
                          defaultValue={semana}
                          min={1}
                          max={53}
                          required
                          disabled={onlyRead}
                          readOnly={onlyRead}
                          onChange={() => guardarBody()}
                        />
                      </div>


                      <div className="mb-2 col-md-2">
                        <label htmlFor="placa" className="form-label mb-1">Placa</label>
                        <select id="vehiculo"
                          name="vehiculo"
                          className="form-control form-control-sm"
                          required
                          readOnly={onlyRead}
                          disabled={onlyRead}
                          onChange={() => guardarBody()}
                        >
                          {listaVehiculos.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.placa}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-5">
                        <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
                        <select
                          id="conductor"
                          name="conductor"
                          className="form-control form-control-sm"
                          required
                          readOnly={onlyRead}
                          disabled={onlyRead}
                          onChange={() => guardarBody()}
                        >
                          {listaConductores.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.conductor}</option>
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
                            setAlert={setAlert} />
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
    </>
  );
};